"""Database-backed authentication endpoints for the institutional API."""
from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from database import get_db
from models import AuthSession, Institution, User
from security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)

router = APIRouter(prefix="/v1/auth", tags=["institutional-auth"])
bearer = HTTPBearer(auto_error=False)
REFRESH_COOKIE = "eduone_refresh"
REFRESH_DAYS = 7


class LoginPayload(BaseModel):
    institution_code: str = Field(min_length=2, max_length=40)
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=1024)


@dataclass(frozen=True)
class AuthPrincipal:
    user: User
    institution: Institution
    roles: tuple[str, ...]
    claims: dict


def _cookie_secure() -> bool:
    return os.getenv("COOKIE_SECURE", "true").strip().lower() not in {"0", "false", "no"}


def _issue_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        max_age=REFRESH_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=_cookie_secure(),
        samesite="lax",
        path="/v1/auth",
    )


def _new_session(db: Session, user: User, token: str) -> None:
    db.add(AuthSession(
        user_id=user.id,
        token_hash=hash_refresh_token(token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_DAYS),
    ))


def _user_roles(user: User) -> tuple[str, ...]:
    return tuple(sorted({role.role for role in user.roles}))


def _new_access_token(user: User, roles: tuple[str, ...]) -> str:
    return create_access_token(
        user_id=user.id,
        institution_id=user.institution_id,
        roles=list(roles),
    )


def _load_active_user(db: Session, user_id: str) -> tuple[User, Institution, tuple[str, ...]]:
    user = db.scalar(select(User).where(User.id == user_id))
    if user is None or not user.is_active or user.is_locked:
        raise HTTPException(status_code=401, detail="Authentication required")
    institution = db.get(Institution, user.institution_id)
    if institution is None or not institution.is_active:
        raise HTTPException(status_code=401, detail="Authentication required")
    roles = _user_roles(user)
    if not roles:
        raise HTTPException(status_code=403, detail="No active role is assigned")
    return user, institution, roles


def get_current_principal(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    db: Annotated[Session, Depends(get_db)],
) -> AuthPrincipal:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Authentication required", headers={"WWW-Authenticate": "Bearer"})
    try:
        claims = decode_access_token(credentials.credentials)
    except (ValueError, RuntimeError):
        raise HTTPException(status_code=401, detail="Authentication required", headers={"WWW-Authenticate": "Bearer"})
    user, institution, roles = _load_active_user(db, claims["sub"])
    if claims.get("tenant_id") != user.institution_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    # Role claims are informational only. Current role grants always come from DB.
    return AuthPrincipal(user=user, institution=institution, roles=roles, claims=claims)


@router.post("/login")
def login(
    payload: LoginPayload,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    institution = db.scalar(select(Institution).where(Institution.code == payload.institution_code.strip().upper()))
    user = None
    if institution is not None and institution.is_active:
        user = db.scalar(select(User).where(
            User.institution_id == institution.id,
            User.email == payload.email.strip().lower(),
        ))
    if user is None or not user.is_active or user.is_locked or not verify_password(payload.password, user.password_hash):
        # Do not reveal whether the institution, email, or password was incorrect.
        raise HTTPException(status_code=401, detail="Invalid institution code, email, or password")
    roles = _user_roles(user)
    if not roles:
        raise HTTPException(status_code=403, detail="No active role is assigned")
    refresh_token = create_refresh_token()
    _new_session(db, user, refresh_token)
    db.commit()
    _issue_refresh_cookie(response, refresh_token)
    return {
        "access_token": _new_access_token(user, roles),
        "token_type": "bearer",
        "expires_in": 900,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.full_name,
            "role": roles[0],
            "roles": list(roles),
            "collegeId": institution.id,
            "collegeName": institution.name,
        },
    }


@router.post("/refresh")
def refresh(
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    old_token = request.cookies.get(REFRESH_COOKIE)
    if not old_token:
        raise HTTPException(status_code=401, detail="Refresh session is invalid")
    now = datetime.now(timezone.utc)
    record = db.scalar(select(AuthSession).where(AuthSession.token_hash == hash_refresh_token(old_token)))
    if record is None or record.revoked_at is not None:
        raise HTTPException(status_code=401, detail="Refresh session is invalid")
    expiry = record.expires_at
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    if expiry <= now:
        raise HTTPException(status_code=401, detail="Refresh session is invalid")
    # Atomic compare-and-revoke prevents two concurrent requests from rotating
    # the same refresh token successfully.
    result = db.execute(
        update(AuthSession)
        .where(AuthSession.id == record.id, AuthSession.revoked_at.is_(None))
        .values(revoked_at=now)
    )
    if result.rowcount != 1:
        db.rollback()
        raise HTTPException(status_code=401, detail="Refresh session is invalid")
    try:
        user, institution, roles = _load_active_user(db, record.user_id)
    except HTTPException:
        db.rollback()
        raise
    new_refresh = create_refresh_token()
    _new_session(db, user, new_refresh)
    db.commit()
    _issue_refresh_cookie(response, new_refresh)
    return {
        "access_token": _new_access_token(user, roles),
        "token_type": "bearer",
        "expires_in": 900,
    }


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def logout(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    token = request.cookies.get(REFRESH_COOKIE)
    if token:
        db.execute(
            update(AuthSession)
            .where(
                AuthSession.token_hash == hash_refresh_token(token),
                AuthSession.revoked_at.is_(None),
            )
            .values(revoked_at=datetime.now(timezone.utc))
        )
        db.commit()
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    response.delete_cookie(REFRESH_COOKIE, path="/v1/auth", secure=_cookie_secure(), httponly=True, samesite="lax")
    return response


@router.get("/me")
def me(principal: Annotated[AuthPrincipal, Depends(get_current_principal)]) -> dict:
    return {
        "id": principal.user.id,
        "email": principal.user.email,
        "name": principal.user.full_name,
        "role": principal.roles[0],
        "roles": list(principal.roles),
        "collegeId": principal.institution.id,
        "collegeName": principal.institution.name,
    }
