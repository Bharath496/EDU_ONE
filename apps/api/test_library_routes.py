from __future__ import annotations

from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from database import get_db
from main import app
from models import Base, Institution, LibraryBook, StudentProfile, User, UserRole
from security import create_access_token


@pytest.fixture
def library_client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "library-test-secret-key-with-at-least-32-bytes")
    monkeypatch.setenv("LIBRARY_FINE_PER_DAY", "2.00")
    engine = create_engine("sqlite+pysqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        college = Institution(name="Library College", code="LIB001")
        db.add(college)
        db.flush()

        def add_user(email: str, role: str) -> User:
            user = User(institution_id=college.id, email=email, full_name=email.split("@")[0], password_hash="test-hash")
            db.add(user)
            db.flush()
            db.add(UserRole(user_id=user.id, role=role))
            db.flush()
            return user

        admin = add_user("admin@library.edu", "College Admin")
        librarian = add_user("librarian@library.edu", "Librarian")
        student = add_user("student@library.edu", "Student")
        profile = StudentProfile(institution_id=college.id, user_id=student.id, registration_number="L001")
        book = LibraryBook(
            institution_id=college.id, isbn="9780000000001", title="Python Basics",
            author="A. Writer", total_copies=1, available_copies=1,
        )
        db.add_all([profile, book])
        db.commit()
        ids = {"college": college.id, "admin": admin.id, "librarian": librarian.id, "student": student.id, "profile": profile.id, "book": book.id}

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


def test_librarian_can_issue_and_return_book(library_client) -> None:
    client, ids, headers = library_client
    librarian_headers = headers(ids["librarian"], "Librarian")
    issued = client.post("/v1/library/loans", headers=librarian_headers, json={
        "book_id": ids["book"], "student_profile_id": ids["profile"],
        "due_date": (date.today() + timedelta(days=7)).isoformat(),
    })
    assert issued.status_code == 201
    assert issued.json()["status"] == "issued"
    student_loans = client.get("/v1/library/loans/me", headers=headers(ids["student"], "Student"))
    assert student_loans.status_code == 200
    assert len(student_loans.json()) == 1

    returned = client.post(f"/v1/library/loans/{issued.json()['id']}/return", headers=librarian_headers)
    assert returned.status_code == 200
    assert returned.json()["status"] == "returned"


def test_student_cannot_issue_or_return_books(library_client) -> None:
    client, ids, headers = library_client
    response = client.post("/v1/library/loans", headers=headers(ids["student"], "Student"), json={
        "book_id": ids["book"], "student_profile_id": ids["profile"],
        "due_date": (date.today() + timedelta(days=7)).isoformat(),
    })
    assert response.status_code == 403


def test_librarian_can_add_book_but_student_cannot(library_client) -> None:
    client, ids, headers = library_client
    payload = {"isbn": "9780000000002", "title": "Data Science", "author": "B. Writer", "total_copies": 2}
    created = client.post("/v1/library/books", headers=headers(ids["librarian"], "Librarian"), json=payload)
    assert created.status_code == 201
    denied = client.post("/v1/library/books", headers=headers(ids["student"], "Student"), json=payload | {"isbn": "9780000000003"})
    assert denied.status_code == 403
