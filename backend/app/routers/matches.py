from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.match import Match
from app.models.user import User


router = APIRouter(prefix="/matches", tags=["matches"])


def update_ratings(db, winner_id, loser_id):
    K = 32
    winner = db.query(User).filter(User.id == winner_id).first()
    loser = db.query(User).filter(User.id == loser_id).first()
    expected_winner = 1 / (1 + 10 ** ((loser.points - winner.points) / 400))
    winner.points += int(K * (1 - expected_winner))
    loser.points -= int(K * expected_winner)
    db.commit()


@router.post("/")
def record_match(player1_id: int, player2_id: int, score: str, winner_id: int):
    db = SessionLocal()
    match = Match(player1_id=player1_id, player2_id=player2_id, score=score, winner_id=winner_id, status='approved')
    db.add(match)
    update_ratings(db, winner_id, player2_id if player1_id == winner_id else player1_id)
    db.commit()
    db.refresh(match)
return match


@router.get("/rankings")
def get_rankings():
    db = SessionLocal()
    players = db.query(User).order_by(User.points.desc()).all()
return players