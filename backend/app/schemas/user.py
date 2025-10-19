from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserPublic(UserBase):
    id: int
    is_admin: bool
    points: int

    class Config:
        from_attributes = True
