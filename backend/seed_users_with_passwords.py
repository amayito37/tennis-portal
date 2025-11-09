from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.models.user import User
from app.models.group import Group
from app.models.match import Match
from app.models.match_result import MatchResult
from app.models.round import Round
from app.auth.security import get_password_hash
from datetime import datetime, timedelta


def seed():
    # Ensure all tables are created
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # Clean old data
    db.query(MatchResult).delete()
    db.query(Match).delete()
    db.query(User).delete()
    db.query(Group).delete()
    db.query(Round).delete()
    db.commit()

    # Create an initial round
    
    now = datetime.now()
    round1 = Round(
        name="Round 1", 
        status="ACTIVE",
        start_date=now,
        end_date=now + timedelta(days=14),
        )
    db.add(round1)
    db.commit()

    # Create groups
    groups = [
        Group(name="Group A", description="Players in Group A"),
        Group(name="Group B", description="Players in Group B"),
        Group(name="Group C", description="Players in Group C"),
    ]
    db.add_all(groups)
    db.commit()

    # Create users (exclude admin from groups)
    users = [
        User(
            full_name="Admin User",
            email="admin@example.com",
            hashed_password=get_password_hash("admin"),
            is_admin=True,
            points=1000,
        ),
        User(
            full_name="John Doe",
            email="john.doe@test.com",
            hashed_password=get_password_hash("test"),
            is_admin=False,
            points=1000,
            group_id=groups[0].id,
        ),
        User(
            full_name="Jane Smith",
            email="jane.smith@test.com",
            hashed_password=get_password_hash("test"),
            is_admin=False,
            points=1000,
            group_id=groups[0].id,
        ),
        User(
            full_name="Lucas Brown",
            email="lucas.brown@test.com",
            hashed_password=get_password_hash("test"),
            is_admin=False,
            points=1000,
            group_id=groups[1].id,
        ),
        User(
            full_name="Samuel Williams",
            email="samuel.williams@test.com",
            hashed_password=get_password_hash("test"),
            is_admin=False,
            points=1000,
            group_id=groups[1].id,
        ),
        User(
            full_name="Alex Johnson",
            email="alex.johnson@test.com",
            hashed_password=get_password_hash("test"),
            is_admin=False,
            points=1000,
            group_id=groups[2].id,
        ),
        User(
            full_name="Short Pass",
            email="short@example.com",
            hashed_password=get_password_hash("test"),
            is_admin=False,
            points=1000,
            group_id=groups[2].id,
        ),
    ]

    db.add_all(users)
    db.commit()

    print("✅ Seeded users, groups, and initial round successfully.")


if __name__ == "__main__":
    seed()
