from sqlalchemy import Column, Integer, ForeignKey, JSON, String
from sqlalchemy.orm import relationship
from app.db.base import Base

class MatchResult(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), unique=True)
    winner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    loser_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # "COMPLETED" | "RETIREMENT" | "WALKOVER" | "ADMIN_DECISION"
    outcome = Column(String(32), nullable=False, default="COMPLETED")

    # Array of set dicts: [{p1_games, p2_games, p1_tiebreak?, p2_tiebreak?, super_tiebreak?}, ...]
    sets = Column(JSON, nullable=False, default=list)

    match = relationship("Match", back_populates="result")
    winner = relationship("User", foreign_keys=[winner_id])
    loser = relationship("User", foreign_keys=[loser_id])
