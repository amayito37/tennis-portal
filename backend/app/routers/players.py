from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.auth.security import get_current_user, get_db
from app.schemas.user import UserPublic
from app.models.user import User

router = APIRouter(tags=["players"])

@router.get("/", response_model=List[UserPublic])
def list_players(
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    """Authenticated endpoint — returns all players ordered by points."""
    players = db.query(User).order_by(User.points.desc()).all()
    return players


@router.get("/ranking")
def get_ranking(db: Session = Depends(get_db)):
    try:
        players = db.query(User).order_by(User.points.desc()).all()
        return [
            {
                "rank": i + 1,
                "id": p.id,
                "name": p.full_name,
                "matches": getattr(p, "matches", 0),
                "points": p.points,
            }
            for i, p in enumerate(players)
        ]
    except Exception as e:
        print("ERROR in /players/ranking:", e)
        return {"error": str(e)}



@router.get("/{player_id}", response_model=UserPublic)
def get_player(
    player_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    """Authenticated endpoint — get specific player details."""
    return db.query(User).filter(User.id == player_id).first()
