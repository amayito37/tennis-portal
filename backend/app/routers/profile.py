from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.auth.security import get_current_user, get_password_hash, verify_password, get_db
from app.models.user import User
from pydantic import BaseModel

router = APIRouter(tags=["profile"])

class UserMeResponse(BaseModel):
    id: int
    email: str
    full_name: str
    points: int
    is_admin: bool
    group_id: int | None = None
    group_name: str | None = None

    class Config:
        from_attributes = True


@router.get("/me", response_model=UserMeResponse)
def get_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return logged-in user info"""
    group_name = None
    if current_user.group_id:
        group = db.query(User).filter(User.group_id == current_user.group_id).first()
        group_name = group.group.name if group and group.group else None

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "points": current_user.points,
        "is_admin": current_user.is_admin,
        "group_id": current_user.group_id,
        "group_name": group_name,
    }


class ChangePasswordPayload(BaseModel):
    old_password: str
    new_password: str


@router.post("/change-password")
def change_password(
    payload: ChangePasswordPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Allow user to change password"""
    if not verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password too short (min 6 characters)")

    current_user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully"}
