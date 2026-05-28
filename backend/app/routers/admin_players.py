from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.security import get_db, get_password_hash, require_admin
from app.models.group import Group
from app.models.user import User
from app.schemas.user import AdminPlayerCreate, AdminPlayerUpdate
from app.services.player_lifecycle import (
    PENDING_DEACTIVATE_NEXT_ROUND,
    PENDING_REACTIVATE_NEXT_ROUND,
    cancel_active_round_matches_for_player,
    generate_missing_active_round_fixtures_for_player,
    schedule_pending_status,
)

router = APIRouter(tags=["admin-players"])


def _serialize_player(user: User) -> Dict[str, Any]:
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "points": user.points,
        "group_id": user.group_id,
        "group_name": user.group.name if user.group else None,
        "is_active": user.is_active,
        "pending_status": user.pending_status,
        "pending_after_round_id": user.pending_after_round_id,
    }


def _get_player(db: Session, player_id: int) -> User:
    user = db.query(User).filter(User.id == player_id, User.is_admin == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="Player not found")
    return user


def _require_group(db: Session, group_id: int) -> None:
    if not db.query(Group.id).filter(Group.id == group_id).first():
        raise HTTPException(status_code=404, detail="Group not found")


@router.get("/", response_model=List[Dict[str, Any]])
def list_admin_players(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    players = (
        db.query(User)
        .filter(User.is_admin == False)
        .order_by(User.is_active.desc(), User.full_name.asc())
        .all()
    )
    return [_serialize_player(player) for player in players]


@router.post("/")
def create_player(
    payload: AdminPlayerCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    _require_group(db, payload.group_id)

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        is_admin=False,
        is_active=payload.join_timing == "NOW",
        points=1000,
        group_id=payload.group_id,
    )

    if payload.join_timing == "NEXT_ROUND":
        user.pending_status = PENDING_REACTIVATE_NEXT_ROUND

    db.add(user)
    db.flush()

    fixtures_created = 0
    if payload.join_timing == "NOW":
        fixtures_created = generate_missing_active_round_fixtures_for_player(db, user)
    else:
        schedule_pending_status(db, user, PENDING_REACTIVATE_NEXT_ROUND)

    db.commit()
    db.refresh(user)
    return {
        "message": "Player created",
        "player": _serialize_player(user),
        "fixtures_created": fixtures_created,
    }


@router.patch("/{player_id}")
def update_player(
    player_id: int,
    payload: AdminPlayerUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = _get_player(db, player_id)
    previous_group_id = user.group_id

    if payload.email is not None and payload.email != user.email:
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        user.email = payload.email
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.points is not None:
        user.points = payload.points
    if payload.group_id is not None:
        _require_group(db, payload.group_id)
        user.group_id = payload.group_id

    db.add(user)
    fixtures_created = 0
    matches_cancelled = 0
    if (
        payload.group_id is not None
        and previous_group_id != payload.group_id
        and user.is_active
    ):
        matches_cancelled = cancel_active_round_matches_for_player(db, user.id)
        db.flush()
        fixtures_created = generate_missing_active_round_fixtures_for_player(db, user)

    db.commit()
    db.refresh(user)
    return {
        "message": "Player updated",
        "player": _serialize_player(user),
        "fixtures_created": fixtures_created,
        "matches_cancelled": matches_cancelled,
    }


@router.post("/{player_id}/deactivate-now")
def deactivate_now(
    player_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = _get_player(db, player_id)
    user.is_active = False
    user.pending_status = None
    user.pending_after_round_id = None
    cancelled = cancel_active_round_matches_for_player(db, user.id)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {
        "message": "Player deactivated",
        "player": _serialize_player(user),
        "matches_cancelled": cancelled,
    }


@router.post("/{player_id}/deactivate-next-round")
def deactivate_next_round(
    player_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = _get_player(db, player_id)
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Player is already inactive")
    schedule_pending_status(db, user, PENDING_DEACTIVATE_NEXT_ROUND)
    db.commit()
    db.refresh(user)
    return {"message": "Player scheduled for deactivation", "player": _serialize_player(user)}


@router.post("/{player_id}/reactivate-now")
def reactivate_now(
    player_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = _get_player(db, player_id)
    user.is_active = True
    user.pending_status = None
    user.pending_after_round_id = None
    db.add(user)
    db.flush()
    fixtures_created = generate_missing_active_round_fixtures_for_player(db, user)
    db.commit()
    db.refresh(user)
    return {
        "message": "Player reactivated",
        "player": _serialize_player(user),
        "fixtures_created": fixtures_created,
    }


@router.post("/{player_id}/reactivate-next-round")
def reactivate_next_round(
    player_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = _get_player(db, player_id)
    if user.is_active:
        raise HTTPException(status_code=400, detail="Player is already active")
    schedule_pending_status(db, user, PENDING_REACTIVATE_NEXT_ROUND)
    db.commit()
    db.refresh(user)
    return {"message": "Player scheduled for reactivation", "player": _serialize_player(user)}


@router.post("/{player_id}/clear-pending")
def clear_pending_status(
    player_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = _get_player(db, player_id)
    user.pending_status = None
    user.pending_after_round_id = None
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "Pending status cleared", "player": _serialize_player(user)}
