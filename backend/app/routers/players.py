from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.auth.security import get_current_user, get_db
from app.schemas.user import UserPublic
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[UserPublic])
def list_players(db: Session = Depends(get_db), _=Depends(get_current_user)):
    players = db.query(User).order_by(User.points.desc()).all()
    return players

@router.get("/{player_id}", response_model=UserPublic)
def get_player(player_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(User).filter(User.id == player_id).first()
