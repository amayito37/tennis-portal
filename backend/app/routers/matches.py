from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.auth.security import get_current_user, get_db
from app.models.match import Match, MatchStatus
from app.models.match_result import MatchResult
from app.models.user import User
from app.schemas.match import MatchPublic, MatchCreate
from app.schemas.result import ResultCreate, SetScore
from app.services.elo import calculate_elo_change, revert_elo_change

router = APIRouter(tags=["matches"])

# --- Helper: convert structured sets into readable score string ---
def _format_score(sets: list[dict]) -> str:
    if not sets:
        return ""
    formatted = []
    for s in sets:
        p1 = s.get("p1_games")
        p2 = s.get("p2_games")
        if s.get("super_tiebreak"):
            formatted.append(f"{p1}-{p2} (STB)")
        else:
            formatted.append(f"{p1}-{p2}")
    return ", ".join(formatted)


# --- Helper: validate logical set data ---
def _validate_sets(sets: list[SetScore], outcome: str) -> None:
    if outcome == "COMPLETED":
        if not sets:
            raise HTTPException(status_code=400, detail="COMPLETED results must include at least one set")
        for s in sets:
            if s.p1_games == 0 and s.p2_games == 0 and not s.super_tiebreak:
                raise HTTPException(status_code=400, detail="Invalid set with 0-0 games")


# --- List ALL matches ---
@router.get("/", response_model=List[MatchPublic])
def list_matches(db: Session = Depends(get_db), _=Depends(get_current_user)):
    matches = (
        db.query(Match)
        .options(joinedload(Match.player1), joinedload(Match.player2), joinedload(Match.winner), joinedload(Match.result))
        .order_by(Match.scheduled_date.desc())
        .all()
    )
    for m in matches:
        if m.status == MatchStatus.COMPLETED and m.result and isinstance(m.result.sets, list):
            m.score = _format_score(m.result.sets)
        else:
            m.score = None
    return matches


# --- Fixtures: upcoming (unplayed) matches only ---
@router.get("/fixtures", response_model=List[MatchPublic])
def list_fixtures(db: Session = Depends(get_db), _=Depends(get_current_user)):
    fixtures = (
        db.query(Match)
        .options(joinedload(Match.player1), joinedload(Match.player2))
        .filter(Match.status == MatchStatus.SCHEDULED)
        .order_by(Match.scheduled_date.asc())
        .all()
    )
    # Fixtures should never expose scores/results
    for f in fixtures:
        f.score = None
    return fixtures


# --- Results: completed matches only ---
@router.get("/results", response_model=List[MatchPublic])
def list_results(db: Session = Depends(get_db), _=Depends(get_current_user)):
    results = (
        db.query(Match)
        .options(joinedload(Match.player1), joinedload(Match.player2), joinedload(Match.winner), joinedload(Match.result))
        .filter(Match.status == MatchStatus.COMPLETED.value)
        .order_by(Match.scheduled_date.desc())
        .all()
    )
    for r in results:
        r.score = _format_score(r.result.sets) if r.result and isinstance(r.result.sets, list) else None
    return results


# --- Create new match ---
@router.post("/", response_model=MatchPublic)
def create_match(payload: MatchCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    player1 = db.query(User).filter(User.id == payload.player1_id).first()
    player2 = db.query(User).filter(User.id == payload.player2_id).first()

    if not player1 or not player2:
        raise HTTPException(status_code=404, detail="Player not found")
    if player1.group_id != player2.group_id:
        raise HTTPException(status_code=400, detail="Players must be in the same group.")

    match = Match(
        player1_id=payload.player1_id,
        player2_id=payload.player2_id,
        scheduled_date=payload.scheduled_date,
        status=MatchStatus.SCHEDULED,
        played=False,
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


# --- Report a result (with ELO update) ---
@router.put("/{match_id}/result")
def update_match_result(
    match_id: int,
    payload: ResultCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match.played or match.result is not None:
        raise HTTPException(status_code=400, detail="Match already has a result")

    if not current_user.is_admin and current_user.id not in (match.player1_id, match.player2_id):
        raise HTTPException(status_code=403, detail="Not allowed to report this match")

    if set([payload.winner_id, payload.loser_id]) != set([match.player1_id, match.player2_id]):
        raise HTTPException(status_code=400, detail="Winner/loser must be match participants")

    _validate_sets(payload.sets, payload.outcome)

    # Create result
    result = MatchResult(
        match_id=match.id,
        winner_id=payload.winner_id,
        loser_id=payload.loser_id,
        outcome=payload.outcome,
        sets=[s.model_dump() for s in payload.sets],
    )
    db.add(result)

    winner = db.query(User).filter(User.id == payload.winner_id).first()

    # Mark match as played/completed
    match.played = True
    match.status = MatchStatus.COMPLETED
    match.winner = winner
    match.result = result
    match.score = _format_score(result.sets)

    # Apply ELO changes
    loser = db.query(User).filter(User.id == payload.loser_id).first()
    d_win, d_lose = calculate_elo_change(winner.points, loser.points)
    winner.points += d_win
    loser.points += d_lose

    db.add_all([winner, loser, match])
    db.commit()
    db.refresh(match)

    return {
        "message": "Result recorded",
        "match_id": match.id,
        "score": match.score,
        "outcome": payload.outcome,
        "elo": {"winner_delta": d_win, "loser_delta": d_lose},
    }

@router.put("/{match_id}/result/update")
def update_existing_result(
    match_id: int,
    payload: ResultCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admins only")

    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    result = match.result
    if not result:
        raise HTTPException(status_code=404, detail="No result found to update")

    revert_elo_change(db.query(User).filter(User.id == result.winner_id).first(), db.query(User).filter(User.id == result.loser_id).first(), db)

    # Replace the old result content
    result.winner_id = payload.winner_id
    result.loser_id = payload.loser_id
    result.outcome = payload.outcome
    result.sets = [s.model_dump() for s in payload.sets]

    # Update ELO
    winner = db.query(User).filter(User.id == payload.winner_id).first()
    loser = db.query(User).filter(User.id == payload.loser_id).first()
    d_win, d_lose = calculate_elo_change(winner.points, loser.points)
    winner.points += d_win
    loser.points += d_lose

    db.add_all([winner, loser, result])
    db.commit()
    db.refresh(match)

    return {"message": "Result updated successfully"}

