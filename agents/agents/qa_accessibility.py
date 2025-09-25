from ..tools.qa_tools import run_axe
from time import time

SEVERITY_ORDER = {"minor": 1, "moderate": 2, "serious": 3, "critical": 4}

def qa_accessibility(state):
    url = state.get("preview_url", "http://localhost:3000")
    url = f"{url}?a11y={int(time()*1000)}"
    violations = run_axe(url)
    max_impact = max([SEVERITY_ORDER.get((v.get("impact") or "minor"), 1) for v in violations] or [0])
    return {"violations": violations, "maxImpact": max_impact}
