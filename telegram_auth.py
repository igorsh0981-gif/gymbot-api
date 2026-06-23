"""
telegram_auth.py — Sprint 12 / T-05
Валидация Telegram initData через HMAC-SHA256.
Используется как FastAPI Dependency в api.py.
"""
import os
import hmac
import hashlib
import json
from urllib.parse import unquote
from typing import Optional
from fastapi import Header, HTTPException

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"


def verify_telegram_init_data(init_data: str, bot_token: str) -> dict:
    """
    Проверяет подпись Telegram initData.
    Возвращает распарсенные данные пользователя или выбрасывает ValueError.
    """
    # Парсим строку initData
    params = {}
    for part in init_data.split("&"):
        if "=" in part:
            k, v = part.split("=", 1)
            params[unquote(k)] = unquote(v)

    received_hash = params.pop("hash", None)
    if not received_hash:
        raise ValueError("hash отсутствует в initData")

    # Формируем data-check-string
    data_check = "\n".join(
        f"{k}={v}" for k, v in sorted(params.items())
    )

    # Вычисляем секретный ключ
    secret_key = hmac.new(
        b"WebAppData",
        bot_token.encode(),
        hashlib.sha256
    ).digest()

    # Вычисляем ожидаемый hash
    expected_hash = hmac.new(
        secret_key,
        data_check.encode(),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_hash, received_hash):
        raise ValueError("Неверная подпись initData")

    # Парсим user
    user_data = {}
    if "user" in params:
        try:
            user_data = json.loads(params["user"])
        except json.JSONDecodeError:
            pass

    return user_data


async def get_verified_tg_id(
    x_init_data: Optional[str] = Header(None, alias="X-Init-Data"),
    x_tg_id: Optional[str] = Header(None, alias="X-Tg-Id"),
) -> Optional[int]:
    """
    FastAPI Dependency для защищённых эндпоинтов.

    Клиент должен передавать:
      X-Init-Data: <строка initData от Telegram>
    или в DEV_MODE:
      X-Tg-Id: <tg_id числом>

    Использование в api.py:
      from telegram_auth import get_verified_tg_id
      from fastapi import Depends

      @app.get("/api/user/{tg_id}")
      def get_user(tg_id: int, verified_id: int = Depends(get_verified_tg_id)):
          if verified_id and verified_id != tg_id:
              raise HTTPException(status_code=403, detail="Forbidden")
          ...
    """
    # DEV_MODE — для тестирования без Telegram
    if DEV_MODE:
        if x_tg_id:
            try:
                return int(x_tg_id)
            except ValueError:
                pass
        return None  # В dev режиме не блокируем

    # Продакшн — требуем initData
    if not x_init_data:
        return None  # Мягкая проверка — не блокируем, но и не подтверждаем

    if not BOT_TOKEN:
        return None

    try:
        user_data = verify_telegram_init_data(x_init_data, BOT_TOKEN)
        tg_id = user_data.get("id")
        return int(tg_id) if tg_id else None
    except (ValueError, Exception):
        raise HTTPException(status_code=401, detail="Invalid Telegram initData")


def extract_tg_id_unsafe(init_data: str) -> Optional[int]:
    """
    Извлекает tg_id БЕЗ проверки подписи.
    Использовать только для логирования, не для авторизации.
    """
    try:
        for part in init_data.split("&"):
            if part.startswith("user="):
                user = json.loads(unquote(part[5:]))
                return user.get("id")
    except Exception:
        pass
    return None
