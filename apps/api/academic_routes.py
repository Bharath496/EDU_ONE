"""Tenant-scoped course, enrolment and attendance workflows."""
from __future__ import annotations

from datetime import date
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth_routes import AuthPrincipal, get_current_principal
from authorization import AuthorizationError, authorize
from database import get_db
from models import (
    AcademicCourse,
    AttendanceRecord,
    AttendanceSession,
    AuditEvent,
    CourseEnrollment,
    StudentProfile,
    User,
)

courses_router = APIRouter(prefix="/v1/academics/courses", tags=["academics"])
attendance_router = APIRouter(prefix="/v1/attendance", tags=["attendance"])


class CourseCreatePayload(BaseModel):
    code: str = Field(min_length=1, max_length=40)
    title: str = Field(min_length=1, max_length=180)
    credits: int = Field(default=3, ge=1, le=10)
    department_id: str | None = None
    semester: int = Field(ge=1, le=12)
    class_id: str | None = None


class EnrollmentPayload(BaseModel):
    student_profile_ids: list[str] = Field(min_length=1, max_length=500)


class AttendanceSessionPayload(BaseModel):
    course_id: str
    session_date: date
    period: int = Field(ge=1, le=16)
    topic: str | None = Field(default=None, max_length=180)


class AttendanceEntryPayload(BaseModel):
    student_profile_id: str
    status: Literal["present", "absent", "late", "excused"]
    remarks: str | None = Field(default=None, max_length=300)


class BulkAttendancePayload(BaseModel):
    records: list[AttendanceEntryPayload] = Field(min_length=1, max_length=200)


def _scope_ids(principal: AuthPrincipal, scope_type: str, permissions: set[str]) -> set[str]:
    return {
        scope_id
        for assigned_type, scope_id, permission in principal.access_context.assignments
        if assigned_type == scope_type and permission in permissions
    }


def _course_dict(course: AcademicCourse) -> dict:
    return {
        "id": course.id,
        "code": course.code,
        "title": course.title,
        "credits": course.credits,
        "department_id": course.department_id,
        "semester": course.semester,
        "class_id": course.class_id,
        "is_active": course.is_active,
    }


def _attendance_dict(record: AttendanceRecord) -> dict:
    return {
        "id": record.id,
        "session_id": record.session_id,
        "student_profile_id": record.student_profile_id,
        "status": record.status,
        "remarks": record.remarks,
        "marked_at": record.marked_at.isoformat(),
    }


def _load_course(db: Session, principal: AuthPrincipal, course_id: str) -> AcademicCourse:
    course = db.scalar(select(AcademicCourse).where(
        AcademicCourse.id == course_id,
        AcademicCourse.institution_id == principal.institution.id,
        AcademicCourse.is_active.is_(True),
    ))
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


def _authorize_course(principal: AuthPrincipal, course: AcademicCourse, permission: str) -> None:
    roles = principal.access_context.roles
    if "HOD" in roles:
        scope_type, scope_id = "department", course.department_id
    elif "Class Advisor" in roles:
        scope_type, scope_id = "class", course.class_id
    elif "Faculty" in roles:
        scope_type, scope_id = "course", course.id
    else:
        scope_type, scope_id = None, None
    try:
        authorize(
            principal.access_context,
            permission=permission,
            resource_institution_id=course.institution_id,
            scope_type=scope_type,
            scope_id=scope_id,
        )
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You are not assigned to this course") from exc


