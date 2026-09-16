from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    action: str
    details: Optional[str]
    created_at: datetime
