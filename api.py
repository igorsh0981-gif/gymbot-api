"""
api.py — REST API для GymBot Mini App (Telegram WebApp)
Запуск: uvicorn api:app --host 0.0.0.0 --port 8081
"""
import os, logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+pg8000://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)

R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "").rstrip("/")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
AI_DAILY_LIMIT = 5

def r2_photo_url(slug: str) -> Optional[str]:
    if not slug or not R2_PUBLIC_URL:
        return None
    from urllib.parse import quote
    return f"{R2_PUBLIC_URL}/{quote(f'exercises/{slug}/photo.jpg', safe='/')}"

app = FastAPI(title="GymBot Mini App API", docs_url="/api/docs")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET", "POST"], allow_headers=["*"])

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "GymBot Mini App API"}

@app.get("/api/user/{tg_id}")
def get_user(tg_id: int):
    with SessionLocal() as db:
        user = db.execute(text("""
            SELECT id, telegram_id, first_name, username,
                   age, weight, height, gender, fitness_level,
                   desired_result, desired_value_text,
                   medical_conditions, allergies,
                   profile_complete, is_minor,
                   ai_requests_today, ai_requests_reset_date, lang, created_at
            FROM users WHERE telegram_id=:tg_id
        """), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        bmi = None
        if user.weight and user.height:
            h = user.height / 100
            bmi = round(float(user.weight) / (h * h), 1)
        streak = db.execute(text("""
            SELECT COUNT(DISTINCT DATE(started_at)) FROM workouts
            WHERE user_id=:uid AND started_at >= NOW() - INTERVAL '30 days'
            AND finished_at IS NOT NULL
        """), {"uid": user.id}).scalar() or 0
        return {
            "id": user.id, "telegram_id": user.telegram_id,
            "first_name": user.first_name, "username": user.username,
            "age": user.age, "weight": float(user.weight) if user.weight else None,
            "height": user.height, "gender": user.gender,
            "fitness_level": user.fitness_level, "desired_result": user.desired_result,
            "desired_value_text": user.desired_value_text,
            "medical_conditions": user.medical_conditions or [],
            "allergies": user.allergies or [],
            "profile_complete": user.profile_complete,
            "ai_requests_today": user.ai_requests_today or 0,
            "lang": user.lang or "ru", "bmi": bmi, "streak_days": streak,
        }

@app.get("/api/workouts/{tg_id}")
def get_workouts(tg_id: int, limit: int = 20):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        rows = db.execute(text("""
            SELECT w.id, w.started_at, w.finished_at, w.workout_type,
                   COUNT(ws.id) as sets_count,
                   COALESCE(SUM(ws.reps * ws.weight), 0) as total_volume,
                   EXTRACT(EPOCH FROM (w.finished_at - w.started_at))/60 as duration_min
            FROM workouts w
            LEFT JOIN workout_sets ws ON ws.workout_id = w.id
            WHERE w.user_id=:uid AND w.finished_at IS NOT NULL
            GROUP BY w.id ORDER BY w.started_at DESC LIMIT :limit
        """), {"uid": user.id, "limit": limit}).fetchall()
        return {"workouts": [{"id": r.id, "started_at": r.started_at.isoformat() if r.started_at else None,
            "workout_type": r.workout_type, "sets_count": r.sets_count or 0,
            "total_volume": float(r.total_volume or 0),
            "duration_min": round(float(r.duration_min or 0))} for r in rows]}

@app.get("/api/stats/{tg_id}")
def get_stats(tg_id: int, days: int = 30):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        uid = user.id
        since = datetime.utcnow() - timedelta(days=days)
        totals = db.execute(text("""
            SELECT COUNT(DISTINCT w.id) as total_workouts, COUNT(ws.id) as total_sets,
                   COALESCE(SUM(ws.reps * ws.weight), 0) as total_volume
            FROM workouts w LEFT JOIN workout_sets ws ON ws.workout_id = w.id
            WHERE w.user_id=:uid AND w.started_at >= :since AND w.finished_at IS NOT NULL
        """), {"uid": uid, "since": since}).fetchone()
        weekly = db.execute(text("""
            SELECT DATE_TRUNC('week', started_at) as week, COUNT(*) as cnt
            FROM workouts WHERE user_id=:uid AND started_at >= NOW() - INTERVAL '56 days'
            AND finished_at IS NOT NULL GROUP BY week ORDER BY week
        """), {"uid": uid}).fetchall()
        weight_logs = db.execute(text("""
            SELECT weight, logged_at FROM weight_log
            WHERE user_id=:uid ORDER BY logged_at DESC LIMIT 10
        """), {"uid": uid}).fetchall()
        return {
            "period_days": days,
            "total_workouts": totals.total_workouts or 0,
            "total_sets": totals.total_sets or 0,
            "total_volume": float(totals.total_volume or 0),
            "weekly_workouts": [int(r.cnt) for r in weekly],
            "streak_days": db.execute(text("""
                SELECT COUNT(DISTINCT DATE(started_at)) FROM workouts
                WHERE user_id=:uid AND finished_at IS NOT NULL
            """), {"uid": uid}).scalar() or 0,
            "weight_logs": [{"weight": float(w.weight), "logged_at": w.logged_at.isoformat()} for w in weight_logs],
        }

@app.get("/api/exercises")
def get_exercises(group_id: Optional[int] = None, search: Optional[str] = None):
    with SessionLocal() as db:
        where = "WHERE 1=1"
        params = {}
        if group_id:
            where += " AND e.muscle_group_id=:gid"
            params["gid"] = group_id
        if search:
            where += " AND LOWER(e.name) LIKE :q"
            params["q"] = f"%{search.lower()}%"
        exercises = db.execute(text(f"""
            SELECT e.id, e.name, e.description, e.difficulty, e.equipment,
                   e.sets_recommended, e.reps_recommended, e.muscle_group_id, e.r2_slug,
                   mg.name as group_name, mg.emoji as group_emoji
            FROM exercises e JOIN muscle_groups mg ON mg.id = e.muscle_group_id
            {where} ORDER BY mg.id, e.name LIMIT 200
        """), params).fetchall()
        groups = db.execute(text("SELECT id, name, emoji FROM muscle_groups ORDER BY id")).fetchall()
        return {
            "exercises": [{"id": e.id, "name": e.name, "description": e.description,
                "difficulty": e.difficulty, "equipment": e.equipment,
                "sets_recommended": e.sets_recommended, "reps_recommended": e.reps_recommended,
                "muscle_group_id": e.muscle_group_id, "group_name": e.group_name,
                "group_emoji": e.group_emoji, "photo_url": r2_photo_url(e.r2_slug)} for e in exercises],
            "muscle_groups": [{"id": g.id, "name": g.name, "emoji": g.emoji} for g in groups],
        }

class AIRequest(BaseModel):
    question: str
    tg_id: Optional[int] = None

@app.post("/api/ai/ask")
async def ai_ask(req: AIRequest):
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=503, detail="AI not configured")
    with SessionLocal() as db:
        user = None
        requests_today = 0
        if req.tg_id:
            user = db.execute(text("""
                SELECT id, age, weight, height, gender, fitness_level,
                       desired_result, medical_conditions, allergies,
                       ai_requests_today, ai_requests_reset_date, lang
                FROM users WHERE telegram_id=:tg_id
            """), {"tg_id": req.tg_id}).fetchone()
        if user:
            today = datetime.utcnow().date()
            reset_date = user.ai_requests_reset_date
            if hasattr(reset_date, 'date'):
                reset_date = reset_date.date()
            requests_today = user.ai_requests_today or 0
            if reset_date != today:
                requests_today = 0
                db.execute(text("UPDATE users SET ai_requests_today=0, ai_requests_reset_date=:today WHERE id=:uid"),
                           {"today": today, "uid": user.id})
                db.commit()
            if requests_today >= AI_DAILY_LIMIT:
                raise HTTPException(status_code=429, detail=f"Daily limit {AI_DAILY_LIMIT} reached")
        lang = (user.lang if user else None) or "ru"
        lang_hint = "Reply in Russian." if lang == "ru" else ("Reply in Uzbek." if lang == "uz" else "Reply in English.")
        if user:
            context = (f"You are GymBot AI Coach. Client: {user.age}y, {user.weight}kg, {user.height}cm, "
                       f"level={user.fitness_level}, goal={user.desired_result}. {lang_hint} "
                       f"Be practical, max 300 words.\nQUESTION: {req.question}")
        else:
            context = f"You are GymBot AI fitness coach. {lang_hint} Be practical, max 300 words.\nQUESTION: {req.question}"
        import anthropic
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        message = client.messages.create(
            model="claude-sonnet-4-6", max_tokens=1000,
            messages=[{"role": "user", "content": context}]
        )
        answer = message.content[0].text
        if user:
            db.execute(text("UPDATE users SET ai_requests_today=COALESCE(ai_requests_today,0)+1, ai_requests_reset_date=:today WHERE id=:uid"),
                       {"today": datetime.utcnow().date(), "uid": user.id})
            db.commit()
        return {"answer": answer, "requests_used": requests_today + 1}

