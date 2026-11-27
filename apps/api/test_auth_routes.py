from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from database import get_db
from main import app
from models import Base, Institution, User, UserRole
from security import hash_password


@pytest.fixture
def auth_client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "test-only-secret-key-with-at-least-32-bytes")
    monkeypatch.setenv("COOKIE_SECURE", "true")
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        college = Institution(name="Auth Test College", code="AUTH01")
        db.add(college)
        db.flush()
        user = User(
            institution_id=college.id,
            email="student@example.edu",
            full_name="Test Student",
            password_hash=hash_password("correct-horse-battery"),
        )
        db.add(user)
        db.flush()
        db.add(UserRole(user_id=user.id, role="Student"))
        db.commit()
        user_id = user.id

    def override_get_db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    from fastapi.testclient import TestClient
    with TestClient(app, base_url="https://testserver") as client:
        yield client, user_id
    app.dependency_overrides.clear()
    engine.dispose()


def test_login_sets_http_only_refresh_cookie_and_returns_short_lived_access_token(auth_client) -> None:
    client, _ = auth_client
    response = client.post("/v1/auth/login", json={
        "institution_code": "auth01",
        "email": "STUDENT@example.edu",
        "password": "correct-horse-battery",
    })
    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
    assert response.json()["expires_in"] == 900
    assert response.json()["user"]["role"] == "Student"
    cookie = response.headers["set-cookie"].lower()
    assert "httponly" in cookie
    assert "secure" in cookie


def test_login_uses_generic_error_for_invalid_credentials(auth_client) -> None:
    client, _ = auth_client
    response = client.post("/v1/auth/login", json={
        "institution_code": "auth01",
        "email": "student@example.edu",
        "password": "wrong-password",
    })
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid institution code, email, or password"


def test_me_requires_bearer_token_and_reads_current_database_roles(auth_client) -> None:
    client, user_id = auth_client
    unauthenticated = client.get("/v1/auth/me")
    assert unauthenticated.status_code == 401
    login = client.post("/v1/auth/login", json={
        "institution_code": "AUTH01",
        "email": "student@example.edu",
        "password": "correct-horse-battery",
    })
    token = login.json()["access_token"]
    response = client.get("/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["id"] == user_id
    assert response.json()["roles"] == ["Student"]


def test_refresh_rotates_cookie_and_old_refresh_token_cannot_be_reused(auth_client) -> None:
    client, _ = auth_client
    login = client.post("/v1/auth/login", json={
        "institution_code": "AUTH01",
        "email": "student@example.edu",
        "password": "correct-horse-battery",
    })
    old_cookie = login.cookies.get("eduone_refresh")
    refreshed = client.post("/v1/auth/refresh")
    assert refreshed.status_code == 200
    new_cookie = refreshed.cookies.get("eduone_refresh")
    assert new_cookie and new_cookie != old_cookie
    # Replaying the old cookie must fail even after the browser has rotated it.
    replay = client.post("/v1/auth/refresh", cookies={"eduone_refresh": old_cookie})
    assert replay.status_code == 401


def test_logout_revokes_refresh_session(auth_client) -> None:
    client, _ = auth_client
    client.post("/v1/auth/login", json={
        "institution_code": "AUTH01",
        "email": "student@example.edu",
        "password": "correct-horse-battery",
    })
    response = client.post("/v1/auth/logout")
    assert response.status_code == 204
    after_logout = client.post("/v1/auth/refresh")
    assert after_logout.status_code == 401
