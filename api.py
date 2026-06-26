"""
api.py — REST API для GymBot Mini App (Telegram WebApp)
Запуск: uvicorn api:app --host 0.0.0.0 --port 8081
pip: fastapi uvicorn sqlalchemy pg8000 python-dotenv httpx anthropic python-multipart
"""
import os, logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException, Request as FastAPIRequest
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
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
AI_DAILY_LIMIT = 5

# Геймификация: лимиты AI по рангу
RANK_AI_LIMITS = {"beginner": 5, "athlete": 7, "champion": 10, "legend": 15}
RANK_THRESHOLDS = {"beginner": 0, "athlete": 200, "champion": 500, "legend": 1000}
RANK_NAMES = {"beginner": "🥉 Новичок", "athlete": "🥈 Атлет", "champion": "🥇 Чемпион", "legend": "💎 Легенда"}

# МЕТ значения для видов спорта
SPORT_MET = {
    "football": 8.0, "volleyball": 4.0, "basketball": 8.0,
    "table_tennis": 4.0, "padel": 6.0, "tennis": 7.0, "yoga": 3.0,
}

def calc_rank(points: int) -> str:
    if points >= 1000: return "legend"
    if points >= 500: return "champion"
    if points >= 200: return "athlete"
    return "beginner"

def get_ai_limit(rank: str) -> int:
    return RANK_AI_LIMITS.get(rank, 5)

def add_points(db, uid: int, pts: int, reason: str):
    """Начисляем баллы и обновляем ранг. Вызывать внутри открытой транзакции."""
    try:
        db.execute(text("UPDATE users SET total_points=COALESCE(total_points,0)+:pts WHERE id=:uid"),
                   {"pts": pts, "uid": uid})
        row = db.execute(text("SELECT total_points FROM users WHERE id=:uid"), {"uid": uid}).fetchone()
        new_rank = calc_rank(row[0] or 0)
        db.execute(text("UPDATE users SET user_rank=:rank WHERE id=:uid"), {"rank": new_rank, "uid": uid})
        db.execute(text("INSERT INTO points_log (user_id, points, reason) VALUES (:uid,:pts,:reason)"),
                   {"uid": uid, "pts": pts, "reason": reason})
    except Exception:
        pass

def r2_photo_url(slug: str) -> Optional[str]:
    if not slug or not R2_PUBLIC_URL:
        return None
    from urllib.parse import quote
    return f"{R2_PUBLIC_URL}/{quote(f'exercises/{slug}/photo.jpg', safe='/')}"

app = FastAPI(title="GymBot Mini App API", docs_url="/api/docs")

from food_catalog import router as food_catalog_router
app.include_router(food_catalog_router, prefix="/api")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    allow_credentials=False,
    max_age=3600,
)

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
                   ai_requests_today, ai_requests_reset_date, lang,
                   ai_tone, created_at,
                   COALESCE(total_points,0) AS total_points,
                   COALESCE(user_rank,'beginner') AS user_rank
            FROM users WHERE telegram_id=:tg_id
        """), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        bmi = None
        if user.weight and user.height:
            h = user.height / 100
            bmi = round(float(user.weight) / (h * h), 1)
        streak = db.execute(text("""
            SELECT COUNT(DISTINCT DATE(date)) FROM workouts
            WHERE user_id=:uid AND date >= NOW() - INTERVAL '30 days'
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
            "lang": user.lang or "ru", "ai_tone": user.ai_tone, "bmi": bmi, "streak_days": streak,
            "total_points": int(user.total_points or 0),
            "user_rank": user.user_rank or "beginner",
            "rank_name": RANK_NAMES.get(user.user_rank or "beginner", "🥉 Новичок"),
            "ai_daily_limit": get_ai_limit(user.user_rank or "beginner"),
            "next_rank_pts": next((v for k,v in RANK_THRESHOLDS.items() if v > (user.total_points or 0)), None),
        }

