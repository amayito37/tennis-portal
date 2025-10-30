from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models import user, match, group  # ✅ Ensure all models are loaded
from app.models.user import User
from app.auth.security import get_password_hash

mock_users = [
    {"full_name": "John Doe", "email": "john.doe@test.com", "password": "password123"},
    {"full_name": "Jane Smith", "email": "jane.smith@test.com", "password": "password123"},
    {"full_name": "Alex Johnson", "email": "alex.johnson@test.com", "password": "password123"},
    {"full_name": "Samuel Williams", "email": "samuel.williams@test.com", "password": "password123"},
    {"full_name": "Lucas Brown", "email": "lucas.brown@test.com", "password": "password123"},
    {"full_name": "Short Pass", "email": "short@example.com", "password": "password123"},
]

def seed():
    # ✅ Make sure all tables exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    for u in mock_users:
        existing = db.query(User).filter_by(email=u["email"]).first()
        if not existing:
            user = User(
                full_name=u["full_name"],
                email=u["email"],
                hashed_password=get_password_hash(u["password"]),
                is_admin=False,
                points=0,
            )
            db.add(user)
    db.commit()
    db.close()
    print("✅ Seeded users with passwords successfully!")

if __name__ == "__main__":
    seed()
