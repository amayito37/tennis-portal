from typing import Dict, List
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.group import Group

def apply_promotions_for_round(
    db: Session,
    standings_by_group: Dict[int, List[dict]]
):
    """
    standings_by_group: { group_id: [ {player_id, rank, ...}, ...] } sorted asc rank.
    Moves users' group_id according to rules. Commits at end.
    """
    group_ids = [g.id for g in db.query(Group).order_by(Group.id).all()]
    if not group_ids:
        return {"moved":0}
    top = min(group_ids)   # assume 1 is top
    bottom = max(group_ids)

    moves = []  # (user_id, from_group, to_group)

    for gid, rows in standings_by_group.items():
        if not rows:
            continue
        # sorted by rank already
        # determine deltas per position
        if gid == top:
            # group 1: 1 & 2 stay; others go down as in general?
            deltas = [0, 0, -1, -2]
        elif gid == top + 1:
            # group 2: 1 up one, 2 stays, 3 down 1, 4 down 2 (or keep general but override 1 & 2)
            deltas = [ +1, 0, -1, -2 ]
        elif gid == bottom - 1:
            # second-to-last: mirror group 2
            # winner up 2? (symmetric relative to bottom): Your spec says “symmetrically for the second to last group”.
            # Interpreting: last group behaves like group 1 mirror; second-to-last behaves like group 2 mirror.
            # In practice: winners go up 2 (general), but near-bottom boundary we ensure no move below bottom.
            deltas = [ +2, +1, 0, -1 ]
        elif gid == bottom:
            # last group: can't go further down; clamp to stay >= bottom
            deltas = [ +2, +1, 0, 0 ]  # losers can't drop past bottom; adjust sensibly
        else:
            # general
            deltas = [ +2, +1, -1, -2 ]

        # assign
        for i, row in enumerate(rows):
            delta = deltas[i] if i < len(deltas) else 0
            user = db.query(User).get(row["player_id"])
            if not user:
                continue
            from_gid = user.group_id or gid
            to_gid = from_gid + -delta
            # clamp
            to_gid = max(top, min(bottom, to_gid))
            user.group_id = to_gid
            old_points = user.points
            new_points = bottom - to_gid + 1
            user.points = old_points + new_points
            db.add(user)
            if from_gid != to_gid:
                moves.append((user.id, from_gid, to_gid))

    db.commit()
    return {"moved": len(moves), "moves": moves}