@app.get("/api/workouts/{tg_id}")
def get_workouts(tg_id: int, limit: int = 20):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        rows = db.execute(text("""
            SELECT w.id AS w_id, w.date AS w_date, w.status AS w_status,
                   COALESCE(w.total_volume, 0) AS w_total_volume,
                   COUNT(ws.id) AS w_sets_count,
                   0 AS w_duration_min
            FROM workouts w
            LEFT JOIN workout_sets ws ON ws.workout_id = w.id
            WHERE w.user_id=:uid
            GROUP BY w.id, w.date, w.status, w.total_volume ORDER BY w.date DESC LIMIT :limit
        """), {"uid": user.id, "limit": limit}).fetchall()
        return {"workouts": [{"id": r.w_id, "date": r.w_date.isoformat() if r.w_date else None,
            "workout_type": r.w_status or "Тренировка", "sets_count": r.w_sets_count or 0,
            "total_volume": float(r.w_total_volume or 0),
            "duration_min": round(float(r.w_duration_min or 0))} for r in rows]}

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
            WHERE w.user_id=:uid AND w.date >= :since AND w.status = 'finished'
        """), {"uid": uid, "since": since}).fetchone()
        weekly = db.execute(text("""
            SELECT DATE_TRUNC('week', date) as week, COUNT(*) as cnt
            FROM workouts WHERE user_id=:uid AND date >= NOW() - INTERVAL '56 days'
            AND status = 'finished' GROUP BY week ORDER BY week
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
                SELECT COUNT(DISTINCT DATE(date)) FROM workouts
                WHERE user_id=:uid AND status = 'finished'
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
                   mg.name as group_name, mg.emoji as group_emoji,
                   COALESCE(e.exercise_type, 'strength') as exercise_type
            FROM exercises e JOIN muscle_groups mg ON mg.id = e.muscle_group_id
            {where} ORDER BY mg.id, e.name LIMIT 200
        """), params).fetchall()
        groups = db.execute(text("SELECT id, name, emoji FROM muscle_groups ORDER BY id")).fetchall()
        return {
            "exercises": [{"id": e.id, "name": e.name, "description": e.description,
                "difficulty": e.difficulty, "equipment": e.equipment,
                "sets_recommended": e.sets_recommended, "reps_recommended": e.reps_recommended,
                "muscle_group_id": e.muscle_group_id, "group_name": e.group_name,
                "group_emoji": e.group_emoji, "photo_url": r2_photo_url(e.r2_slug),
                "exercise_type": getattr(e, 'exercise_type', 'strength') or 'strength'} for e in exercises],
            "muscle_groups": [{"id": g.id, "name": g.name, "emoji": g.emoji} for g in groups],
        }


class UserUpdateRequest(BaseModel):
    age: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[int] = None
    gender: Optional[str] = None
    fitness_level: Optional[str] = None
    desired_result: Optional[str] = None
    lang: Optional[str] = None
    ai_tone: Optional[str] = None
    medical_conditions: Optional[list] = None
    allergies: Optional[list] = None

class AIRequest(BaseModel):
    question: str
    tg_id: Optional[int] = None
    skip_limit: Optional[bool] = False  # для системных вызовов (оценка тренировки)

@app.post("/api/ai/ask")
async def ai_ask(req: AIRequest):
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=503, detail="AI not configured")

    # ── Шаг 1: читаем данные из БД (отдельная транзакция) ────────────────────
    user = None
    requests_today = 0
    checkin_context = ""
    exercises_context = ""

    with SessionLocal() as db:
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
            if hasattr(reset_date, "date"):
                reset_date = reset_date.date()
            requests_today = user.ai_requests_today or 0
            if reset_date != today:
                requests_today = 0
                db.execute(text("UPDATE users SET ai_requests_today=0, ai_requests_reset_date=:today WHERE id=:uid"),
                           {"today": today, "uid": user.id})
                db.commit()
            is_admin = req.tg_id == 5281759957
            user_rank_val = getattr(user, "user_rank", "beginner") or "beginner"
            effective_limit = get_ai_limit(user_rank_val)
            if requests_today >= effective_limit and not req.skip_limit and not is_admin:
                raise HTTPException(status_code=429, detail=f"Daily limit {effective_limit} reached")

        # Чек-ин контекст
        if user:
            try:
                last_ci = db.execute(text("""
                    SELECT weight, sleep_hours, energy_level, sleep_quality,
                           stress_level, motivation_level, created_at
                    FROM checkins WHERE user_id=:uid
                    ORDER BY created_at DESC LIMIT 1
                """), {"uid": user.id}).fetchone()
                if last_ci:
                    ci_parts = []
                    if last_ci.weight:
                        ci_parts.append(f"current weight: {last_ci.weight}kg")
                    if last_ci.sleep_hours:
                        ci_parts.append(f"sleep last night: {last_ci.sleep_hours}h")
                    if last_ci.energy_level:
                        ci_parts.append(f"energy {last_ci.energy_level}/5")
                    if last_ci.sleep_quality:
                        ci_parts.append(f"sleep quality {last_ci.sleep_quality}/5")
                    if last_ci.stress_level:
                        ci_parts.append(f"stress {last_ci.stress_level}/5")
                    if last_ci.motivation_level:
                        ci_parts.append(f"motivation {last_ci.motivation_level}/5")
                    if ci_parts:
                        days_ago = (datetime.utcnow() - last_ci.created_at).days if last_ci.created_at else 0
                        checkin_context = f"\n\nLATEST CHECK-IN ({days_ago}d ago): {', '.join(ci_parts)}. Use this to personalize advice."
            except Exception:
                pass

        # Каталог упражнений
        try:
            ex_rows = db.execute(text("""
                SELECT e.name, mg.name AS group_name, e.difficulty,
                       e.sets_recommended, e.reps_recommended
                FROM exercises e
                JOIN muscle_groups mg ON mg.id = e.muscle_group_id
                ORDER BY mg.id, e.name LIMIT 200
            """)).fetchall()
            if ex_rows:
                by_group = {}
                for r in ex_rows:
                    by_group.setdefault(r.group_name, []).append(
                        f"{r.name} ({r.sets_recommended}x{r.reps_recommended})")
                exercises_context = "\n\nAVAILABLE EXERCISES IN APP CATALOG:\n"
                exercises_context += "\n".join(f"{g}: {', '.join(exs)}" for g, exs in by_group.items())
                exercises_context += "\n\nIMPORTANT: When recommending a workout plan, ONLY use exercises from the catalog above."
        except Exception:
            pass

        # Спорт-активность за последние 30 дней
        sport_context = ""
        if user:
            try:
                sport_rows = db.execute(text("""
                    SELECT sport_type, COUNT(*) as cnt,
                           SUM(duration_min) as total_min,
                           SUM(calories_burned) as total_cal
                    FROM sport_sessions
                    WHERE user_id=:uid AND session_date >= NOW() - INTERVAL '30 days'
                    GROUP BY sport_type ORDER BY cnt DESC
                """), {"uid": user.id}).fetchall()
                if sport_rows:
                    sport_names = {"football":"футбол","volleyball":"волейбол","basketball":"баскетбол",
                                   "table_tennis":"настольный теннис","padel":"падел","tennis":"теннис","yoga":"йога"}
                    parts = [f"{sport_names.get(r[0],r[0])} {r[1]}×{r[2]}мин ({r[3] or 0}ккал)" for r in sport_rows]
                    sport_context = f"\n\nSPORT ACTIVITY (last 30d): {', '.join(parts)}. Consider this in recommendations."
            except Exception:
                pass

        # Последние 10 тренировок + прогресс за 90 дней
        workouts_context = ""
        if user:
            try:
                recent_wk = db.execute(text("""
                    SELECT w.id, w.date, w.duration_minutes,
                           COALESCE(w.total_volume,0) as volume, w.ai_review
                    FROM workouts w
                    WHERE w.user_id=:uid AND w.status='finished'
                    ORDER BY w.date DESC LIMIT 10
                """), {"uid": user.id}).fetchall()
                if recent_wk:
                    wk_parts = []
                    for wk in recent_wk:
                        sets_rows = db.execute(text("""
                            SELECT exercise_name, weight, reps, rpe
                            FROM workout_sets WHERE workout_id=:wid ORDER BY id
                        """), {"wid": wk.id}).fetchall()
                        ex_grouped = {}
                        for s in sets_rows:
                            ex_grouped.setdefault(s.exercise_name, []).append(
                                f"{s.weight or 0}kg×{s.reps or 0}" + (f"@RPE{s.rpe}" if s.rpe else ""))
                        sets_str = "; ".join(f"{n}: {', '.join(v)}" for n,v in ex_grouped.items())
                        wk_str = f"[{wk.date}] {wk.duration_minutes or 0}min, {wk.volume}kg"
                        if sets_str: wk_str += f" — {sets_str}"
                        if wk.ai_review: wk_str += f" | advice: {wk.ai_review[:80]}..."
                        wk_parts.append(wk_str)
                    workouts_context = "\n\nRECENT WORKOUTS (last 10):\n" + "\n".join(wk_parts)

                prog = db.execute(text("""
                    SELECT ws.exercise_name, MAX(ws.weight) as max_w,
                           COUNT(DISTINCT w.id) as sessions,
                           MIN(w.date) as first_d, MAX(w.date) as last_d
                    FROM workout_sets ws
                    JOIN workouts w ON w.id=ws.workout_id
                    WHERE w.user_id=:uid AND ws.weight>0
                      AND w.date >= NOW() - INTERVAL '90 days'
                    GROUP BY ws.exercise_name ORDER BY sessions DESC LIMIT 15
                """), {"uid": user.id}).fetchall()
                if prog:
                    workouts_context += "\n\nPROGRESS (90d max weights): " + "; ".join(
                        f"{r.exercise_name} {r.max_w}kg ({r.sessions}x, {r.first_d}→{r.last_d})" for r in prog)

                st = db.execute(text("""
                    SELECT COUNT(*) as total, ROUND(AVG(duration_minutes)) as avg_dur,
                           SUM(COALESCE(total_volume,0)) as vol
                    FROM workouts WHERE user_id=:uid AND status='finished'
                      AND date >= NOW() - INTERVAL '90 days'
                """), {"uid": user.id}).fetchone()
                if st and st.total:
                    workouts_context += f"\nSTATS 90d: {st.total} workouts, avg {st.avg_dur}min, {st.vol}kg volume"
                    workouts_context += "\nAnalyze progress, find plateaus, give specific weight/rep targets."
            except Exception as e:
                logger.error(f"workouts_context: {e}")

        # Добавки пользователя
        supplements_context = ""
        if user:
            try:
                supps = db.execute(text("""
                    SELECT name, dose, timing FROM user_supplements WHERE user_id=:uid ORDER BY created_at
                """), {"uid": user[0]}).fetchall()
                if supps:
                    supp_list = "; ".join(f"{r.name}" + (f" {r.dose}" if r.dose else "") + (f" ({r.timing})" if r.timing else "") for r in supps)
                    supplements_context = f"\n\nCURRENT SUPPLEMENTS: {supp_list}. Consider interactions and synergies in advice."
            except Exception:
                pass

        # Питание за сегодня
        nutrition_context = ""
        if user:
            try:
                today_logs = db.execute(text("""
                    SELECT fl.meal_type, fp.name, fl.amount_g,
                           ROUND(fp.calories * fl.amount_g / 100) as kcal,
                           ROUND(fp.protein * fl.amount_g / 100, 1) as prot
                    FROM food_logs fl
                    JOIN food_products fp ON fp.id = fl.food_product_id
                    WHERE fl.user_id=:uid AND DATE(fl.logged_at) = CURRENT_DATE
                    ORDER BY fl.logged_at
                """), {"uid": user.id}).fetchall()
                if today_logs:
                    total_kcal = sum(r.kcal or 0 for r in today_logs)
                    total_prot = sum(r.prot or 0 for r in today_logs)
                    meals = {}
                    for r in today_logs:
                        meals.setdefault(r.meal_type, []).append(f"{r.name} {r.amount_g}g")
                    meal_str = "; ".join(f"{k}: {', '.join(v)}" for k,v in meals.items())
                    nutrition_context = f"\n\nTODAY NUTRITION: {total_kcal}kcal, {total_prot}g protein. {meal_str}"
            except Exception:
                pass

    # ── Шаг 2: вызываем Anthropic API ВНЕ транзакции БД ─────────────────────
    lang = (user.lang if user else None) or "ru"
    lang_hint = "Reply in Russian." if lang == "ru" else ("Reply in Uzbek." if lang == "uz" else "Reply in English.")
    # Тон общения AI — из профиля или по возрасту
    tone_prompt = ""
    try:
        from ai_tone import get_tone_prompt as _get_tone
        tone_prompt = _get_tone(
            getattr(user, "ai_tone", None) if user else None,
            getattr(user, "age", None) if user else None
        )
    except Exception:
        pass

    workout_keywords = ["тренировк", "программ", "сплит", "план", "упражнен", "workout", "program", "split"]
    is_workout_question = any(kw in req.question.lower() for kw in workout_keywords)

    if user:
        context = (
            f"You are GymBot AI Coach. Client: {user.age}y, {user.weight}kg, {user.height}cm, "
            f"level={user.fitness_level}, goal={user.desired_result}. {lang_hint} "
            f"Be practical, max 400 words."
            f"{tone_prompt}"
            f"{checkin_context}"
            f"{workouts_context}"
            f"{nutrition_context}"
            f"{supplements_context}"
            f"{sport_context}"
            f"{exercises_context}"
            f"\n\nQUESTION: {req.question}"
        )
        if is_workout_question:
            context += (
                "\n\nIf you provide a workout plan, end your response with:\n"
                "WORKOUT_PLAN_JSON: {\"title\": \"название\", \"exercises\": [\"Упражнение 1\", \"Упражнение 2\"]}\n"
                "Use exact exercise names from the catalog."
            )
    else:
        context = f"You are GymBot AI fitness coach. {lang_hint} Be practical, max 300 words.\nQUESTION: {req.question}"

    import anthropic as _anthropic
    client = _anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    message = client.messages.create(
        model="claude-sonnet-4-6", max_tokens=1000,
        messages=[{"role": "user", "content": context}]
    )
    raw_answer = message.content[0].text

    # Извлекаем workout_plan
    workout_plan = None
    import re as _re, json as _json
    plan_match = _re.search("WORKOUT_PLAN_JSON: (.+)", raw_answer)
    if plan_match:
        try:
            workout_plan = _json.loads(plan_match.group(1))
            answer = raw_answer[:plan_match.start()].strip()
        except Exception:
            answer = raw_answer
    else:
        answer = raw_answer

    # ── Шаг 3: обновляем счётчик запросов (отдельная транзакция) ─────────────
    if user:
        try:
            with SessionLocal() as db2:
                db2.execute(text("UPDATE users SET ai_requests_today=COALESCE(ai_requests_today,0)+1, ai_requests_reset_date=:today WHERE id=:uid"),
                           {"today": datetime.utcnow().date(), "uid": user.id})
                db2.commit()
        except Exception:
            pass

    return {"answer": answer, "requests_used": requests_today + 1, "workout_plan": workout_plan}


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
            SELECT id, meal_name, kcal, protein, fat, carb, meal_type, date FROM food_log
            WHERE user_id=:uid AND DATE(date)=:today ORDER BY date
        """), {"uid": user.id, "today": today}).fetchall()
        w, h, a = float(user.weight or 70), user.height or 175, user.age or 30
        bmr = (10*w + 6.25*h - 5*a + 5) if user.gender == "male" else (10*w + 6.25*h - 5*a - 161)
        tdee = round(bmr * {"beginner": 1.375, "intermediate": 1.55, "advanced": 1.725}.get(user.fitness_level, 1.375))
        target = tdee + {"lose_weight": -500, "gain_muscle": 300, "gain_strength": 200}.get(user.desired_result, 0)
        return {
            "tdee": tdee, "target_kcal": target,
            "today_logs": [{"id": l.id, "meal_name": l.meal_name, "kcal": l.kcal,
                "protein": float(l.protein or 0), "fat": float(l.fat or 0), "carb": float(l.carb or 0),
                "meal_type": l.meal_type} for l in logs],
            "today_totals": {"kcal": sum(l.kcal or 0 for l in logs),
                "protein": round(sum(float(l.protein or 0) for l in logs), 1),
                "fat": round(sum(float(l.fat or 0) for l in logs), 1),
                "carb": round(sum(float(l.carb or 0) for l in logs), 1)},
        "water_norm_glasses": max(6, min(12, round(w * 30 / 250))),
        }


