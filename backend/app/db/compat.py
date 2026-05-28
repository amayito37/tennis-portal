from sqlalchemy import inspect, text

from app.db.session import engine


def ensure_user_lifecycle_columns() -> None:
    """
    Lightweight compatibility for existing deployments.
    The project currently uses create_all rather than migrations, so new
    columns must be added explicitly when the users table already exists.
    """
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    existing = {column["name"] for column in inspector.get_columns("users")}
    dialect = engine.dialect.name

    statements = []
    if "is_active" not in existing:
        if dialect == "postgresql":
            statements.append(
                "ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE"
            )
        else:
            statements.append(
                "ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1"
            )
    if "pending_status" not in existing:
        statements.append("ALTER TABLE users ADD COLUMN pending_status VARCHAR(50)")
    if "pending_after_round_id" not in existing:
        statements.append("ALTER TABLE users ADD COLUMN pending_after_round_id INTEGER")

    if not statements:
        return

    with engine.begin() as conn:
        for statement in statements:
            conn.execute(text(statement))
