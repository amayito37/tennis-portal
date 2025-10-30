from app.db.session import SessionLocal, engine
from app.models.user import User
from app.db.base import Base

mock_players = [
    {"full_name": "John Doe", "points": 560},
    {"full_name": "Jane Smith", "points": 490},
    {"full_name": "Alex Johnson", "points": 450},
    {"full_name": "Samuel Williams", "points": 430},
    {"full_name": "Lucas Brown", "points": 410},
    {"full_name": "Short Pass", "points": 1000},
]

def seed():
    # Ensure all tables exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    for p in mock_players:
        existing = db.query(User).filter_by(full_name=p["full_name"]).first()
        if not existing:
            user = User(
                full_name=p["full_name"],
                email=p["full_name"].replace(" ", ".").lower() + "@test.com",
                hashed_password="placeholder",
                is_admin=False,
                points=p["points"],
            )
            db.add(user)

    db.commit()
    db.close()
    print("✅ Seeded mock players successfully!")

if __name__ == "__main__":
    seed()
