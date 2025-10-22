from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.auth.security import get_current_user, get_db
from app.models.match import Match, MatchStatus
from app.models.user import User
from app.schemas.match import MatchPublic, MatchCreate

router = APIRouter(tags=["matches"])

@router.get("/", response_model=List[MatchPublic])
def list_matches(db: Session = Depends(get_db), _=Depends(get_current_user)):
    matches = (
        db.query(Match)
        .options(
            joinedload(Match.player1),
            joinedload(Match.player2),
            joinedload(Match.winner)
        )
        .order_by(Match.scheduled_date.desc())
        .all()
    )
    return matches


@router.get("/fixtures", response_model=List[MatchPublic])
def list_fixtures(db: Session = Depends(get_db), _=Depends(get_current_user)):
    fixtures = (
        db.query(Match)
        .options(
            joinedload(Match.player1),
            joinedload(Match.player2),
            joinedload(Match.winner)
        )
        .filter(Match.status == MatchStatus.SCHEDULED)
        .order_by(Match.scheduled_date.asc())
        .all()
    )
    return fixtures


@router.get("/results", response_model=List[MatchPublic])
def list_results(db: Session = Depends(get_db), _=Depends(get_current_user)):
    results = (
        db.query(Match)
        .options(
            joinedload(Match.player1),
            joinedload(Match.player2),
            joinedload(Match.winner)
        )
        .filter(Match.status == MatchStatus.COMPLETED)
        .order_by(Match.scheduled_date.desc())
        .all()
    )
    return results


@router.post("/", response_model=MatchPublic)
def create_match(
    payload: MatchCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    player1 = db.query(User).filte
