from sqlalchemy import Column, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.base import Base


class RoundGroupMembership(Base):
    __tablename__ = "round_group_memberships"
    __table_args__ = (
        UniqueConstraint("round_id", "user_id", name="uq_round_group_membership_round_user"),
    )

    id = Column(Integer, primary_key=True, index=True)
    round_id = Column(Integer, ForeignKey("rounds.id"), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    points_at_start = Column(Integer, nullable=False)
    points_at_end = Column(Integer, nullable=True)

    round = relationship("Round")
    group = relationship("Group")
    user = relationship("User")
