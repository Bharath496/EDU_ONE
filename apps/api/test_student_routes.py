from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from database import get_db
from main import app
from models import AcademicCourse, Base, CourseEnrollment, Institution, ParentStudentLink, StaffAssignment, StudentProfile, User, UserRole
from security import create_access_token, hash_password


@pytest.fixture
def student_client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "student-test-secret-key-with-at-least-32-bytes")
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        college = Institution(name="Student Test College", code="STUD01")
        other_college = Institution(name="Other College", code="OTHER01")
        db.add_all([college, other_college])
        db.flush()

        def add_user(email: str, role: str, institution_id: str | None = None) -> User:
            user = User(
                institution_id=institution_id or college.id,
                email=email,
                full_name=email.split("@")[0].title(),
                password_hash=hash_password("a-long-test-password"),
            )
            db.add(user)
            db.flush()
            db.add(UserRole(
                user_id=user.id,
                role=role,
                department_id="dept-aiml" if role == "HOD" else None,
            ))
            db.flush()
            return user

        admin = add_user("admin@college.edu", "College Admin")
        student1 = add_user("one@college.edu", "Student")
        student2 = add_user("two@college.edu", "Student")
        student3 = add_user("three@college.edu", "Student")
        parent = add_user("parent@college.edu", "Parent")
        hod = add_user("hod@college.edu", "HOD")
        faculty = add_user("faculty@college.edu", "Faculty")
        outsider = add_user("outsider@other.edu", "Student", other_college.id)

        profile1 = StudentProfile(
            institution_id=college.id, user_id=student1.id,
            registration_number="REG001", department_id="dept-aiml",
            programme="BSc AIML", semester=5, class_id="class-5a",
        )
        profile2 = StudentProfile(
            institution_id=college.id, user_id=student2.id,
            registration_number="REG002", department_id="dept-cse",
            programme="BSc CSE", semester=5, class_id="class-5b",
        )
        other_profile = StudentProfile(
            institution_id=other_college.id, user_id=outsider.id,
            registration_number="OTHER001", department_id="dept-other",
        )
        db.add_all([profile1, profile2, other_profile])
        db.flush()
        course1 = AcademicCourse(
            institution_id=college.id, code="AIML101", title="AIML Foundations",
            credits=3, department_id="dept-aiml", semester=5, class_id="class-5a",
        )
        course2 = AcademicCourse(
            institution_id=college.id, code="CSE101", title="Computer Science",
            credits=3, department_id="dept-cse", semester=5, class_id="class-5b",
        )
        db.add_all([course1, course2])
        db.flush()
        db.add_all([
            CourseEnrollment(institution_id=college.id, course_id=course1.id, student_profile_id=profile1.id),
            CourseEnrollment(institution_id=college.id, course_id=course2.id, student_profile_id=profile2.id),
            StaffAssignment(
                institution_id=college.id, user_id=faculty.id,
                scope_type="course", scope_id=course1.id, permission="students.read",
            ),
        ])
        db.add(ParentStudentLink(
            institution_id=college.id, parent_user_id=parent.id,
            student_profile_id=profile1.id, is_verified=True,
        ))
        db.commit()
        ids = {
            "college": college.id, "admin": admin.id, "student1": student1.id,
            "student2": student2.id, "student3": student3.id, "parent": parent.id,
            "hod": hod.id, "faculty": faculty.id, "course1": course1.id,
            "profile1": profile1.id, "profile2": profile2.id,
            "other_profile": other_profile.id,
        }

    def override_get_db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, base_url="https://testserver") as client:
        def auth_headers(user_id: str, role: str, tenant_id: str | None = None):
            token = create_access_token(
                user_id=user_id,
                institution_id=tenant_id or ids["college"],
                roles=[role],
            )
            return {"Authorization": f"Bearer {token}"}
        yield client, ids, auth_headers
    app.dependency_overrides.clear()
    engine.dispose()


def test_student_can_read_only_own_profile(student_client) -> None:
    client, ids, headers = student_client
    response = client.get("/v1/students/me", headers=headers(ids["student1"], "Student"))
    assert response.status_code == 200
    assert response.json()["id"] == ids["profile1"]
    assert client.get("/v1/students", headers=headers(ids["student1"], "Student")).json()["total"] == 1
    forbidden = client.get(f"/v1/students/{ids['profile2']}", headers=headers(ids["student1"], "Student"))
    assert forbidden.status_code == 403


def test_parent_can_read_only_verified_linked_student(student_client) -> None:
    client, ids, headers = student_client
    allowed = client.get(f"/v1/students/{ids['profile1']}", headers=headers(ids["parent"], "Parent"))
    denied = client.get(f"/v1/students/{ids['profile2']}", headers=headers(ids["parent"], "Parent"))
    assert allowed.status_code == 200
    assert denied.status_code == 403


def test_hod_list_is_limited_to_assigned_department(student_client) -> None:
    client, ids, headers = student_client
    response = client.get("/v1/students", headers=headers(ids["hod"], "HOD"))
    assert response.status_code == 200
    assert [row["id"] for row in response.json()["items"]] == [ids["profile1"]]


def test_admin_can_create_update_and_deactivate_student_profile(student_client) -> None:
    client, ids, headers = student_client
    admin_headers = headers(ids["admin"], "College Admin")
    created = client.post("/v1/students", headers=admin_headers, json={
        "user_id": ids["student3"],
        "registration_number": " reg003 ",
        "department_id": "dept-aiml",
        "programme": "BSc AIML",
        "semester": 1,
        "class_id": "class-1a",
    })
    assert created.status_code == 201
    profile_id = created.json()["id"]
    assert created.json()["registration_number"] == "REG003"

    updated = client.patch(f"/v1/students/{profile_id}", headers=admin_headers, json={"semester": 2})
    assert updated.status_code == 200
    assert updated.json()["semester"] == 2

    deactivated = client.delete(f"/v1/students/{profile_id}", headers=admin_headers)
    assert deactivated.status_code == 200
    assert deactivated.json()["success"] is True
    assert client.get(f"/v1/students/{profile_id}", headers=admin_headers).status_code == 404


def test_institution_admin_cannot_read_other_tenant_student(student_client) -> None:
    client, ids, headers = student_client
    response = client.get(
        f"/v1/students/{ids['other_profile']}",
        headers=headers(ids["admin"], "College Admin"),
    )
    assert response.status_code == 404


def test_student_cannot_create_or_modify_profiles(student_client) -> None:
    client, ids, headers = student_client
    response = client.post("/v1/students", headers=headers(ids["student1"], "Student"), json={
        "user_id": ids["student3"],
        "registration_number": "REG003",
    })
    assert response.status_code == 403


def test_faculty_student_roster_is_limited_to_assigned_courses(student_client) -> None:
    client, ids, headers = student_client
    faculty_headers = headers(ids["faculty"], "Faculty")
    roster = client.get("/v1/students", headers=faculty_headers)
    assert roster.status_code == 200
    assert [row["id"] for row in roster.json()["items"]] == [ids["profile1"]]
    allowed = client.get(f"/v1/students/{ids['profile1']}", headers=faculty_headers)
    denied = client.get(f"/v1/students/{ids['profile2']}", headers=faculty_headers)
    assert allowed.status_code == 200
    assert denied.status_code == 403