def _visible_course_query(db: Session, principal: AuthPrincipal):
    context = principal.access_context
    query = select(AcademicCourse).where(
        AcademicCourse.institution_id == principal.institution.id,
        AcademicCourse.is_active.is_(True),
    )
    roles = context.roles
    if {"College Admin", "Principal", "Vice Principal", "Exam Cell"}.intersection(roles):
        authorize(context, permission="academics.read", resource_institution_id=principal.institution.id)
        return query
    if "HOD" in roles:
        ids = _scope_ids(principal, "department", {"academics.read"})
        return query.where(AcademicCourse.department_id.in_(ids)) if ids else query.where(AcademicCourse.id == "__no_scope__")
    if "Class Advisor" in roles:
        ids = _scope_ids(principal, "class", {"academics.read"})
        return query.where(AcademicCourse.class_id.in_(ids)) if ids else query.where(AcademicCourse.id == "__no_scope__")
    if "Faculty" in roles:
        ids = _scope_ids(principal, "course", {"academics.read", "attendance.read", "attendance.write"})
        return query.where(AcademicCourse.id.in_(ids)) if ids else query.where(AcademicCourse.id == "__no_scope__")
    if "Student" in roles or "Parent" in roles:
        student_ids = context.own_student_ids if "Student" in roles else context.linked_student_ids
        if not student_ids:
            return query.where(AcademicCourse.id == "__no_scope__")
        course_ids = select(CourseEnrollment.course_id).where(
            CourseEnrollment.institution_id == principal.institution.id,
            CourseEnrollment.student_profile_id.in_(student_ids),
            CourseEnrollment.status == "active",
        )
        return query.where(AcademicCourse.id.in_(course_ids))
    raise HTTPException(status_code=403, detail="You do not have access to the course catalogue")


@courses_router.get("")
def list_courses(
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
    department_id: str | None = None,
    semester: int | None = Query(default=None, ge=1, le=12),
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=25, ge=1, le=100),
) -> dict:
    query = _visible_course_query(db, principal)
    if department_id:
        query = query.where(AcademicCourse.department_id == department_id)
    if semester is not None:
        query = query.where(AcademicCourse.semester == semester)
    if search:
        needle = f"%{search.strip()}%"
        query = query.where(or_(AcademicCourse.code.ilike(needle), AcademicCourse.title.ilike(needle)))
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = db.scalars(query.order_by(AcademicCourse.code).offset((page - 1) * limit).limit(limit)).all()
    return {"items": [_course_dict(row) for row in rows], "total": total, "page": page, "limit": limit}


