import random, string
from app.db.session import SessionLocal
from app.models.user import User
from app.auth.security import get_password_hash

db = SessionLocal()

# Mapping from PDF "Clasificación general 27/06"
ranking_points = {
    "Santiago Ortiz": 1221,
    "Jorge López": 1211,
    "Yann Kerouredan": 1188,
    "Jorge Sancho": 1144,
    "Miguel Ángel García": 1123,
    "Jorge Scharfhausen": 1112,
    "Félix López": 1108,
    "Tania Díaz": 1105,
    "Ignacio Rivera": 1101,
    "Álvaro Palacio": 1099,
    "Miguel de Antonio": 1078,
    "Eduardo Tejedor": 1078,
    "Juan Pablo Arévalo": 1073,
    "Tomás González": 1068,
    "Carlos Calvo": 1057,
    "Fernando Sainz": 1057,
    "Jorge Vidal": 1051,
    "Jaminson Sarmiento": 1037,
    "Raúl Varas": 1028,
    "Samuel Martínez": 1012,
    "Aurora Graciá": 1011,
    "Antonio Martínez": 1010,
    "Isaac Torreblanca": 1010,
    "Samuel Reyes": 1010,
    "Ana Bellón": 1005,
    "Juanjo Bolaños": 995,
    "Daniel Rodríguez": 994,
    "Alberto Lambea": 992,
    "David González": 992,
    "Elías López": 991,
    "Ricardo Gómez": 989,
    "Mayra Lazar": 981,
    "Daniel Ruiz": 977,
    "Álvaro Varas": 976,
    "Raphael Dornard": 976,
    "Javier Murcia": 974,
    "Adrián Pérez": 964,
    "Miguel Bermejo": 959,
    "Ana María Triguero": 946,
    "Emiliano Russo": 946,
    "Iván Fernández": 933,
    "Ismael Juarez": 930,
    "Alejandro Carbia": 922,
    "Adam Kin": 921,
    "Ciro Annunziata": 913,
    "Isabel Alemany": 906,
    "Diego Quesada": 901,
    "Emanuel Baptista": 896,
    "Emilio Rivero": 890,
    "Beatriz Moñino": 883,
    "Phil Veysey": 863,
    "Gonzalo Sánchez": 837,
    "María Fernández": 828,
    "José Sanseroni": 805,
    "Paula Gatón": 717,
}

def random_password(length=9):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=length))

db.query(User).delete()
db.commit()

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

for group_id, players in groups_data.items():
    for full_name in players:
        first, *rest = full_name.split()
        last = "".join(rest)
        email = (
            f"{first}{last}"
            .replace("ñ", "n").replace("Ñ", "N")
            .replace("á", "a").replace("é", "e").replace("í", "i")
            .replace("ó", "o").replace("ú", "u")
        ).lower()
        password = random_password()
        hashed_pw = get_password_hash(password)

        points = ranking_points.get(full_name, 1000)

        u = User(
            full_name=full_name,
            email=email,
            hashed_password=hashed_pw,
            group_id=group_id,
            is_admin=False,
            points=points,
        )
        db.add(u)
        print(f"✅ {full_name} ({email}) | pwd: {password} | pts: {points}")

admin = User(
    full_name="Admin User",
    email="admin",
    hashed_password=get_password_hash("admin123"),
    is_admin=True,
    points=0,
)
db.add(admin)

db.commit()
print("✅ Users + rankings seeded successfully (including admin).")
