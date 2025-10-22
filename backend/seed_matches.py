from datetime import datetime, timedelta, timezone
from app.db.session import SessionLocal
from app.models.match import Match, MatchStatus
from app.models.user import User

def seed():
    db = SessionLocal()

    # Get all players
    players = db.query(User).all()
    if len(players) < 2:
        print("❌ Not enough players to create matches.")
        return

    # Played matches (COMPLETED)
    match_data = [
        (players[0], players[1], players[0], "6-3 6-4", True),
        (players[2], players[3], players[2], "7-6 3-6 6-2", True),
        (players[4], players[5], players[4], "6-1 6-0", True),
    ]

    # Upcoming fixtures (SCHEDULED)
    fixture_data = [
        (players[0], players[2], None, None, False),
        (players[3], players[5], None, None, False),
        (players[1], players[4], None, None, False),
    ]

    all_data = match_data + fixture_data
    now = datetime.now(timezone.utc)

    # Clear existing matches
    db.query(Match).delete()

    for i, (p1, p2, winner, score, played) in enumerate(all_data):
        status = MatchStatus.COMPLETED if played else MatchStatus.SCHEDULED
        scheduled_date = now - timedelta(days=i) if played else now + timedelta(days=i + 1)

        match = Match(
            player1_id=p1.id,
            player2_id=p2.id,
            winner_id=winner.id if winner else None,
            score=score,
            played=played,
            status=status,
            scheduled_date=scheduled_date,
        )
        db.add(match)

    db.commit()
    print("✅ Mock matches and fixtures inserted successfully!")

if __name__ == "__main__":
    seed()
