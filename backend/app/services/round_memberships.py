from typing import List

from sqlalchemy.orm import Session, joinedload

from app.models.round_group_membership import RoundGroupMembership
from app.models.user import User


def round_has_memberships(db: Session, round_id: int) -> bool:
    return (
        db.query(RoundGroupMembership.id)
        .filter(RoundGroupMembership.round_id == round_id)
        .first()
        is not None
    )


def snapshot_round_memberships(db: Session, round_id: int) -> int:
    """
    Additive, idempotent snapshot of current groups for a round.
    Existing rows are left untouched so historical data is not overwritten.
    """
    existing_user_ids = {
        row[0]
        for row in (
            db.query(RoundGroupMembership.user_id)
            .filter(RoundGroupMembership.round_id == round_id)
            .all()
        )
    }

    users = (
        db.query(User)
        .filter(User.is_admin == False, User.group_id.isnot(None))
        .order_by(User.id)
        .all()
    )

    created = 0
    for user in users:
        if user.id in existing_user_ids:
            continue

        db.add(
            RoundGroupMembership(
                round_id=round_id,
                group_id=user.group_id,
                user_id=user.id,
                points_at_start=user.points,
            )
        )
        created += 1

    if created:
        db.flush()

    return created


def get_round_group_players(db: Session, group_id: int, round_id: int) -> List[User]:
    """
    Historical membership lookup. Falls back to current User.group_id when a
    round has not been snapshotted yet, keeping existing data usable.
    """
    if round_has_memberships(db, round_id):
        memberships = (
            db.query(RoundGroupMembership)
            .options(joinedload(RoundGroupMembership.user))
            .filter(
                RoundGroupMembership.round_id == round_id,
                RoundGroupMembership.group_id == group_id,
            )
            .order_by(RoundGroupMembership.user_id)
            .all()
        )
        return [m.user for m in memberships if m.user and not m.user.is_admin]

    return (
        db.query(User)
        .filter(User.group_id == group_id, User.is_admin == False)
        .order_by(User.id)
        .all()
    )


def get_round_group_player_ids(db: Session, group_id: int, round_id: int) -> List[int]:
    return [user.id for user in get_round_group_players(db, group_id, round_id)]


def update_round_membership_points_at_end(db: Session, round_id: int) -> None:
    memberships = (
        db.query(RoundGroupMembership)
        .options(joinedload(RoundGroupMembership.user))
        .filter(RoundGroupMembership.round_id == round_id)
        .all()
    )
    for membership in memberships:
        if membership.user:
            membership.points_at_end = membership.user.points
            db.add(membership)
