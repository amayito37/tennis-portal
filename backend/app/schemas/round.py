from datetime import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict

class RoundStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"
    FINALIZED = "FINALIZED"

class RoundBase(BaseModel):
    name: str
    start_date: datetime
    end_date: datetime

class RoundCreate(RoundBase):
    pass

class RoundPublic(RoundBase):
    id: int
    status: RoundStatus
    model_config = ConfigDict(
        from_attributes=True,
        use_enum_values=True 
    )
