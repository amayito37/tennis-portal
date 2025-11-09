from fastapi import APIRouter
from app.routers import auth, players, matches, profile, groups, rounds

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(players.router, prefix="/players", tags=["players"])
api_router.include_router(matches.router, prefix="/matches", tags=["matches"])
api_router.include_router(profile.router, prefix="/profile", tags=["profile"])
api_router.include_router(groups.router, prefix="/groups", tags=["groups"])
api_router.include_router(rounds.router, prefix="/rounds", tags=["rounds"])