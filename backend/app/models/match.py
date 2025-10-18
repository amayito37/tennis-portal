from sqlalchemy import Column, Integer, ForeignKey, String, DateTime
from app.db.base_class import Base
import datetime

class Match(Base):
    __tablename__ = 'matches'
    id = Column(Integer, primary_key=True, index=True)
    player1_id = Column(Integer, ForeignKey('users.id'))
    player2_id = Column(Integer, ForeignKey('users.id'))
    score = Column(String)
    winner_id = Column(Integer, ForeignKey('users.id'))
    status = Column(String, default='pending')
    date_played = Column(DateTime, default=datetime.datetime.utcnow)