from ..tools.qa_tools import screenshot, visual_diff
from ..tools.io_tools import root_path
from time import time

def qa_visual(state):
    ui = state.get("ui_spec", {}) or {}
    viewport = ui.get("hero", {}).get("acceptance", {}).get("visual", {}).get("viewport", [1280, 720])
    w, h = viewport
    actual_rel = "agents/.tmp/actual.png"
    diff_rel   = "agents/.tmp/diff.png"
    target_rel = state.get("target_image", "assets/target/hero.png")

    url = state.get("preview_url", "http://localhost:3000")
    url = f"{url}?t={int(time()*1000)}"  # cache-bust
    screenshot(url, actual_rel, width=w, height=h)
    similarity, _ = visual_diff(actual_rel, target_rel, diff_rel, size=(w, h))
    return {
        "similarity": float(similarity),
        "actual": str(root_path(actual_rel)),
        "diff":   str(root_path(diff_rel)),
    }
