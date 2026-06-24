"""
food_catalog.py — справочник продуктов питания
Подключение в api.py:
    from food_catalog import router as food_catalog_router
    app.include_router(food_catalog_router, prefix="/api")
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional
import asyncpg
import os

router = APIRouter(tags=["food-catalog"])

DATABASE_URL = os.environ.get("DATABASE_URL", "").replace(
    "postgres://", "postgresql://"
)


async def get_conn():
    return await asyncpg.connect(DATABASE_URL)


# ── DTO ──────────────────────────────────────────────────────────────────────

class FoodProductOut(BaseModel):
    id: int
    name: str
    name_en: Optional[str]
    calories: float
    protein: float
    fat: float
    carbs: float
    fiber: float
    category: str
    image_url: Optional[str]
    is_custom: bool
    is_verified: bool


class FoodProductCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    name_en: Optional[str] = Field(None, max_length=200)
    calories: float = Field(..., gt=0, le=1000)
    protein: float = Field(..., ge=0, le=200)
    fat: float = Field(..., ge=0, le=200)
    carbs: float = Field(..., ge=0, le=200)
    fiber: float = Field(0, ge=0, le=100)
    category: str = Field(..., pattern="^(meat|fish|dairy|eggs|grains|bread|vegetables|fruits|nuts|drinks|snacks|other)$")
    image_url: Optional[str] = None
    user_id: int  # telegram_id из запроса (валидируется через токен на проде)


class FoodLogEntry(BaseModel):
    user_id: int
    product_id: int
    weight_g: float = Field(..., gt=0, le=5000)
    meal_type: str = Field(..., pattern="^(breakfast|lunch|dinner|snack)$")
    date: Optional[str] = None  # YYYY-MM-DD, default today


# ── ЭНДПОИНТЫ ────────────────────────────────────────────────────────────────

VALID_CATEGORIES = {
    "meat", "fish", "dairy", "eggs", "grains",
    "bread", "vegetables", "fruits", "nuts", "drinks", "snacks", "other"
}


@router.get("/food/search", response_model=list[FoodProductOut])
async def search_food(
    q: str = Query("", min_length=0, max_length=100),
    category: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    """
    Поиск продуктов по названию и/или категории.
    GET /api/food/search?q=греч&category=grains&limit=20
    """
    conn = await get_conn()
    try:
        conditions = []
        params = []
        idx = 1

        if q and len(q) >= 2:
            # Полнотекстовый поиск + fallback ILIKE для коротких слов
            conditions.append(
                f"(search_vector @@ plainto_tsquery('russian', ${idx}) "
                f"OR name ILIKE ${idx + 1})"
            )
            params.append(q)
            params.append(f"%{q}%")
            idx += 2
        
        if category and category in VALID_CATEGORIES:
            conditions.append(f"category = ${idx}")
            params.append(category)
            idx += 1

        where = "WHERE " + " AND ".join(conditions) if conditions else ""
        params.extend([limit, offset])

        sql = f"""
            SELECT id, name, name_en, calories, protein, fat, carbs, fiber,
                   category, image_url, is_custom, is_verified
            FROM food_products
            {where}
            ORDER BY is_verified DESC, name
            LIMIT ${idx} OFFSET ${idx + 1}
        """
        rows = await conn.fetch(sql, *params)
        return [dict(r) for r in rows]
    finally:
        await conn.close()


@router.get("/food/categories")
async def get_categories():
    """Список категорий с количеством продуктов."""
    conn = await get_conn()
    try:
        rows = await conn.fetch("""
            SELECT category, COUNT(*) as count
            FROM food_products
            GROUP BY category
            ORDER BY count DESC
        """)
        category_labels = {
            "meat": "🥩 Мясо и птица",
            "fish": "🐟 Рыба и морепродукты",
            "dairy": "🥛 Молочные продукты",
            "eggs": "🥚 Яйца",
            "grains": "🌾 Крупы и бобовые",
            "bread": "🍞 Хлеб и выпечка",
            "vegetables": "🥦 Овощи",
            "fruits": "🍎 Фрукты",
            "nuts": "🥜 Орехи и семена",
            "drinks": "🥤 Напитки",
            "snacks": "🍫 Снеки",
            "other": "📦 Прочее",
        }
        return [
            {
                "key": r["category"],
                "label": category_labels.get(r["category"], r["category"]),
                "count": r["count"],
            }
            for r in rows
        ]
    finally:
        await conn.close()


@router.get("/food/products/{product_id}", response_model=FoodProductOut)
async def get_product(product_id: int):
    """Карточка продукта по ID."""
    conn = await get_conn()
    try:
        row = await conn.fetchrow("""
            SELECT id, name, name_en, calories, protein, fat, carbs, fiber,
                   category, image_url, is_custom, is_verified
            FROM food_products WHERE id = $1
        """, product_id)
        if not row:
            raise HTTPException(status_code=404, detail="Продукт не найден")
        return dict(row)
    finally:
        await conn.close()


@router.post("/food/products", response_model=FoodProductOut, status_code=201)
async def create_product(body: FoodProductCreate):
    """
    Добавить свой продукт.
    is_custom=TRUE, is_verified=FALSE.
    После создания доступен всем пользователям.
    """
    conn = await get_conn()
    try:
        # Проверка дубликата по имени (регистронезависимо)
        existing = await conn.fetchrow(
            "SELECT id FROM food_products WHERE LOWER(name) = LOWER($1)",
            body.name
        )
        if existing:
            raise HTTPException(
                status_code=409,
                detail="Продукт с таким названием уже существует"
            )

        row = await conn.fetchrow("""
            INSERT INTO food_products
                (name, name_en, calories, protein, fat, carbs, fiber,
                 category, image_url, is_custom, created_by_user_id, is_verified)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, $10, FALSE)
            RETURNING id, name, name_en, calories, protein, fat, carbs, fiber,
                      category, image_url, is_custom, is_verified
        """,
            body.name, body.name_en, body.calories, body.protein,
            body.fat, body.carbs, body.fiber, body.category,
            body.image_url, body.user_id
        )
        return dict(row)
    finally:
        await conn.close()


@router.post("/food/log-from-catalog", status_code=201)
async def log_food_from_catalog(body: FoodLogEntry):
    """
    Добавить запись в food_log из справочника.
    Считает КБЖУ пропорционально весу.
    """
    conn = await get_conn()
    try:
        # Получаем продукт
        product = await conn.fetchrow(
            "SELECT calories, protein, fat, carbs FROM food_products WHERE id = $1",
            body.product_id
        )
        if not product:
            raise HTTPException(status_code=404, detail="Продукт не найден")

        # Пересчёт на указанный вес
        factor = body.weight_g / 100.0
        calories = round(product["calories"] * factor, 1)
        protein = round(product["protein"] * factor, 1)
        fat = round(product["fat"] * factor, 1)
        carbs = round(product["carbs"] * factor, 1)

        date_val = body.date or "CURRENT_DATE"

        await conn.execute("""
            INSERT INTO food_log
                (user_id, date, calories, protein, fat, carbs,
                 meal_type, food_product_id, weight_g, source)
            VALUES ($1, COALESCE($2::date, CURRENT_DATE), $3, $4, $5, $6, $7, $8, $9, 'catalog')
        """,
            body.user_id, body.date, calories, protein, fat, carbs,
            body.meal_type, body.product_id, body.weight_g
        )

        return {
            "status": "ok",
            "logged": {
                "calories": calories,
                "protein": protein,
                "fat": fat,
                "carbs": carbs,
                "weight_g": body.weight_g,
            }
        }
    finally:
        await conn.close()
