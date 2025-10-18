from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, matches, players

app = FastAPI()
origins = ["http://localhost:5173", "https://tennisranking.netlify.app"]
app.add_middleware(CORSMiddleware, allow_origins=origins,
allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router)
app.include_router(matches.router)
app.include_router(players.router)