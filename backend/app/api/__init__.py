from fastapi import APIRouter
from app.routers import auth, players, matches

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(players.router, prefix="/players", tags=["players"])
api_router.include_router(matches.router, prefix="/matches", tags=["matches"])