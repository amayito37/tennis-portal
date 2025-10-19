from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.auth.security import get_current_user, require_admin, get_db
from app.schemas.match import MatchCreate, MatchPublic
from app.models.match import Match, MatchStatus
from app.models.user import User
from app.services.elo import apply_elo

router = APIRouter()

@router.post("/", response_model=MatchPublic)
def submit_match(payload: MatchCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Basic sanity checks
    if payload.player1_id == payload.player2_id:
        raise HTTPException(status_code=400, detail="A player cannot play against themselves.")

    if payload.winner_id not in (payload.player1_id, payload.player2_id):
        raise HTTPException(status_code=400, detail="Winner must be either player1 or player2.")

    m = Match(
        player1_id=payload.player1_id,
        player2_id=payload.player2_id,
        score=payload.score,
        winner_id=payload.winner_id,
        status=MatchStatus.pending,
        date_played=payload.date_played,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m

@router.get("/", response_model=List[MatchPublic])
def list_matches(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Match).order_by(Match.id.desc()).all()

@router.patch("/{match_id}/approve", response_model=MatchPublic)
def approve_match(match_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    m = db.query(Match).filter(Match.id == match_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Match not found")

    if m.status == MatchStatus.approved:
        return m  # idempotent

    # Apply ELO
    loser_id = m.player2_id if m.winner_id == m.player1_id else m.player1_id
    apply_elo(db, m.winner_id, loser_id)

    m.status = MatchStatus.approved
    db.add(m)
    db.commit()
    db.refresh(m)
    return m

@router.get("/rankings", response_model=List[MatchPublic])
def rankings_placeholder():
    # Kept for backward-compat if you had this path bookmarked; real rankings are from /players ordered by points.
    raise HTTPException(status_code=410, detail="Use /players for rankings (ordered by points).")