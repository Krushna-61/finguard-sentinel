from pydantic import BaseModel
from typing import List

class AuditEntry(BaseModel):
    id: str
    timestamp: str
    event_type: str
    hash: str
    status: str

class GovernanceResponse(BaseModel):
    entries: List[AuditEntry]
    total_count: int
