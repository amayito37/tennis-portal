from typing import List, Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

# One set in the match (regular set or super tiebreak)
class SetScore(BaseModel):
    p1_games: int = Field(ge=0)
    p2_games: int = Field(ge=0)
    # Optional tiebreak details (store points won in the tiebreak if it happened)
    p1_tiebreak: Optional[int] = Field(default=None, ge=0)
    p2_tiebreak: Optional[int] = Field(default=None, ge=0)
    # If this is a super tiebreak (e.g., 10-point), mark it
    super_tiebreak: bool = False

# Outcome of the match (drives how we display + whether set scores matter)
OutcomeType = Literal["COMPLETED", "RETIREMENT", "WALKOVER", "ADMIN_DECISION"]

class ResultBase(BaseModel):
    winner_id: int
    loser_id: int
    outcome: OutcomeType = "COMPLETED"
    sets: List[SetScore] = Field(default_factory=list)

class ResultCreate(ResultBase):
    pass

class ResultPublic(ResultBase):
    id: int
    match_id: int
    model_config = ConfigDict(from_attributes=True)
