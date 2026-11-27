from __future__ import annotations

from datetime import date, time, timedelta, datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from database import get_db
from main import app
from models import AcademicCourse, Base, CourseEnrollment, Institution, ParentStudentLink, StaffAssignment, StudentProfile, User, UserRole
from security import create_access_token


@pytest.fixture
def timetable_client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "timetable-test-secret-key-with-at-least-32-bytes")
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        college = Institution(name="Timetable College", code="TIME01")
        db.add(college)
        db.flush()

        def add_user(email: str, role: str) -> User:
            user = User(institution_id=college.id, email=email, full_name=email.split("@")[0], password_hash="test-hash")
            db.add(user)
            db.flush()
            db.add(UserRole(user_id=user.id, role=role))
            db.flush()
            return user

        admin = add_user("admin@time.edu", "College Admin")
        faculty = add_user("faculty@time.edu", "Faculty")
        student = add_user("student@time.edu", "Student")
        parent = add_user("parent@time.edu", "Parent")
        profile = StudentProfile(
            institution_id=college.id, user_id=student.id, registration_number="T001",
            department_id="dept-ai", semester=5, class_id="class-5a",
        )
        course = AcademicCourse(
            institution_id=college.id, code="T501", title="Timetable Course",
            department_id="dept-ai", semester=5, class_id="class-5a",
        )
        db.add_all([profile, course])
        db.flush()
        db.add(CourseEnrollment(institution_id=college.id, course_id=course.id, student_profile_id=profile.id))
        db.add(ParentStudentLink(
            institution_id=college.id, parent_user_id=parent.id,
            student_profile_id=profile.id, is_verified=True,
        ))
        db.add(StaffAssignment(
            institution_id=college.id, user_id=faculty.id, scope_type="course",
            scope_id=course.id, permission="academics.read",
        ))
        db.commit()
        ids = {"college": college.id, "admin": admin.id, "faculty": faculty.id, "student": student.id, "parent": parent.id, "profile": profile.id, "course": course.id}

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


def test_admin_creates_timetable_and_student_reads_own_class(timetable_client) -> None:
    client, ids, headers = timetable_client
    created = client.post("/v1/timetable", headers=headers(ids["admin"], "College Admin"), json={
        "class_id": "class-5a", "course_id": ids["course"], "faculty_user_id": ids["faculty"],
        "weekday": 0, "start_time": "09:00:00", "end_time": "10:00:00",
        "effective_from": date.today().isoformat(), "room": "Lab 2",
    })
    assert created.status_code == 201
    timetable = client.get("/v1/timetable/me", headers=headers(ids["student"], "Student"))
    assert timetable.status_code == 200
    assert len(timetable.json()) == 1
    assert timetable.json()[0]["course_code"] == "T501"


def test_timetable_rejects_class_and_faculty_time_conflicts(timetable_client) -> None:
    client, ids, headers = timetable_client
    admin_headers = headers(ids["admin"], "College Admin")
    payload = {
        "class_id": "class-5a", "course_id": ids["course"], "faculty_user_id": ids["faculty"],
        "weekday": 1, "start_time": "10:00:00", "end_time": "11:00:00",
        "effective_from": date.today().isoformat(),
    }
    assert client.post("/v1/timetable", headers=admin_headers, json=payload).status_code == 201
    conflict = client.post("/v1/timetable", headers=admin_headers, json=payload | {"start_time": "10:30:00", "end_time": "11:30:00"})
    assert conflict.status_code == 409


def test_calendar_event_is_visible_only_to_targeted_role(timetable_client) -> None:
    client, ids, headers = timetable_client
    admin_headers = headers(ids["admin"], "College Admin")
    event = client.post("/v1/calendar", headers=admin_headers, json={
        "title": "Student seminar", "event_type": "seminar",
        "start_at": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
        "end_at": (datetime.now(timezone.utc) + timedelta(days=2, hours=1)).isoformat(),
        "audience_role": "Student",
    })
    assert event.status_code == 201
    assert len(client.get("/v1/calendar", headers=headers(ids["student"], "Student")).json()) == 1
    assert client.get("/v1/calendar", headers=headers(ids["faculty"], "Faculty")).json() == []


def test_parent_can_read_only_verified_linked_student_timetables(timetable_client) -> None:
    client, ids, headers = timetable_client
    admin_headers = headers(ids["admin"], "College Admin")
    created = client.post("/v1/timetable", headers=admin_headers, json={
        "class_id": "class-5a", "course_id": ids["course"], "faculty_user_id": ids["faculty"],
        "weekday": 2, "start_time": "11:00:00", "end_time": "12:00:00",
        "effective_from": date.today().isoformat(),
    })
    assert created.status_code == 201
    linked = client.get("/v1/timetable/linked", headers=headers(ids["parent"], "Parent"))
    assert linked.status_code == 200
    assert len(linked.json()) == 1
    assert linked.json()[0]["student_profile_id"] == ids["profile"]
    assert len(linked.json()[0]["slots"]) == 1
    assert client.get("/v1/timetable/linked", headers=headers(ids["student"], "Student")).status_code == 403
