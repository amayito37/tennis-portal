from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Dict, Any
from app.auth.security import get_db, get_current_user
from app.models.group import Group
from app.models.user import User
from app.models.match import Match, MatchStatus
from app.schemas.match import MatchPublic
from app.routers.matches import _format_score

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
    ids = [u.id for u in db.query(User.id).filter(User.group_id == group_id).all()]
    if not ids:
        return []
    matches = (
        db.query(Match)
        .options(joinedload(Match.player1), joinedload(Match.player2))
        .filter(Match.player1_id.in_(ids), Match.player2_id.in_(ids), Match.played == True)
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
        )
        .all()
    )

    return fixtures

@router.get("/{group_id}/table")
def group_table(group_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    ids = [u.id for u in db.query(User.id).filter(User.group_id == group_id).all()]
    if not ids:
        return []

    # compute W/L only from matches within this group and played
    q = (
        db.query(Match)
        .filter(
            Match.player1_id.in_(ids),
            Match.player2_id.in_(ids),
            Match.played == True,
        )
        .all()
    )
    stats = {uid: {"player_id": uid, "wins": 0, "losses": 0} for uid in ids}
    for m in q:
        if not m.winner_id:
            continue
        loser_id = m.player2_id if m.winner_id == m.player1_id else m.player1_id
        if m.winner_id in stats:
            stats[m.winner_id]["wins"] += 1
        if loser_id in stats:
            stats[loser_id]["losses"] += 1

    # attach names
    users = {u.id: u.full_name for u in db.query(User).filter(User.id.in_(ids)).all()}
    table = []
    for uid, s in stats.items():
        table.append({
            "player_id": uid,
            "player_name": users.get(uid, f"#{uid}"),
            "wins": s["wins"],
            "losses": s["losses"],
            "played": s["wins"] + s["losses"],
        })
    # sort by wins desc, losses asc, then name
    table.sort(key=lambda r: (-r["wins"], r["losses"], r["player_name"].lower()))
    # add rank
    for i, row in enumerate(table, start=1):
        row["rank"] = i
    return table

@router.post("/{group_id}/assign/{user_id}")
def assign_player(group_id: int, user_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    g = db.query(Group).get(group_id)
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
    u = db.query(User).get(user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.group_id = group_id
    db.commit()
    return {"message": "Player assigned", "user_id": user_id, "group_id": group_id}
