from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from database import get_db
from main import app
from models import AcademicCourse, Base, Institution, StudentProfile, User, UserRole
from security import create_access_token


@pytest.fixture
def admin_client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "user-admin-test-secret-key-with-at-least-32-bytes")
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        college = Institution(name="User Admin College", code="USRADM")
        db.add(college)
        db.flush()
        admin = User(institution_id=college.id, email="admin@users.edu", full_name="Admin", password_hash="test-hash")
        student = User(institution_id=college.id, email="student@users.edu", full_name="Student", password_hash="test-hash")
        db.add_all([admin, student])
        db.flush()
        db.add_all([UserRole(user_id=admin.id, role="College Admin"), UserRole(user_id=student.id, role="Student")])
        profile = StudentProfile(institution_id=college.id, user_id=student.id, registration_number="U001")
        course = AcademicCourse(institution_id=college.id, code="U101", title="User Admin Course", semester=1)
        db.add_all([profile, course])
        db.commit()
        ids = {"college": college.id, "admin": admin.id, "student": student.id, "profile": profile.id, "course": course.id}

    def override_get_db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, base_url="https://testserver") as client:
        token = create_access_token(user_id=ids["admin"], institution_id=ids["college"], roles=["College Admin"])
        yield client, {"Authorization": f"Bearer {token}"}, ids
    app.dependency_overrides.clear()
    engine.dispose()


def test_admin_can_create_staff_user_without_exposing_password_hash(admin_client) -> None:
    client, headers, _ = admin_client
    response = client.post("/v1/users", headers=headers, json={
        "email": "faculty@users.edu", "full_name": "New Faculty",
        "password": "a-strong-test-password", "roles": ["Faculty"],
    })
    assert response.status_code == 201
    assert response.json()["email"] == "faculty@users.edu"
    assert "password_hash" not in response.json()


def test_admin_cannot_create_another_college_admin_or_super_admin(admin_client) -> None:
    client, headers, _ = admin_client
    for role in ["College Admin", "Super Admin"]:
        response = client.post("/v1/users", headers=headers, json={
            "email": f"{role.lower().replace(' ', '-')}@users.edu",
            "full_name": "Escalation Attempt",
            "password": "a-strong-test-password", "roles": [role],
        })
        assert response.status_code == 422


def test_admin_can_assign_faculty_to_course(admin_client) -> None:
    client, headers, _ = admin_client
    faculty = client.post("/v1/users", headers=headers, json={
        "email": "faculty@users.edu", "full_name": "Faculty",
        "password": "a-strong-test-password", "roles": ["Faculty"],
    }).json()
    response = client.post("/v1/staff-assignments", headers=headers, json={
        "user_id": faculty["id"], "scope_type": "course",
        "scope_id": admin_client[2]["course"], "permission": "attendance.write",
    })
    assert response.status_code == 201
    assert response.json()["permission"] == "attendance.write"


def test_admin_can_create_and_verify_parent_student_link(admin_client) -> None:
    client, headers, ids = admin_client
    parent = client.post("/v1/users", headers=headers, json={
        "email": "parent@users.edu", "full_name": "Parent",
        "password": "a-strong-test-password", "roles": ["Parent"],
    }).json()
    link = client.post("/v1/parent-links", headers=headers, json={
        "parent_user_id": parent["id"], "student_profile_id": ids["profile"],
        "relationship_label": "Mother",
    })
    assert link.status_code == 201
    assert link.json()["is_verified"] is False
    verified = client.post(f"/v1/parent-links/{link.json()['id']}/verify", headers=headers)
    assert verified.status_code == 200
    assert verified.json()["is_verified"] is True


def test_admin_cannot_lock_own_account(admin_client) -> None:
    client, headers, ids = admin_client
    response = client.patch(f"/v1/users/{ids['admin']}/status", headers=headers, json={
        "is_active": True, "is_locked": True,
    })
    assert response.status_code == 409
