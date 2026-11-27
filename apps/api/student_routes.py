"""Tenant-scoped student profile endpoints."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth_routes import AuthPrincipal, get_current_principal
from authorization import AuthorizationError, authorize
from database import get_db
from models import AuditEvent, StudentProfile, User

router = APIRouter(prefix="/v1/students", tags=["students"])


class StudentCreatePayload(BaseModel):
    user_id: str = Field(min_length=1)
    registration_number: str = Field(min_length=1, max_length=60)
    department_id: str | None = None
    programme: str | None = Field(default=None, max_length=120)
    semester: int | None = Field(default=None, ge=1, le=12)
    class_id: str | None = None


class StudentUpdatePayload(BaseModel):
    registration_number: str | None = Field(default=None, min_length=1, max_length=60)
    department_id: str | None = None
    programme: str | None = Field(default=None, max_length=120)
    semester: int | None = Field(default=None, ge=1, le=12)
    class_id: str | None = None
    is_active: bool | None = None


def _serialize(db: Session, profile: StudentProfile) -> dict:
    user = db.get(User, profile.user_id)
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "name": user.full_name if user else None,
        "email": user.email if user else None,
        "registration_number": profile.registration_number,
        "department_id": profile.department_id,
        "programme": profile.programme,
        "semester": profile.semester,
        "class_id": profile.class_id,
        "is_active": profile.is_active,
    }


def _scope_ids(principal: AuthPrincipal, scope_type: str, permission: str) -> set[str]:
    return {
        scope_id
        for assigned_type, scope_id, assigned_permission in principal.access_context.assignments
        if assigned_type == scope_type and assigned_permission == permission
    }


def _student_query(principal: AuthPrincipal):
    context = principal.access_context
    query = select(StudentProfile).where(
        StudentProfile.institution_id == principal.institution.id,
        StudentProfile.is_active.is_(True),
    )
    roles = context.roles

    if {"College Admin", "Principal", "Vice Principal", "Admissions", "Accounts", "Librarian"}.intersection(roles):
        authorize(context, permission="students.read", resource_institution_id=principal.institution.id)
        return query
    if "HOD" in roles:
        departments = _scope_ids(principal, "department", "students.read")
        return query.where(StudentProfile.department_id.in_(departments)) if departments else query.where(StudentProfile.id == "__no_matching_scope__")
    if "Class Advisor" in roles:
        classes = _scope_ids(principal, "class", "students.read")
        return query.where(StudentProfile.class_id.in_(classes)) if classes else query.where(StudentProfile.id == "__no_matching_scope__")
    if "Student" in roles:
        ids = context.own_student_ids
        return query.where(StudentProfile.id.in_(ids)) if ids else query.where(StudentProfile.id == "__no_matching_scope__")
    if "Parent" in roles:
        ids = context.linked_student_ids
        return query.where(StudentProfile.id.in_(ids)) if ids else query.where(StudentProfile.id == "__no_matching_scope__")
    raise HTTPException(status_code=403, detail="You do not have access to student records")


def _authorize_profile(principal: AuthPrincipal, profile: StudentProfile) -> None:
    context = principal.access_context
    if "HOD" in context.roles:
        scope_type, scope_id = "department", profile.department_id
    elif "Class Advisor" in context.roles:
        scope_type, scope_id = "class", profile.class_id
    else:
        scope_type, scope_id = None, None
    try:
        authorize(
            context,
            permission="students.read",
            resource_institution_id=profile.institution_id,
            owner_user_id=profile.user_id,
            student_id=profile.id,
            scope_type=scope_type,
            scope_id=scope_id,
        )
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You do not have access to this student record") from exc


@router.get("")
def list_students(
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=25, ge=1, le=100),
) -> dict:
    query = _student_query(principal)
    if search:
        needle = f"%{search.strip()}%"
        query = query.join(User, User.id == StudentProfile.user_id).where(
            or_(
                StudentProfile.registration_number.ilike(needle),
                User.full_name.ilike(needle),
                User.email.ilike(needle),
            )
        )
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = db.scalars(
        query.order_by(StudentProfile.registration_number)
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()
    for profile in rows:
        _authorize_profile(principal, profile)
    return {"items": [_serialize(db, profile) for profile in rows], "total": total, "page": page, "limit": limit}


@router.get("/me")
def my_student_profile(
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
    return _serialize(db, profile)


@router.get("/{student_id}")
def get_student(
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
    _authorize_profile(principal, profile)
    return _serialize(db, profile)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_student(
    payload: StudentCreatePayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    context = principal.access_context
    try:
        if "Admissions" in context.roles:
            authorize(context, permission="admissions.manage", resource_institution_id=principal.institution.id)
        else:
            authorize(context, permission="students.write", resource_institution_id=principal.institution.id)
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You cannot create student records") from exc

    user = db.scalar(select(User).where(
        User.id == payload.user_id,
        User.institution_id == principal.institution.id,
        User.is_active.is_(True),
    ))
    if user is None or "Student" not in {role.role for role in user.roles}:
        raise HTTPException(status_code=422, detail="A valid active student account is required")

    profile = StudentProfile(
        institution_id=principal.institution.id,
        user_id=user.id,
        registration_number=payload.registration_number.strip().upper(),
        department_id=payload.department_id,
        programme=payload.programme,
        semester=payload.semester,
        class_id=payload.class_id,
    )
    db.add(profile)
    try:
        db.flush()
        db.add(AuditEvent(
            institution_id=principal.institution.id,
            actor_user_id=principal.user.id,
            action="student.profile.created",
            resource_type="student_profile",
            resource_id=profile.id,
            details={},
        ))
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Registration number or user already has a student profile") from exc
    db.refresh(profile)
    return _serialize(db, profile)


@router.patch("/{student_id}")
def update_student(
    student_id: str,
    payload: StudentUpdatePayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    try:
        authorize(principal.access_context, permission="students.write", resource_institution_id=principal.institution.id)
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You cannot modify student records") from exc
    profile = db.scalar(select(StudentProfile).where(
        StudentProfile.id == student_id,
        StudentProfile.institution_id == principal.institution.id,
    ))
    if profile is None:
        raise HTTPException(status_code=404, detail="Student profile not found")
    changes = payload.model_dump(exclude_unset=True)
    if "registration_number" in changes and changes["registration_number"] is not None:
        changes["registration_number"] = changes["registration_number"].strip().upper()
    for key, value in changes.items():
        setattr(profile, key, value)
    db.add(AuditEvent(
        institution_id=principal.institution.id,
        actor_user_id=principal.user.id,
        action="student.profile.updated",
        resource_type="student_profile",
        resource_id=profile.id,
        details={"changed_fields": sorted(changes.keys())},
    ))
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Registration number is already in use") from exc
    db.refresh(profile)
    return _serialize(db, profile)


@router.delete("/{student_id}")
def deactivate_student(
    student_id: str,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    try:
        authorize(principal.access_context, permission="students.write", resource_institution_id=principal.institution.id)
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You cannot deactivate student records") from exc
    profile = db.scalar(select(StudentProfile).where(
        StudentProfile.id == student_id,
        StudentProfile.institution_id == principal.institution.id,
    ))
    if profile is None:
        raise HTTPException(status_code=404, detail="Student profile not found")
    profile.is_active = False
    db.add(AuditEvent(
        institution_id=principal.institution.id,
        actor_user_id=principal.user.id,
        action="student.profile.deactivated",
        resource_type="student_profile",
        resource_id=profile.id,
        details={},
    ))
    db.commit()
    return {"success": True}
