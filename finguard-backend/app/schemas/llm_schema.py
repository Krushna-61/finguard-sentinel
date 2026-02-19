from pydantic import BaseModel
from typing import Optional

class LLMRequest(BaseModel):
    text: str
    context: Optional[str] = None

class LLMResponse(BaseModel):
    latency: int
    token_usage: int
    hallucination_score: float
    toxicity_score: float
    pii_detected: bool
