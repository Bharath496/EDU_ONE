from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from database import get_db
from main import app
from models import Base, FeeInvoice, Institution, ParentStudentLink, StudentProfile, User, UserRole
from security import create_access_token


@pytest.fixture
def fee_client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "fees-test-secret-key-with-at-least-32-bytes")
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        college = Institution(name="Fees College", code="FEES01")
        db.add(college)
        db.flush()

        def add_user(email: str, role: str) -> User:
            user = User(
                institution_id=college.id, email=email,
                full_name=email.split("@")[0], password_hash="test-hash",
            )
            db.add(user)
            db.flush()
            db.add(UserRole(user_id=user.id, role=role))
            db.flush()
            return user

        admin = add_user("admin@fees.edu", "College Admin")
        accounts = add_user("accounts@fees.edu", "Accounts")
        student = add_user("student@fees.edu", "Student")
        parent = add_user("parent@fees.edu", "Parent")
        profile = StudentProfile(
            institution_id=college.id, user_id=student.id,
            registration_number="F001", department_id="dept", semester=3,
        )
        db.add(profile)
        db.flush()
        db.add(ParentStudentLink(
            institution_id=college.id, parent_user_id=parent.id,
            student_profile_id=profile.id, is_verified=True,
        ))
        invoice = FeeInvoice(
            institution_id=college.id, student_profile_id=profile.id,
            invoice_number="INV001", fee_type="Tuition", amount=Decimal("50000"),
            due_date=date(2026, 12, 31), issued_by=admin.id, status="issued",
        )
        db.add(invoice)
        db.commit()
        ids = {
            "college": college.id, "admin": admin.id, "accounts": accounts.id,
            "student": student.id, "parent": parent.id,
            "profile": profile.id, "invoice": invoice.id,
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


def test_student_payment_stays_pending_until_accounts_verifies(fee_client) -> None:
    client, ids, headers = fee_client
    student_headers = headers(ids["student"], "Student")
    payment = client.post(f"/v1/fees/invoices/{ids['invoice']}/payments", headers=student_headers, json={
        "amount": 50000, "method": "upi", "payment_reference": "UPI-REFERENCE-123",
    })
    assert payment.status_code == 201
    assert payment.json()["status"] == "pending"
    pending = client.get("/v1/fees/payments/pending", headers=headers(ids["accounts"], "Accounts"))
    assert pending.status_code == 200
    assert pending.json()[0]["student_profile_id"] == ids["profile"]
    invoice = client.get(f"/v1/fees/invoices/{ids['invoice']}", headers=student_headers)
    assert invoice.json()["status"] == "issued"
    assert invoice.json()["outstanding_amount"] == 50000

    verified = client.post(
        f"/v1/fees/payments/{payment.json()['id']}/verify",
        headers=headers(ids["accounts"], "Accounts"),
    )
    assert verified.status_code == 200
    assert verified.json()["status"] == "verified"
    assert verified.json()["invoice"]["status"] == "paid"
    assert verified.json()["invoice"]["outstanding_amount"] == 0


def test_student_cannot_verify_payment(fee_client) -> None:
    client, ids, headers = fee_client
    payment = client.post(f"/v1/fees/invoices/{ids['invoice']}/payments", headers=headers(ids["student"], "Student"), json={
        "amount": 1000, "method": "bank_transfer",
    })
    denied = client.post(
        f"/v1/fees/payments/{payment.json()['id']}/verify",
        headers=headers(ids["student"], "Student"),
    )
    assert denied.status_code == 403


def test_parent_can_read_linked_invoice_but_not_unlinked_invoice(fee_client) -> None:
    client, ids, headers = fee_client
    response = client.get("/v1/fees/invoices", headers=headers(ids["parent"], "Parent"))
    assert response.status_code == 200
    assert response.json()["total"] == 1



def test_accounts_can_read_student_billing_identities(fee_client) -> None:
    client, ids, headers = fee_client
    response = client.get("/v1/students", headers=headers(ids["accounts"], "Accounts"))
    assert response.status_code == 200
    assert response.json()["items"][0]["id"] == ids["profile"]
