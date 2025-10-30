from app.db.session import SessionLocal, engine
from app.models.group import Group
from app.models.user import User
from app.db.base import Base

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Create some example groups
    names = ["Group A", "Group B", "Group C"]
    groups = {}
    for n in names:
        g = db.query(Group).filter_by(name=n).first()
        if not g:
            g = Group(name=n, description=f"Players in {n}")
            db.add(g)
            db.commit()
            db.refresh(g)
        groups[n] = g

    # Assign players manually for now
    assigns = {
        "Group A": ["John Doe", "Jane Smith"],
        "Group B": ["Alex Johnson", "Samuel Williams"],
        "Group C": ["Lucas Brown", "Short Pass"],
    }

    for gname, plist in assigns.items():
        gid = groups[gname].id
        for pname in plist:
            u = db.query(User).filter(User.full_name == pname).first()
            if u:
                u.group_id = gid

    db.commit()
    db.close()
    print("✅ Groups created and players assigned successfully!")

if __name__ == "__main__":
    seed()
