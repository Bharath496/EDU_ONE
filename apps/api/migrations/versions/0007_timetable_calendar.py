"""Add class timetable slots and academic calendar events."""
from alembic import op
import sqlalchemy as sa

revision = "0007_timetable_calendar"
down_revision = "0006_announcements_support"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "timetable_slots",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("institution_id", sa.String(36), sa.ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("class_id", sa.String(36), nullable=False),
        sa.Column("course_id", sa.String(36), sa.ForeignKey("academic_courses.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("faculty_user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("weekday", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("room", sa.String(40)),
        sa.Column("effective_from", sa.Date(), nullable=False),
        sa.Column("effective_to", sa.Date()),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_by", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("weekday >= 0 AND weekday <= 6", name="ck_timetable_weekday"),
        sa.CheckConstraint("start_time < end_time", name="ck_timetable_time_range"),
    )
    op.create_index("ix_timetable_tenant_class_day", "timetable_slots", ["institution_id", "class_id", "weekday"])
    op.create_index("ix_timetable_tenant_faculty_day", "timetable_slots", ["institution_id", "faculty_user_id", "weekday"])
    op.create_table(
        "calendar_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("institution_id", sa.String(36), sa.ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("title", sa.String(180), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("event_type", sa.String(40), nullable=False),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("audience_role", sa.String(60)),
        sa.Column("department_id", sa.String(36)),
        sa.Column("class_id", sa.String(36)),
        sa.Column("status", sa.String(20), nullable=False, server_default="published"),
        sa.Column("created_by", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_calendar_tenant_status_start", "calendar_events", ["institution_id", "status", "start_at"])


def downgrade() -> None:
    op.drop_index("ix_calendar_tenant_status_start", table_name="calendar_events")
    op.drop_table("calendar_events")
    op.drop_index("ix_timetable_tenant_faculty_day", table_name="timetable_slots")
    op.drop_index("ix_timetable_tenant_class_day", table_name="timetable_slots")
    op.drop_table("timetable_slots")
