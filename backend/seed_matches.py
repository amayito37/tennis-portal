from app.db.session import SessionLocal
from app.models.match import Match
from app.models.user import User
from app.models.match_result import MatchResult
from datetime import datetime, timedelta

db = SessionLocal()

# Clean existing data
db.query(MatchResult).delete()
db.query(Match).delete()
db.commit()

# Deterministic setup (no randomness)
users = db.query(User).order_by(User.id).all()
users_by_group = {}
for u in users:
    users_by_group.setdefault(u.group_id, []).append(u)

now = datetime.utcnow()
matches_to_seed = []

# Deterministic counters
match_index = 0

for group_id, players in users_by_group.items():
    if len(players) < 2:
        continue

    p1, p2 = players[0], players[1]

    # Create exactly 4 matches per group
    for game_num in range(4):
        match_index += 1

        match = Match(
            player1_id=p1.id,
            player2_id=p2.id,
            scheduled_date=now + timedelta(days=game_num + group_id),
            played=False,
            status="SCHEDULED",
        )

        db.add(match)
        db.flush()  # Ensure match.id exists

        # Alternate deterministically → 50% completed, 50% scheduled
        if match_index % 2 == 0:
            winner = p1 if game_num % 2 == 0 else p2
            loser = p2 if winner == p1 else p1

            # Deterministic fixed result for debug visibility
            sets = [
                {"p1_games": 6, "p2_games": 4, "p1_tiebreak": None, "p2_tiebreak": None, "super_tiebreak": False},
                {"p1_games": 3, "p2_games": 6, "p1_tiebreak": None, "p2_tiebreak": None, "super_tiebreak": False},
                {"p1_games": 6, "p2_games": 2, "p1_tiebreak": None, "p2_tiebreak": None, "super_tiebreak": False},
            ]

            result = MatchResult(
                match_id=match.id,
                winner_id=winner.id,
                loser_id=loser.id,
                outcome="COMPLETED",
                sets=sets,
            )

            match.played = True
            match.status = "COMPLETED"
            match.winner_id = winner.id
            match.result = result
            db.add(result)

        matches_to_seed.append(match)

db.commit()
print(f"✅ Seeded {len(matches_to_seed)} matches successfully.")
completed = len([m for m in matches_to_seed if m.status == "COMPLETED"])
print(f"✅ {completed} completed, {len(matches_to_seed) - completed} scheduled.")
