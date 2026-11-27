"""One-time, fail-closed creation of the first institution administrator."""
from __future__ import annotations

import os
import sys

from sqlalchemy import select

from database import get_session_factory
from models import Institution, User, UserRole
from security import hash_password


def required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is required")
    return value


def main() -> int:
    if os.getenv("BOOTSTRAP_CONFIRM") != "YES":
        raise RuntimeError("Set BOOTSTRAP_CONFIRM=YES to explicitly authorize one-time admin creation")
    institution_name = required("BOOTSTRAP_INSTITUTION_NAME")
    institution_code = required("BOOTSTRAP_INSTITUTION_CODE").upper()
    admin_name = required("BOOTSTRAP_ADMIN_NAME")
    admin_email = required("BOOTSTRAP_ADMIN_EMAIL").lower()
    admin_password = required("BOOTSTRAP_ADMIN_PASSWORD")
    password_hash = hash_password(admin_password)

    session = get_session_factory()()
    try:
        institution = session.scalar(select(Institution).where(Institution.code == institution_code))
        if institution is None:
            institution = Institution(name=institution_name, code=institution_code)
            session.add(institution)
            session.flush()
        existing = session.scalar(select(User.id).where(User.institution_id == institution.id).limit(1))
        if existing is not None:
            raise RuntimeError("This institution already has users; bootstrap is refused")
        admin = User(institution_id=institution.id, email=admin_email, full_name=admin_name, password_hash=password_hash)
        session.add(admin)
        session.flush()
        session.add(UserRole(user_id=admin.id, role="College Admin"))
        session.commit()
        print(f"Created the first administrator for institution {institution_code}. Remove bootstrap secrets from the environment.")
        return 0
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Bootstrap failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
