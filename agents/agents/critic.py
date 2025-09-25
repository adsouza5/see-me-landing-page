from __future__ import annotations

from ..llm import critic_llm
from ..schemas import CriticOutput
from ..tools.io_tools import read_json, write_json
from ..tools.actions import apply_token_edits  # we won't use ui/code patches here

SEVERITY_ORDER = {"minor": 1, "moderate": 2, "serious": 3, "critical": 4}

SYS = """You are the Critic agent.
You receive QA results (visual similarity 0..1, a11y impact, perf score) plus the current design tokens/ui.

HARD RULES:
- The phone frame size is LOCKED; never modify spacing.phoneWidth.
- Only propose SMALL edits to spacing.headlineGap (heading → subheading gap).
- Do not change overlay.opacity; background is image-only.
- Never propose large jumps; prefer <= 4px change per loop.
- Prefer tokens/ui over code patches. Code/UI patches are not allowed in this phase.

Return JSON strictly matching the schema. Set accept=true only when ALL budgets pass.
"""

# Config for the one allowed knob
ALLOWED_KEY = "headlineGap"
MAX_STEP = 4              # px per loop
MIN_GAP = 0               # px floor
MAX_GAP = 200             # px ceiling (safety)

def _coerce_number(e) -> float | None:
    """Pull the proposed numeric from a TokenEdit (int/float/str)."""
    v = getattr(e, "value_int", None)
    if v is not None:
        return float(v)
    v = getattr(e, "value_float", None)
    if v is not None:
        return float(v)
    v = getattr(e, "value_str", None)
    if v is not None:
        try:
            return float(v)
        except Exception:
            return None
    return None

def critic(state):
    ui      = state.get("ui_spec", {}) or {}
    tokens  = state.get("tokens", {}) or {}
    qa_vis  = state.get("qa_visual", {}) or {}
    qa_a11y = state.get("qa_a11y", {}) or {}
    qa_perf = state.get("qa_perf", {}) or {}

    v_budget = float(ui.get("hero", {}).get("acceptance", {}).get("visual", {}).get("ssimMin", 0.99))
    a_budget = ui.get("hero", {}).get("acceptance", {}).get("accessibility", {}).get("axeMaxSeverity", "minor")
    p_budget = int(ui.get("hero", {}).get("acceptance", {}).get("performance", {}).get("lighthouseMin", 90))

    sim       = float(qa_vis.get("similarity", 0.0))
    maxImpact = int(qa_a11y.get("maxImpact", 0))
    perfScore = int(qa_perf.get("performance", 0))

    pass_visual = sim >= v_budget
    pass_a11y   = maxImpact <= SEVERITY_ORDER.get(a_budget, 1)
    pass_perf   = True if qa_perf.get("error") else (perfScore >= p_budget)

    # Prepare LLM call (explicitly allow only headlineGap)
    user = f"""
Current similarity: {sim:.4f} (target {v_budget})
A11y max impact: {maxImpact} (allowed <= {SEVERITY_ORDER.get(a_budget,1)})
Perf: {qa_perf}

tokens.spacing (ONLY headlineGap may change; phoneWidth must NOT change):
{tokens.get('spacing', {})}

Propose at most a ±{MAX_STEP}px adjustment to spacing.headlineGap if needed.
Do NOT propose any ui_edits or code_patches. Never touch spacing.phoneWidth.
"""

    out: CriticOutput = critic_llm.structured(SYS, user, CriticOutput)

    # === Filter & clamp edits ===
    current_gap = int(tokens.get("spacing", {}).get(ALLOWED_KEY, 12))

    proposed_gap = None
    notes: list[str] = []

    # Accept only spacing.headlineGap; drop everything else (including phoneWidth)
    for e in (out.token_edits or []):
        if getattr(e, "path", "") != "spacing":
            continue
        key = getattr(e, "key", "")
        if key.lower() == "phonewidth":
            # explicit reject to avoid surprises
            notes.append("Skipped edit to spacing.phoneWidth (locked).")
            continue
        if key != ALLOWED_KEY:
            continue

        val = _coerce_number(e)
        if val is None:
            continue
        proposed_gap = int(round(val))
        break  # only one knob allowed

    # Clamp the change to ±MAX_STEP and within [MIN_GAP, MAX_GAP]
    if proposed_gap is not None:
        delta = proposed_gap - current_gap
        if abs(delta) > MAX_STEP:
            delta = MAX_STEP if delta > 0 else -MAX_STEP
        new_gap = max(MIN_GAP, min(MAX_GAP, current_gap + delta))

        if new_gap != current_gap:
            # Apply directly (bypass generic applier to avoid other edits sneaking in)
            tokens.setdefault("spacing", {})[ALLOWED_KEY] = new_gap
            write_json("specs/tokens.json", tokens)
            notes.append(f"{ALLOWED_KEY} {current_gap}px → {new_gap}px (clamped Δ {delta:+}px)")
        else:
            notes.append(f"{ALLOWED_KEY} unchanged at {current_gap}px (already optimal or clamped).")
    else:
        notes.append(f"No valid proposal for {ALLOWED_KEY}; kept {current_gap}px.")

    # Force-drop any ui_edits / code_patches
    out.ui_edits = []
    out.code_patches = []

    done = pass_visual and pass_a11y and pass_perf
    if done and proposed_gap is None:
        notes.append("All budgets met. Done.")

    return {"issues": notes or ["No changes proposed."], "score": sim}
