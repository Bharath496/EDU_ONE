"""Add course catalogue, enrolments and attendance records."""
from alembic import op
import sqlalchemy as sa

revision = "0002_courses_attendance"
down_revision = "0001_initial_identity_audit"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "academic_courses",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("institution_id", sa.String(36), sa.ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("code", sa.String(40), nullable=False),
        sa.Column("title", sa.String(180), nullable=False),
        sa.Column("credits", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("department_id", sa.String(36)),
        sa.Column("semester", sa.Integer(), nullable=False),
        sa.Column("class_id", sa.String(36)),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("institution_id", "code", name="uq_course_institution_code"),
    )
    op.create_index("ix_courses_tenant_department_semester", "academic_courses", ["institution_id", "department_id", "semester"])
    op.create_table(
        "course_enrollments",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("institution_id", sa.String(36), sa.ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("course_id", sa.String(36), sa.ForeignKey("academic_courses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("student_profile_id", sa.String(36), sa.ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("enrolled_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("course_id", "student_profile_id", name="uq_course_student_enrollment"),
    )
    op.create_index("ix_course_enrollments_tenant_student", "course_enrollments", ["institution_id", "student_profile_id"])
    op.create_table(
        "attendance_sessions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("institution_id", sa.String(36), sa.ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("course_id", sa.String(36), sa.ForeignKey("academic_courses.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("session_date", sa.Date(), nullable=False),
        sa.Column("period", sa.Integer(), nullable=False),
        sa.Column("topic", sa.String(180)),
        sa.Column("status", sa.String(20), nullable=False, server_default="open"),
        sa.Column("marked_by", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("course_id", "session_date", "period", name="uq_attendance_course_date_period"),
    )
    op.create_index("ix_attendance_sessions_tenant_date", "attendance_sessions", ["institution_id", "session_date"])
    op.create_table(
        "attendance_records",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("institution_id", sa.String(36), sa.ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("session_id", sa.String(36), sa.ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("student_profile_id", sa.String(36), sa.ForeignKey("student_profiles.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("status", sa.String(12), nullable=False),
        sa.Column("remarks", sa.String(300)),
        sa.Column("marked_by", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("marked_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("status IN ('present', 'absent', 'late', 'excused')", name="ck_attendance_status"),
        sa.UniqueConstraint("session_id", "student_profile_id", name="uq_attendance_session_student"),
    )
    op.create_index("ix_attendance_records_tenant_student", "attendance_records", ["institution_id", "student_profile_id"])


def downgrade() -> None:
    op.drop_index("ix_attendance_records_tenant_student", table_name="attendance_records")
    op.drop_table("attendance_records")
    op.drop_index("ix_attendance_sessions_tenant_date", table_name="attendance_sessions")
    op.drop_table("attendance_sessions")
    op.drop_index("ix_course_enrollments_tenant_student", table_name="course_enrollments")
    op.drop_table("course_enrollments")
    op.drop_index("ix_courses_tenant_department_semester", table_name="academic_courses")
    op.drop_table("academic_courses")
