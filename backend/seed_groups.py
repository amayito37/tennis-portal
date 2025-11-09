from app.db.session import SessionLocal
from app.models.group import Group
from app.models.round import Round

db = SessionLocal()

# Ensure at least one active round exists
active_round = db.query(Round).filter(Round.status == "ACTIVE").first()
if not active_round:
    active_round = Round(name="Round 1", status="ACTIVE")
    db.add(active_round)
    db.commit()
    print("✅ Created Round 1 as active round")

# Create groups if not already existing
groups = [
    ("Group A", "Players in Group A"),
    ("Group B", "Players in Group B"),
    ("Group C", "Players in Group C"),
]

for name, desc in groups:
    if not db.query(Group).filter(Group.name == name).first():
        db.add(Group(name=name, description=desc))

db.commit()
print("✅ Groups seeded successfully.")