@app.put("/api/user/{tg_id}")
def update_user(tg_id: int, req: UserUpdateRequest):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        fields = []
        params = {"uid": user.id}
        if req.age is not None:
            fields.append("age=:age"); params["age"] = req.age
        if req.weight is not None:
            fields.append("weight=:weight"); params["weight"] = req.weight
        if req.height is not None:
            fields.append("height=:height"); params["height"] = req.height
        if req.gender is not None:
            fields.append("gender=:gender"); params["gender"] = req.gender
        if req.fitness_level is not None:
            fields.append("fitness_level=:fitness_level"); params["fitness_level"] = req.fitness_level
        if req.desired_result is not None:
            fields.append("desired_result=:desired_result"); params["desired_result"] = req.desired_result
        if req.lang is not None:
            fields.append("lang=:lang"); params["lang"] = req.lang
        if req.ai_tone is not None:
            fields.append("ai_tone=:ai_tone"); params["ai_tone"] = req.ai_tone
        if req.medical_conditions is not None:
            import json
            fields.append("medical_conditions=:medical_conditions")
            params["medical_conditions"] = json.dumps(req.medical_conditions, ensure_ascii=False)
        if req.allergies is not None:
            import json
            fields.append("allergies=:allergies")
            params["allergies"] = json.dumps(req.allergies, ensure_ascii=False)
        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        db.execute(text(f"UPDATE users SET {", ".join(fields)} WHERE id=:uid"), params)
        db.commit()
        return {"ok": True, "updated": list(params.keys())}


FOOD_GUIDE = {
    "vegetables": {"name": "Овощи", "emoji": "🥦", "kcal": "20–50", "protein": "1–3", "fat": "0–0.5", "carb": "3–10",
        "timing": "В любое время дня. К обеду и ужину обязательно.",
        "tips": "Минимум 400г в день. Разноцветная тарелка = разные витамины.",
        "best": "Брокколи, шпинат, кабачок, огурец, помидор, перец, морковь",
        "combines": "Белок, крупы, бобовые", "avoid": "Молоко, сладкие фрукты в больших количествах"},
    "fruits": {"name": "Фрукты", "emoji": "🍎", "kcal": "40–80", "protein": "0.5–1", "fat": "0–0.5", "carb": "10–20",
        "timing": "Утром или за 1 ч до тренировки. Не на ночь.",
        "tips": "1–2 фрукта в день. Предпочитай ягоды — меньше сахара.",
        "best": "Черника, голубика, клубника, малина, вишня, смородина",
        "combines": "Творог, йогурт, орехи, овсянка", "avoid": "Жирное мясо, хлеб в больших количествах"},
    "protein": {"name": "Белковые продукты", "emoji": "🥩", "kcal": "100–250", "protein": "15–30", "fat": "2–20", "carb": "0–5",
        "timing": "В каждый приём пищи (25–40г белка). После тренировки — в течение 40 мин.",
        "tips": "Норма: 1.6–2.2г белка на кг веса. Распредели равномерно.",
        "best": "Куриная грудка, лосось, тунец, яйца, творог, говядина",
        "combines": "Овощи, зелень, крупы умеренно", "avoid": "Фрукты (замедляют усвоение)"},
    "fats": {"name": "Полезные жиры", "emoji": "🥑", "kcal": "500–900", "protein": "2–20", "fat": "50–90", "carb": "0–15",
        "timing": "Завтрак и обед. Не за 2 ч до тренировки, не на ужин.",
        "tips": "1–1.2г жира на кг веса. Орехи — горсть (30г) в день.",
        "best": "Авокадо, лосось, орехи, оливковое масло, яичный желток",
        "combines": "Овощи, зелень, белок", "avoid": "Простые углеводы (хлеб+масло = жировой запас)"},
    "carbs": {"name": "Углеводы", "emoji": "🍚", "kcal": "300–380", "protein": "3–12", "fat": "1–5", "carb": "60–80",
        "timing": "Утром и до тренировки (за 1.5–2 ч). После — восполнить гликоген.",
        "tips": "Медленные > быстрых. ГИ: чем ниже — тем лучше для похудения.",
        "best": "Гречка, овсянка, бурый рис, картофель, цельнозерновой хлеб",
        "combines": "Овощи, белок умеренно", "avoid": "Жиры в больших количествах"},
    "dairy": {"name": "Молочные продукты", "emoji": "🥛", "kcal": "50–350", "protein": "3–18", "fat": "0–20", "carb": "3–50",
        "timing": "Творог и казеин — перед сном (медленный белок). Молоко — утром.",
        "tips": "Выбирай 2–5% жирности. Греческий йогурт — лучший выбор.",
        "best": "Творог 2–5%, греческий йогурт, кефир, сыр 30–45%",
        "combines": "Ягоды, орехи, мёд, овсянка", "avoid": "Белок из мяса одновременно"},
    "sweets": {"name": "Сладости", "emoji": "🍫", "kcal": "350–600", "protein": "3–8", "fat": "15–40", "carb": "50–80",
        "timing": "Если нужно — сразу после интенсивной тренировки или утром.",
        "tips": "Горький шоколад 70%+ — антиоксиданты. 20–30г/день допустимо.",
        "best": "Тёмный шоколад 70%+, протеиновые батончики, творожные десерты",
        "combines": "-", "avoid": "Перед сном, до тренировки, натощак"},
    "alcohol": {"name": "Алкоголь", "emoji": "🍷", "kcal": "196–250", "protein": "0", "fat": "0", "carb": "0–15",
        "timing": "Не рекомендуется. При употреблении — не раньше чем через 3 ч после тренировки.",
        "tips": "7 ккал/г — почти как жир, но без нутриентов. Снижает тестостерон, нарушает восстановление. Красное вино 150мл — компромисс, антиоксиданты.",
        "best": "Красное сухое вино, водка без миксеров",
        "combines": "Вода (1:1), белковая закуска",
        "avoid": "До/после тренировки, при наборе массы, во время сушки"},
}


@app.get("/api/food-guide")
def get_food_guide():
    return {"categories": [
        {"id": k, **v} for k, v in FOOD_GUIDE.items()
    ]}


# ─── PLANNED WORKOUTS ────────────────────────────────────────────────────────

@app.get("/api/planned/{tg_id}")
def get_planned(tg_id: int):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        rows = db.execute(text("""
            SELECT id AS pw_id, planned_datetime AS pw_dt, title AS pw_title, status AS pw_status
            FROM planned_workouts
            WHERE user_id=:uid AND status IN ('scheduled','reminded')
            ORDER BY planned_datetime ASC LIMIT 20
        """), {"uid": user.id}).fetchall()
        archive = db.execute(text("""
            SELECT id AS pw_id, planned_datetime AS pw_dt, title AS pw_title, status AS pw_status
            FROM planned_workouts
            WHERE user_id=:uid AND status NOT IN ('scheduled','reminded')
            ORDER BY planned_datetime DESC LIMIT 10
        """), {"uid": user.id}).fetchall()
        def fmt(r):
            return {
                "id": r.pw_id,
                "planned_datetime": r.pw_dt.isoformat() if r.pw_dt else None,
                "title": r.pw_title or "Тренировка",
                "status": r.pw_status,
            }
        return {"planned": [fmt(r) for r in rows], "archive": [fmt(r) for r in archive]}


class PlannedWorkoutRequest(BaseModel):
    title: str
    planned_datetime: str  # ISO format: "2026-06-23T10:00:00"
    exercise_ids: Optional[list] = None
    exercise_names: Optional[list] = None  # названия от AI — сервер сам найдёт ID

@app.post("/api/planned/{tg_id}")
def create_planned(tg_id: int, req: PlannedWorkoutRequest):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        try:
            dt = datetime.fromisoformat(req.planned_datetime)
            # Mini App отправляет локальное время Ташкент (UTC+5) — конвертируем в UTC
            dt = dt - timedelta(hours=5)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid datetime format")
        import json as _json_pw

        exercise_ids = req.exercise_ids or []

        # Если переданы названия упражнений — ищем их ID в каталоге
        if req.exercise_names:
            found_ids = []
            for name in req.exercise_names:
                name_low = name.lower().strip()
                # Точное совпадение
                row = db.execute(text("""
                    SELECT id FROM exercises
                    WHERE LOWER(name)=:name LIMIT 1
                """), {"name": name_low}).fetchone()
                # Частичное совпадение
                if not row:
                    row = db.execute(text("""
                        SELECT id FROM exercises
                        WHERE LOWER(name) LIKE :name LIMIT 1
                    """), {"name": f"%{name_low}%"}).fetchone()
                if row:
                    found_ids.append(row.id)
            if found_ids:
                exercise_ids = found_ids

        db.execute(text("""
            INSERT INTO planned_workouts (user_id, planned_datetime, title, status, exercises_ids)
            VALUES (:uid, :dt, :title, 'scheduled', :exids)
        """), {"uid": user.id, "dt": dt, "title": req.title[:200],
               "exids": _json_pw.dumps(exercise_ids)})
        db.commit()
        return {"ok": True, "exercise_count": len(exercise_ids)}


