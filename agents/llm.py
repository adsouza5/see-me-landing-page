from pathlib import Path
import os
from dotenv import load_dotenv

# Load the repo-root .env before creating any clients
load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")

import backoff
from typing import Any
from pydantic import BaseModel, ValidationError
from openai import OpenAI, APIConnectionError, RateLimitError, BadRequestError

DEFAULT_PLANNER = os.getenv("PLANNER_MODEL", "gpt-4o-mini")
DEFAULT_DEV     = os.getenv("DEV_MODEL",     "gpt-4o-mini")
DEFAULT_CRITIC  = os.getenv("CRITIC_MODEL",  "gpt-4o-mini")

class LLM:
    def __init__(self, model: str):
        key = os.environ.get("OPENAI_API_KEY")
        if not key:
            raise RuntimeError("OPENAI_API_KEY not set. Create see-me-landing-page/.env and reload.")
        self.client = OpenAI(api_key=key)
        self.model = model

    @backoff.on_exception(backoff.expo, (APIConnectionError, RateLimitError), max_time=60)
    def complete(self, system: str, user: str) -> str:
        r = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role":"system","content":system},{"role":"user","content":user}],
            temperature=0.2,
        )
        return r.choices[0].message.content or ""

    @backoff.on_exception(backoff.expo, (APIConnectionError, RateLimitError), max_time=60)
    def structured(self, system: str, user: str, schema: type[BaseModel]) -> BaseModel:
        # Satisfy json_object requirement and keep a fallback on 400s
        sys2  = (system or "").strip() + "\n\nRespond ONLY with a single valid JSON object."
        user2 = (user   or "").strip() + "\n\nReturn JSON only."
        try:
            r = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role":"system","content":sys2},{"role":"user","content":user2}],
                response_format={"type":"json_object"},
                temperature=0.2,
            )
            txt = r.choices[0].message.content or "{}"
            return schema.model_validate_json(txt)
        except BadRequestError:
            r = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role":"system","content":sys2},
                          {"role":"user","content":user2 + "\nFormat your entire reply as a JSON object."}],
                temperature=0.1,
            )
            txt = r.choices[0].message.content or "{}"
            return schema.model_validate_json(txt)
        except ValidationError:
            r = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role":"system","content":sys2},
                    {"role":"user","content":user2},
                    {"role":"assistant","content":"{}"},
                    {"role":"user","content":f"Fix to this JSON schema:\n{schema.model_json_schema()}\nReturn JSON only."}
                ],
                response_format={"type":"json_object"},
                temperature=0.1,
            )
            txt = r.choices[0].message.content or "{}"
            return schema.model_validate_json(txt)

# Instantiate one LLM per agent and export them
planner_llm = LLM(DEFAULT_PLANNER)
dev_llm     = LLM(DEFAULT_DEV)
critic_llm  = LLM(DEFAULT_CRITIC)

__all__ = ["LLM", "planner_llm", "dev_llm", "critic_llm"]
