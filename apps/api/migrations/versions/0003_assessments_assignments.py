"""Add exams, marks, assignments and student submissions."""
from alembic import op
import sqlalchemy as sa

revision = "0003_assessments_assignments"
down_revision = "0002_courses_attendance"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "exams",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("institution_id", sa.String(36), sa.ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("course_id", sa.String(36), sa.ForeignKey("academic_courses.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("code", sa.String(40), nullable=False),
        sa.Column("title", sa.String(180), nullable=False),
        sa.Column("exam_type", sa.String(30), nullable=False),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("max_marks", sa.Numeric(8, 2), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("created_by", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("institution_id", "code", name="uq_exam_institution_code"),
    )
    op.create_index("ix_exams_tenant_course_date", "exams", ["institution_id", "course_id", "start_at"])
    op.create_table(
        "exam_results",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("institution_id", sa.String(36), sa.ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("exam_id", sa.String(36), sa.ForeignKey("exams.id", ondelete="CASCADE"), nullable=False),
        sa.Column("student_profile_id", sa.String(36), sa.ForeignKey("student_profiles.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("marks_obtained", sa.Numeric(8, 2), nullable=False),
        sa.Column("grade", sa.String(8)),
        sa.Column("remarks", sa.String(300)),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("entered_by", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("marks_obtained >= 0", name="ck_exam_result_marks_nonnegative"),
        sa.UniqueConstraint("exam_id", "student_profile_id", name="uq_exam_result_student"),
    )
    op.create_index("ix_exam_results_tenant_student", "exam_results", ["institution_id", "student_profile_id"])
    op.create_table(
        "assignments",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("institution_id", sa.String(36), sa.ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("course_id", sa.String(36), sa.ForeignKey("academic_courses.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("title", sa.String(180), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("max_marks", sa.Numeric(8, 2), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("created_by", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_assignments_tenant_course_due", "assignments", ["institution_id", "course_id", "due_at"])
    op.create_table(
        "assignment_submissions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("institution_id", sa.String(36), sa.ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("assignment_id", sa.String(36), sa.ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("student_profile_id", sa.String(36), sa.ForeignKey("student_profiles.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="submitted"),
        sa.Column("marks_obtained", sa.Numeric(8, 2)),
        sa.Column("feedback", sa.Text()),
        sa.Column("graded_by", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("graded_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("marks_obtained IS NULL OR marks_obtained >= 0", name="ck_assignment_marks_nonnegative"),
        sa.UniqueConstraint("assignment_id", "student_profile_id", name="uq_assignment_submission_student"),
    )
    op.create_index("ix_assignment_submissions_tenant_student", "assignment_submissions", ["institution_id", "student_profile_id"])


def downgrade() -> None:
    op.drop_index("ix_assignment_submissions_tenant_student", table_name="assignment_submissions")
    op.drop_table("assignment_submissions")
    op.drop_index("ix_assignments_tenant_course_due", table_name="assignments")
    op.drop_table("assignments")
    op.drop_index("ix_exam_results_tenant_student", table_name="exam_results")
    op.drop_table("exam_results")
    op.drop_index("ix_exams_tenant_course_date", table_name="exams")
    op.drop_table("exams")
