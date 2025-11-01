from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserPublic
from app.schemas.result import ResultPublic

class MatchBase(BaseModel):
    player1_id: int
    player2_id: int
    scheduled_date: Optional[datetime] = None
    played: bool = False

class MatchCreate(MatchBase):
    pass

class MatchPublic(BaseModel):
    id: int
    player1: Optional[UserPublic] = None
    player2: Optional[UserPublic] = None
    # winner can be derived from result.winner_id, but we keep it for convenience / UI
    winner: Optional[UserPublic] = None
    result: Optional[ResultPublic] = None
    score: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    played: bool = False
    status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
