import json
from pathlib import Path
from .io_tools import read_json, write_json, root_path, ensure_dir
from ..schemas import TokenEdit, UISpecEdit, CodePatch

def _phone_locked() -> bool:
    ui = read_json("specs/ui_spec.json")
    return bool((ui.get("hero") or {}).get("tuning", {}).get("lockPhoneWidth", False))

def apply_token_edits(edits: list[TokenEdit]) -> list[str]:
    tokens = read_json("specs/tokens.json")
    msgs = []
    locked = _phone_locked()

    for e in edits:
        if locked and e.path == "spacing" and e.key.lower() == "phonewidth":
            msgs.append("Skipped edit to spacing.phoneWidth (locked).")
            continue

        bucket = tokens.setdefault(e.path, {})
        if e.value_int is not None:
            bucket[e.key] = int(e.value_int)
        elif e.value_float is not None:
            bucket[e.key] = float(e.value_float)
        elif e.value_str is not None:
            bucket[e.key] = str(e.value_str)
        msgs.append(f"{e.path}.{e.key} → {bucket[e.key]}")

    write_json("specs/tokens.json", tokens)
    return msgs

def apply_ui_edits(edits: list[UISpecEdit]) -> list[str]:
    ui = read_json("specs/ui_spec.json")
    for e in edits:
        # naive JSON pointer implementation
        parts = [p for p in e.json_pointer.split("/") if p]
        cur = ui
        for p in parts[:-1]:
            cur = cur[p]
        cur[parts[-1]] = e.value
    write_json("specs/ui_spec.json", ui)
    return [f"{e.json_pointer} → {e.value!r}" for e in edits]

def apply_code_patches(patches: list[CodePatch]) -> list[str]:
    msgs = []
    for p in patches:
        file_path = root_path(p.file)
        txt = file_path.read_text(encoding="utf-8")
        if p.find in txt:
            txt = txt.replace(p.find, p.replace, 1)
            file_path.write_text(txt, encoding="utf-8")
            msgs.append(f"Patched {p.file}")
        else:
            msgs.append(f"Skip {p.file}: pattern not found")
    return msgs
