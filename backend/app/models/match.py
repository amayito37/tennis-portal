from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum
from datetime import datetime

class MatchStatus(enum.Enum):
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    player1_id = Column(Integer, ForeignKey("users.id"))
    player2_id = Column(Integer, ForeignKey("users.id"))
    winner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    score = Column(String, nullable=True)
    scheduled_date = Column(DateTime, default=datetime.utcnow)
    played = Column(Boolean, default=False)
    status = Column(Enum(MatchStatus), default=MatchStatus.SCHEDULED)

    player1 = relationship("User", foreign_keys=[player1_id], lazy="joined")
    player2 = relationship("User", foreign_keys=[player2_id], lazy="joined")
    winner = relationship("User", foreign_keys=[winner_id], lazy="joined")

    result = relationship(
        "MatchResult",
        uselist=False,
        back_populates="match",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
