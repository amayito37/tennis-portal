from pydantic import BaseModel, constr, ConfigDict
from typing import Literal, Optional

class UserBase(BaseModel):
    email: str | None = None
    full_name: str | None = None

class UserCreate(UserBase):
    # bcrypt supports up to 72 bytes, so we enforce that limit here
    password: constr(min_length=6, max_length=72)

class UserPublic(UserBase):
    id: int
    is_admin: bool
    is_active: bool = True
    pending_status: str | None = None
    pending_after_round_id: int | None = None
    points: int

    group_id: int | None = None
    group_name: str | None = None

    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    points: Optional[int] = None
    group_id: Optional[int] = None


class AdminPlayerCreate(BaseModel):
    email: str
    full_name: str
    password: constr(min_length=6, max_length=72)
    group_id: int
    join_timing: Literal["NOW", "NEXT_ROUND"] = "NOW"


class AdminPlayerUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    points: Optional[int] = None
    group_id: Optional[int] = None
