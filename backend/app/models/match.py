from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base
from datetime import datetime
import enum

class MatchStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    player1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    player2_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Example score format: "6-4 3-6 7-6"
    score = Column(String(50), nullable=False)

    winner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(MatchStatus), default=MatchStatus.pending, nullable=False)
    date_played = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Optional relationships (not strictly required)
    player1 = relationship("User", foreign_keys=[player1_id])
    player2 = relationship("User", foreign_keys=[player2_id])
    winner = relationship("User", foreign_keys=[winner_id])
