from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserPublic  # make sure this import works

class MatchBase(BaseModel):
    player1_id: int
    player2_id: int
    scheduled_date: Optional[datetime] = None
    score: Optional[str] = None
    winner_id: Optional[int] = None
    played: bool = False

class MatchCreate(MatchBase):
    pass

class MatchPublic(BaseModel):
    id: int
    player1: Optional[UserPublic] = None
    player2: Optional[UserPublic] = None
    winner: Optional[UserPublic] = None
    score: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    played: bool = False
    status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
