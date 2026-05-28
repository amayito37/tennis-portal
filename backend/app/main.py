from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import CORS_ORIGINS
from app.db.compat import ensure_user_lifecycle_columns
from app.db.session import engine
from app.db.base import Base
from app.models import user as _user_model  
from app.models import match as _match_model
from app.models import group as _group_model
from app.models import round as _round_model
from app.models import round_group_membership as _round_group_membership_model

app = FastAPI(title="Tennis Ranking API", version="1.0.0")

default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

allow_origin_regex = r"^https://.*\.netlify\.app$|^https://(www\.)?rankingcta\.com$"

allow_origins = default_origins
if CORS_ORIGINS:
    allow_origins.append(CORS_ORIGINS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,           
    allow_origin_regex=allow_origin_regex, 
    allow_credentials=False,               
    allow_methods=["*"],                   
    allow_headers=["*"],
)

app.include_router(api_router)

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    ensure_user_lifecycle_columns()
