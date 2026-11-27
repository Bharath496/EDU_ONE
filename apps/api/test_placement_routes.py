from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from database import get_db
from main import app
from models import Base, Institution, StudentProfile, User, UserRole
from security import create_access_token


@pytest.fixture
def placement_client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "placement-test-secret-key-with-at-least-32-bytes")
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        college = Institution(name="Placement College", code="PLACE01")
        db.add(college)
        db.flush()

        def add_user(email: str, role: str) -> User:
            user = User(institution_id=college.id, email=email, full_name=email.split("@")[0], password_hash="test-hash")
            db.add(user)
            db.flush()
            db.add(UserRole(user_id=user.id, role=role))
            db.flush()
            return user

        officer = add_user("placement@college.edu", "Placement Officer")
        student = add_user("student@college.edu", "Student")
        profile = StudentProfile(institution_id=college.id, user_id=student.id, registration_number="P001")
        db.add(profile)
        db.commit()
        ids = {"college": college.id, "officer": officer.id, "student": student.id, "profile": profile.id}

    def override_get_db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, base_url="https://testserver") as client:
        def headers(user_id: str, role: str):
            token = create_access_token(user_id=user_id, institution_id=ids["college"], roles=[role])
            return {"Authorization": f"Bearer {token}"}
        yield client, ids, headers
    app.dependency_overrides.clear()
    engine.dispose()


def test_student_applies_and_placement_officer_updates_status(placement_client) -> None:
    client, ids, headers = placement_client
    officer_headers = headers(ids["officer"], "Placement Officer")
    created = client.post("/v1/placements/opportunities", headers=officer_headers, json={
        "company": "Example Systems", "title": "Data Analyst Intern",
        "description": "Work with the analytics team.",
        "employment_type": "internship",
        "application_deadline": (datetime.now(timezone.utc) + timedelta(days=10)).isoformat(),
    })
    assert created.status_code == 201
    opportunity_id = created.json()["id"]

    student_headers = headers(ids["student"], "Student")
    applied = client.post(f"/v1/placements/opportunities/{opportunity_id}/apply", headers=student_headers, json={
        "application_note": "Interested in data analytics and reporting.",
    })
    assert applied.status_code == 201
    duplicate = client.post(f"/v1/placements/opportunities/{opportunity_id}/apply", headers=student_headers, json={})
    assert duplicate.status_code == 409

    updated = client.patch(f"/v1/placements/applications/{applied.json()['id']}/status", headers=officer_headers, json={"status": "shortlisted"})
    assert updated.status_code == 200
    assert updated.json()["status"] == "shortlisted"
    own = client.get("/v1/placements/applications/me", headers=student_headers)
    assert own.json()[0]["status"] == "shortlisted"


def test_student_cannot_create_placement_opportunity(placement_client) -> None:
    client, ids, headers = placement_client
    response = client.post("/v1/placements/opportunities", headers=headers(ids["student"], "Student"), json={
        "company": "Not allowed", "title": "Role", "description": "No",
        "employment_type": "full_time",
        "application_deadline": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
    })
    assert response.status_code == 403
