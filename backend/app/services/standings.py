from collections import defaultdict
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.match import Match, MatchStatus
from app.models.user import User
from app.models.round_group_membership import RoundGroupMembership
from sqlalchemy import or_
from app.services.round_memberships import get_round_group_players, round_has_memberships


def _round_group_points(db: Session, group_id: int, round_id: int) -> Dict[int, int]:
    if not round_has_memberships(db, round_id):
        return {}

    return {
        user_id: points
        for user_id, points in (
            db.query(RoundGroupMembership.user_id, RoundGroupMembership.points_at_start)
            .filter(
                RoundGroupMembership.round_id == round_id,
                RoundGroupMembership.group_id == group_id,
            )
            .all()
        )
    }

def compute_group_table_for_round(
    db: Session, group_id: int, round_id: int
) -> List[Dict[str, Any]]:
    # pull players from the historical snapshot when available
    players: List[User] = get_round_group_players(db, group_id, round_id)
    by_id = {p.id: p for p in players}
    points_by_id = _round_group_points(db, group_id, round_id)

    # init stats
    stats = {
        pid: {"player": by_id[pid], "wins":0, "losses":0,
              "sets_w":0,"sets_l":0,"games_w":0,"games_l":0}
        for pid in by_id.keys()
    }

    matches = (
        db.query(Match)
        .options(joinedload(Match.result))
        .filter(
            Match.round_id == round_id,
            Match.status == MatchStatus.COMPLETED,
            Match.player1_id.in_(by_id.keys()) | Match.player2_id.in_(by_id.keys())
        )
        .all()
    )

    for m in matches:
        if not m.result:
            continue
        w = m.result.winner_id
        l = m.result.loser_id
        if w in stats and l in stats:
            stats[w]["wins"] += 1
            stats[l]["losses"] += 1
            for s in m.result.sets:
                p1g, p2g = s["p1_games"], s["p2_games"]
                # add games
                stats[m.player1_id]["games_w"] += p1g
                stats[m.player1_id]["games_l"] += p2g
                stats[m.player2_id]["games_w"] += p2g
                stats[m.player2_id]["games_l"] += p1g
                # add sets (who won the set)
                if p1g == p2g and s.get("super_tiebreak"):  # super TB: larger games wins
                    if p1g > p2g:
                        stats[m.player1_id]["sets_w"] += 1
                        stats[m.player2_id]["sets_l"] += 1
                    else:
                        stats[m.player2_id]["sets_w"] += 1
                        stats[m.player1_id]["sets_l"] += 1
                else:
                    if p1g > p2g:
                        stats[m.player1_id]["sets_w"] += 1
                        stats[m.player2_id]["sets_l"] += 1
                    elif p2g > p1g:
                        stats[m.player2_id]["sets_w"] += 1
                        stats[m.player1_id]["sets_l"] += 1
                    # ties (6-6) with TB fields would be handled earlier if you store TB points

    # sort: 1) W/L %, 2) sets W/L %, 3) games W/L %, 4) ELO desc
    def pct(w,l): return (w / (w+l)) if (w+l)>0 else 0.0
    rows = []
    for pid, st in stats.items():
        p = st["player"]
        rows.append({
            "player_id": p.id,
            "full_name": p.full_name,
            "wins": st["wins"], "losses": st["losses"],
            "sets_w": st["sets_w"], "sets_l": st["sets_l"],
            "games_w": st["games_w"], "games_l": st["games_l"],
            "elo": points_by_id.get(p.id, p.points),
            "wl_pct": pct(st["wins"], st["losses"]),
            "sets_pct": pct(st["sets_w"], st["sets_l"]),
            "games_pct": pct(st["games_w"], st["games_l"]),
        })

    rows.sort(
        key=lambda r: (
            r["wl_pct"],
            r["sets_pct"],
            r["games_pct"],
            r["elo"]
        ),
        reverse=True
    )
    # attach rank for clarity
    for i, r in enumerate(rows, start=1):
        r["rank"] = i
    return rows


def compute_group_table_for_round_ui(db: Session, group_id: int, round_id: int) -> List[Dict[str, Any]]:
    """
    Returns rows matching the SAME schema as /groups/{group_id}/table:
    {
      id, player_name, points,
      matches_played, matches_won,
      sets_played, sets_won,
      games_played, games_won,
      win_pct, set_pct, game_pct,
      rank
    }
    """

    players: List[User] = get_round_group_players(db, group_id, round_id)
    player_ids = [p.id for p in players]
    by_id = {p.id: p for p in players}
    points_by_id = _round_group_points(db, group_id, round_id)

    # init stats
    agg = {
        pid: {
            "matches_played": 0,
            "matches_won": 0,
            "sets_played": 0,
            "sets_won": 0,
            "games_played": 0,
            "games_won": 0,
        }
        for pid in player_ids
    }

    matches = (
        db.query(Match)
        .filter(
            Match.round_id == round_id,
            Match.status == MatchStatus.COMPLETED,
            or_(
                Match.player1_id.in_(player_ids),
                Match.player2_id.in_(player_ids),
            )
        )
        .all()
    )

    for m in matches:
        if not m.result:
            continue

        # Count only matches where BOTH players are in the group
        if m.player1_id not in agg or m.player2_id not in agg:
            continue

        agg[m.player1_id]["matches_played"] += 1
        agg[m.player2_id]["matches_played"] += 1

        winner_id = getattr(m.result, "winner_id", None)
        if winner_id in agg:
            agg[winner_id]["matches_won"] += 1

        sets = getattr(m.result, "sets", None) or []
        for s in sets:
            p1g = (s.get("p1_games") or 0)
            p2g = (s.get("p2_games") or 0)
            is_super_tb = bool(s.get("super_tiebreak", False))

            # set counts as a set for both players
            agg[m.player1_id]["sets_played"] += 1
            agg[m.player2_id]["sets_played"] += 1

            if p1g > p2g:
                agg[m.player1_id]["sets_won"] += 1
            elif p2g > p1g:
                agg[m.player2_id]["sets_won"] += 1

            # super tiebreak doesn't count as games
            if is_super_tb:
                continue

            # normal set: games
            agg[m.player1_id]["games_won"] += p1g
            agg[m.player2_id]["games_won"] += p2g
            agg[m.player1_id]["games_played"] += (p1g + p2g)
            agg[m.player2_id]["games_played"] += (p1g + p2g)

    rows: List[Dict[str, Any]] = []
    for pid in player_ids:
        p = by_id[pid]
        st = agg[pid]

        mp = st["matches_played"]
        mw = st["matches_won"]
        sp = st["sets_played"]
        sw = st["sets_won"]
        gp = st["games_played"]
        gw = st["games_won"]

        win_pct = round((mw / mp) * 100, 1) if mp else 0.0
        set_pct = round((sw / sp) * 100, 1) if sp else 0.0
        game_pct = round((gw / gp) * 100, 1) if gp else 0.0

        rows.append({
            "id": p.id,
            "player_name": p.full_name,
            "points": points_by_id.get(p.id, p.points),  # ELO at round start when snapshotted
            "matches_played": mp,
            "matches_won": mw,
            "sets_played": sp,
            "sets_won": sw,
            "games_played": gp,
            "games_won": gw,
            "win_pct": win_pct,
            "set_pct": set_pct,
            "game_pct": game_pct,
        })

    # same sorting criteria as your existing /groups/{group_id}/table
    rows.sort(
        key=lambda r: (r["win_pct"], r["set_pct"], r["game_pct"], r["points"]),
        reverse=True,
    )

    for i, row in enumerate(rows):
        row["rank"] = i + 1

    return rows
