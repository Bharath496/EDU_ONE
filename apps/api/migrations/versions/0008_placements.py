"""Add placement opportunities and student applications."""
from alembic import op
import sqlalchemy as sa

revision = "0008_placements"
down_revision = "0007_timetable_calendar"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "placement_opportunities",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("institution_id", sa.String(36), sa.ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("company", sa.String(180), nullable=False),
        sa.Column("title", sa.String(180), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("location", sa.String(160)),
        sa.Column("employment_type", sa.String(40), nullable=False, server_default="full_time"),
        sa.Column("eligibility_text", sa.Text()),
        sa.Column("application_deadline", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="published"),
        sa.Column("created_by", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_placement_tenant_status_deadline", "placement_opportunities", ["institution_id", "status", "application_deadline"])
    op.create_table(
        "placement_applications",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("institution_id", sa.String(36), sa.ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("opportunity_id", sa.String(36), sa.ForeignKey("placement_opportunities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("student_profile_id", sa.String(36), sa.ForeignKey("student_profiles.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("application_note", sa.Text()),
        sa.Column("status", sa.String(24), nullable=False, server_default="applied"),
        sa.Column("status_updated_by", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("applied_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("opportunity_id", "student_profile_id", name="uq_placement_student_application"),
    )
    op.create_index("ix_placement_apps_tenant_student", "placement_applications", ["institution_id", "student_profile_id"])


def downgrade() -> None:
    op.drop_index("ix_placement_apps_tenant_student", table_name="placement_applications")
    op.drop_table("placement_applications")
    op.drop_index("ix_placement_tenant_status_deadline", table_name="placement_opportunities")
    op.drop_table("placement_opportunities")
