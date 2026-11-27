"""Institution-scoped user provisioning and relationship administration."""
from __future__ import annotations

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth_routes import AuthPrincipal, get_current_principal
from authorization import AuthorizationError, ROLE_PERMISSIONS, authorize
from database import get_db
from models import AcademicCourse, AuditEvent, ParentStudentLink, StaffAssignment, StudentProfile, User, UserRole
from security import hash_password

router = APIRouter(prefix="/v1", tags=["user-administration"])

AssignableRole = Literal[
    "Student", "Parent", "Faculty", "HOD", "Class Advisor", "Principal",
    "Vice Principal", "Exam Cell", "Accounts", "Librarian",
    "Placement Officer", "HR", "Admissions", "Hostel Warden",
    "Transport Coordinator",
]


class UserCreatePayload(BaseModel):
    email: str = Field(min_length=3, max_length=254, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    full_name: str = Field(min_length=2, max_length=160)
    password: str = Field(min_length=12, max_length=1024)
    roles: list[AssignableRole] = Field(min_length=1, max_length=5)
    department_id: str | None = None


class UserStatusPayload(BaseModel):
    is_active: bool
    is_locked: bool


class StaffAssignmentPayload(BaseModel):
    user_id: str
    scope_type: Literal["class", "course"]
    scope_id: str
    permission: str = Field(min_length=3, max_length=80)


class ParentLinkPayload(BaseModel):
    parent_user_id: str
    student_profile_id: str
    relationship_label: str = Field(default="Parent", min_length=2, max_length=40)


def _require_admin(principal: AuthPrincipal) -> None:
    try:
        authorize(principal.access_context, permission="users.manage", resource_institution_id=principal.institution.id)
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="Only an authorized institution administrator can perform this action") from exc


def _user_dict(user: User) -> dict:
    return {
        "id": user.id, "email": user.email, "name": user.full_name,
        "is_active": user.is_active, "is_locked": user.is_locked,
        "created_at": user.created_at.isoformat(),
        "roles": [{"role": item.role, "department_id": item.department_id} for item in sorted(user.roles, key=lambda row: row.role)],
    }


@router.get("/users")
def list_users(
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
    role: str | None = None,
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
) -> dict:
    _require_admin(principal)
    query = select(User).where(User.institution_id == principal.institution.id)
    if search:
        needle = f"%{search.strip()}%"
        query = query.where(User.full_name.ilike(needle) | User.email.ilike(needle))
    rows = db.scalars(query.order_by(User.full_name).offset((page - 1) * limit).limit(limit)).unique().all()
    items = [_user_dict(row) for row in rows]
    if role:
        items = [item for item in items if role in {grant["role"] for grant in item["roles"]}]
    return {"items": items, "page": page, "limit": limit}


