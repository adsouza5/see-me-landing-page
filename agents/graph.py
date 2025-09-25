from langgraph.graph import StateGraph, END
from .state import State
from .agents.planner import planner
from .agents.dev import dev
from .agents.qa_visual import qa_visual
from .agents.qa_accessibility import qa_accessibility
from .agents.qa_perf import qa_perf
from .agents.critic import critic

def build_graph():
    g = StateGraph(State)

    g.add_node("plan", lambda s: planner(s))
    g.add_node("dev",  lambda s: dev(s))

    # ✅ Node ids are unique; they write to distinct state keys
    g.add_node("qa_visual_node", lambda s: {"qa_visual": qa_visual(s)})
    g.add_node("qa_a11y_node",   lambda s: {"qa_a11y": qa_accessibility(s)})
    g.add_node("qa_perf_node",   lambda s: {"qa_perf": qa_perf(s)})

    g.add_node("critic", lambda s: critic(s))

    g.set_entry_point("plan")
    g.add_edge("plan", "dev")
    g.add_edge("dev", "qa_visual_node")
    g.add_edge("dev", "qa_a11y_node")
    g.add_edge("dev", "qa_perf_node")
    g.add_edge("qa_visual_node", "critic")
    g.add_edge("qa_a11y_node",   "critic")
    g.add_edge("qa_perf_node",   "critic")

    def loop_or_end(s: State):
        ui = s.get("ui_spec", {}) or {}
        budgets = ui.get("hero", {}).get("acceptance", {}) or {}
        v = float(budgets.get("visual", {}).get("ssimMin", 0.90))
        a_max = {"minor":1,"moderate":2,"serious":3,"critical":4}.get(
            budgets.get("accessibility", {}).get("axeMaxSeverity","minor"), 1
        )
        p = int(budgets.get("performance", {}).get("lighthouseMin", 90))

        pass_visual = float(s.get("qa_visual",{}).get("similarity",0.0)) >= v
        pass_a11y   = int(s.get("qa_a11y",{}).get("maxImpact",0)) <= a_max

        perf_res = s.get("qa_perf",{}) or {}
        perf_ok = (int(perf_res.get("performance", 0)) >= p) if not perf_res.get("error") else True

        return END if (pass_visual and pass_a11y and perf_ok) else "plan"

    g.add_conditional_edges("critic", loop_or_end, {"plan": "plan", END: END})
    return g.compile()
