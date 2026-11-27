"""Cryptographic primitives for the institutional API."""
from __future__ import annotations

import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt

ALGORITHM = "HS256"
ISSUER = "edu-one-api"
AUDIENCE = "edu-one-client"


def _jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET_KEY", "")
    if len(secret.encode("utf-8")) < 32:
        raise RuntimeError("JWT_SECRET_KEY must contain at least 32 bytes")
    return secret


def hash_password(password: str) -> str:
    if len(password) < 12:
        raise ValueError("Password must contain at least 12 characters")
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 600_000)
    return f"pbkdf2_sha256$600000${salt.hex()}${digest.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        scheme, iterations_text, salt_hex, digest_hex = encoded.split("$", 3)
        if scheme != "pbkdf2_sha256":
            return False
        iterations = int(iterations_text)
        if iterations < 100_000 or iterations > 2_000_000:
            return False
        candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), iterations)
        return hmac.compare_digest(candidate.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def create_access_token(*, user_id: str, institution_id: str, roles: list[str], expires_minutes: int = 15) -> str:
    if expires_minutes < 1 or expires_minutes > 60:
        raise ValueError("Access token lifetime must be between 1 and 60 minutes")
    now = datetime.now(timezone.utc)
    claims: dict[str, Any] = {
        "sub": user_id, "tenant_id": institution_id, "roles": roles,
        "iat": now, "exp": now + timedelta(minutes=expires_minutes),
        "iss": ISSUER, "aud": AUDIENCE, "jti": secrets.token_urlsafe(16),
    }
    return jwt.encode(claims, _jwt_secret(), algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        claims = jwt.decode(
            token, _jwt_secret(), algorithms=[ALGORITHM], issuer=ISSUER, audience=AUDIENCE,
            options={"require_sub": True, "require_exp": True, "require_iat": True},
        )
    except JWTError as exc:
        raise ValueError("Invalid or expired access token") from exc
    if not claims.get("tenant_id") or not isinstance(claims.get("roles"), list):
        raise ValueError("Access token is missing required authorization claims")
    return claims


def create_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
