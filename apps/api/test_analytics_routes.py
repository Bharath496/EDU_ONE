from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from database import get_db
from main import app
from models import (
    AcademicCourse, AttendanceRecord, AttendanceSession, Base, Exam, ExamResult,
    Institution, StudentProfile, User, UserRole,
)
from security import create_access_token


@pytest.fixture
def analytics_client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "analytics-test-secret-key-with-at-least-32-bytes")
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        college = Institution(name="Analytics College", code="ANALYTICS01")
        db.add(college)
        db.flush()

        def add_user(email: str, role: str, department_id: str | None = None) -> User:
            user = User(
                institution_id=college.id, email=email,
                full_name=email.split("@")[0], password_hash="test-hash",
            )
            db.add(user)
            db.flush()
            db.add(UserRole(user_id=user.id, role=role, department_id=department_id))
            db.flush()
            return user

        admin = add_user("admin@analytics.edu", "College Admin")
        hod = add_user("hod@analytics.edu", "HOD", "dept-a")
        student_a = add_user("student-a@analytics.edu", "Student")
        student_b = add_user("student-b@analytics.edu", "Student")
        profile_a = StudentProfile(
            institution_id=college.id, user_id=student_a.id,
            registration_number="A001", department_id="dept-a",
            semester=5, class_id="class-a",
        )
        profile_b = StudentProfile(
            institution_id=college.id, user_id=student_b.id,
            registration_number="B001", department_id="dept-b",
            semester=5, class_id="class-b",
        )
        course = AcademicCourse(
            institution_id=college.id, code="AIML501", title="Machine Learning",
            department_id="dept-a", semester=5, class_id="class-a",
        )
        db.add_all([profile_a, profile_b, course])
        db.flush()
        today = date.today()
        session_one = AttendanceSession(
            institution_id=college.id, course_id=course.id,
            session_date=today - timedelta(days=2), period=1,
            status="locked", marked_by=admin.id,
        )
        session_two = AttendanceSession(
            institution_id=college.id, course_id=course.id,
            session_date=today - timedelta(days=1), period=1,
            status="locked", marked_by=admin.id,
        )
        db.add_all([session_one, session_two])
        db.flush()
        db.add_all([
            AttendanceRecord(
                institution_id=college.id, session_id=session_one.id,
                student_profile_id=profile_a.id, status="present", marked_by=admin.id,
            ),
            AttendanceRecord(
                institution_id=college.id, session_id=session_two.id,
                student_profile_id=profile_a.id, status="absent", marked_by=admin.id,
            ),
        ])
        exam = Exam(
            institution_id=college.id, course_id=course.id,
            code="IA01", title="Internal Assessment", exam_type="internal",
            start_at=datetime.now(timezone.utc) - timedelta(days=3),
            end_at=datetime.now(timezone.utc) - timedelta(days=3) + timedelta(hours=1),
            max_marks=100, status="published", created_by=admin.id,
        )
        db.add(exam)
        db.flush()
        db.add(ExamResult(
            institution_id=college.id, exam_id=exam.id,
            student_profile_id=profile_a.id, marks_obtained=80,
            is_published=True, entered_by=admin.id,
            published_at=datetime.now(timezone.utc),
        ))
        db.commit()
        ids = {
            "college": college.id, "admin": admin.id, "hod": hod.id,
            "student": student_a.id, "profile_a": profile_a.id, "profile_b": profile_b.id,
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


def test_admin_student_risk_report_handles_missing_data_without_zero_filling(analytics_client) -> None:
    client, ids, headers = analytics_client
    response = client.get("/v1/analytics/student-risk", headers=headers(ids["admin"], "College Admin"))
    assert response.status_code == 200
    report = {row["student_profile_id"]: row for row in response.json()["items"]}
    observed = report[ids["profile_a"]]
    missing = report[ids["profile_b"]]
    assert observed["attendance_percentage"] == 50.0
    assert observed["average_marks_percentage"] == 80.0
    assert observed["risk_level"] == "medium"
    assert observed["review_required"] is True
    assert missing["attendance_percentage"] is None
    assert missing["average_marks_percentage"] is None
    assert missing["risk_level"] == "insufficient_data"
    assert response.json()["summary"]["insufficient_data"] == 1
    assert "not a diagnosis" in response.json()["disclaimer"]


def test_hod_analytics_are_department_scoped(analytics_client) -> None:
    client, ids, headers = analytics_client
    response = client.get("/v1/analytics/student-risk", headers=headers(ids["hod"], "HOD"))
    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["student_profile_id"] == ids["profile_a"]


def test_student_cannot_read_student_risk_report(analytics_client) -> None:
    client, ids, headers = analytics_client
    response = client.get("/v1/analytics/student-risk", headers=headers(ids["student"], "Student"))
    assert response.status_code == 403
