from playwright.sync_api import sync_playwright
from PIL import Image
import numpy as np
from .io_tools import root_path, ensure_dir
from pathlib import Path
import json, subprocess, shutil

# --- Helpers ---------------------------------------------------------------

def _new_context(browser, width=1280, height=720):
    """
    Create a desktop-like context with zoom locked to 100%.
    device_scale_factor=1 ensures CSS pixel ratio = 1 (no browser zoom).
    """
    return browser.new_context(
        viewport={"width": width, "height": height},
        device_scale_factor=1,   # ← lock to 100% zoom
        is_mobile=False,
        has_touch=False,
        color_scheme="light",
    )

# --- Visual QA -------------------------------------------------------------

def screenshot(url: str, out_rel: str, width=1280, height=720):
    """Open URL and save a screenshot at the given viewport size with zoom locked."""
    out = root_path(out_rel); ensure_dir(out)
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = _new_context(browser, width=width, height=height)
        page = ctx.new_page()
        page.goto(url, wait_until="networkidle")
        page.screenshot(path=str(out), full_page=False)
        ctx.close()
        browser.close()
    return str(out)

def visual_diff(a_rel: str, b_rel: str, out_rel: str, size=(1280, 720)):
    """Return (similarity, out_diff_path). Simple MAE-based similarity."""
    a = Image.open(root_path(a_rel)).convert("RGB").resize(size)
    b = Image.open(root_path(b_rel)).convert("RGB").resize(size)
    a_np, b_np = np.asarray(a, dtype=np.float32), np.asarray(b, dtype=np.float32)
    mae = np.mean(np.abs(a_np - b_np))  # 0..255
    similarity = max(0.0, 1.0 - (mae / 255.0))  # 1.0 is identical

    # visual diff (highlight differences)
    diff = (np.abs(a_np - b_np)).astype(np.uint8)
    diff_img = Image.fromarray(diff)
    out = root_path(out_rel); ensure_dir(out)
    diff_img.save(out)
    return float(similarity), str(out)

# --- Accessibility QA ------------------------------------------------------

def run_axe(url: str, width=1280, height=720):
    """Return axe violations array with 'impact' levels. Uses locked zoom context."""
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = _new_context(browser, width=width, height=height)
        page = ctx.new_page()
        page.goto(url, wait_until="networkidle")
        # inject axe
        page.add_script_tag(url="https://cdn.jsdelivr.net/npm/axe-core@4.9.1/axe.min.js")
        a11y = page.evaluate("async () => await axe.run()")
        ctx.close()
        browser.close()

    # normalize to simple list of {id, impact, nodesCount}
    violations = [
        {"id": v.get("id"), "impact": v.get("impact"), "nodes": len(v.get("nodes", []))}
        for v in a11y.get("violations", [])
    ]
    return violations

# --- Performance QA --------------------------------------------------------

def run_lighthouse(url: str):
    """
    Run Lighthouse via pnpm dlx (preferred) or npx fallback.
    Returns {"performance": 0..100, "raw": <optional>}.
    """
    cmds = []
    if shutil.which("pnpm"):
        cmds.append([
            "pnpm", "dlx", "lighthouse@12.6.0", url,
            "--quiet", "--chrome-flags=--headless=new",
            "--only-categories=performance", "--output=json", "--output-path=stdout"
        ])
    if shutil.which("npx"):
        cmds.append([
            "npx", "--yes", "lighthouse@12.6.0", url,
            "--quiet", "--chrome-flags=--headless=new",
            "--only-categories=performance", "--output=json", "--output-path=stdout"
        ])

    last_err = None
    for cmd in cmds:
        try:
            out = subprocess.run(cmd, capture_output=True, text=True, check=True)
            data = json.loads(out.stdout)
            perf = int(round((data["categories"]["performance"]["score"] or 0) * 100))
            return {"performance": perf}
        except Exception as e:
            last_err = e
            continue
    # fallback if both failed
    return {"performance": 0, "error": str(last_err or "no runner found")}