@app.delete("/api/planned/{tg_id}/{workout_id}")
def delete_planned(tg_id: int, workout_id: int):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        db.execute(text("DELETE FROM planned_workouts WHERE id=:wid AND user_id=:uid"), {"wid": workout_id, "uid": user.id})
        db.commit()
        return {"ok": True}


# ─── GOALS ───────────────────────────────────────────────────────────────────

@app.get("/api/goals/{tg_id}")
def get_goals(tg_id: int):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        rows = db.execute(text("""
            SELECT id AS g_id, goal_type AS g_type, description AS g_desc,
                   target_value AS g_target, current_value AS g_current,
                   unit AS g_unit, deadline AS g_deadline, is_achieved AS g_achieved,
                   created_at AS g_created
            FROM goals WHERE user_id=:uid ORDER BY is_achieved ASC, created_at DESC LIMIT 20
        """), {"uid": user.id}).fetchall()
        def fmt(r):
            pct = round(float(r.g_current or 0) / float(r.g_target or 1) * 100, 1) if r.g_target else 0
            days = (r.g_deadline - datetime.utcnow()).days if r.g_deadline else None
            return {
                "id": r.g_id, "goal_type": r.g_type, "description": r.g_desc,
                "target_value": float(r.g_target or 0), "current_value": float(r.g_current or 0),
                "unit": r.g_unit, "pct": min(100, pct),
                "days_left": max(0, days) if days is not None else None,
                "deadline": r.g_deadline.isoformat() if r.g_deadline else None,
                "is_achieved": bool(r.g_achieved),
            }
        return {"goals": [fmt(r) for r in rows]}


class GoalRequest(BaseModel):
    description: str
    target_value: Optional[float] = None
    current_value: Optional[float] = 0
    unit: Optional[str] = None
    goal_type: Optional[str] = "custom"
    deadline: Optional[str] = None  # ISO date "2026-12-31"

@app.post("/api/goals/{tg_id}")
def create_goal(tg_id: int, req: GoalRequest):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        deadline = None
        if req.deadline:
            try:
                deadline = datetime.fromisoformat(req.deadline)
            except ValueError:
                pass
        db.execute(text("""
            INSERT INTO goals (user_id, goal_type, description, target_value, current_value, unit, deadline, created_at, is_achieved)
            VALUES (:uid, :gtype, :desc, :target, :current, :unit, :deadline, :now, false)
        """), {"uid": user.id, "gtype": req.goal_type or "custom", "desc": req.description[:500],
               "target": req.target_value, "current": req.current_value or 0,
               "unit": req.unit, "deadline": deadline, "now": datetime.utcnow().replace(tzinfo=None)})
        db.commit()
        return {"ok": True}


# ─── REMINDERS ───────────────────────────────────────────────────────────────

@app.get("/api/reminders/{tg_id}")
def get_reminders(tg_id: int):
    """Возвращает ближайшие запланированные тренировки как напоминания"""
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        rows = db.execute(text("""
            SELECT planned_datetime AS r_dt, title AS r_title, status AS r_status
            FROM planned_workouts
            WHERE user_id=:uid AND planned_datetime >= NOW()
            ORDER BY planned_datetime ASC LIMIT 5
        """), {"uid": user.id}).fetchall()
        return {"reminders": [{"dt": r.r_dt.isoformat(), "title": r.r_title or "Тренировка", "status": r.r_status} for r in rows]}


# ─── WORKOUT DETAIL ──────────────────────────────────────────────────────────

@app.get("/api/workout/{workout_id}")
def get_workout_detail(workout_id: int, tg_id: int):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        w = db.execute(text("""
            SELECT w.id AS w_id, w.date AS w_date, w.status AS w_status,
                   COALESCE(w.total_volume,0) AS w_volume, w.duration_minutes AS w_dur,
                   w.ai_review AS w_ai_review
            FROM workouts w WHERE w.id=:wid AND w.user_id=:uid
        """), {"wid": workout_id, "uid": user.id}).fetchone()
        if not w:
            raise HTTPException(status_code=404, detail="Workout not found")
        sets = db.execute(text("""
            SELECT ws.id AS s_id, ws.set_number AS s_num,
                   ws.exercise_name AS s_name, ws.exercise_id AS s_ex_id,
                   ws.reps AS s_reps, ws.weight AS s_weight, ws.rpe AS s_rpe
            FROM workout_sets ws WHERE ws.workout_id=:wid ORDER BY ws.set_number ASC
        """), {"wid": workout_id}).fetchall()
        # Группируем по упражнению
        exercises = {}
        for s in sets:
            key = s.s_name or str(s.s_ex_id)
            if key not in exercises:
                exercises[key] = {"name": s.s_name, "exercise_id": s.s_ex_id, "sets": []}
            exercises[key]["sets"].append({
                "set_number": s.s_num, "reps": s.s_reps,
                "weight": float(s.s_weight) if s.s_weight else None, "rpe": s.s_rpe
            })
        return {
            "id": w.w_id,
            "date": w.w_date.isoformat() if w.w_date else None,
            "status": w.w_status,
            "total_volume": float(w.w_volume or 0),
            "duration_minutes": w.w_dur,
            "ai_review": w.w_ai_review,
            "exercises": list(exercises.values())
        }


# ─── ACTIVE WORKOUT (start/log set/finish) ───────────────────────────────────

class StartWorkoutRequest(BaseModel):
    planned_workout_id: Optional[int] = None
    exercise_ids: Optional[list] = None  # список id упражнений

@app.post("/api/workout/start/{tg_id}")
def start_workout(tg_id: int, req: StartWorkoutRequest):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        result = db.execute(text("""
            INSERT INTO workouts (user_id, date, status, total_volume)
            VALUES (:uid, :now, 'active', 0) RETURNING id
        """), {"uid": user.id, "now": datetime.utcnow().replace(tzinfo=None)})
        db.commit()
        wid = db.execute(text(
            "SELECT id FROM workouts WHERE user_id=:uid ORDER BY date DESC LIMIT 1"
        ), {"uid": user.id}).fetchone().id
        return {"workout_id": wid}


class LogSetRequest(BaseModel):
    exercise_id: int
    exercise_name: str
    set_number: int
    reps: Optional[int] = None
    weight: Optional[float] = None
    duration_sec: Optional[int] = None
    distance_km: Optional[float] = None
    rpe: Optional[int] = None

@app.post("/api/workout/{workout_id}/set")
def log_set(workout_id: int, req: LogSetRequest, tg_id: int):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        volume_add = (req.weight or 0) * (req.reps or 1)
        db.execute(text("""
            INSERT INTO workout_sets
              (workout_id, exercise_id, exercise_name, set_number, reps, weight, rpe)
            VALUES (:wid, :eid, :ename, :snum, :reps, :weight, :rpe)
        """), {"wid": workout_id, "eid": req.exercise_id, "ename": req.exercise_name,
               "snum": req.set_number, "reps": req.reps, "weight": req.weight, "rpe": req.rpe})
        db.execute(text("""
            UPDATE workouts SET total_volume = COALESCE(total_volume,0) + :vol WHERE id=:wid
        """), {"vol": volume_add, "wid": workout_id})
        db.commit()
        return {"ok": True}


class FinishWorkoutRequest(BaseModel):
    duration_minutes: Optional[int] = None

@app.post("/api/workout/{workout_id}/finish")
def finish_workout(workout_id: int, req: FinishWorkoutRequest, tg_id: int):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        db.execute(text("""
            UPDATE workouts SET status='finished', duration_minutes=:dur WHERE id=:wid AND user_id=:uid
        """), {"dur": req.duration_minutes, "wid": workout_id, "uid": user.id})
        add_points(db, user.id, 10, "workout_finished")
        db.commit()
        return {"ok": True}


# ─── PLANNED WORKOUT DETAIL ───────────────────────────────────────────────────

@app.get("/api/planned/{tg_id}/{workout_id}")
def get_planned_detail(tg_id: int, workout_id: int):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        pw = db.execute(text("""
            SELECT id AS pw_id, planned_datetime AS pw_dt, title AS pw_title,
                   status AS pw_status, exercises_ids AS pw_exids
            FROM planned_workouts WHERE id=:wid AND user_id=:uid
        """), {"wid": workout_id, "uid": user.id}).fetchone()
        if not pw:
            raise HTTPException(status_code=404, detail="Not found")
        ex_ids = pw.pw_exids or []
        exercises = []
        if ex_ids:
            placeholders = ",".join([f":eid{i}" for i in range(len(ex_ids))])
            eid_params = {f"eid{i}": v for i, v in enumerate(ex_ids)}
            rows = db.execute(text(f"""
                SELECT e.id AS e_id, e.name AS e_name, e.sets_recommended AS e_sets,
                       e.reps_recommended AS e_reps, e.difficulty AS e_diff,
                       e.equipment AS e_equip, e.description AS e_desc,
                       mg.name AS mg_name, mg.emoji AS mg_emoji
                FROM exercises e
                LEFT JOIN muscle_groups mg ON mg.id = e.muscle_group_id
                WHERE e.id IN ({placeholders})
            """), eid_params).fetchall()
            by_id = {r.e_id: r for r in rows}
            for i, eid in enumerate(ex_ids):
                r = by_id.get(eid)
                if r:
                    exercises.append({
                        "order": i+1, "id": r.e_id, "name": r.e_name,
                        "sets_recommended": r.e_sets, "reps_recommended": r.e_reps,
                        "difficulty": r.e_diff, "equipment": r.e_equip,
                        "description": r.e_desc,
                        "group_name": r.mg_name, "group_emoji": r.mg_emoji,
                    })
        return {
            "id": pw.pw_id,
            "planned_datetime": pw.pw_dt.isoformat() if pw.pw_dt else None,
            "title": pw.pw_title, "status": pw.pw_status,
            "exercises": exercises,
        }


