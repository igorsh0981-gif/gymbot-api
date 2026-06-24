"""
food_catalog.py — справочник продуктов питания
Стек: sqlalchemy + pg8000 (как в api.py)
Подключение в api.py:
    from food_catalog import router as food_catalog_router
    app.include_router(food_catalog_router, prefix="/api")
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy import text

router = APIRouter(tags=["food-catalog"])

VALID_CATEGORIES = {
    "meat","fish","dairy","eggs","grains","bread",
    "vegetables","fruits","nuts","drinks","snacks","other","supplements"
}

# engine импортируется из api.py через общий модуль — используем dependency
# Но проще: импортируем engine из api напрямую при старте
_engine = None

def get_engine():
    global _engine
    if _engine is None:
        import os
        from sqlalchemy import create_engine
        url = os.environ.get("DATABASE_URL","")
        if url.startswith("postgres://"):
            url = url.replace("postgres://","postgresql+pg8000://",1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://","postgresql+pg8000://",1)
        _engine = create_engine(url, pool_pre_ping=True)
    return _engine


class FoodProductOut(BaseModel):
    id: int
    name: str
    name_en: Optional[str] = None
    calories: float
    protein: float
    fat: float
    carbs: float
    fiber: float
    category: str
    image_url: Optional[str] = None
    is_custom: bool
    is_verified: bool
    serving_size_g: Optional[float] = None
    servings_per_pack: Optional[int] = None
    brand: Optional[str] = None
    supplement_type: Optional[str] = None


class FoodProductCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    name_en: Optional[str] = Field(None, max_length=200)
    calories: float = Field(..., ge=0, le=1500)
    protein: float = Field(..., ge=0, le=200)
    fat: float = Field(..., ge=0, le=200)
    carbs: float = Field(..., ge=0, le=500)
    fiber: float = Field(0, ge=0, le=200)
    category: str
    image_url: Optional[str] = None
    created_by_user_id: Optional[int] = None


class FoodLogFromCatalog(BaseModel):
    user_id: int
    product_id: int
    weight_g: float = Field(..., gt=0, le=5000)
    meal_type: str = Field(..., pattern="^(breakfast|lunch|dinner|snack|water)$")


# ── ENDPOINTS ─────────────────────────────────────────────────────────────────

@router.get("/food/search")
def search_food(
    q: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    engine = get_engine()
    with engine.connect() as conn:
        conditions = ["1=1"]
        params = {"limit": limit, "offset": offset}

        if category and category in VALID_CATEGORIES:
            conditions.append("category = :category")
            params["category"] = category

        if q and q.strip():
            conditions.append(
                "(LOWER(name) LIKE :q OR LOWER(name_en) LIKE :q OR LOWER(brand) LIKE :q)"
            )
            params["q"] = f"%{q.strip().lower()}%"

        where = " AND ".join(conditions)
        sql = text(f"""
            SELECT id, name, name_en, calories, protein, fat, carbs, fiber,
                   category, image_url, is_custom, is_verified,
                   serving_size_g, servings_per_pack, brand, supplement_type
            FROM food_products
            WHERE {where}
            ORDER BY
                CASE WHEN is_custom THEN 1 ELSE 0 END,
                name
            LIMIT :limit OFFSET :offset
        """)
        rows = conn.execute(sql, params).fetchall()

        count_sql = text(f"SELECT COUNT(*) FROM food_products WHERE {where}")
        total = conn.execute(count_sql, {k:v for k,v in params.items() if k not in ("limit","offset")}).scalar()

    items = []
    for r in rows:
        items.append({
            "id": r[0], "name": r[1], "name_en": r[2],
            "calories": r[3], "protein": r[4], "fat": r[5],
            "carbs": r[6], "fiber": r[7], "category": r[8],
            "image_url": r[9], "is_custom": r[10], "is_verified": r[11],
            "serving_size_g": r[12], "servings_per_pack": r[13],
            "brand": r[14], "supplement_type": r[15],
        })
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.get("/food/categories")
def list_categories():
    engine = get_engine()
    with engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT category, COUNT(*) as cnt FROM food_products GROUP BY category ORDER BY category"
        )).fetchall()
    return {"categories": [{"category": r[0], "count": r[1]} for r in rows]}


@router.get("/food/products/{product_id}")
def get_product(product_id: int):
    engine = get_engine()
    with engine.connect() as conn:
        row = conn.execute(text(
            """SELECT id, name, name_en, calories, protein, fat, carbs, fiber,
                      category, image_url, is_custom, is_verified,
                      serving_size_g, servings_per_pack, brand, supplement_type
               FROM food_products WHERE id = :id"""
        ), {"id": product_id}).fetchone()
    if not row:
        raise HTTPException(404, "Product not found")
    return {
        "id": row[0], "name": row[1], "name_en": row[2],
        "calories": row[3], "protein": row[4], "fat": row[5],
        "carbs": row[6], "fiber": row[7], "category": row[8],
        "image_url": row[9], "is_custom": row[10], "is_verified": row[11],
        "serving_size_g": row[12], "servings_per_pack": row[13],
        "brand": row[14], "supplement_type": row[15],
    }


@router.post("/food/products", status_code=201)
def create_product(data: FoodProductCreate):
    if data.category not in VALID_CATEGORIES:
        raise HTTPException(400, f"Invalid category. Valid: {sorted(VALID_CATEGORIES)}")
    engine = get_engine()
    with engine.connect() as conn:
        # дедупликация
        exists = conn.execute(text(
            "SELECT id FROM food_products WHERE LOWER(name) = LOWER(:name) LIMIT 1"
        ), {"name": data.name}).fetchone()
        if exists:
            raise HTTPException(409, "Product with this name already exists")

        row = conn.execute(text("""
            INSERT INTO food_products
                (name, name_en, calories, protein, fat, carbs, fiber,
                 category, image_url, is_custom, is_verified, created_by_user_id)
            VALUES
                (:name, :name_en, :calories, :protein, :fat, :carbs, :fiber,
                 :category, :image_url, TRUE, FALSE, :created_by_user_id)
            RETURNING id
        """), {
            "name": data.name, "name_en": data.name_en,
            "calories": data.calories, "protein": data.protein,
            "fat": data.fat, "carbs": data.carbs, "fiber": data.fiber,
            "category": data.category, "image_url": data.image_url,
            "created_by_user_id": data.created_by_user_id,
        }).fetchone()
        conn.commit()
    return {"id": row[0], "name": data.name}


@router.post("/food/log-from-catalog")
def log_from_catalog(data: FoodLogFromCatalog):
    engine = get_engine()
    with engine.connect() as conn:
        product = conn.execute(text(
            "SELECT id, name, calories, protein, fat, carbs FROM food_products WHERE id = :id"
        ), {"id": data.product_id}).fetchone()
        if not product:
            raise HTTPException(404, "Product not found")

        factor = data.weight_g / 100.0
        kcal = round((product[2] or 0) * factor)
        protein = round((product[3] or 0) * factor, 1)
        fat = round((product[4] or 0) * factor, 1)
        carb = round((product[5] or 0) * factor, 1)

        conn.execute(text("""
            INSERT INTO food_log
                (user_id, meal_name, kcal, protein, fat, carb, meal_type,
                 food_product_id, weight_g, source, date)
            VALUES
                (:user_id, :meal_name, :kcal, :protein, :fat, :carb, :meal_type,
                 :product_id, :weight_g, 'catalog', NOW())
        """), {
            "user_id": data.user_id,
            "meal_name": product[1],
            "kcal": kcal, "protein": protein, "fat": fat, "carb": carb,
            "meal_type": data.meal_type,
            "product_id": data.product_id,
            "weight_g": data.weight_g,
        })
        conn.commit()
    return {"ok": True, "kcal": kcal, "protein": protein, "fat": fat, "carb": carb}
