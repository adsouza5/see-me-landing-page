from typing import Optional, List, Literal
from pydantic import BaseModel, Field

class TokenEdit(BaseModel):
    path: Literal["spacing","colors","typography","overlay","radii"] = "spacing"
    key: str
    value_int: Optional[int] = None
    value_float: Optional[float] = None
    value_str: Optional[str] = None

class UISpecEdit(BaseModel):
    json_pointer: str = Field(..., description="RFC6901 pointer, e.g. /hero/layout/phoneTopGap")
    value: object

class CodePatch(BaseModel):
    file: str
    find: str
    replace: str

class PlanOutput(BaseModel):
    # keep it simple for now; you already read specs from disk
    note: str = "ok"

class CriticOutput(BaseModel):
    accept: bool = False
    reason: str = ""
    token_edits: List[TokenEdit] = []
    ui_edits: List[UISpecEdit] = []
    code_patches: List[CodePatch] = []