@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreatePayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    _require_admin(principal)
    roles = list(dict.fromkeys(payload.roles))
    if len(roles) != len(payload.roles):
        raise HTTPException(status_code=422, detail="Duplicate role assignments are not allowed")
    user = User(
        institution_id=principal.institution.id,
        email=payload.email.strip().lower(),
        full_name=payload.full_name.strip(),
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.flush()
        for role in roles:
            db.add(UserRole(user_id=user.id, role=role, department_id=payload.department_id if role == "HOD" else None))
        db.add(AuditEvent(
            institution_id=principal.institution.id, actor_user_id=principal.user.id,
            action="users.created", resource_type="user", resource_id=user.id,
            details={"roles": roles},
        ))
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists in the institution") from exc
    db.refresh(user)
    return _user_dict(user)


@router.patch("/users/{user_id}/status")
def update_user_status(
    user_id: str,
    payload: UserStatusPayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    _require_admin(principal)
    if user_id == principal.user.id and (not payload.is_active or payload.is_locked):
        raise HTTPException(status_code=409, detail="You cannot deactivate or lock your own administrator account")
    user = db.scalar(select(User).where(User.id == user_id, User.institution_id == principal.institution.id))
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = payload.is_active
    user.is_locked = payload.is_locked
    db.add(AuditEvent(
        institution_id=principal.institution.id, actor_user_id=principal.user.id,
        action="users.status.updated", resource_type="user", resource_id=user.id,
        details={"is_active": user.is_active, "is_locked": user.is_locked},
    ))
    db.commit()
    return _user_dict(user)


@router.post("/staff-assignments", status_code=status.HTTP_201_CREATED)
def create_staff_assignment(
    payload: StaffAssignmentPayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    _require_admin(principal)
    user = db.scalar(select(User).where(
        User.id == payload.user_id, User.institution_id == principal.institution.id, User.is_active.is_(True),
    ))
    if user is None:
        raise HTTPException(status_code=404, detail="Staff user not found")
    roles = {item.role for item in user.roles}
    expected_role = "Faculty" if payload.scope_type == "course" else "Class Advisor"
    if expected_role not in roles:
        raise HTTPException(status_code=422, detail=f"User must have the {expected_role} role for this assignment")
    if not any(payload.permission in ROLE_PERMISSIONS.get(role, frozenset()) for role in roles):
        raise HTTPException(status_code=422, detail="The user's role does not grant this permission")
    if payload.scope_type == "course":
        course = db.scalar(select(AcademicCourse).where(
            AcademicCourse.id == payload.scope_id, AcademicCourse.institution_id == principal.institution.id,
        ))
        if course is None:
            raise HTTPException(status_code=422, detail="Course scope must belong to this institution")
    assignment = StaffAssignment(
        institution_id=principal.institution.id, user_id=user.id,
        scope_type=payload.scope_type, scope_id=payload.scope_id, permission=payload.permission,
    )
    db.add(assignment)
    db.flush()
    db.add(AuditEvent(
        institution_id=principal.institution.id, actor_user_id=principal.user.id,
        action="staff.assignment.created", resource_type="staff_assignment",
        resource_id=assignment.id,
        details={"user_id": user.id, "scope_type": payload.scope_type, "scope_id": payload.scope_id, "permission": payload.permission},
    ))
    db.commit()
    return {"id": assignment.id, "user_id": assignment.user_id, "scope_type": assignment.scope_type, "scope_id": assignment.scope_id, "permission": assignment.permission}


@router.post("/parent-links", status_code=status.HTTP_201_CREATED)
def create_parent_link(
    payload: ParentLinkPayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    _require_admin(principal)
    parent = db.scalar(select(User).where(
        User.id == payload.parent_user_id, User.institution_id == principal.institution.id, User.is_active.is_(True),
    ))
    profile = db.scalar(select(StudentProfile).where(
        StudentProfile.id == payload.student_profile_id,
        StudentProfile.institution_id == principal.institution.id,
        StudentProfile.is_active.is_(True),
    ))
    if parent is None or "Parent" not in {item.role for item in parent.roles} or profile is None:
        raise HTTPException(status_code=422, detail="A valid parent account and student profile from this institution are required")
    link = ParentStudentLink(
        institution_id=principal.institution.id, parent_user_id=parent.id,
        student_profile_id=profile.id, relationship_label=payload.relationship_label.strip(),
        is_verified=False,
    )
    db.add(link)
    try:
        db.flush()
        db.add(AuditEvent(
            institution_id=principal.institution.id, actor_user_id=principal.user.id,
            action="parent.student_link.created", resource_type="parent_student_link",
            resource_id=link.id, details={"parent_user_id": parent.id, "student_profile_id": profile.id},
        ))
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="A parent/student link already exists") from exc
    return {"id": link.id, "is_verified": link.is_verified, "relationship": link.relationship_label}


@router.post("/parent-links/{link_id}/verify")
def verify_parent_link(
    link_id: str,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    _require_admin(principal)
    link = db.scalar(select(ParentStudentLink).where(
        ParentStudentLink.id == link_id, ParentStudentLink.institution_id == principal.institution.id,
    ))
    if link is None:
        raise HTTPException(status_code=404, detail="Parent/student link not found")
    link.is_verified = True
    db.add(AuditEvent(
        institution_id=principal.institution.id, actor_user_id=principal.user.id,
        action="parent.student_link.verified", resource_type="parent_student_link",
        resource_id=link.id, details={},
    ))
    db.commit()
    return {"id": link.id, "is_verified": link.is_verified}


@router.get("/parent-links")
def list_parent_links(
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
    verified: bool | None = None,
) -> list[dict]:
    _require_admin(principal)
    query = select(ParentStudentLink).where(ParentStudentLink.institution_id == principal.institution.id)
    if verified is not None:
        query = query.where(ParentStudentLink.is_verified.is_(verified))
    return [{
        "id": link.id, "parent_user_id": link.parent_user_id,
        "student_profile_id": link.student_profile_id,
        "relationship": link.relationship_label, "is_verified": link.is_verified,
    } for link in db.scalars(query).all()]