@courses_router.get("/{course_id}")
def get_course(
    course_id: str,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    course = _load_course(db, principal, course_id)
    allowed_ids = {row.id for row in db.scalars(_visible_course_query(db, principal)).all()}
    if course.id not in allowed_ids:
        raise HTTPException(status_code=403, detail="You are not enrolled or assigned to this course")
    return _course_dict(course)


@courses_router.post("", status_code=status.HTTP_201_CREATED)
def create_course(
    payload: CourseCreatePayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    try:
        authorize(principal.access_context, permission="academics.manage", resource_institution_id=principal.institution.id)
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You cannot create courses") from exc
    course = AcademicCourse(
        institution_id=principal.institution.id,
        code=payload.code.strip().upper(),
        title=payload.title.strip(),
        credits=payload.credits,
        department_id=payload.department_id,
        semester=payload.semester,
        class_id=payload.class_id,
    )
    db.add(course)
    try:
        db.flush()
        db.add(AuditEvent(
            institution_id=principal.institution.id,
            actor_user_id=principal.user.id,
            action="academics.course.created",
            resource_type="academic_course",
            resource_id=course.id,
            details={},
        ))
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Course code already exists in this institution") from exc
    db.refresh(course)
    return _course_dict(course)


@courses_router.post("/{course_id}/enrollments", status_code=status.HTTP_201_CREATED)
def enroll_students(
    course_id: str,
    payload: EnrollmentPayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    try:
        authorize(principal.access_context, permission="academics.manage", resource_institution_id=principal.institution.id)
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You cannot manage course enrolments") from exc
    course = _load_course(db, principal, course_id)
    if len(set(payload.student_profile_ids)) != len(payload.student_profile_ids):
        raise HTTPException(status_code=422, detail="Duplicate student profile IDs are not allowed")
    profiles = db.scalars(select(StudentProfile).where(
        StudentProfile.institution_id == principal.institution.id,
        StudentProfile.is_active.is_(True),
        StudentProfile.id.in_(payload.student_profile_ids),
    )).all()
    if len(profiles) != len(payload.student_profile_ids):
        raise HTTPException(status_code=422, detail="Every student must belong to this institution and be active")
    existing = set(db.scalars(select(CourseEnrollment.student_profile_id).where(
        CourseEnrollment.course_id == course.id,
        CourseEnrollment.student_profile_id.in_(payload.student_profile_ids),
        CourseEnrollment.status == "active",
    )).all())
    if existing:
        raise HTTPException(status_code=409, detail="One or more students are already enrolled")
    for profile in profiles:
        db.add(CourseEnrollment(
            institution_id=principal.institution.id,
            course_id=course.id,
            student_profile_id=profile.id,
        ))
    db.add(AuditEvent(
        institution_id=principal.institution.id,
        actor_user_id=principal.user.id,
        action="academics.course.enrolments.created",
        resource_type="academic_course",
        resource_id=course.id,
        details={"count": len(profiles)},
    ))
    db.commit()
    return {"course_id": course.id, "enrolled": len(profiles)}


@attendance_router.post("/sessions", status_code=status.HTTP_201_CREATED)
def create_attendance_session(
    payload: AttendanceSessionPayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    course = _load_course(db, principal, payload.course_id)
    _authorize_course(principal, course, "attendance.write")
    session = AttendanceSession(
        institution_id=principal.institution.id,
        course_id=course.id,
        session_date=payload.session_date,
        period=payload.period,
        topic=payload.topic,
        marked_by=principal.user.id,
    )
    db.add(session)
    try:
        db.flush()
        db.add(AuditEvent(
            institution_id=principal.institution.id,
            actor_user_id=principal.user.id,
            action="attendance.session.created",
            resource_type="attendance_session",
            resource_id=session.id,
            details={"course_id": course.id, "session_date": payload.session_date.isoformat(), "period": payload.period},
        ))
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="An attendance session already exists for this course, date and period") from exc
    db.refresh(session)
    return {
        "id": session.id, "course_id": session.course_id,
        "session_date": session.session_date.isoformat(), "period": session.period,
        "topic": session.topic, "status": session.status,
    }


@attendance_router.post("/sessions/{session_id}/records")
def mark_attendance(
    session_id: str,
    payload: BulkAttendancePayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    session = db.scalar(select(AttendanceSession).where(
        AttendanceSession.id == session_id,
        AttendanceSession.institution_id == principal.institution.id,
    ))
    if session is None:
        raise HTTPException(status_code=404, detail="Attendance session not found")
    if session.status != "open":
        raise HTTPException(status_code=409, detail="This attendance session is locked")
    course = _load_course(db, principal, session.course_id)
    _authorize_course(principal, course, "attendance.write")

    student_ids = [item.student_profile_id for item in payload.records]
    if len(set(student_ids)) != len(student_ids):
        raise HTTPException(status_code=422, detail="Duplicate student IDs are not allowed")
    enrolled = set(db.scalars(select(CourseEnrollment.student_profile_id).where(
        CourseEnrollment.institution_id == principal.institution.id,
        CourseEnrollment.course_id == course.id,
        CourseEnrollment.status == "active",
        CourseEnrollment.student_profile_id.in_(student_ids),
    )).all())
    if enrolled != set(student_ids):
        raise HTTPException(status_code=422, detail="Attendance can only be marked for active students enrolled in this course")
    existing = set(db.scalars(select(AttendanceRecord.student_profile_id).where(
        AttendanceRecord.session_id == session.id,
        AttendanceRecord.student_profile_id.in_(student_ids),
    )).all())
    if existing:
        raise HTTPException(status_code=409, detail="Attendance already exists for one or more students in this session")

    for item in payload.records:
        db.add(AttendanceRecord(
            institution_id=principal.institution.id,
            session_id=session.id,
            student_profile_id=item.student_profile_id,
            status=item.status,
            remarks=item.remarks,
            marked_by=principal.user.id,
        ))
    db.add(AuditEvent(
        institution_id=principal.institution.id,
        actor_user_id=principal.user.id,
        action="attendance.records.marked",
        resource_type="attendance_session",
        resource_id=session.id,
        details={"count": len(payload.records), "course_id": course.id},
    ))
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Attendance records conflict with an existing submission") from exc
    return {"session_id": session.id, "created": len(payload.records)}


@attendance_router.post("/sessions/{session_id}/lock")
def lock_attendance_session(
    session_id: str,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    session = db.scalar(select(AttendanceSession).where(
        AttendanceSession.id == session_id,
        AttendanceSession.institution_id == principal.institution.id,
    ))
    if session is None:
        raise HTTPException(status_code=404, detail="Attendance session not found")
    course = _load_course(db, principal, session.course_id)
    _authorize_course(principal, course, "attendance.write")
    session.status = "locked"
    db.add(AuditEvent(
        institution_id=principal.institution.id,
        actor_user_id=principal.user.id,
        action="attendance.session.locked",
        resource_type="attendance_session",
        resource_id=session.id,
        details={},
    ))
    db.commit()
    return {"session_id": session.id, "status": session.status}


def _authorize_student_attendance(principal: AuthPrincipal, profile: StudentProfile, course: AcademicCourse) -> None:
    roles = principal.access_context.roles
    if "HOD" in roles:
        scope_type, scope_id = "department", course.department_id
    elif "Class Advisor" in roles:
        scope_type, scope_id = "class", course.class_id
    elif "Faculty" in roles:
        scope_type, scope_id = "course", course.id
    else:
        scope_type, scope_id = None, None
    try:
        authorize(
            principal.access_context,
            permission="attendance.read",
            resource_institution_id=profile.institution_id,
            owner_user_id=profile.user_id,
            student_id=profile.id,
            scope_type=scope_type,
            scope_id=scope_id,
        )
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You cannot view this student's attendance") from exc


@attendance_router.get("/me")
def my_attendance(
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    if "Student" not in principal.roles:
        raise HTTPException(status_code=403, detail="This endpoint is available to student accounts")
    profile = db.scalar(select(StudentProfile).where(
        StudentProfile.institution_id == principal.institution.id,
        StudentProfile.user_id == principal.user.id,
        StudentProfile.is_active.is_(True),
    ))
    if profile is None:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return _attendance_for_student(db, principal, profile)


@attendance_router.get("/students/{student_id}")
def student_attendance(
    student_id: str,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    profile = db.scalar(select(StudentProfile).where(
        StudentProfile.id == student_id,
        StudentProfile.institution_id == principal.institution.id,
        StudentProfile.is_active.is_(True),
    ))
    if profile is None:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return _attendance_for_student(db, principal, profile)


def _attendance_for_student(db: Session, principal: AuthPrincipal, profile: StudentProfile) -> dict:
    rows = db.execute(
        select(AttendanceRecord, AttendanceSession, AcademicCourse)
        .join(AttendanceSession, AttendanceSession.id == AttendanceRecord.session_id)
        .join(AcademicCourse, AcademicCourse.id == AttendanceSession.course_id)
        .where(
            AttendanceRecord.institution_id == principal.institution.id,
            AttendanceRecord.student_profile_id == profile.id,
        )
        .order_by(AttendanceSession.session_date.desc(), AttendanceSession.period.desc())
    ).all()
    records = []
    for record, session, course in rows:
        _authorize_student_attendance(principal, profile, course)
        records.append({
            **_attendance_dict(record),
            "course_id": course.id,
            "course_code": course.code,
            "course_title": course.title,
            "session_date": session.session_date.isoformat(),
            "period": session.period,
        })
    total = len(records)
    counted = [row for row in records if row["status"] != "excused"]
    present = sum(1 for row in counted if row["status"] in {"present", "late"})
    percentage = round((present / len(counted)) * 100, 1) if counted else None
    return {"student_id": profile.id, "total_sessions": total, "counted_sessions": len(counted), "present_or_late": present, "attendance_percentage": percentage, "records": records}
