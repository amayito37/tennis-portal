from sqlalchemy.orm import Session
from app.models.user import User

def apply_elo(db: Session, winner_id: int, loser_id: int, k: int = 32) -> None:
    winner = db.query(User).filter(User.id == winner_id).first()
    loser = db.query(User).filter(User.id == loser_id).first()
    if not winner or not loser:
        return

    expected_winner = 1 / (1 + 10 ** ((loser.points - winner.points) / 400))
    expected_loser = 1 - expected_winner

    winner.points = max(0, int(winner.points + k * (1 - expected_winner)))
    loser.points = max(0, int(loser.points + k * (0 - expected_loser)))

    db.add(winner)
    db.add(loser)
    db.flush()
