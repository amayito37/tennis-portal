from pydantic import BaseModel, EmailStr, constr, ConfigDict

class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None

class UserCreate(UserBase):
    # bcrypt supports up to 72 bytes, so we enforce that limit here
    password: constr(min_length=6, max_length=72)

class UserPublic(UserBase):
    id: int
    is_admin: bool
    points: int

    group_id: int | None = None
    group_name: str | None = None

    model_config = ConfigDict(from_attributes=True)
