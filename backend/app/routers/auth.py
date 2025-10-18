from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.schemas.user import UserCreate, Token
from app.auth.jwt import create_access_token
import bcrypt

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=Token)
def signup(user: UserCreate):
    db = SessionLocal()
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_pw = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    db_user = User(email=user.email, hashed_password=hashed_pw)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    token = create_access_token({"sub": db_user.email})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(user: UserCreate):
    db = SessionLocal()
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not bcrypt.checkpw(user.password.encode('utf-8'), db_user.hashed_password.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": db_user.email})
    return {"access_token": token, "token_type": "bearer"}