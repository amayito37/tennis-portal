from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class PlayerSummary(BaseModel):
    id: int
    full_name: str
    points: int

    model_config = ConfigDict(from_attributes=True)

class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None

class GroupCreate(GroupBase):
    pass

class GroupPublic(GroupBase):
    id: int
    members: List[PlayerSummary] = []
    model_config = ConfigDict(from_attributes=True)
