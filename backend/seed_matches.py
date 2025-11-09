from app.db.session import SessionLocal
from app.models.match import Match
from app.models.user import User
from app.models.match_result import MatchResult
from app.models.round import Round
from datetime import datetime, timedelta

db = SessionLocal()

# Clean existing matches
db.query(MatchResult).delete()
db.query(Match).delete()
db.commit()

# Get active round
current_round = db.query(Round).filter(Round.status == "ACTIVE").first()
if not current_round:
    raise Exception("❌ No active round found. Please seed a round first.")

users = db.query(User).filter(User.is_admin == False).order_by(User.id).all()
users_by_group = {}
for u in users:
    users_by_group.setdefault(u.group_id, []).append(u)

now = datetime.utcnow()
matches_to_seed = []
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
            round_id=current_round.id,  # ✅ assign round
        )

        db.add(match)
        db.flush()  # ensure match.id exists

        # 50% completed matches (deterministic)
        if match_index % 2 == 0:
            # Winner wins more sets deterministically
            if game_num % 2 == 0:
                sets = [
                    {"p1_games": 6, "p2_games": 4, "p1_tiebreak": None, "p2_tiebreak": None, "super_tiebreak": False},
                    {"p1_games": 2, "p2_games": 6, "p1_tiebreak": None, "p2_tiebreak": None, "super_tiebreak": False},
                    {"p1_games": 6, "p2_games": 3, "p1_tiebreak": None, "p2_tiebreak": None, "super_tiebreak": False},
                ]
                winner, loser = p1, p2
            else:
                sets = [
                    {"p1_games": 3, "p2_games": 6, "p1_tiebreak": None, "p2_tiebreak": None, "super_tiebreak": False},
                    {"p1_games": 6, "p2_games": 4, "p1_tiebreak": None, "p2_tiebreak": None, "super_tiebreak": False},
                    {"p1_games": 5, "p2_games": 7, "p1_tiebreak": None, "p2_tiebreak": None, "super_tiebreak": False},
                ]
                winner, loser = p2, p1

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
completed = len([m for m in matches_to_seed if m.status == "COMPLETED"])
print(f"✅ Seeded {len(matches_to_seed)} matches ({completed} completed, {len(matches_to_seed) - completed} scheduled).")