class UpdatePlannedRequest(BaseModel):
    title: Optional[str] = None
    planned_datetime: Optional[str] = None
    exercises_ids: Optional[list] = None
    status: Optional[str] = None  # scheduled/completed/missed

@app.put("/api/planned/{tg_id}/{workout_id}")
def update_planned(tg_id: int, workout_id: int, req: UpdatePlannedRequest):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        import json as _json
        fields, params = [], {"uid": user.id, "wid": workout_id}
        if req.title: fields.append("title=:title"); params["title"] = req.title
        if req.planned_datetime:
            fields.append("planned_datetime=:dt")
            # Конвертируем из локального (UTC+5) в UTC
            params["dt"] = datetime.fromisoformat(req.planned_datetime) - timedelta(hours=5)
        if req.exercises_ids is not None:
            fields.append("exercises_ids=:exids")
            params["exids"] = _json.dumps(req.exercises_ids)
        if req.status is not None:
            fields.append("status=:status")
            params["status"] = req.status
        if fields:
            db.execute(text(f"UPDATE planned_workouts SET {', '.join(fields)} WHERE id=:wid AND user_id=:uid"), params)
            db.commit()
        return {"ok": True}


# ─── NUTRITION POST ───────────────────────────────────────────────────────────

class FoodLogRequest(BaseModel):
    meal_name: str
    kcal: float
    protein: Optional[float] = 0
    fat: Optional[float] = 0
    carb: Optional[float] = 0
    meal_type: Optional[str] = None  # breakfast/lunch/dinner/snack

class WaterLogRequest(BaseModel):
    glasses: int = 1

@app.post("/api/nutrition/{tg_id}")
def add_food_log(tg_id: int, req: FoodLogRequest):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        db.execute(text("""
            INSERT INTO food_log (user_id, meal_name, kcal, protein, fat, carb, meal_type, date)
            VALUES (:uid, :name, :kcal, :protein, :fat, :carb, :meal_type, :now)
        """), {"uid": user.id, "name": req.meal_name[:200], "kcal": req.kcal,
               "protein": req.protein or 0, "fat": req.fat or 0, "carb": req.carb or 0,
               "meal_type": req.meal_type,
               "now": datetime.utcnow().replace(tzinfo=None)})
        db.commit()
        return {"ok": True}


# ─── MEASUREMENTS GET/POST ────────────────────────────────────────────────────

class MeasurementRequest(BaseModel):
    waist: Optional[float] = None
    hips: Optional[float] = None
    chest: Optional[float] = None
    arm: Optional[float] = None
    thigh: Optional[float] = None

@app.get("/api/measurements/{tg_id}")
def get_measurements(tg_id: int):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        rows = db.execute(text("""
            SELECT waist AS m_waist, hips AS m_hips, chest AS m_chest,
                   arm AS m_arm, thigh AS m_thigh, logged_at AS m_at
            FROM body_measurements WHERE user_id=:uid
            ORDER BY logged_at DESC LIMIT 20
        """), {"uid": user.id}).fetchall()
        return {"logs": [{"waist": r.m_waist, "hips": r.m_hips, "chest": r.m_chest,
                          "arm": r.m_arm, "thigh": r.m_thigh,
                          "logged_at": r.m_at.isoformat() if r.m_at else None} for r in rows]}

@app.post("/api/measurements/{tg_id}")
def add_measurement(tg_id: int, req: MeasurementRequest):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        db.execute(text("""
            INSERT INTO body_measurements (user_id, waist, hips, chest, arm, thigh, logged_at)
            VALUES (:uid, :waist, :hips, :chest, :arm, :thigh, :now)
        """), {"uid": user.id, "waist": req.waist, "hips": req.hips, "chest": req.chest,
               "arm": req.arm, "thigh": req.thigh, "now": datetime.utcnow().replace(tzinfo=None)})
        db.commit()
        return {"ok": True}


# ─── CHECKIN POST ──────────────────────────────────────────────────────────────

class CheckinRequest(BaseModel):
    weight: Optional[float] = None
    sleep_hours: Optional[float] = None
    energy: Optional[int] = 3
    sleep: Optional[int] = 3
    stress: Optional[int] = 3
    motivation: Optional[int] = 3

@app.post("/api/checkin/{tg_id}")
def save_checkin(tg_id: int, req: CheckinRequest):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        db.execute(text("""
            INSERT INTO checkins (user_id, weight, sleep_hours, energy_level, sleep_quality, stress_level, motivation_level, created_at)
            VALUES (:uid, :weight, :sleep_hours, :energy, :sleep, :stress, :motivation, :now)
        """), {"uid": user.id, "weight": req.weight, "sleep_hours": req.sleep_hours,
               "energy": req.energy, "sleep": req.sleep, "stress": req.stress,
               "motivation": req.motivation, "now": datetime.utcnow().replace(tzinfo=None)})
        # Обновляем вес в профиле если передан
        if req.weight:
            db.execute(text("UPDATE users SET weight=:w WHERE id=:uid"), {"w": req.weight, "uid": user.id})
        db.commit()
        return {"ok": True}

# ─── SUPPORT TICKET FROM MINI APP ────────────────────────────────────────────

class SupportRequest(BaseModel):
    tg_id: int
    message: str
    user_name: Optional[str] = None
    username: Optional[str] = None

@app.post("/api/support")
async def create_support_ticket(req: SupportRequest):
    import httpx, os
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message is empty")

    with SessionLocal() as db:
        # Сохраняем тикет в support_tickets
        result = db.execute(text("""
            INSERT INTO support_tickets
              (user_tg_id, user_name, section, ticket_type, message, status, created_at, is_read)
            VALUES (:tg_id, :name, :section, :ttype, :msg, 'open', :now, false)
            RETURNING id
        """), {
            "tg_id": req.tg_id,
            "name": (req.user_name or "—") + (f" (@{req.username})" if req.username else ""),
            "section": "Mini App",
            "ttype": "question",
            "msg": req.message[:2000],
            "now": datetime.utcnow().replace(tzinfo=None)
        })
        db.commit()

        # Получаем ID через отдельный SELECT (pg8000 не поддерживает RETURNING напрямую)
        ticket_row = db.execute(text("""
            SELECT id FROM support_tickets
            WHERE user_tg_id=:tg_id
            ORDER BY created_at DESC LIMIT 1
        """), {"tg_id": req.tg_id}).fetchone()
        ticket_id = ticket_row.id if ticket_row else "?"

    # Уведомляем администратора через Telegram Bot API
    bot_token = os.getenv("BOT_TOKEN")
    admin_tg_id = os.getenv("ADMIN_TG_ID")
    if bot_token and admin_tg_id:
        user_label = (req.user_name or "—") + (f" (@{req.username})" if req.username else "")
        admin_text = (
            f"📨 Новое обращение #{ticket_id} (Mini App)\n\n"
            f"👤 {user_label} (ID: {req.tg_id})\n"
            f"📂 Раздел: Mini App\n\n"
            f"💬 {req.message[:500]}\n\n"
            f"Ответить: /reply_{ticket_id}_"
        )
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                await client.post(
                    f"https://api.telegram.org/bot{bot_token}/sendMessage",
                    json={"chat_id": int(admin_tg_id), "text": admin_text}
                )
        except Exception as e:
            logger.warning(f"[Support] Не удалось уведомить админа: {e}")

    return {"ok": True, "ticket_id": ticket_id}

# ─── FOOD PHOTO ANALYSIS ──────────────────────────────────────────────────────

class FoodPhotoRequest(BaseModel):
    image_base64: str
    tg_id: Optional[int] = None
    save: Optional[bool] = False
    meal_type: Optional[str] = None  # breakfast/lunch/dinner/snack

@app.post("/api/food/analyze")
def analyze_food_photo(req: FoodPhotoRequest):
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=503, detail="AI not configured")

    import anthropic as _anthropic, base64 as _b64, json as _json, re as _re

    VISION_PROMPT = """Ты — диетолог. Проанализируй фото еды и определи КБЖУ.
Верни ТОЛЬКО JSON без лишнего текста:
{"dish_name":"Название","weight_g":300,"calories":450,"protein_g":25,"fat_g":15,"carbs_g":45,"confidence":"high/medium/low","note":"примечание или null"}
Правила: weight_g — вес порции в граммах, calories — итоговые. Если несколько блюд — суммируй. Отвечай ТОЛЬКО валидным JSON."""

    try:
        client = _anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=400,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": req.image_base64,
                        },
                    },
                    {"type": "text", "text": VISION_PROMPT}
                ],
            }]
        )
        raw = response.content[0].text.strip()
        # Убираем markdown
        raw = _re.sub(r"```json|```", "", raw).strip()
        result = _json.loads(raw)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision error: {str(e)}")

    # Сохраняем в food_log если нужно
    if req.save and req.tg_id:
        try:
            with SessionLocal() as db:
                user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tid"),
                                  {"tid": req.tg_id}).fetchone()
                if user:
                    db.execute(text("""
                        INSERT INTO food_log (user_id, date, meal_name, kcal, protein, fat, carb, meal_type)
                        VALUES (:uid, :now, :name, :kcal, :protein, :fat, :carb, :meal_type)
                    """), {
                        "uid": user.id,
                        "now": datetime.utcnow().replace(tzinfo=None),
                        "name": result.get("dish_name", "Блюдо")[:200],
                        "kcal": int(result.get("calories", 0)),
                        "protein": float(result.get("protein_g", 0)),
                        "fat": float(result.get("fat_g", 0)),
                        "carb": float(result.get("carbs_g", 0)),
                        "meal_type": req.meal_type,
                    })
                    db.commit()
        except Exception as e:
            logger.warning(f"[FoodVision] Save error: {e}")

    return {
        "ok": True,
        "dish_name": result.get("dish_name"),
        "weight_g": result.get("weight_g"),
        "calories": result.get("calories"),
        "protein_g": result.get("protein_g"),
        "fat_g": result.get("fat_g"),
        "carbs_g": result.get("carbs_g"),
        "confidence": result.get("confidence"),
        "note": result.get("note"),
    }

