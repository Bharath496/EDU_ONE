"""Create initial tenant-aware identity, student-link and audit tables.

This first migration uses the checked-in SQLAlchemy metadata as its source of
truth. Once a database has been initialized, subsequent migrations should use
explicit Alembic operations and must never rewrite this revision.
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
