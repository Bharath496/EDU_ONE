from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from database import get_db
from main import app
from models import (
    AcademicCourse, Assignment, Base, CourseEnrollment, Institution,
    StaffAssignment, StudentProfile, User, UserRole,
)
from security import create_access_token


@pytest.fixture
def assessment_client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "assessment-test-secret-key-with-at-least-32-bytes")
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        college = Institution(name="Assessment College", code="ASSESS01")
        db.add(college)
        db.flush()

        def user(email: str, role: str) -> User:
            item = User(
                institution_id=college.id, email=email, full_name=email.split("@")[0],
                password_hash="test-hash",
            )
            db.add(item)
            db.flush()
            db.add(UserRole(user_id=item.id, role=role))
            db.flush()
            return item

        admin = user("admin@assess.edu", "College Admin")
        faculty = user("faculty@assess.edu", "Faculty")
        exam_cell = user("exam-cell@assess.edu", "Exam Cell")
        student = user("student@assess.edu", "Student")
        profile = StudentProfile(
            institution_id=college.id, user_id=student.id, registration_number="S001",
            department_id="dept-ai", semester=5, class_id="class-5",
        )
        course = AcademicCourse(
            institution_id=college.id, code="AI501", title="AI Fundamentals",
            credits=4, department_id="dept-ai", semester=5, class_id="class-5",
        )
        db.add_all([profile, course])
        db.flush()
        db.add(CourseEnrollment(
            institution_id=college.id, course_id=course.id, student_profile_id=profile.id,
        ))
        db.add_all([
            StaffAssignment(
                institution_id=college.id, user_id=faculty.id, scope_type="course",
                scope_id=course.id, permission="academics.read",
            ),
            StaffAssignment(
                institution_id=college.id, user_id=faculty.id, scope_type="course",
                scope_id=course.id, permission="marks.write",
            ),
            StaffAssignment(
                institution_id=college.id, user_id=faculty.id, scope_type="course",
                scope_id=course.id, permission="assignments.manage",
            ),
        ])
        db.commit()
        ids = {"college": college.id, "admin": admin.id, "faculty": faculty.id, "exam_cell": exam_cell.id, "student": student.id, "profile": profile.id, "course": course.id}

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


def test_exam_marks_are_hidden_until_exam_cell_publishes_results(assessment_client) -> None:
    client, ids, headers = assessment_client
    admin_headers = headers(ids["admin"], "College Admin")
    exam = client.post("/v1/exams", headers=admin_headers, json={
        "course_id": ids["course"], "code": "INT1", "title": "Internal 1",
        "exam_type": "internal",
        "start_at": "2026-12-01T09:00:00+05:30",
        "end_at": "2026-12-01T10:00:00+05:30",
        "max_marks": 50,
    })
    assert exam.status_code == 201
    exam_id = exam.json()["id"]
    assert client.post(f"/v1/exams/{exam_id}/publish", headers=admin_headers).status_code == 200

    faculty_headers = headers(ids["faculty"], "Faculty")
    entered = client.post(f"/v1/exams/{exam_id}/results", headers=faculty_headers, json={
        "results": [{"student_profile_id": ids["profile"], "marks_obtained": 42, "grade": "A"}],
    })
    assert entered.status_code == 200
    staff_results = client.get(f"/v1/exams/{exam_id}/results", headers=faculty_headers)
    assert staff_results.status_code == 200
    assert staff_results.json()[0]["marks_obtained"] == 42.0

    student_headers = headers(ids["student"], "Student")
    assert client.get("/v1/results/me", headers=student_headers).json() == []
    exam_cell_headers = headers(ids["exam_cell"], "Exam Cell")
    published = client.post(f"/v1/exams/{exam_id}/publish-results", headers=exam_cell_headers)
    assert published.status_code == 200
    results = client.get("/v1/results/me", headers=student_headers)
    assert results.status_code == 200
    assert results.json()[0]["marks_obtained"] == 42.0


def test_student_can_submit_assignment_and_faculty_can_grade(assessment_client) -> None:
    client, ids, headers = assessment_client
    faculty_headers = headers(ids["faculty"], "Faculty")
    assignment = client.post("/v1/assignments", headers=faculty_headers, json={
        "course_id": ids["course"], "title": "Mini Project",
        "description": "Build a small supervised learning workflow.",
        "due_at": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
        "max_marks": 20,
    })
    assert assignment.status_code == 201
    assignment_id = assignment.json()["id"]

    student_headers = headers(ids["student"], "Student")
    submission = client.post(f"/v1/assignments/{assignment_id}/submissions", headers=student_headers, json={
        "content": "Implemented the workflow and evaluated the model.",
    })
    assert submission.status_code == 201
    submission_id = submission.json()["id"]
    staff_submissions = client.get(f"/v1/assignments/{assignment_id}/submissions", headers=faculty_headers)
    assert staff_submissions.status_code == 200
    assert staff_submissions.json()[0]["student_profile_id"] == ids["profile"]

    graded = client.post(f"/v1/assignments/submissions/{submission_id}/grade", headers=faculty_headers, json={
        "marks_obtained": 18, "feedback": "Good evaluation and explanation.",
    })
    assert graded.status_code == 200
    own = client.get(f"/v1/assignments/{assignment_id}/my-submission", headers=student_headers)
    assert own.status_code == 200
    assert own.json()["marks_obtained"] == 18.0


def test_student_cannot_create_exams_or_grade_assignments(assessment_client) -> None:
    client, ids, headers = assessment_client
    student_headers = headers(ids["student"], "Student")
    exam = client.post("/v1/exams", headers=student_headers, json={
        "course_id": ids["course"], "code": "BAD", "title": "Unauthorized",
        "exam_type": "quiz",
        "start_at": "2026-12-01T09:00:00+05:30",
        "end_at": "2026-12-01T10:00:00+05:30",
        "max_marks": 10,
    })
    assert exam.status_code == 403
