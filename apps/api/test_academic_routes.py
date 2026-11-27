from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from database import get_db
from main import app
from models import (
    AcademicCourse, AttendanceSession, Base, CourseEnrollment,
    Institution, StaffAssignment, StudentProfile, User, UserRole,
)
from security import create_access_token


@pytest.fixture
def academic_client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "academic-test-secret-key-with-at-least-32-bytes")
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        college = Institution(name="Academic Test College", code="ACAD01")
        other = Institution(name="Other Academic College", code="ACAD02")
        db.add_all([college, other])
        db.flush()

        def add_user(email: str, role: str, institution_id: str | None = None) -> User:
            user = User(
                institution_id=institution_id or college.id,
                email=email,
                full_name=email.split("@")[0].title(),
                password_hash="test-password-hash",
            )
            db.add(user)
            db.flush()
            db.add(UserRole(user_id=user.id, role=role))
            db.flush()
            return user

        admin = add_user("admin@academic.edu", "College Admin")
        faculty = add_user("faculty@academic.edu", "Faculty")
        other_faculty = add_user("other-faculty@academic.edu", "Faculty")
        student1 = add_user("student1@academic.edu", "Student")
        student2 = add_user("student2@academic.edu", "Student")
        profile1 = StudentProfile(
            institution_id=college.id, user_id=student1.id, registration_number="A001",
            department_id="dept-aiml", semester=5, class_id="class-a",
        )
        profile2 = StudentProfile(
            institution_id=college.id, user_id=student2.id, registration_number="A002",
            department_id="dept-aiml", semester=5, class_id="class-a",
        )
        course = AcademicCourse(
            institution_id=college.id, code="AIML501", title="Machine Learning",
            credits=4, department_id="dept-aiml", semester=5, class_id="class-a",
        )
        db.add_all([profile1, profile2, course])
        db.flush()
        db.add_all([
            CourseEnrollment(institution_id=college.id, course_id=course.id, student_profile_id=profile1.id),
            CourseEnrollment(institution_id=college.id, course_id=course.id, student_profile_id=profile2.id),
            StaffAssignment(
                institution_id=college.id, user_id=faculty.id, scope_type="course",
                scope_id=course.id, permission="academics.read",
            ),
            StaffAssignment(
                institution_id=college.id, user_id=faculty.id, scope_type="course",
                scope_id=course.id, permission="attendance.read",
            ),
            StaffAssignment(
                institution_id=college.id, user_id=faculty.id, scope_type="course",
                scope_id=course.id, permission="attendance.write",
            ),
        ])
        db.commit()
        ids = {
            "college": college.id, "admin": admin.id, "faculty": faculty.id,
            "other_faculty": other_faculty.id, "student1": student1.id,
            "student2": student2.id, "profile1": profile1.id, "profile2": profile2.id,
            "course": course.id,
        }

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


def test_student_sees_only_enrolled_courses(academic_client) -> None:
    client, ids, headers = academic_client
    response = client.get("/v1/academics/courses", headers=headers(ids["student1"], "Student"))
    assert response.status_code == 200
    assert [item["id"] for item in response.json()["items"]] == [ids["course"]]


def test_assigned_faculty_can_create_and_mark_attendance(academic_client) -> None:
    client, ids, headers = academic_client
    faculty_headers = headers(ids["faculty"], "Faculty")
    session = client.post("/v1/attendance/sessions", headers=faculty_headers, json={
        "course_id": ids["course"], "session_date": "2026-11-27", "period": 1, "topic": "Model evaluation",
    })
    assert session.status_code == 201
    session_id = session.json()["id"]

    marked = client.post(f"/v1/attendance/sessions/{session_id}/records", headers=faculty_headers, json={
        "records": [
            {"student_profile_id": ids["profile1"], "status": "present"},
            {"student_profile_id": ids["profile2"], "status": "absent"},
        ],
    })
    assert marked.status_code == 200
    assert marked.json()["created"] == 2

    student_headers = headers(ids["student1"], "Student")
    own = client.get("/v1/attendance/me", headers=student_headers)
    assert own.status_code == 200
    assert own.json()["attendance_percentage"] == 100.0
    forbidden = client.get(f"/v1/attendance/students/{ids['profile2']}", headers=student_headers)
    assert forbidden.status_code == 403


def test_unassigned_faculty_cannot_mark_attendance(academic_client) -> None:
    client, ids, headers = academic_client
    response = client.post("/v1/attendance/sessions", headers=headers(ids["other_faculty"], "Faculty"), json={
        "course_id": ids["course"], "session_date": "2026-11-27", "period": 2,
    })
    assert response.status_code == 403


def test_attendance_requires_enrolment_and_locked_sessions_are_immutable(academic_client) -> None:
    client, ids, headers = academic_client
    faculty_headers = headers(ids["faculty"], "Faculty")
    session = client.post("/v1/attendance/sessions", headers=faculty_headers, json={
        "course_id": ids["course"], "session_date": "2026-11-27", "period": 3,
    }).json()
    bad = client.post(f"/v1/attendance/sessions/{session['id']}/records", headers=faculty_headers, json={
        "records": [{"student_profile_id": "not-enrolled", "status": "present"}],
    })
    assert bad.status_code == 422
    locked = client.post(f"/v1/attendance/sessions/{session['id']}/lock", headers=faculty_headers)
    assert locked.status_code == 200
    after_lock = client.post(f"/v1/attendance/sessions/{session['id']}/records", headers=faculty_headers, json={
        "records": [{"student_profile_id": ids["profile1"], "status": "present"}],
    })
    assert after_lock.status_code == 409


def test_admin_can_create_course_but_student_cannot(academic_client) -> None:
    client, ids, headers = academic_client
    payload = {"code": "NEW501", "title": "Data Engineering", "credits": 3, "semester": 5}
    created = client.post("/v1/academics/courses", headers=headers(ids["admin"], "College Admin"), json=payload)
    assert created.status_code == 201
    denied = client.post("/v1/academics/courses", headers=headers(ids["student1"], "Student"), json=payload | {"code": "NEW502"})
    assert denied.status_code == 403



def test_assigned_faculty_can_list_only_enrolled_course_students(academic_client) -> None:
    client, ids, headers = academic_client
    response = client.get(
        f"/v1/academics/courses/{ids['course']}/students",
        headers=headers(ids["faculty"], "Faculty"),
    )
    assert response.status_code == 200
    assert {row["id"] for row in response.json()} == {ids["profile1"], ids["profile2"]}


def test_student_cannot_browse_course_roster(academic_client) -> None:
    client, ids, headers = academic_client
    response = client.get(
        f"/v1/academics/courses/{ids['course']}/students",
        headers=headers(ids["student1"], "Student"),
    )
    assert response.status_code == 403
