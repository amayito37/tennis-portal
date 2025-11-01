from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List
from app.auth.security import get_current_user, get_db
from app.schemas.user import UserPublic
from app.models.user import User
from app.models.match import Match

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
        # Aggregate total matches played (either as player1 or player2 and marked played=True)
        match_counts = (
            db.query(
                Match.player1_id.label("player_id"),
                func.count(Match.id).label("count")
            )
            .filter(Match.played == True)
            .group_by(Match.player1_id)
            .union_all(
                db.query(
                    Match.player2_id.label("player_id"),
                    func.count(Match.id).label("count")
                )
                .filter(Match.played == True)
                .group_by(Match.player2_id)
            )
            .subquery()
        )

        # Aggregate both roles
        totals = (
            db.query(match_counts.c.player_id, func.sum(match_counts.c.count).label("matches_played"))
            .group_by(match_counts.c.player_id)
            .all()
        )
        match_count_map = {pid: cnt for pid, cnt in totals}

        # Final ranking
        players = db.query(User).order_by(User.points.desc()).all()

        return [
            {
                "rank": i + 1,
                "id": p.id,
                "name": p.full_name,
                "matches": match_count_map.get(p.id, 0),
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
