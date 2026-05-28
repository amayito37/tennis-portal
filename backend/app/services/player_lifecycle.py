from typing import Optional

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.models.match import Match, MatchStatus
from app.models.round import Round, RoundStatus
from app.models.round_group_membership import RoundGroupMembership
from app.models.user import User

PENDING_DEACTIVATE_NEXT_ROUND = "DEACTIVATE_NEXT_ROUND"
PENDING_REACTIVATE_NEXT_ROUND = "REACTIVATE_NEXT_ROUND"


def get_active_round(db: Session) -> Optional[Round]:
    return db.query(Round).filter(Round.status == RoundStatus.ACTIVE).first()


def _round_has_memberships(db: Session, round_id: int) -> bool:
    return (
        db.query(RoundGroupMembership.id)
        .filter(RoundGroupMembership.round_id == round_id)
        .first()
        is not None
    )


def _pending_applies_to_round(db: Session, user: User, target_round: Round) -> bool:
    if user.pending_after_round_id is None:
        return True
    if user.pending_after_round_id == target_round.id:
        return False

    anchor = db.query(Round).filter(Round.id == user.pending_after_round_id).first()
    if anchor and target_round.start_date and anchor.start_date:
        return target_round.start_date > anchor.start_date

    return target_round.id > user.pending_after_round_id


def apply_pending_player_statuses(db: Session, target_round_id: int) -> int:
    target_round = db.query(Round).filter(Round.id == target_round_id).first()
    if not target_round:
        return 0

    users = (
        db.query(User)
        .filter(User.is_admin == False, User.pending_status.isnot(None))
        .all()
    )

    changed = 0
    for user in users:
        if not _pending_applies_to_round(db, user, target_round):
            continue

        if user.pending_status == PENDING_DEACTIVATE_NEXT_ROUND:
            user.is_active = False
        elif user.pending_status == PENDING_REACTIVATE_NEXT_ROUND:
            user.is_active = True
        else:
            continue

        user.pending_status = None
        user.pending_after_round_id = None
        db.add(user)
        changed += 1

    if changed:
        db.flush()
    return changed


def add_player_to_round_snapshot_if_needed(db: Session, user: User, round_id: int) -> bool:
    if not user.group_id or not _round_has_memberships(db, round_id):
        return False

    existing = (
        db.query(RoundGroupMembership)
        .filter(
            RoundGroupMembership.round_id == round_id,
            RoundGroupMembership.user_id == user.id,
        )
        .first()
    )
    if existing:
        return False

    db.add(
        RoundGroupMembership(
            round_id=round_id,
            group_id=user.group_id,
            user_id=user.id,
            points_at_start=user.points,
        )
    )
    db.flush()
    return True


def sync_player_round_snapshot_group(db: Session, user: User, round_id: int) -> bool:
    if not user.group_id or not _round_has_memberships(db, round_id):
        return False

    membership = (
        db.query(RoundGroupMembership)
        .filter(
            RoundGroupMembership.round_id == round_id,
            RoundGroupMembership.user_id == user.id,
        )
        .first()
    )
    if not membership:
        return add_player_to_round_snapshot_if_needed(db, user, round_id)

    if membership.group_id == user.group_id:
        return False

    membership.group_id = user.group_id
    db.add(membership)
    db.flush()
    return True


def cancel_active_round_matches_for_player(db: Session, user_id: int) -> int:
    active_round = get_active_round(db)
    if not active_round:
        return 0

    matches = (
        db.query(Match)
        .filter(
            Match.round_id == active_round.id,
            Match.played == False,
            Match.status == MatchStatus.SCHEDULED,
            or_(Match.player1_id == user_id, Match.player2_id == user_id),
        )
        .all()
    )

    for match in matches:
        match.status = MatchStatus.CANCELLED
        db.add(match)

    if matches:
        db.flush()
    return len(matches)


def generate_missing_active_round_fixtures_for_player(db: Session, user: User) -> int:
    active_round = get_active_round(db)
    if not active_round or not user.group_id or not user.is_active:
        return 0

    sync_player_round_snapshot_group(db, user, active_round.id)

    opponents = (
        db.query(User)
        .filter(
            User.id != user.id,
            User.group_id == user.group_id,
            User.is_admin == False,
            User.is_active == True,
        )
        .order_by(User.id)
        .all()
    )

    created = 0
    for opponent in opponents:
        existing = (
            db.query(Match.id)
            .filter(
                Match.round_id == active_round.id,
                or_(
                    and_(Match.player1_id == user.id, Match.player2_id == opponent.id),
                    and_(Match.player1_id == opponent.id, Match.player2_id == user.id),
                ),
            )
            .first()
        )
        if existing:
            continue

        db.add(
            Match(
                player1_id=min(user.id, opponent.id),
                player2_id=max(user.id, opponent.id),
                scheduled_date=active_round.start_date,
                status=MatchStatus.SCHEDULED,
                played=False,
                round_id=active_round.id,
            )
        )
        created += 1

    if created:
        db.flush()
    return created


def schedule_pending_status(db: Session, user: User, pending_status: str) -> None:
    active_round = get_active_round(db)
    user.pending_status = pending_status
    user.pending_after_round_id = active_round.id if active_round else None
    db.add(user)