@app.delete("/api/nutrition/{tg_id}/{log_id}")
def delete_food_log(tg_id: int, log_id: int):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"),
                          {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        result = db.execute(text("""
            DELETE FROM food_log WHERE id=:log_id AND user_id=:uid
        """), {"log_id": log_id, "uid": user.id})
        db.commit()
        return {"ok": True}

@app.post("/api/nutrition/{tg_id}/water")
def log_water(tg_id: int, req: WaterLogRequest):
    """Логируем стаканы воды"""
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"),
                          {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        today = datetime.utcnow().date()
        # Ищем запись воды за сегодня
        existing = db.execute(text("""
            SELECT id, kcal FROM food_log
            WHERE user_id=:uid AND meal_type='water' AND DATE(date)=:today
        """), {"uid": user.id, "today": today}).fetchone()
        if existing:
            db.execute(text("""
                UPDATE food_log SET kcal=:glasses WHERE id=:id
            """), {"glasses": req.glasses, "id": existing.id})
        else:
            db.execute(text("""
                INSERT INTO food_log (user_id, meal_name, kcal, meal_type, date)
                VALUES (:uid, 'Вода', :glasses, 'water', :now)
            """), {"uid": user.id, "glasses": req.glasses,
                   "now": datetime.utcnow().replace(tzinfo=None)})
        db.commit()
        return {"ok": True, "glasses": req.glasses}

@app.get("/api/nutrition/{tg_id}/history")
def get_nutrition_history(tg_id: int, date: str):
    """Питание за конкретную дату (YYYY-MM-DD)"""
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"),
                          {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        try:
            from datetime import date as _date
            target_date = _date.fromisoformat(date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date")
        logs = db.execute(text("""
            SELECT id, meal_name, kcal, protein, fat, carb, meal_type, date
            FROM food_log WHERE user_id=:uid AND DATE(date)=:d ORDER BY date
        """), {"uid": user.id, "d": target_date}).fetchall()
        return {
            "date": date,
            "logs": [{"id": l.id, "meal_name": l.meal_name, "kcal": l.kcal,
                      "protein": float(l.protein or 0), "fat": float(l.fat or 0),
                      "carb": float(l.carb or 0), "meal_type": l.meal_type} for l in logs],
            "totals": {
                "kcal": sum(l.kcal or 0 for l in logs if l.meal_type != 'water'),
                "protein": round(sum(float(l.protein or 0) for l in logs), 1),
                "fat": round(sum(float(l.fat or 0) for l in logs), 1),
                "carb": round(sum(float(l.carb or 0) for l in logs), 1),
            }
        }

# ════════════════════════════════════════════════════════════════════
#  ОНБОРДИНГ — создание пользователя из Mini App
# ════════════════════════════════════════════════════════════════════

class OnboardingRequest(BaseModel):
    telegram_id: int
    first_name: str
    username: Optional[str] = None
    age: int
    weight: float
    height: float
    gender: Optional[str] = "male"
    fitness_level: Optional[str] = "beginner"
    desired_result: Optional[str] = "stay_healthy"
    lang: Optional[str] = "ru"

@app.post("/api/user/create")
def create_user(req: OnboardingRequest):
    """Создаём пользователя из Mini App онбординга"""
    with SessionLocal() as db:
        existing = db.execute(text(
            "SELECT id FROM users WHERE telegram_id=:tg"
        ), {"tg": req.telegram_id}).fetchone()

        if existing:
            # Обновляем профиль если уже есть
            db.execute(text("""
                UPDATE users SET first_name=:fn, username=:un, age=:age,
                    weight=:w, height=:h, gender=:g, fitness_level=:fl,
                    desired_result=:dr, lang=:lang, profile_complete=TRUE
                WHERE telegram_id=:tg
            """), {"fn": req.first_name, "un": req.username, "age": req.age,
                   "w": req.weight, "h": req.height, "g": req.gender,
                   "fl": req.fitness_level, "dr": req.desired_result,
                   "lang": req.lang, "tg": req.telegram_id})
        else:
            # Создаём нового пользователя
            import random, string
            ref_code = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
            db.execute(text("""
                INSERT INTO users (telegram_id, first_name, username, age, weight, height,
                    gender, fitness_level, desired_result, lang, profile_complete,
                    ref_code, total_points, user_rank)
                VALUES (:tg, :fn, :un, :age, :w, :h, :g, :fl, :dr, :lang, TRUE,
                    :ref, 0, 'beginner')
            """), {"tg": req.telegram_id, "fn": req.first_name, "un": req.username,
                   "age": req.age, "w": req.weight, "h": req.height, "g": req.gender,
                   "fl": req.fitness_level, "dr": req.desired_result, "lang": req.lang,
                   "ref": ref_code})
        db.commit()
        # Возвращаем созданного пользователя
        user = db.execute(text(
            "SELECT * FROM users WHERE telegram_id=:tg"
        ), {"tg": req.telegram_id}).fetchone()
        return {"ok": True, "user_id": user.id if user else None}


# ════════════════════════════════════════════════════════════════════
#  AI REVIEW — сохранение советов тренера
# ════════════════════════════════════════════════════════════════════

@app.post("/api/workout/{workout_id}/ai-review")
def save_ai_review(workout_id: int, tg_id: int, review: str):
    """Сохраняем AI совет после тренировки"""
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg"), {"tg": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        db.execute(text("""
            UPDATE workouts SET ai_review=:review, ai_review_at=NOW()
            WHERE id=:wid AND user_id=:uid
        """), {"review": review, "wid": workout_id, "uid": user[0]})
        db.commit()
    return {"ok": True}

@app.get("/api/workouts/{tg_id}/recent-reviews")
def get_recent_reviews(tg_id: int, limit: int = 3):
    """Последние AI советы для контекста тренера"""
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg"), {"tg": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        reviews = db.execute(text("""
            SELECT w.date, w.ai_review, w.ai_review_at
            FROM workouts w
            WHERE w.user_id=:uid AND w.ai_review IS NOT NULL
            ORDER BY w.date DESC LIMIT :lim
        """), {"uid": user[0], "lim": limit}).fetchall()
    return {"reviews": [{"date": str(r[0]), "review": r[1]} for r in reviews]}



# ════════════════════════════════════════════════════════════════════
#  ГОЛОСОВОЙ ВВОД — Whisper STT
# ════════════════════════════════════════════════════════════════════

@app.post("/api/voice/transcribe")
async def voice_transcribe(request: FastAPIRequest, tg_id: int, ext: str = "webm"):
    """Транскрибируем голосовое сообщение через OpenAI Whisper"""
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="Voice service not configured")

    try:
        import httpx
        audio_bytes = await request.body()
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Empty audio")
        if len(audio_bytes) > 25 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Audio too large (max 25MB)")

        # Определяем расширение и content-type
        content_type = request.headers.get("content-type", "audio/webm")
        if ext not in ["mp3","mp4","mpeg","mpga","m4a","wav","webm","ogg"]:
            ext = "webm"
        # Используем правильный content-type для файла
        file_ct = f"audio/{ext}" if ext != "mpeg" else "audio/mpeg"

        logger.info(f"[Voice] User {tg_id}: {len(audio_bytes)//1024}kb ext={ext} ct={content_type}")

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                files={"file": (f"voice.{ext}", audio_bytes, file_ct)},
                data={"model": "whisper-1", "language": "ru", "response_format": "json"},
            )

        if response.status_code != 200:
            logger.error(f"[Voice] Whisper error: {response.status_code} {response.text[:200]}")
            raise HTTPException(status_code=502, detail=f"Whisper error: {response.status_code}")

        result = response.json()
        text_result = result.get("text", "").strip()
        if not text_result:
            raise HTTPException(status_code=422, detail="No speech detected")

        logger.info(f"[Voice] OK: {len(text_result)} chars")
        return {"text": text_result}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Voice] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))




# ════════════════════════════════════════════════════════════════════
#  ДОБАВКИ ПОЛЬЗОВАТЕЛЯ
# ════════════════════════════════════════════════════════════════════

@app.get("/api/user/{tg_id}/supplements")
def get_user_supplements(tg_id: int):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg"), {"tg": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        rows = db.execute(text("""
            SELECT id, name, dose, timing, is_custom
            FROM user_supplements WHERE user_id=:uid ORDER BY created_at
        """), {"uid": user[0]}).fetchall()
        return {"supplements": [{"id": r[0], "name": r[1], "dose": r[2], "timing": r[3], "is_custom": r[4]} for r in rows]}

class UserSupplementRequest(BaseModel):
    name: str
    dose: Optional[str] = None
    timing: Optional[str] = None
    is_custom: bool = False

@app.post("/api/user/{tg_id}/supplements")
def add_user_supplement(tg_id: int, req: UserSupplementRequest):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg"), {"tg": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        db.execute(text("""
            INSERT INTO user_supplements (user_id, name, dose, timing, is_custom)
            VALUES (:uid, :name, :dose, :timing, :custom)
        """), {"uid": user[0], "name": req.name, "dose": req.dose, "timing": req.timing, "custom": req.is_custom})
        db.commit()
    return {"ok": True}

@app.delete("/api/user/{tg_id}/supplements/{supp_id}")
def delete_user_supplement(tg_id: int, supp_id: int):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg"), {"tg": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        db.execute(text("DELETE FROM user_supplements WHERE id=:sid AND user_id=:uid"), {"sid": supp_id, "uid": user[0]})
        db.commit()
    return {"ok": True}


# ════════════════════════════════════════════════════════════════════
#  ПРОГРЕСС ПО ГРУППАМ МЫШЦ
# ════════════════════════════════════════════════════════════════════

@app.get("/api/progress/muscle-groups/{tg_id}")
def get_muscle_group_progress(tg_id: int, days: int = 90):
    """Прогресс по группам мышц — для графиков сравнения тренировок"""
    with SessionLocal() as db:
        user = db.execute(text(
            "SELECT id FROM users WHERE telegram_id=:tg"
        ), {"tg": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Тоннаж по группам мышц за каждую тренировку
        rows = db.execute(text("""
            SELECT
                w.id AS workout_id,
                w.date,
                mg.name AS group_name,
                mg.emoji AS group_emoji,
                SUM(ws.weight * ws.reps) AS volume,
                MAX(ws.weight) AS max_weight,
                COUNT(*) AS sets_count
            FROM workout_sets ws
            JOIN workouts w ON w.id = ws.workout_id
            JOIN exercises e ON LOWER(e.name) = LOWER(ws.exercise_name)
            JOIN muscle_groups mg ON mg.id = e.muscle_group_id
            WHERE w.user_id=:uid
              AND ws.weight IS NOT NULL AND ws.weight > 0
              AND ws.reps IS NOT NULL AND ws.reps > 0
              AND w.date >= NOW() - INTERVAL :days
              AND w.status = 'finished'
            GROUP BY w.id, w.date, mg.name, mg.emoji
            ORDER BY w.date ASC
        """), {"uid": user[0], "days": f"{days} days"}).fetchall()

        # Лучший вес по упражнению за каждую тренировку (для графика прогресса)
        exercise_progress = db.execute(text("""
            SELECT
                ws.exercise_name,
                mg.name AS group_name,
                mg.emoji AS group_emoji,
                w.date,
                MAX(ws.weight) AS max_weight,
                SUM(ws.weight * ws.reps) AS volume
            FROM workout_sets ws
            JOIN workouts w ON w.id = ws.workout_id
            LEFT JOIN exercises e ON LOWER(e.name) = LOWER(ws.exercise_name)
            LEFT JOIN muscle_groups mg ON mg.id = e.muscle_group_id
            WHERE w.user_id=:uid
              AND ws.weight IS NOT NULL AND ws.weight > 0
              AND w.date >= NOW() - INTERVAL :days
              AND w.status = 'finished'
            GROUP BY ws.exercise_name, mg.name, mg.emoji, w.date
            ORDER BY w.date ASC
        """), {"uid": user[0], "days": f"{days} days"}).fetchall()

        # Группируем по группам мышц
        by_group = {}
        for r in rows:
            g = r.group_name or "Другое"
            if g not in by_group:
                by_group[g] = {"emoji": r.group_emoji or "", "workouts": []}
            by_group[g]["workouts"].append({
                "date": str(r.date),
                "volume": float(r.volume or 0),
                "max_weight": float(r.max_weight or 0),
                "sets": r.sets_count,
            })

        # Группируем прогресс по упражнениям
        by_exercise = {}
        for r in exercise_progress:
            ex = r.exercise_name
            if ex not in by_exercise:
                by_exercise[ex] = {
                    "group": r.group_name or "Другое",
                    "emoji": r.group_emoji or "",
                    "data": []
                }
            by_exercise[ex]["data"].append({
                "date": str(r.date),
                "max_weight": float(r.max_weight or 0),
                "volume": float(r.volume or 0),
            })

        return {
            "by_group": by_group,
            "by_exercise": by_exercise,
            "days": days,
        }


# ════════════════════════════════════════════════════════════════════
#  ПЛАТО ДЕТЕКТОР
# ════════════════════════════════════════════════════════════════════

@app.get("/api/plateau/{tg_id}")
def get_plateau_status(tg_id: int):
    """Анализ плато для Mini App ProgressScreen"""
    with SessionLocal() as db:
        user = db.execute(text("""
            SELECT id, weight, desired_result FROM users WHERE telegram_id=:tg_id
        """), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Вес за последние 21 день
        weight_logs = db.execute(text("""
            SELECT weight, logged_at FROM weight_log
            WHERE user_id=:uid AND logged_at >= NOW() - INTERVAL '21 days'
            ORDER BY logged_at ASC
        """), {"uid": user[0]}).fetchall()

        # Прогресс по упражнениям — сравниваем первые 2 недели vs последние 2 недели (90 дней)
        stagnant_exercises = db.execute(text("""
            SELECT ws.exercise_name,
                   MIN(ws.weight) AS min_w, MAX(ws.weight) AS max_w,
                   COUNT(DISTINCT DATE(w.date)) AS session_count,
                   MAX(CASE WHEN w.date >= NOW() - INTERVAL '21 days' THEN ws.weight ELSE 0 END) AS recent_max,
                   MAX(CASE WHEN w.date < NOW() - INTERVAL '21 days' THEN ws.weight ELSE 0 END) AS old_max
            FROM workout_sets ws
            JOIN workouts w ON w.id = ws.workout_id
            WHERE w.user_id=:uid
              AND ws.weight IS NOT NULL AND ws.weight > 0
              AND w.date >= NOW() - INTERVAL '90 days'
            GROUP BY ws.exercise_name
            HAVING COUNT(DISTINCT DATE(w.date)) >= 2
            ORDER BY session_count DESC
            LIMIT 8
        """), {"uid": user[0]}).fetchall()

        # Фильтруем реальное плато: нет прогресса за последние 3 недели
        plateau_exercises = [
            r for r in stagnant_exercises
            if r.recent_max > 0 and r.old_max > 0 and (r.recent_max - r.old_max) < 2.5
        ] or [
            r for r in stagnant_exercises
            if r.max_w - r.min_w < 2.5 and r.session_count >= 2
        ]
        stagnant_exercises = plateau_exercises[:5]

        # Анализ веса
        weight_plateau = False
        weight_change = None
        if len(weight_logs) >= 3:
            w_first = float(weight_logs[0][0])
            w_last = float(weight_logs[-1][0])
            weight_change = round(w_last - w_first, 1)
            if abs(weight_change) < 0.5 and user[2] in ("lose_weight", "gain_muscle"):
                weight_plateau = True

        return {
            "weight_plateau": weight_plateau,
            "weight_change": weight_change,
            "weight_logs_count": len(weight_logs),
            "stagnant_exercises": [{
                "name": r[0],
                "min_weight": float(r[1]),
                "max_weight": float(r[2]),
                "sessions": r[3],
            } for r in stagnant_exercises],
            "has_plateau": weight_plateau or len(stagnant_exercises) > 0,
        }


# ════════════════════════════════════════════════════════════════════
#  РЕФЕРАЛЬНАЯ СИСТЕМА
# ════════════════════════════════════════════════════════════════════

@app.get("/api/referral/{tg_id}")
def get_referral_info(tg_id: int):
    with SessionLocal() as db:
        user = db.execute(text("""
            SELECT id, ref_code, total_points FROM users WHERE telegram_id=:tg_id
        """), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Настройки
        settings = db.execute(text("""
            SELECT key, value FROM app_settings
            WHERE key IN ('referral_enabled','referral_bonus_points','referral_invited_bonus')
        """)).fetchall()
        cfg = {r[0]: r[1] for r in settings}

        # Список рефералов
        referrals = db.execute(text("""
            SELECT first_name, username, created_at FROM users
            WHERE invited_by=:uid ORDER BY created_at DESC LIMIT 20
        """), {"uid": user[0]}).fetchall()

        return {
            "ref_code": user[1],
            "ref_link": f"https://t.me/GYMASH_bot?start=ref_{user[1]}",
            "referrals_count": len(referrals),
            "bonus_per_referral": int(cfg.get("referral_bonus_points", 50)),
            "enabled": cfg.get("referral_enabled", "true") == "true",
            "referrals": [{
                "name": r[0] or "—",
                "username": r[1],
                "joined": r[2].isoformat() if r[2] else None,
            } for r in referrals],
        }


@app.post("/api/referral/apply")
def apply_referral(tg_id: int, ref_code: str):
    """Применить реферальный код при регистрации"""
    with SessionLocal() as db:
        # Проверяем настройки
        enabled = db.execute(text(
            "SELECT value FROM app_settings WHERE key='referral_enabled'"
        )).scalar()
        if enabled != "true":
            raise HTTPException(status_code=400, detail="Referral system disabled")

        # Находим приглашателя
        referrer = db.execute(text(
            "SELECT id FROM users WHERE ref_code=:code"
        ), {"code": ref_code.upper()}).fetchone()
        if not referrer:
            raise HTTPException(status_code=404, detail="Invalid ref code")

        # Находим нового пользователя
        new_user = db.execute(text(
            "SELECT id, invited_by FROM users WHERE telegram_id=:tg_id"
        ), {"tg_id": tg_id}).fetchone()
        if not new_user or new_user[1]:  # уже применён код
            raise HTTPException(status_code=400, detail="Already applied")

        bonus_pts = int(db.execute(text(
            "SELECT value FROM app_settings WHERE key='referral_bonus_points'"
        )).scalar() or 50)
        invited_pts = int(db.execute(text(
            "SELECT value FROM app_settings WHERE key='referral_invited_bonus'"
        )).scalar() or 25)

        # Обновляем нового пользователя
        db.execute(text("""
            UPDATE users SET invited_by=:ref_id,
                total_points=COALESCE(total_points,0)+:pts
            WHERE telegram_id=:tg_id
        """), {"ref_id": referrer[0], "pts": invited_pts, "tg_id": tg_id})

        # Начисляем баллы приглашателю
        db.execute(text("""
            UPDATE users SET total_points=COALESCE(total_points,0)+:pts,
                referral_bonus_given=TRUE
            WHERE id=:uid
        """), {"pts": bonus_pts, "uid": referrer[0]})

        # Логируем
        db.execute(text("""
            INSERT INTO points_log (user_id, points, reason) VALUES (:uid,:pts,'referral_bonus')
        """), {"uid": referrer[0], "pts": bonus_pts})

        # Пересчитываем ранг
        for uid in [referrer[0], new_user[0]]:
            pts = db.execute(text(
                "SELECT COALESCE(total_points,0) FROM users WHERE id=:uid"
            ), {"uid": uid}).scalar() or 0
            rank = "legend" if pts>=1000 else "champion" if pts>=500 else "athlete" if pts>=200 else "beginner"
            db.execute(text("UPDATE users SET user_rank=:r WHERE id=:uid"), {"r": rank, "uid": uid})

        db.commit()
        return {"ok": True, "invited_bonus": invited_pts, "referrer_bonus": bonus_pts}


# ════════════════════════════════════════════════════════════════════
#  ВИДЫ СПОРТА — динамические из БД
# ════════════════════════════════════════════════════════════════════

@app.get("/api/sport-types")
def get_sport_types():
    """Список активных видов спорта для Mini App"""
    with SessionLocal() as db:
        if not _table_exists_api(db, "sport_types"):
            # Fallback на хардкод если таблица не создана
            return {"sport_types": [
                {"code":"football","name":"⚽ Футбол","met":8.0,"track_duration":True,"track_intensity":True,"track_distance":False,"track_sets":False},
                {"code":"volleyball","name":"🏐 Волейбол","met":4.0,"track_duration":True,"track_intensity":True,"track_distance":False,"track_sets":False},
                {"code":"basketball","name":"🏀 Баскетбол","met":8.0,"track_duration":True,"track_intensity":True,"track_distance":False,"track_sets":False},
                {"code":"table_tennis","name":"🏓 Настольный теннис","met":4.0,"track_duration":True,"track_intensity":True,"track_distance":False,"track_sets":False},
                {"code":"padel","name":"🎾 Падел","met":6.0,"track_duration":True,"track_intensity":True,"track_distance":False,"track_sets":False},
                {"code":"tennis","name":"🎾 Большой теннис","met":7.0,"track_duration":True,"track_intensity":True,"track_distance":False,"track_sets":False},
                {"code":"yoga","name":"🧘 Йога","met":3.0,"track_duration":True,"track_intensity":False,"track_distance":False,"track_sets":False},
            ]}
        rows = db.execute(text("""
            SELECT code, emoji, name_ru, met_value,
                   track_duration, track_intensity, track_distance, track_sets, track_score
            FROM sport_types WHERE is_active=TRUE ORDER BY sort_order, id
        """)).fetchall()
        return {"sport_types": [{
            "code": r[0], "emoji": r[1], "name": f"{r[1]} {r[2]}",
            "met": r[3], "track_duration": r[4], "track_intensity": r[5],
            "track_distance": r[6], "track_sets": r[7], "track_score": r[8],
        } for r in rows]}

def _table_exists_api(db, table_name: str) -> bool:
    result = db.execute(text(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name=:t)"
    ), {"t": table_name}).scalar()
    return bool(result)



# ─── SPORT SESSIONS ──────────────────────────────────────────────────────────

SPORT_LABELS = {
    "football": "⚽ Футбол", "volleyball": "🏐 Волейбол", "basketball": "🏀 Баскетбол",
    "table_tennis": "🏓 Настольный теннис", "padel": "🎾 Падел",
    "tennis": "🎾 Большой теннис", "yoga": "🧘 Йога",
}

class SportSessionRequest(BaseModel):
    sport_type: str
    duration_min: int
    intensity: Optional[str] = "medium"
    notes: Optional[str] = None
    score: Optional[str] = None  # счёт игры, например "3:2"
    session_date: Optional[str] = None  # YYYY-MM-DD, default today

@app.post("/api/sport/{tg_id}")
def create_sport_session(tg_id: int, req: SportSessionRequest):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id, weight FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        # Считаем калории по МЕТ
        met = SPORT_MET.get(req.sport_type, 5.0)
        intensity_mult = {"low": 0.8, "medium": 1.0, "high": 1.2}.get(req.intensity, 1.0)
        weight = float(user[1] or 75)
        calories = round(met * intensity_mult * weight * (req.duration_min / 60))
        session_date = req.session_date or datetime.utcnow().date().isoformat()
        # Добавляем score в notes если передан
        combined_notes = req.notes or ""
        if req.score:
            combined_notes = f"Счёт: {req.score}. {combined_notes}".strip()

        db.execute(text("""
            INSERT INTO sport_sessions (user_id, sport_type, duration_min, intensity, calories_burned, notes, session_date)
            VALUES (:uid, :sport, :dur, :intensity, :cal, :notes, :date)
        """), {"uid": user[0], "sport": req.sport_type, "dur": req.duration_min,
               "intensity": req.intensity, "cal": calories, "notes": combined_notes or None,
               "date": session_date})
        add_points(db, user[0], 8, f"sport_{req.sport_type}")
        db.commit()
        return {"ok": True, "calories_burned": calories}

@app.get("/api/sport/{tg_id}")
def get_sport_sessions(tg_id: int, limit: int = 30):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        rows = db.execute(text("""
            SELECT id, sport_type, duration_min, intensity, calories_burned, notes, session_date, created_at
            FROM sport_sessions WHERE user_id=:uid ORDER BY session_date DESC, created_at DESC LIMIT :limit
        """), {"uid": user[0], "limit": limit}).fetchall()
        return {"sessions": [{
            "id": r[0], "sport_type": r[1], "sport_label": SPORT_LABELS.get(r[1], r[1]),
            "duration_min": r[2], "intensity": r[3], "calories_burned": r[4],
            "notes": r[5], "session_date": r[6].isoformat() if r[6] else None,
        } for r in rows]}

@app.delete("/api/sport/{tg_id}/{session_id}")
def delete_sport_session(tg_id: int, session_id: int):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        db.execute(text("DELETE FROM sport_sessions WHERE id=:sid AND user_id=:uid"),
                   {"sid": session_id, "uid": user[0]})
        db.commit()
        return {"ok": True}


# ─── CUSTOM EXERCISES ─────────────────────────────────────────────────────────

class CustomExerciseRequest(BaseModel):
    name: str
    muscle_group_id: Optional[int] = None
    sets_recommended: Optional[int] = 3
    reps_recommended: Optional[int] = 12
    description: Optional[str] = None
    equipment: Optional[str] = None
    difficulty: Optional[str] = "medium"

@app.get("/api/custom-exercises/{tg_id}")
def get_custom_exercises(tg_id: int):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        rows = db.execute(text("""
            SELECT ce.id, ce.name, ce.muscle_group_id, ce.sets_recommended, ce.reps_recommended,
                   ce.description, ce.equipment, ce.difficulty,
                   mg.name AS group_name, mg.emoji AS group_emoji
            FROM custom_exercises ce
            LEFT JOIN muscle_groups mg ON mg.id = ce.muscle_group_id
            WHERE ce.user_id=:uid ORDER BY ce.created_at DESC
        """), {"uid": user[0]}).fetchall()
        return {"exercises": [{
            "id": r[0], "name": r[1], "muscle_group_id": r[2],
            "sets_recommended": r[3], "reps_recommended": r[4],
            "description": r[5], "equipment": r[6], "difficulty": r[7],
            "group_name": r[8], "group_emoji": r[9],
            "is_custom": True, "photo_url": None,
        } for r in rows]}

@app.post("/api/custom-exercises/{tg_id}", status_code=201)
def create_custom_exercise(tg_id: int, req: CustomExerciseRequest):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        db.execute(text("""
            INSERT INTO custom_exercises (user_id, name, muscle_group_id, sets_recommended,
                reps_recommended, description, equipment, difficulty)
            VALUES (:uid, :name, :mg, :sets, :reps, :desc, :equip, :diff)
        """), {"uid": user[0], "name": req.name[:200], "mg": req.muscle_group_id,
               "sets": req.sets_recommended, "reps": req.reps_recommended,
               "desc": req.description, "equip": req.equipment, "diff": req.difficulty})
        db.commit()
        row = db.execute(text(
            "SELECT id FROM custom_exercises WHERE user_id=:uid ORDER BY created_at DESC LIMIT 1"
        ), {"uid": user[0]}).fetchone()
        return {"ok": True, "id": row[0]}

@app.delete("/api/custom-exercises/{tg_id}/{ex_id}")
def delete_custom_exercise(tg_id: int, ex_id: int):
    with SessionLocal() as db:
        user = db.execute(text("SELECT id FROM users WHERE telegram_id=:tg_id"), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        db.execute(text("DELETE FROM custom_exercises WHERE id=:eid AND user_id=:uid"),
                   {"eid": ex_id, "uid": user[0]})
        db.commit()
        return {"ok": True}


# ─── GAMIFICATION ─────────────────────────────────────────────────────────────

@app.get("/api/gamification/{tg_id}")
def get_gamification(tg_id: int):
    with SessionLocal() as db:
        user = db.execute(text("""
            SELECT id, COALESCE(total_points,0) AS pts, COALESCE(user_rank,'beginner') AS rank
            FROM users WHERE telegram_id=:tg_id
        """), {"tg_id": tg_id}).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        pts = int(user[1])
        rank = user[2]
        next_rank = {"beginner": ("athlete", 200), "athlete": ("champion", 500),
                     "champion": ("legend", 1000), "legend": (None, None)}
        next_r, next_pts = next_rank.get(rank, (None, None))
        logs = db.execute(text("""
            SELECT points, reason, created_at FROM points_log
            WHERE user_id=:uid ORDER BY created_at DESC LIMIT 10
        """), {"uid": user[0]}).fetchall()
        return {
            "total_points": pts, "rank": rank,
            "rank_name": RANK_NAMES.get(rank, "🥉 Новичок"),
            "ai_limit": get_ai_limit(rank),
            "next_rank": next_r, "next_rank_pts": next_pts,
            "pts_to_next": max(0, next_pts - pts) if next_pts else 0,
            "progress_pct": round(pts / next_pts * 100) if next_pts else 100,
            "recent_points": [{"pts": r[0], "reason": r[1], "at": r[2].isoformat()} for r in logs],
        }
