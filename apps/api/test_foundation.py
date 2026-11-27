from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from models import AuthSession, Base, Institution, StudentProfile, User, UserRole
from security import create_access_token, create_refresh_token, decode_access_token, hash_password, hash_refresh_token, verify_password


def test_password_hash_is_salted_and_verifiable() -> None:
    first = hash_password("a-long-demo-password")
    second = hash_password("a-long-demo-password")
    assert first != second
    assert verify_password("a-long-demo-password", first)
    assert not verify_password("wrong-password", first)


def test_access_token_contains_tenant_and_role_claims(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("JWT_SECRET_KEY", "test-only-secret-key-with-at-least-32-bytes")
    token = create_access_token(user_id="user-1", institution_id="college-1", roles=["Faculty"])
    claims = decode_access_token(token)
    assert claims["sub"] == "user-1"
    assert claims["tenant_id"] == "college-1"
    assert claims["roles"] == ["Faculty"]


def test_access_token_rejects_wrong_signing_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("JWT_SECRET_KEY", "test-only-secret-key-with-at-least-32-bytes")
    token = create_access_token(user_id="user-1", institution_id="college-1", roles=["Student"])
    monkeypatch.setenv("JWT_SECRET_KEY", "different-test-secret-key-with-at-least-32-bytes")
    with pytest.raises(ValueError, match="Invalid or expired"):
        decode_access_token(token)


def test_refresh_tokens_are_random_and_stored_as_hashes() -> None:
    token = create_refresh_token()
    assert len(token) > 40
    assert hash_refresh_token(token) != token
    assert hash_refresh_token(token) == hash_refresh_token(token)


def test_tenant_aware_identity_schema_and_foreign_keys() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        college = Institution(name="Example College", code="EXAMPLE")
        session.add(college)
        session.flush()
        user = User(
            institution_id=college.id, email="faculty@example.edu",
            full_name="Example Faculty", password_hash=hash_password("a-long-demo-password"),
        )
        session.add(user)
        session.flush()
        session.add(UserRole(user_id=user.id, role="Faculty", department_id="dept-1"))
        session.add(StudentProfile(
            institution_id=college.id, user_id=user.id, registration_number="REG001",
            department_id="dept-1", programme="BSc AIML", semester=5,
        ))
        session.commit()
        assert session.scalar(select(User).where(User.email == "faculty@example.edu")) is not None
        assert session.scalar(select(UserRole).where(UserRole.user_id == user.id)) is not None
        assert session.scalar(select(StudentProfile).where(StudentProfile.registration_number == "REG001")) is not None
    engine.dispose()


def test_refresh_session_model_supports_expiry_and_revocation() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        college = Institution(name="Session College", code="SESSION")
        session.add(college)
        session.flush()
        user = User(institution_id=college.id, email="a@example.edu", full_name="A User", password_hash="hash")
        session.add(user)
        session.flush()
        record = AuthSession(
            user_id=user.id, token_hash=hash_refresh_token("opaque-refresh-token"),
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        )
        session.add(record)
        session.commit()
        assert record.revoked_at is None
        record.revoked_at = datetime.now(timezone.utc)
        session.commit()
        assert record.revoked_at is not None
    engine.dispose()
