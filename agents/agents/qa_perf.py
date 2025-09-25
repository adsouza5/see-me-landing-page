from ..tools.qa_tools import run_lighthouse
from time import time

def qa_perf(state):
    url = state.get("preview_url", "http://localhost:3000")
    url = f"{url}?perf={int(time()*1000)}"
    res = run_lighthouse(url)
    return res  # {"performance": 0..100, maybe "error": "..."}
