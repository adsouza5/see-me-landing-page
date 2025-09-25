from ..llm import planner_llm
from ..schemas import PlanOutput
from ..tools.io_tools import read_json

SYS = """You are the planning agent. Read existing spec/tokens/copy and return a short note.
Do not propose edits; dev and critic will handle that."""

def planner(state):
    ui_spec = read_json("specs/ui_spec.json")
    tokens  = read_json("specs/tokens.json")
    copy    = read_json("specs/copy.json")
    _ = planner_llm.structured(SYS, "Plan the next step.", PlanOutput)
    return {"ui_spec": ui_spec, "tokens": tokens, "copy": copy}
