from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List
from app.auth.security import get_current_user, get_db
from app.schemas.user import UserPublic
from app.models.user import User
from app.models.match import Match
from app.schemas.user import UserUpdate

router = APIRouter(tags=["players"])

@router.get("/", response_model=List[UserPublic])
def list_players(
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    """Authenticated endpoint — returns all players ordered by points."""
    players = db.query(User).filter(User.is_admin == False).order_by(User.points.desc()).all()
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
        players = db.query(User).filter(User.is_admin == False).order_by(User.points.desc()).all()

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

from app.schemas.user import UserUpdate  # new schema
from app.models.user import User

@router.patch("/{user_id}")
def update_user_by_admin(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admins only")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_admin:
        raise HTTPException(status_code=400, detail="Cannot modify another admin")

    if payload.points is not None:
        user.points = payload.points
    if payload.group_id is not None:
        user.group_id = payload.group_id

    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "User updated successfully", "user": user}
