from app.db.session import SessionLocal
from app.models.group import Group

db = SessionLocal()

groups = [
    "Grupo I", "Grupo II", "Grupo III", "Grupo IV", "Grupo V", "Grupo VI",
    "Grupo VII", "Grupo VIII", "Grupo IX", "Grupo X", "Grupo XI", "Grupo XII", "Grupo XIII"
]

db.query(Group).delete()
db.commit()

for i, name in enumerate(groups, start=1):
    g = Group(name=name)
    db.add(g)

db.commit()
print(f"✅ Seeded {len(groups)} groups.")
