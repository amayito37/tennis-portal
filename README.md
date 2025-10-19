# 🎾 Tennis Ranking Portal

A modern full-stack web application for managing a community tennis ranking — built with **React** (frontend) and **FastAPI** (backend).  
Players can log in, record match results, and see live leaderboards.  
Admins can approve results, edit scores, and manage users.

---

## 🚀 Features

### 🧑‍🎾 Players
- Sign up, log in, and view their ranking
- Submit match results
- See stats and history

### 🧑‍💼 Admins
- Approve or reject match results
- Edit player scores and points
- Manage users and fixtures

### 📊 Ranking System
- ELO-based rating updates
- Automatic recalculation on match approval
- Dynamic leaderboard

---

### Development
```
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Or
```
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

