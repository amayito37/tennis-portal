from pydantic import BaseModel, conint
from typing import Literal
from datetime import datetime

class MatchCreate(BaseModel):
    player1_id: conint(gt=0)
    player2_id: conint(gt=0)
    score: str
    winner_id: conint(gt=0)
    date_played: datetime | None = None

class MatchPublic(BaseModel):
    id: int
    player1_id: int
    player2_id: int
    score: str
    winner_id: int
    status: Literal["pending", "approved", "rejected"]
    date_played: datetime

    class Config:
        from_attributes = True
