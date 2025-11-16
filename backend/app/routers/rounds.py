from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from typing import List, Dict, Any

from app.auth.security import get_db, get_current_user
from app.models.user import User
from app.models.group import Group
from app.models.round import Round, RoundStatus
from app.models.match import Match, MatchStatus
from app.schemas.round import RoundCreate, RoundPublic
from app.services.standings import compute_group_table_for_round
from app.services.promotions import apply_promotions_for_round

router = APIRouter(tags=["rounds"])

def _require_admin(u: User):
    if not u.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")

@router.post("/", response_model=RoundPublic)
def create_round(payload: RoundCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_admin(current_user)
    if payload.end_date <= payload.start_date:
        raise HTTPException(400, "end_date must be after start_date")
    r = Round(
        name=payload.name,
        start_date=payload.start_date,
        end_date=payload.end_date,
        status=RoundStatus.DRAFT
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return r

@router.post("/{round_id}/activate", response_model=RoundPublic)
def activate_round(round_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_admin(current_user)
    r = db.query(Round).get(round_id)
    if not r: raise HTTPException(404, "Round not found")
    r.status = RoundStatus.ACTIVE
    db.add(r); db.commit(); db.refresh(r)
    return r

@router.post("/{round_id}/generate-fixtures")
def generate_fixtures(round_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_admin(current_user)
    r = db.query(Round).get(round_id)
    if not r: raise HTTPException(404, "Round not found")
    if r.status not in (RoundStatus.DRAFT, RoundStatus.ACTIVE):
        raise HTTPException(400, "Round not in DRAFT/ACTIVE")

    groups = db.query(Group).order_by(Group.id).all()
    created = 0

    for g in groups:
        players = (
            db.query(User)
            .filter(User.group_id == g.id, User.is_admin == False)
            .order_by(User.id)
            .all()
        )
        # simple round-robin once: every pair plays once
        for i in range(len(players)):
            for j in range(i+1, len(players)):
                m = Match(
                    player1_id=players[i].id,
                    player2_id=players[j].id,
                    scheduled_date=r.start_date,  # or distribute within window
                    status=MatchStatus.SCHEDULED,
                    played=False,
                    round_id=round_id
                )
                db.add(m)
                created += 1

    db.commit()
    return {"message":"fixtures generated", "matches_created": created}

@router.get("/", response_model=List[RoundPublic])
def list_rounds(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_admin(current_user)
    return db.query(Round).order_by(Round.start_date.desc()).all()

@router.get("/{round_id}/unplayed")
def list_unplayed(round_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_admin(current_user)
    qs = (
        db.query(Match)
        .options(joinedload(Match.player1), joinedload(Match.player2))
        .filter(Match.round_id == round_id, Match.status == MatchStatus.SCHEDULED)
        .all()
    )
    return [
        {
            "id": m.id,
            "player1": {"id": m.player1.id, "full_name": m.player1.full_name},
            "player2": {"id": m.player2.id, "full_name": m.player2.full_name},
            "scheduled_date": m.scheduled_date
        } for m in qs
    ]

@router.post("/{round_id}/close", response_model=RoundPublic)
def close_round(round_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_admin(current_user)
    r = db.query(Round).get(round_id)
    if not r: raise HTTPException(404, "Round not found")
    r.status = RoundStatus.CLOSED
    db.add(r); db.commit(); db.refresh(r)
    return r

@router.get("/{round_id}/standings")
def standings(round_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_admin(current_user)
    rows_by_group: Dict[int, List[Dict[str, Any]]] = {}
    groups = db.query(Group).order_by(Group.id).all()
    for g in groups:
        rows_by_group[g.id] = compute_group_table_for_round(db, g.id, round_id)
    return rows_by_group

@router.post("/{round_id}/finalize", response_model=RoundPublic)
def finalize_round(round_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_admin(current_user)
    r = db.query(Round).get(round_id)
    if not r: raise HTTPException(404, "Round not found")
    if r.status != RoundStatus.CLOSED:
        raise HTTPException(400, "Round must be CLOSED before finalizing")

    standings_by_group = {}
    groups = db.query(Group).order_by(Group.id).all()
    for g in groups:
        standings_by_group[g.id] = compute_group_table_for_round(db, g.id, round_id)

    apply_promotions_for_round(db, standings_by_group)

    r.status = RoundStatus.FINALIZED
    db.add(r); db.commit(); db.refresh(r)
    return r

@router.get("/current", response_model=RoundPublic)
def get_current_round(db: Session = Depends(get_db), _=Depends(get_current_user)):
    r = db.query(Round).filter(Round.status == RoundStatus.ACTIVE).first()
    if not r:
        raise HTTPException(404, "No active round")
    return r

