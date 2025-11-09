from collections import defaultdict
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.match import Match, MatchStatus
from app.models.user import User

def compute_group_table_for_round(
    db: Session, group_id: int, round_id: int
) -> List[Dict[str, Any]]:
    # pull players in group (non-admin)
    players: List[User] = (
        db.query(User)
        .filter(User.group_id == group_id, User.is_admin == False)
        .order_by(User.id)
        .all()
    )
    by_id = {p.id: p for p in players}

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
            "elo": p.points,
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
