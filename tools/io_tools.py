from pathlib import Path
from typing import Dict, Any
import json

ARTIFACTS = Path("artifacts")
ARTIFACTS.mkdir(exist_ok=True, parents=True)

def write_text(filename: str, content: str) -> str:
    p = ARTIFACTS / filename
    p.write_text(content, encoding="utf-8")
    return str(p)

def write_json(filename: str, data: Dict[str, Any]) -> str:
    p = ARTIFACTS / filename
    p.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return str(p)

def read_text(filename: str) -> str:
    return (ARTIFACTS / filename).read_text(encoding="utf-8")
