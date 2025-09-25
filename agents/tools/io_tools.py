from pathlib import Path
import json

def write_json(rel_path: str, data):
    p = root_path(rel_path)
    ensure_dir(p)
    p.write_text(json.dumps(data, indent=2), encoding="utf-8")

ROOT = Path(__file__).resolve().parents[2]  # repo root (../.. from here)

def root_path(*parts) -> Path:
    return ROOT.joinpath(*parts)

def read_json(rel_path: str):
    p = root_path(rel_path)
    raw = p.read_text("utf-8")
    if raw and ord(raw[0]) == 0xFEFF:  # strip BOM if present
        raw = raw[1:]
    return json.loads(raw)

def ensure_dir(path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
