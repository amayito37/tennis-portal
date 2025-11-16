import random, string
from app.db.session import SessionLocal
from app.models.user import User
from app.models.group import Group
from app.core.security import get_password_hash  # or use your local hash util

db = SessionLocal()

def random_password(length=9):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=length))

# Wipe previous users
db.query(User).delete()
db.commit()

# Groups mapping (same order as in seed_groups.py)
groups_data = {
    1: ["Santiago Ortiz", "Yann Kerouredan", "Jorge Scharfhausen", "Rubén Baquero"],
    2: ["Juan Pablo Arévalo", "Miguel de Antonio", "Iago Hidalgo", "Jaime Bedia"],
    3: ["Tomás González", "Jorge Sancho", "Pablo Magán", "Miguel Ángel García"],
    4: ["Ignacio Rivera", "Borja Ferrer", "Javier Murcia", "Juanjo Bolaños"],
    5: ["Álvaro Palacio", "María Hernández", "Isabel Harahus", "Antonio Martínez"],
    6: ["Eduardo Tejedor", "Ricardo Gómez", "Jonathan García", "Carlos Calvo"],
    7: ["Adam Kin", "Isaac Torreblanca", "Jorge Vidal", "Alejandro Carril"],
    8: ["Félix López", "Fernando Sainz", "Iván Fernández", "Adrián Pérez"],
    9: ["Sergi Martín", "Ziqi Deng", "Miguel Bermejo", "Alejandro Rodera"],
    10: ["José Antonio González", "Daniel Herranz", "Ismael Juarez", "Carlos Poderoso"],
    11: ["Ana Bellón", "Tania Díaz", "Ignacio Ochoa", "Ciro Annunziata"],
    12: ["Emanuel Baptista", "Arturo Guevara", "Claudia Riera", "Victoria Fadul"],
    13: ["Emilio Rivero", "Gonzalo Sánchez", "Beatriz Moñino", "Paula Gatón"],
}

# Add all players
for group_id, players in groups_data.items():
    for full_name in players:
        first, *rest = full_name.split()
        last = "".join(rest)
        email = f"{first}{last}@test.com".replace("ñ", "n").replace("Ñ", "N").replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
        password = random_password()
        hashed_pw = get_password_hash(password)

        u = User(
            full_name=full_name,
            email=email.lower(),
            hashed_password=hashed_pw,
            group_id=group_id,
            is_admin=False
        )
        db.add(u)
        print(f"✅ Created {full_name} ({email}) | pwd: {password}")

# Add admin user
admin = User(
    full_name="Admin User",
    email="admin@example.com",
    hashed_password=get_password_hash("admin123"),
    is_admin=True
)
db.add(admin)

db.commit()
print("✅ All users seeded successfully (including admin).")
