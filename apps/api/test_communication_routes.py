from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from database import get_db
from main import app
from models import Base, Institution, ParentStudentLink, StudentProfile, User, UserRole
from security import create_access_token


@pytest.fixture
def communication_client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "communication-test-secret-key-with-at-least-32-bytes")
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        college = Institution(name="Communication College", code="COMM01")
        db.add(college)
        db.flush()

        def add_user(email: str, role: str) -> User:
            user = User(institution_id=college.id, email=email, full_name=email.split("@")[0], password_hash="test-hash")
            db.add(user)
            db.flush()
            db.add(UserRole(user_id=user.id, role=role))
            db.flush()
            return user

        admin = add_user("admin@comm.edu", "College Admin")
        student = add_user("student@comm.edu", "Student")
        support = add_user("support@comm.edu", "Support Staff")
        profile = StudentProfile(institution_id=college.id, user_id=student.id, registration_number="C001")
        db.add(profile)
        db.commit()
        ids = {"college": college.id, "admin": admin.id, "student": student.id, "support": support.id, "profile": profile.id}

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


def test_announcement_visibility_and_read_receipt(communication_client) -> None:
    client, ids, headers = communication_client
    created = client.post("/v1/announcements", headers=headers(ids["admin"], "College Admin"), json={
        "title": "Semester update", "body": "The academic calendar has been updated.",
        "category": "academic", "audience_role": "Student",
    })
    assert created.status_code == 201
    student_headers = headers(ids["student"], "Student")
    visible = client.get("/v1/announcements", headers=student_headers)
    assert len(visible.json()) == 1
    read = client.post(f"/v1/announcements/{created.json()['id']}/read", headers=student_headers)
    assert read.status_code == 200
    assert read.json()["is_read"] is True


def test_student_can_create_ticket_and_support_staff_can_resolve(communication_client) -> None:
    client, ids, headers = communication_client
    student_headers = headers(ids["student"], "Student")
    ticket = client.post("/v1/support/tickets", headers=student_headers, json={
        "student_profile_id": ids["profile"], "category": "Academic",
        "subject": "Timetable conflict", "description": "Two classes are scheduled at the same time.",
    })
    assert ticket.status_code == 201
    ticket_id = ticket.json()["id"]
    message = client.post(f"/v1/support/tickets/{ticket_id}/messages", headers=student_headers, json={
        "body": "Please review the timetable for my section.",
    })
    assert message.status_code == 201
    resolved = client.patch(f"/v1/support/tickets/{ticket_id}", headers=headers(ids["support"], "Support Staff"), json={
        "status": "resolved", "resolution": "The timetable conflict has been corrected.",
    })
    assert resolved.status_code == 200
    assert resolved.json()["status"] == "resolved"


def test_student_cannot_manage_support_ticket_status(communication_client) -> None:
    client, ids, headers = communication_client
    student_headers = headers(ids["student"], "Student")
    ticket = client.post("/v1/support/tickets", headers=student_headers, json={
        "student_profile_id": ids["profile"], "category": "Facilities",
        "subject": "Broken light", "description": "The light in the lab is not working.",
    }).json()
    denied = client.patch(f"/v1/support/tickets/{ticket['id']}", headers=student_headers, json={"status": "closed"})
    assert denied.status_code == 403
