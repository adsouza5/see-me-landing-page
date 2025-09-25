from typing import TypedDict, Dict, Any, List, Optional

class State(TypedDict, total=False):
    brief: str
    target_image: str
    ui_spec: Dict[str, Any]
    tokens: Dict[str, Any]
    copy: Dict[str, Any]
    assets: Dict[str, str]
    code_paths: List[str]
    preview_url: Optional[str]

    # write in parallel to these (no collisions)
    qa_visual: Dict[str, Any]
    qa_a11y: Dict[str, Any]
    qa_perf: Dict[str, Any]

    score: float
    issues: List[str]
