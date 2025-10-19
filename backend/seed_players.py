from app.db.session import SessionLocal
from app.models.user import User

# --- mock player data ---
mock_players = [
    {"full_name": "John Doe", "points": 560},
    {"full_name": "Jane Smith", "points": 490},
    {"full_name": "Alex Johnson", "points": 450},
    {"full_name": "Samuel Williams", "points": 430},
    {"full_name": "Lucas Brown", "points": 410},
]

def seed():
    db = SessionLocal()
    for p in mock_players:
        existing = db.query(User).filter_by(full_name=p["full_name"]).first()
        if not existing:
            db.add(
                User(
                    full_name=p["full_name"],
                    email=p["full_name"].replace(" ", ".").lower() + "@test.com",
                    hashed_password="placeholder",  # not used here
                    is_admin=False,
                    points=p["points"],
                )
            )
    db.commit()
    db.close()
    print("✅ Seeded mock players successfully!")

if __name__ == "__main__":
    seed()
