from datetime import datetime, timedelta
from app.db.session import SessionLocal
from app.models.match import Match
from app.models.user import User

def seed():
    db = SessionLocal()
    now = datetime.utcnow()

    players = db.query(User).all()
    group_ids = sorted(set(p.group_id for p in players if p.group_id))

    for g_id in group_ids:
        group_players = [p for p in players if p.group_id == g_id]
        if len(group_players) < 2:
            continue

        # ✅ Add a played match
        m1 = Match(
            player1_id=group_players[0].id,
            player2_id=group_players[1].id,
            winner_id=group_players[0].id,
            score="6-4 6-3",
            played=True,
            scheduled_date=now - timedelta(days=3),
        )
        db.add(m1)

        # ✅ Add an unplayed fixture (will show up in /groups/{id}/fixtures)
        m2 = Match(
            player1_id=group_players[0].id,
            player2_id=group_players[-1].id,
            played=False,
            scheduled_date=now + timedelta(days=2),
        )
        db.add(m2)

    db.commit()
    db.close()
    print("✅ Group-based matches + fixtures seeded successfully!")

if __name__ == "__main__":
    seed()
