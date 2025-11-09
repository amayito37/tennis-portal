from sqlalchemy import Column, Integer, String, DateTime, Enum
from enum import Enum as PyEnum
from app.db.base import Base

class RoundStatus(PyEnum):
    DRAFT = "DRAFT"       # created, not active
    ACTIVE = "ACTIVE"     # matches can be played/logged
    CLOSED = "CLOSED"     # no more user logging; admin review
    FINALIZED = "FINALIZED" # promotions applied

class Round(Base):
    __tablename__ = "rounds"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    status = Column(Enum(RoundStatus), nullable=False, default=RoundStatus.DRAFT)
