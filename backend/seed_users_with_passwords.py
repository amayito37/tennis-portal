from app.db.session import SessionLocal
from app.models.user import User
from app.auth.security import get_password_hash

# --- mock player data ---
mock_players = [
    {"full_name": "John Doe", "points": 560},
    {"full_name": "Jane Smith", "points": 490},
    {"full_name": "Alex Johnson", "points": 450},
    {"full_name": "Samuel Williams", "points": 430},
    {"full_name": "Lucas Brown", "points": 410},
    {"full_name": "Short Pass", "points": 1000},  # optional, if part of your ranking
]

DEFAULT_PASSWORD = "password123"

def seed():
    db = SessionLocal()
    for p in mock_players:
        email = p["full_name"].replace(" ", ".").lower() + "@test.com"
        existing = db.query(User).filter_by(email=email).first()
        if not existing:
            user = User(
                full_name=p["full_name"],
                email=email,
                hashed_password=get_password_hash(DEFAULT_PASSWORD),
                is_admin=False,
                points=p["points"],
            )
            db.add(user)
            print(f"🧑‍💻 Created user {email} with password '{DEFAULT_PASSWORD}'")
        else:
            print(f"ℹ️ User {email} already exists, skipping.")

    db.commit()
    db.close()
    print("✅ All mock users seeded successfully!")

if __name__ == "__main__":
    seed()
