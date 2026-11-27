"""Create initial tenant-aware identity, student-link, class-scope and audit tables.

This first migration captures the initial schema, including student class scope.
Subsequent migrations must use explicit Alembic operations and must never rewrite
this revision after it has been applied to a persistent database.
"""
from __future__ import annotations

from alembic import op

from models import Base
import models  # noqa: F401 - register all model metadata

revision = "0001_initial_identity_audit"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind())
