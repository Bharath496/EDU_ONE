"""Add class-level scope to student profiles."""
from alembic import op
import sqlalchemy as sa

revision = "0002_student_class_scope"
down_revision = "0001_initial_identity_audit"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("student_profiles", sa.Column("class_id", sa.String(length=36), nullable=True))
    op.create_index("ix_student_profiles_class", "student_profiles", ["institution_id", "class_id"])


def downgrade() -> None:
    op.drop_index("ix_student_profiles_class", table_name="student_profiles")
    op.drop_column("student_profiles", "class_id")
