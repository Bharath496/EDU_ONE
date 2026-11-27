from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from database import get_db
from main import app
from models import AuditEvent, Base, Institution, User, UserRole
from security import create_access_token


@pytest.fixture
def audit_client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "audit-test-secret-key-with-at-least-32-bytes")
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        college = Institution(name="Audit College", code="AUDIT01")
        other_college = Institution(name="Other Audit College", code="AUDIT02")
        db.add_all([college, other_college])
        db.flush()

        def add_user(institution_id: str, email: str, role: str) -> User:
            user = User(
                institution_id=institution_id,
                email=email,
                full_name=email.split("@")[0],
                password_hash="test-hash",
            )
            db.add(user)
            db.flush()
            db.add(UserRole(user_id=user.id, role=role))
            db.flush()
            return user

        admin = add_user(college.id, "admin@audit.edu", "College Admin")
        student = add_user(college.id, "student@audit.edu", "Student")
        other_admin = add_user(other_college.id, "admin@other.edu", "College Admin")
        db.add_all([
            AuditEvent(
                institution_id=college.id, actor_user_id=admin.id,
                action="users.created", resource_type="user",
                resource_id="local-user-1", details={"roles": ["Student"]},
            ),
            AuditEvent(
                institution_id=other_college.id, actor_user_id=other_admin.id,
                action="users.created", resource_type="user",
                resource_id="other-user-1", details={"roles": ["Faculty"]},
            ),
        ])
        db.commit()
        ids = {"college": college.id, "admin": admin.id, "student": student.id, "other_admin": other_admin.id}

    def override_get_db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, base_url="https://testserver") as client:
        def headers(user_id: str, institution_id: str, role: str):
            token = create_access_token(user_id=user_id, institution_id=institution_id, roles=[role])
            return {"Authorization": f"Bearer {token}"}
        yield client, ids, headers
    app.dependency_overrides.clear()
    engine.dispose()


def test_college_admin_reads_only_own_institution_audit_events(audit_client) -> None:
    client, ids, headers = audit_client
    response = client.get("/v1/audit", headers=headers(ids["admin"], ids["college"], "College Admin"))
    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["action"] == "users.created"
    assert response.json()["items"][0]["actor_email"] == "admin@audit.edu"
    assert response.json()["items"][0]["resource_id"] == "local-user-1"


def test_student_cannot_read_audit_events(audit_client) -> None:
    client, ids, headers = audit_client
    response = client.get("/v1/audit", headers=headers(ids["student"], ids["college"], "Student"))
    assert response.status_code == 403


def test_audit_filters_and_pagination_are_applied(audit_client) -> None:
    client, ids, headers = audit_client
    response = client.get(
        "/v1/audit?action=users.created&resource_type=user&page=1&limit=1",
        headers=headers(ids["admin"], ids["college"], "College Admin"),
    )
    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["page"] == 1
    assert response.json()["limit"] == 1
