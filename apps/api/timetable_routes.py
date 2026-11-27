"""Class timetable and institution calendar endpoints."""
from __future__ import annotations

from datetime import date, datetime, time, timezone
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from academic_routes import _authorize_course, _load_course
from auth_routes import AuthPrincipal, get_current_principal
from authorization import AuthorizationError, authorize
from database import get_db
from models import (
    AcademicCourse, AuditEvent, CalendarEvent, ParentStudentLink,
    StaffAssignment, StudentProfile, TimetableSlot, User,
)

timetable_router = APIRouter(prefix="/v1/timetable", tags=["timetable"])
calendar_router = APIRouter(prefix="/v1/calendar", tags=["calendar"])


class TimetableSlotPayload(BaseModel):
    class_id: str
    course_id: str
    faculty_user_id: str
    weekday: int = Field(ge=0, le=6)
    start_time: time
    end_time: time
    room: str | None = Field(default=None, max_length=40)
    effective_from: date
    effective_to: date | None = None


class CalendarEventPayload(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    description: str | None = Field(default=None, max_length=12000)
    event_type: Literal["holiday", "exam", "seminar", "workshop", "deadline", "meeting", "event"]
    start_at: datetime
    end_at: datetime
    audience_role: str | None = Field(default=None, max_length=60)
    department_id: str | None = None
    class_id: str | None = None


def _slot_dict(db: Session, slot: TimetableSlot) -> dict:
    course = db.get(AcademicCourse, slot.course_id)
    faculty = db.get(User, slot.faculty_user_id)
    return {
        "id": slot.id, "class_id": slot.class_id, "course_id": slot.course_id,
        "course_code": course.code if course else None,
        "course_title": course.title if course else None,
        "faculty_user_id": slot.faculty_user_id,
        "faculty_name": faculty.full_name if faculty else None,
        "weekday": slot.weekday, "start_time": slot.start_time.strftime("%H:%M"),
        "end_time": slot.end_time.strftime("%H:%M"), "room": slot.room,
        "effective_from": slot.effective_from.isoformat(),
        "effective_to": slot.effective_to.isoformat() if slot.effective_to else None,
    }


def _slot_query(db: Session, principal: AuthPrincipal, class_id: str):
    return select(TimetableSlot).where(
        TimetableSlot.institution_id == principal.institution.id,
        TimetableSlot.class_id == class_id,
        TimetableSlot.is_active.is_(True),
    ).order_by(TimetableSlot.weekday, TimetableSlot.start_time)


@timetable_router.get("/me")
def my_timetable(
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> list[dict]:
    if "Student" not in principal.roles:
        raise HTTPException(status_code=403, detail="This endpoint is available to student accounts")
    profile = db.scalar(select(StudentProfile).where(
        StudentProfile.institution_id == principal.institution.id,
        StudentProfile.user_id == principal.user.id,
        StudentProfile.is_active.is_(True),
    ))
    if profile is None or not profile.class_id:
        raise HTTPException(status_code=404, detail="Student class timetable is not configured")
    try:
        authorize(
            principal.access_context, permission="academics.read",
            resource_institution_id=principal.institution.id,
            owner_user_id=profile.user_id, student_id=profile.id,
        )
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You cannot view this timetable") from exc
    rows = db.scalars(_slot_query(db, principal, profile.class_id)).all()
    today = date.today()
    return [
        _slot_dict(db, row) for row in rows
        if row.effective_from <= today and (row.effective_to is None or row.effective_to >= today)
    ]


@timetable_router.get("/students/{student_id}")
def student_timetable(
    student_id: str,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> list[dict]:
    profile = db.scalar(select(StudentProfile).where(
        StudentProfile.id == student_id,
        StudentProfile.institution_id == principal.institution.id,
        StudentProfile.is_active.is_(True),
    ))
    if profile is None or not profile.class_id:
        raise HTTPException(status_code=404, detail="Student class timetable is not configured")
    try:
        authorize(
            principal.access_context, permission="academics.read",
            resource_institution_id=principal.institution.id,
            owner_user_id=profile.user_id, student_id=profile.id,
        )
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You cannot view this timetable") from exc
    today = date.today()
    rows = db.scalars(_slot_query(db, principal, profile.class_id)).all()
    return [_slot_dict(db, row) for row in rows if row.effective_from <= today and (row.effective_to is None or row.effective_to >= today)]


@timetable_router.get("/faculty/me")
def faculty_timetable(
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> list[dict]:
    if "Faculty" not in principal.roles:
        raise HTTPException(status_code=403, detail="This endpoint is available to faculty accounts")
    course_ids = {
        scope_id for scope_type, scope_id, permission in principal.access_context.assignments
        if scope_type == "course" and permission in {"academics.read", "attendance.read", "attendance.write"}
    }
    if not course_ids:
        return []
    today = date.today()
    rows = db.scalars(select(TimetableSlot).where(
        TimetableSlot.institution_id == principal.institution.id,
        TimetableSlot.faculty_user_id == principal.user.id,
        TimetableSlot.course_id.in_(course_ids),
        TimetableSlot.is_active.is_(True),
    ).order_by(TimetableSlot.weekday, TimetableSlot.start_time)).all()
    return [_slot_dict(db, row) for row in rows if row.effective_from <= today and (row.effective_to is None or row.effective_to >= today)]


@timetable_router.get("/classes/{class_id}")
def class_timetable(
    class_id: str,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> list[dict]:
    rows = db.scalars(_slot_query(db, principal, class_id)).all()
    for row in rows:
        course = _load_course(db, principal, row.course_id)
        _authorize_course(principal, course, "academics.read")
    today = date.today()
    return [_slot_dict(db, row) for row in rows if row.effective_from <= today and (row.effective_to is None or row.effective_to >= today)]


@timetable_router.post("", status_code=status.HTTP_201_CREATED)
def create_timetable_slot(
    payload: TimetableSlotPayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    try:
        authorize(principal.access_context, permission="academics.manage", resource_institution_id=principal.institution.id)
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You cannot manage the timetable") from exc
    if payload.end_time <= payload.start_time:
        raise HTTPException(status_code=422, detail="Class end time must be after its start time")
    if payload.effective_to and payload.effective_to < payload.effective_from:
        raise HTTPException(status_code=422, detail="Effective end date cannot be before start date")
    course = _load_course(db, principal, payload.course_id)
    if course.class_id and course.class_id != payload.class_id:
        raise HTTPException(status_code=422, detail="Course is assigned to a different class")
    faculty = db.scalar(select(User).where(
        User.id == payload.faculty_user_id,
        User.institution_id == principal.institution.id,
        User.is_active.is_(True),
    ))
    if faculty is None or "Faculty" not in {role.role for role in faculty.roles}:
        raise HTTPException(status_code=422, detail="An active faculty account is required")
    assigned = db.scalar(select(StaffAssignment.id).where(
        StaffAssignment.institution_id == principal.institution.id,
        StaffAssignment.user_id == faculty.id,
        StaffAssignment.scope_type == "course",
        StaffAssignment.scope_id == course.id,
        StaffAssignment.permission == "academics.read",
    ))
    if assigned is None:
        raise HTTPException(status_code=422, detail="Faculty member is not assigned to this course")

    def overlaps(existing: TimetableSlot) -> bool:
        dates_overlap = (
            (existing.effective_to is None or existing.effective_to >= payload.effective_from)
            and (payload.effective_to is None or existing.effective_from <= payload.effective_to)
        )
        times_overlap = existing.start_time < payload.end_time and existing.end_time > payload.start_time
        return dates_overlap and times_overlap

    conflicts = db.scalars(select(TimetableSlot).where(
        TimetableSlot.institution_id == principal.institution.id,
        TimetableSlot.weekday == payload.weekday,
        TimetableSlot.is_active.is_(True),
        or_(TimetableSlot.effective_to.is_(None), TimetableSlot.effective_to >= payload.effective_from),
        or_(payload.effective_to is None, TimetableSlot.effective_from <= payload.effective_to),
        TimetableSlot.start_time < payload.end_time,
        TimetableSlot.end_time > payload.start_time,
        or_(
            TimetableSlot.class_id == payload.class_id,
            TimetableSlot.faculty_user_id == payload.faculty_user_id,
        ),
    )).all()
    if any(row.class_id == payload.class_id for row in conflicts):
        raise HTTPException(status_code=409, detail="This class already has a timetable slot at that time")
    if any(row.faculty_user_id == payload.faculty_user_id for row in conflicts):
        raise HTTPException(status_code=409, detail="This faculty member already has a class at that time")

    slot = TimetableSlot(
        institution_id=principal.institution.id, class_id=payload.class_id,
        course_id=course.id, faculty_user_id=faculty.id,
        weekday=payload.weekday, start_time=payload.start_time,
        end_time=payload.end_time, room=payload.room,
        effective_from=payload.effective_from, effective_to=payload.effective_to,
        created_by=principal.user.id,
    )
    db.add(slot)
    db.flush()
    db.add(AuditEvent(
        institution_id=principal.institution.id, actor_user_id=principal.user.id,
        action="timetable.slot.created", resource_type="timetable_slot",
        resource_id=slot.id, details={"class_id": slot.class_id, "course_id": slot.course_id},
    ))
    db.commit()
    return _slot_dict(db, slot)


def _calendar_visible(db: Session, principal: AuthPrincipal, event: CalendarEvent) -> bool:
    roles = principal.access_context.roles
    if event.audience_role and event.audience_role not in roles:
        return False
    profile_ids = set(principal.access_context.own_student_ids) | set(principal.access_context.linked_student_ids)
    if event.department_id:
        assigned_departments = {
            scope_id for scope_type, scope_id, permission in principal.access_context.assignments
            if scope_type == "department" and permission == "students.read"
        }
        profile_departments = set(db.scalars(select(StudentProfile.department_id).where(
            StudentProfile.institution_id == principal.institution.id,
            StudentProfile.id.in_(profile_ids),
        )).all()) if profile_ids else set()
        if event.department_id not in assigned_departments and event.department_id not in profile_departments:
            if not {"College Admin", "Principal", "Vice Principal"}.intersection(roles):
                return False
    if event.class_id:
        assigned_classes = {
            scope_id for scope_type, scope_id, permission in principal.access_context.assignments
            if scope_type == "class" and permission == "students.read"
        }
        profile_classes = set(db.scalars(select(StudentProfile.class_id).where(
            StudentProfile.institution_id == principal.institution.id,
            StudentProfile.id.in_(profile_ids),
        )).all()) if profile_ids else set()
        if event.class_id not in assigned_classes and event.class_id not in profile_classes:
            if not {"College Admin", "Principal", "Vice Principal"}.intersection(roles):
                return False
    return True


@calendar_router.get("")
def list_calendar_events(
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
    start_at: datetime | None = None,
    end_at: datetime | None = None,
) -> list[dict]:
    query = select(CalendarEvent).where(
        CalendarEvent.institution_id == principal.institution.id,
        CalendarEvent.status == "published",
    )
    if start_at:
        query = query.where(CalendarEvent.end_at >= start_at)
    if end_at:
        query = query.where(CalendarEvent.start_at <= end_at)
    rows = db.scalars(query.order_by(CalendarEvent.start_at)).all()
    return [{
        "id": row.id, "title": row.title, "description": row.description,
        "event_type": row.event_type, "start_at": row.start_at.isoformat(),
        "end_at": row.end_at.isoformat(), "audience_role": row.audience_role,
        "department_id": row.department_id, "class_id": row.class_id,
    } for row in rows if _calendar_visible(db, principal, row)]


@calendar_router.post("", status_code=status.HTTP_201_CREATED)
def create_calendar_event(
    payload: CalendarEventPayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    context = principal.access_context
    try:
        if "HOD" in context.roles:
            authorize(context, permission="notices.publish", resource_institution_id=principal.institution.id, scope_type="department", scope_id=payload.department_id)
        elif "Class Advisor" in context.roles:
            authorize(context, permission="notices.publish", resource_institution_id=principal.institution.id, scope_type="class", scope_id=payload.class_id)
        else:
            authorize(context, permission="notices.publish", resource_institution_id=principal.institution.id)
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You cannot create this calendar event") from exc
    if payload.start_at.tzinfo is None or payload.end_at.tzinfo is None or payload.end_at <= payload.start_at:
        raise HTTPException(status_code=422, detail="Event times must be timezone-aware and end after start")
    if payload.department_id and payload.class_id:
        raise HTTPException(status_code=422, detail="Choose either department or class scope")
    event = CalendarEvent(
        institution_id=principal.institution.id,
        title=payload.title.strip(), description=payload.description,
        event_type=payload.event_type, start_at=payload.start_at,
        end_at=payload.end_at, audience_role=payload.audience_role,
        department_id=payload.department_id, class_id=payload.class_id,
        status="published", created_by=principal.user.id,
    )
    db.add(event)
    db.flush()
    db.add(AuditEvent(
        institution_id=principal.institution.id, actor_user_id=principal.user.id,
        action="calendar.event.created", resource_type="calendar_event",
        resource_id=event.id, details={"event_type": event.event_type},
    ))
    db.commit()
    return {"id": event.id, "title": event.title, "event_type": event.event_type, "start_at": event.start_at.isoformat(), "end_at": event.end_at.isoformat()}
