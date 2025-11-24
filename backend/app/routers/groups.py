from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Dict, Any
from app.auth.security import get_db, get_current_user
from app.models.group import Group
from app.models.user import User
from app.models.match import Match, MatchStatus
from app.schemas.match import MatchPublic
from app.routers.matches import _format_score
from app.services.stats import compute_player_stats

router = APIRouter(tags=["groups"])

@router.get("/", response_model=List[Dict[str, Any]])
def list_groups(db: Session = Depends(get_db), _=Depends(get_current_user)):
    groups = db.query(Group).all()
    result = []

    for g in groups:
        players = (
            db.query(User)
            .filter(User.group_id == g.id)
            .all()
        )
        result.append({
            "id": g.id,
            "name": g.name,
            "description": g.description,
            "members": [
                {
                    "id": u.id,
                    "full_name": u.full_name,
                    "points": u.points,
                    "group_id": u.group_id,
                    "group_name": g.name,
                }
                for u in players
            ]
        })

    return result


@router.get("/{group_id}")
def get_group(group_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    g = db.query(Group).filter(Group.id == group_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
    return {"id": g.id, "name": g.name, "description": g.description}

@router.get("/{group_id}/players")
def list_group_players(group_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    players = db.query(User).filter(User.group_id == group_id).all()
    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "points": u.points,  # global ELO
            "group_id": u.group_id,
            "group_name": u.group.name if u.group else None,
        }
        for u in players
    ]

@router.get("/{group_id}/matches", response_model=List[MatchPublic])
def list_group_matches(group_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    # Only matches where both players are in this group
    current_round = db.query(Round).filter(Round.status == RoundStatus.ACTIVE).first()

    ids = [u.id for u in db.query(User.id).filter(User.group_id == group_id).all()]
    if not ids:
        return []
    matches = (
        db.query(Match)
        .options(joinedload(Match.player1), joinedload(Match.player2))
        .filter(Match.player1_id.in_(ids), Match.player2_id.in_(ids), Match.played == True, Match.round == current_round)
        .order_by(Match.scheduled_date.desc())
        .all()
    )
    for m in matches:
        if m.status == MatchStatus.COMPLETED and m.result and isinstance(m.result.sets, list):
            m.score = _format_score(m.result.sets)
        else:
            m.score = None
    return matches

@router.get("/{group_id}/fixtures", response_model=List[MatchPublic])
def list_group_fixtures(group_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Return all upcoming (unplayed) fixtures for a group"""
    from app.models.user import User
    from app.models.match import Match

    current_round = db.query(Round).filter(Round.status == RoundStatus.ACTIVE).first()

    # Get all players in the group
    players = db.query(User).filter(User.group_id == group_id).all()
    player_ids = [p.id for p in players]

    # Get all unplayed matches between those players
    fixtures = (
        db.query(Match)
        .options(joinedload(Match.player1), joinedload(Match.player2))
        .filter(
            Match.played == False,
            Match.player1_id.in_(player_ids),
            Match.player2_id.in_(player_ids),
            Match.round == current_round
        )
        .all()
    )

    return fixtures

@router.get("/{group_id}/table")
def group_table(group_id: int, db: Session = Depends(get_db)):
    users = (
        db.query(User)
        .filter(User.group_id == group_id, User.is_admin == False)
        .all()
    )

    table: List[Dict[str, Any]] = []
    for u in users:
        stats = compute_player_stats(db, u)
        table.append({
            "id": u.id,
            "player_name": u.full_name,
            "points": u.points,
            **stats,
        })

    # Sort by performance (same internal logic)
    table.sort(
        key=lambda r: (r["win_pct"], r["set_pct"], r["game_pct"], r["points"]),
        reverse=True,
    )

    for i, row in enumerate(table):
        row["rank"] = i + 1

    return table

