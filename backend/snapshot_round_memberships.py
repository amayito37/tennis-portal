import argparse

from app.db.session import SessionLocal
from app.models.round import Round
from app.services.round_memberships import snapshot_round_memberships


def main():
    parser = argparse.ArgumentParser(
        description="Snapshot current user groups into round_group_memberships."
    )
    parser.add_argument("round_id", type=int)
    args = parser.parse_args()

    db = SessionLocal()
    try:
        round_ = db.query(Round).get(args.round_id)
        if not round_:
            raise SystemExit(f"Round {args.round_id} does not exist.")

        created = snapshot_round_memberships(db, args.round_id)
        db.commit()
        print(f"Snapshot complete for round {args.round_id}. Created {created} rows.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
