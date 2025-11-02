from sqlalchemy.orm import Session
from app.models.user import User
from app.models.match import Match, MatchStatus

def compute_player_stats(db: Session, player: User):
    """
    For a single player: compute matches/sets/games tallies and percentages.
    Matches: count any match with match.played == True (regardless of outcome).
    Sets/games: counted from result.sets if present.
    """
    # All matches that were played where this user participated
    matches = (
        db.query(Match)
        .filter(Match.played == True)
        .filter((Match.player1_id == player.id) | (Match.player2_id == player.id))
        .all()
    )

    mp = 0
    mw = 0
    sets_won = 0
    sets_played = 0
    games_won = 0
    games_played = 0

    for m in matches:
        if not m.result:
            continue

        mp += 1
        if m.result.winner_id == player.id:
            mw += 1

        sets = m.result.sets or []
        for s in sets:
            p1g = s.get("p1_games", 0) or 0
            p2g = s.get("p2_games", 0) or 0

            if m.player1_id == player.id:
                games_won += p1g
                games_played += p1g + p2g
                sets_played += 1
                if p1g > p2g:
                    sets_won += 1
            else:
                games_won += p2g
                games_played += p1g + p2g
                sets_played += 1
                if p2g > p1g:
                    sets_won += 1

    win_pct  = round((mw / mp) * 100, 1) if mp else 0.0
    set_pct  = round((sets_won / sets_played) * 100, 1) if sets_played else 0.0
    game_pct = round((games_won / games_played) * 100, 1) if games_played else 0.0

    return {
        "matches_played": mp,
        "matches_won": mw,
        "sets_played": sets_played,
        "sets_won": sets_won,
        "games_played": games_played,
        "games_won": games_won,
        "win_pct": win_pct,
        "set_pct": set_pct,
        "game_pct": game_pct,
    }
