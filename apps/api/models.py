"""Initial tenant-aware identity and audit data model."""
from __future__ import annotations

from datetime import date, datetime, timezone
from uuid import uuid4

from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, ForeignKey, Index, Integer, JSON, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid4())


class Base(DeclarativeBase):
    pass


class Institution(Base):
    __tablename__ = "institutions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    users: Mapped[list["User"]] = relationship(back_populates="institution")


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("institution_id", "email", name="uq_user_institution_email"),
        Index("ix_users_institution_active", "institution_id", "is_active"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(256), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_locked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    institution: Mapped[Institution] = relationship(back_populates="users")
    roles: Mapped[list["UserRole"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class UserRole(Base):
    __tablename__ = "user_roles"
    __table_args__ = (UniqueConstraint("user_id", "role", name="uq_user_role"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(60), nullable=False)
    department_id: Mapped[str | None] = mapped_column(String(36))
    user: Mapped[User] = relationship(back_populates="roles")


class StudentProfile(Base):
    __tablename__ = "student_profiles"
    __table_args__ = (
        UniqueConstraint("institution_id", "registration_number", name="uq_student_registration"),
        Index("ix_student_profiles_class", "institution_id", "class_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, unique=True)
    registration_number: Mapped[str] = mapped_column(String(60), nullable=False)
    department_id: Mapped[str | None] = mapped_column(String(36))
    programme: Mapped[str | None] = mapped_column(String(120))
    semester: Mapped[int | None] = mapped_column()
    class_id: Mapped[str | None] = mapped_column(String(36))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class ParentStudentLink(Base):
    __tablename__ = "parent_student_links"
    __table_args__ = (UniqueConstraint("parent_user_id", "student_profile_id", name="uq_parent_student_link"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False)
    parent_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    student_profile_id: Mapped[str] = mapped_column(ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False)
    relationship_label: Mapped[str] = mapped_column(String(40), default="Parent", nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class StaffAssignment(Base):
    __tablename__ = "staff_assignments"
    __table_args__ = (Index("ix_staff_assignment_scope", "institution_id", "user_id", "scope_type", "scope_id"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    scope_type: Mapped[str] = mapped_column(String(30), nullable=False)
    scope_id: Mapped[str] = mapped_column(String(36), nullable=False)
    permission: Mapped[str] = mapped_column(String(80), nullable=False)


class AuthSession(Base):
    __tablename__ = "auth_sessions"
    __table_args__ = (Index("ix_auth_sessions_user_expiry", "user_id", "expires_at"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AuditEvent(Base):
    __tablename__ = "audit_events"
    __table_args__ = (Index("ix_audit_institution_created", "institution_id", "created_at"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False)
    actor_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(80), nullable=False)
    resource_id: Mapped[str | None] = mapped_column(String(36))
    details: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class AcademicCourse(Base):
    __tablename__ = "academic_courses"
    __table_args__ = (
        UniqueConstraint("institution_id", "code", name="uq_course_institution_code"),
        Index("ix_courses_tenant_department_semester", "institution_id", "department_id", "semester"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False)
    code: Mapped[str] = mapped_column(String(40), nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    credits: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    department_id: Mapped[str | None] = mapped_column(String(36))
    semester: Mapped[int] = mapped_column(Integer, nullable=False)
    class_id: Mapped[str | None] = mapped_column(String(36))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class CourseEnrollment(Base):
    __tablename__ = "course_enrollments"
    __table_args__ = (
        UniqueConstraint("course_id", "student_profile_id", name="uq_course_student_enrollment"),
        Index("ix_course_enrollments_tenant_student", "institution_id", "student_profile_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False)
    course_id: Mapped[str] = mapped_column(ForeignKey("academic_courses.id", ondelete="CASCADE"), nullable=False)
    student_profile_id: Mapped[str] = mapped_column(ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    enrolled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"
    __table_args__ = (
        UniqueConstraint("course_id", "session_date", "period", name="uq_attendance_course_date_period"),
        Index("ix_attendance_sessions_tenant_date", "institution_id", "session_date"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False)
    course_id: Mapped[str] = mapped_column(ForeignKey("academic_courses.id", ondelete="RESTRICT"), nullable=False)
    session_date: Mapped[date] = mapped_column(Date, nullable=False)
    period: Mapped[int] = mapped_column(Integer, nullable=False)
    topic: Mapped[str | None] = mapped_column(String(180))
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="open")
    marked_by: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    __table_args__ = (
        UniqueConstraint("session_id", "student_profile_id", name="uq_attendance_session_student"),
        CheckConstraint("status IN ('present', 'absent', 'late', 'excused')", name="ck_attendance_status"),
        Index("ix_attendance_records_tenant_student", "institution_id", "student_profile_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False)
    session_id: Mapped[str] = mapped_column(ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False)
    student_profile_id: Mapped[str] = mapped_column(ForeignKey("student_profiles.id", ondelete="RESTRICT"), nullable=False)
    status: Mapped[str] = mapped_column(String(12), nullable=False)
    remarks: Mapped[str | None] = mapped_column(String(300))
    marked_by: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    marked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class Exam(Base):
    __tablename__ = "exams"
    __table_args__ = (
        UniqueConstraint("institution_id", "code", name="uq_exam_institution_code"),
        Index("ix_exams_tenant_course_date", "institution_id", "course_id", "start_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False)
    course_id: Mapped[str] = mapped_column(ForeignKey("academic_courses.id", ondelete="RESTRICT"), nullable=False)
    code: Mapped[str] = mapped_column(String(40), nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    exam_type: Mapped[str] = mapped_column(String(30), nullable=False)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    max_marks: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class ExamResult(Base):
    __tablename__ = "exam_results"
    __table_args__ = (
        UniqueConstraint("exam_id", "student_profile_id", name="uq_exam_result_student"),
        CheckConstraint("marks_obtained >= 0", name="ck_exam_result_marks_nonnegative"),
        Index("ix_exam_results_tenant_student", "institution_id", "student_profile_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False)
    exam_id: Mapped[str] = mapped_column(ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    student_profile_id: Mapped[str] = mapped_column(ForeignKey("student_profiles.id", ondelete="RESTRICT"), nullable=False)
    marks_obtained: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    grade: Mapped[str | None] = mapped_column(String(8))
    remarks: Mapped[str | None] = mapped_column(String(300))
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    entered_by: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Assignment(Base):
    __tablename__ = "assignments"
    __table_args__ = (Index("ix_assignments_tenant_course_due", "institution_id", "course_id", "due_at"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False)
    course_id: Mapped[str] = mapped_column(ForeignKey("academic_courses.id", ondelete="RESTRICT"), nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    max_marks: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"
    __table_args__ = (
        UniqueConstraint("assignment_id", "student_profile_id", name="uq_assignment_submission_student"),
        CheckConstraint("marks_obtained IS NULL OR marks_obtained >= 0", name="ck_assignment_marks_nonnegative"),
        Index("ix_assignment_submissions_tenant_student", "institution_id", "student_profile_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False)
    assignment_id: Mapped[str] = mapped_column(ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    student_profile_id: Mapped[str] = mapped_column(ForeignKey("student_profiles.id", ondelete="RESTRICT"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="submitted")
    marks_obtained: Mapped[float | None] = mapped_column(Numeric(8, 2))
    feedback: Mapped[str | None] = mapped_column(Text)
    graded_by: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    graded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class FeeInvoice(Base):
    __tablename__ = "fee_invoices"
    __table_args__ = (
        Index("ix_fee_invoices_tenant_student_due", "institution_id", "student_profile_id", "due_date"),
        CheckConstraint("amount > 0", name="ck_fee_invoice_amount_positive"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False)
    student_profile_id: Mapped[str] = mapped_column(ForeignKey("student_profiles.id", ondelete="RESTRICT"), nullable=False)
    invoice_number: Mapped[str] = mapped_column(String(60), nullable=False, unique=True)
    fee_type: Mapped[str] = mapped_column(String(80), nullable=False)
    description: Mapped[str | None] = mapped_column(String(300))
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="issued")
    issued_by: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class FeePayment(Base):
    __tablename__ = "fee_payments"
    __table_args__ = (
        Index("ix_fee_payments_tenant_invoice_status", "institution_id", "invoice_id", "status"),
        CheckConstraint("amount > 0", name="ck_fee_payment_amount_positive"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    institution_id: Mapped[str] = mapped_column(ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False)
    invoice_id: Mapped[str] = mapped_column(ForeignKey("fee_invoices.id", ondelete="RESTRICT"), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    method: Mapped[str] = mapped_column(String(30), nullable=False)
    payment_reference: Mapped[str | None] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    recorded_by: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    verified_by: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