@app.get("/api/nutrition/{tg_id}")
def get_nutrition(tg_id: int):
    with SessionLocal() as db:
        user = db.execute(text("""
            SELECT id, age, weight, height, gender, fitness_level, desired_result
            FROM users WHERE telegram_id=:tg_id
        """), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        today = datetime.utcnow().date()
        logs = db.execute(text("""
            SELECT meal_name, kcal, protein, fat, carb FROM food_log
            WHERE user_id=:uid AND DATE(date)=:today ORDER BY date
        """), {"uid": user.id, "today": today}).fetchall()
        w, h, a = float(user.weight or 70), user.height or 175, user.age or 30
        bmr = (10*w + 6.25*h - 5*a + 5) if user.gender == "male" else (10*w + 6.25*h - 5*a - 161)
        tdee = round(bmr * {"beginner": 1.375, "intermediate": 1.55, "advanced": 1.725}.get(user.fitness_level, 1.375))
        target = tdee + {"lose_weight": -500, "gain_muscle": 300, "gain_strength": 200}.get(user.desired_result, 0)
        return {
            "tdee": tdee, "target_kcal": target,
            "today_logs": [{"meal_name": l.meal_name, "kcal": l.kcal,
                "protein": float(l.protein or 0), "fat": float(l.fat or 0), "carb": float(l.carb or 0)} for l in logs],
            "today_totals": {"kcal": sum(l.kcal or 0 for l in logs),
                "protein": round(sum(float(l.protein or 0) for l in logs), 1),
                "fat": round(sum(float(l.fat or 0) for l in logs), 1),
                "carb": round(sum(float(l.carb or 0) for l in logs), 1)},
        }
