"""Role-scoped announcements and student grievance workflows."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth_routes import AuthPrincipal, get_current_principal
from authorization import AuthorizationError, authorize
from database import get_db
from models import (
    Announcement, AnnouncementRead, AuditEvent, GrievanceMessage,
    GrievanceTicket, ParentStudentLink, StudentProfile, User,
)

announcements_router = APIRouter(prefix="/v1/announcements", tags=["announcements"])
support_router = APIRouter(prefix="/v1/support", tags=["student-support"])


class AnnouncementCreatePayload(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    body: str = Field(min_length=1, max_length=12000)
    category: str = Field(default="general", min_length=2, max_length=40)
    audience_role: str | None = Field(default=None, max_length=60)
    department_id: str | None = None
    class_id: str | None = None


class TicketCreatePayload(BaseModel):
    student_profile_id: str
    category: str = Field(min_length=2, max_length=60)
    subject: str = Field(min_length=3, max_length=180)
    description: str = Field(min_length=5, max_length=12000)


class TicketMessagePayload(BaseModel):
    body: str = Field(min_length=1, max_length=8000)


class TicketUpdatePayload(BaseModel):
    status: Literal["open", "in_progress", "resolved", "closed"]
    assigned_to: str | None = None
    resolution: str | None = Field(default=None, max_length=12000)


def _student_scope_ids(principal: AuthPrincipal) -> set[str]:
    ids = set(principal.access_context.own_student_ids)
    ids.update(principal.access_context.linked_student_ids)
    return ids


def _announcement_visible(db: Session, principal: AuthPrincipal, item: Announcement) -> bool:
    context = principal.access_context
    if item.audience_role and item.audience_role not in context.roles:
        return False
    if item.department_id:
        department_ids = {
            scope_id for scope_type, scope_id, permission in context.assignments
            if scope_type == "department" and permission == "students.read"
        }
        profile_ids = _student_scope_ids(principal)
        profile_departments = set(db.scalars(select(StudentProfile.department_id).where(
            StudentProfile.institution_id == principal.institution.id,
            StudentProfile.id.in_(profile_ids),
        )).all()) if profile_ids else set()
        if item.department_id not in department_ids and item.department_id not in profile_departments:
            if not {"College Admin", "Principal", "Vice Principal"}.intersection(context.roles):
                return False
    if item.class_id:
        class_ids = {
            scope_id for scope_type, scope_id, permission in context.assignments
            if scope_type == "class" and permission == "students.read"
        }
        profile_ids = _student_scope_ids(principal)
        profile_classes = set(db.scalars(select(StudentProfile.class_id).where(
            StudentProfile.institution_id == principal.institution.id,
            StudentProfile.id.in_(profile_ids),
        )).all()) if profile_ids else set()
        if item.class_id not in class_ids and item.class_id not in profile_classes:
            if not {"College Admin", "Principal", "Vice Principal"}.intersection(context.roles):
                return False
    return True


def _announcement_dict(db: Session, principal: AuthPrincipal, item: Announcement) -> dict:
    read = db.scalar(select(AnnouncementRead.id).where(
        AnnouncementRead.announcement_id == item.id,
        AnnouncementRead.user_id == principal.user.id,
    ))
    return {
        "id": item.id, "title": item.title, "body": item.body,
        "category": item.category, "audience_role": item.audience_role,
        "department_id": item.department_id, "class_id": item.class_id,
        "published_at": item.published_at.isoformat() if item.published_at else None,
        "is_read": read is not None,
    }


@announcements_router.get("")
def list_announcements(
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
    category: str | None = None,
) -> list[dict]:
    query = select(Announcement).where(
        Announcement.institution_id == principal.institution.id,
        Announcement.status == "published",
    )
    if category:
        query = query.where(Announcement.category == category)
    rows = db.scalars(query.order_by(Announcement.published_at.desc())).all()
    visible = [row for row in rows if _announcement_visible(db, principal, row)]
    return [_announcement_dict(db, principal, row) for row in visible]


@announcements_router.post("", status_code=status.HTTP_201_CREATED)
def create_announcement(
    payload: AnnouncementCreatePayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    context = principal.access_context
    try:
        if "HOD" in context.roles:
            authorize(
                context, permission="notices.publish",
                resource_institution_id=principal.institution.id,
                scope_type="department", scope_id=payload.department_id,
            )
        elif "Class Advisor" in context.roles:
            authorize(
                context, permission="notices.publish",
                resource_institution_id=principal.institution.id,
                scope_type="class", scope_id=payload.class_id,
            )
        else:
            authorize(context, permission="notices.publish", resource_institution_id=principal.institution.id)
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You cannot publish this announcement or scope it to this audience") from exc
    if payload.department_id and payload.class_id:
        raise HTTPException(status_code=422, detail="Choose either a department scope or a class scope")
    item = Announcement(
        institution_id=principal.institution.id,
        title=payload.title.strip(), body=payload.body,
        category=payload.category.strip(),
        audience_role=payload.audience_role,
        department_id=payload.department_id,
        class_id=payload.class_id,
        status="published",
        created_by=principal.user.id,
        published_at=datetime.now(timezone.utc),
    )
    db.add(item)
    db.flush()
    db.add(AuditEvent(
        institution_id=principal.institution.id, actor_user_id=principal.user.id,
        action="announcement.published", resource_type="announcement",
        resource_id=item.id, details={"category": item.category},
    ))
    db.commit()
    return _announcement_dict(db, principal, item)


@announcements_router.post("/{announcement_id}/read")
def mark_announcement_read(
    announcement_id: str,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    item = db.scalar(select(Announcement).where(
        Announcement.id == announcement_id,
        Announcement.institution_id == principal.institution.id,
        Announcement.status == "published",
    ))
    if item is None:
        raise HTTPException(status_code=404, detail="Announcement not found")
    if not _announcement_visible(db, principal, item):
        raise HTTPException(status_code=403, detail="This announcement is not addressed to your account")
    existing = db.scalar(select(AnnouncementRead).where(
        AnnouncementRead.announcement_id == item.id,
        AnnouncementRead.user_id == principal.user.id,
    ))
    if existing:
        return {"announcement_id": item.id, "is_read": True}
    db.add(AnnouncementRead(
        institution_id=principal.institution.id,
        announcement_id=item.id,
        user_id=principal.user.id,
    ))
    db.commit()
    return {"announcement_id": item.id, "is_read": True}


def _ticket_access(principal: AuthPrincipal, ticket: GrievanceTicket, db: Session) -> StudentProfile:
    profile = db.scalar(select(StudentProfile).where(
        StudentProfile.id == ticket.student_profile_id,
        StudentProfile.institution_id == principal.institution.id,
    ))
    if profile is None:
        raise HTTPException(status_code=404, detail="Student profile not found")
    if "support.manage" in principal.access_context.roles:
        return profile
    try:
        authorize(
            principal.access_context,
            permission="support.create",
            resource_institution_id=ticket.institution_id,
            owner_user_id=profile.user_id,
            student_id=profile.id,
        )
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You cannot access this support ticket") from exc
    return profile


def _ticket_dict(db: Session, principal: AuthPrincipal, ticket: GrievanceTicket, include_messages: bool = False) -> dict:
    profile = db.get(StudentProfile, ticket.student_profile_id)
    result = {
        "id": ticket.id, "student_profile_id": ticket.student_profile_id,
        "registration_number": profile.registration_number if profile else None,
        "category": ticket.category, "subject": ticket.subject,
        "description": ticket.description, "priority": ticket.priority,
        "status": ticket.status, "assigned_to": ticket.assigned_to,
        "resolution": ticket.resolution, "created_at": ticket.created_at.isoformat(),
        "updated_at": ticket.updated_at.isoformat(),
    }
    if include_messages:
        messages = db.scalars(select(GrievanceMessage).where(
            GrievanceMessage.ticket_id == ticket.id,
            GrievanceMessage.institution_id == principal.institution.id,
        ).order_by(GrievanceMessage.created_at)).all()
        result["messages"] = [{
            "id": message.id, "sender_user_id": message.sender_user_id,
            "body": message.body, "created_at": message.created_at.isoformat(),
        } for message in messages]
    return result


@support_router.post("/tickets", status_code=status.HTTP_201_CREATED)
def create_ticket(
    payload: TicketCreatePayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    profile = db.scalar(select(StudentProfile).where(
        StudentProfile.id == payload.student_profile_id,
        StudentProfile.institution_id == principal.institution.id,
        StudentProfile.is_active.is_(True),
    ))
    if profile is None:
        raise HTTPException(status_code=422, detail="Student profile must belong to this institution")
    try:
        authorize(
            principal.access_context,
            permission="support.create",
            resource_institution_id=principal.institution.id,
            owner_user_id=profile.user_id,
            student_id=profile.id,
        )
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You cannot create a ticket for this student") from exc
    if "Parent" in principal.roles and profile.id not in principal.access_context.linked_student_ids:
        raise HTTPException(status_code=403, detail="A verified parent/student link is required")
    ticket = GrievanceTicket(
        institution_id=principal.institution.id,
        student_profile_id=profile.id,
        created_by=principal.user.id,
        category=payload.category.strip(),
        subject=payload.subject.strip(),
        description=payload.description,
        priority="normal",
        status="open",
    )
    db.add(ticket)
    db.flush()
    db.add(AuditEvent(
        institution_id=principal.institution.id, actor_user_id=principal.user.id,
        action="support.ticket.created", resource_type="grievance_ticket",
        resource_id=ticket.id, details={"category": ticket.category},
    ))
    db.commit()
    return _ticket_dict(db, principal, ticket)


@support_router.get("/tickets")
def list_tickets(
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
    status_filter: str | None = Query(default=None, alias="status"),
) -> list[dict]:
    query = select(GrievanceTicket).where(GrievanceTicket.institution_id == principal.institution.id)
    if "support.manage" not in principal.access_context.roles:
        student_ids = _student_scope_ids(principal)
        if not student_ids:
            raise HTTPException(status_code=403, detail="You do not have access to support tickets")
        query = query.where(GrievanceTicket.student_profile_id.in_(student_ids))
    if status_filter:
        query = query.where(GrievanceTicket.status == status_filter)
    rows = db.scalars(query.order_by(GrievanceTicket.created_at.desc())).all()
    return [_ticket_dict(db, principal, row) for row in rows]


@support_router.get("/tickets/{ticket_id}")
def get_ticket(
    ticket_id: str,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    ticket = db.scalar(select(GrievanceTicket).where(
        GrievanceTicket.id == ticket_id,
        GrievanceTicket.institution_id == principal.institution.id,
    ))
    if ticket is None:
        raise HTTPException(status_code=404, detail="Support ticket not found")
    _ticket_access(principal, ticket, db)
    return _ticket_dict(db, principal, ticket, include_messages=True)


@support_router.post("/tickets/{ticket_id}/messages", status_code=status.HTTP_201_CREATED)
def add_ticket_message(
    ticket_id: str,
    payload: TicketMessagePayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    ticket = db.scalar(select(GrievanceTicket).where(
        GrievanceTicket.id == ticket_id,
        GrievanceTicket.institution_id == principal.institution.id,
    ))
    if ticket is None:
        raise HTTPException(status_code=404, detail="Support ticket not found")
    _ticket_access(principal, ticket, db)
    if ticket.status in {"resolved", "closed"} and "support.manage" not in principal.access_context.roles:
        raise HTTPException(status_code=409, detail="This ticket is closed for new messages")
    message = GrievanceMessage(
        institution_id=principal.institution.id,
        ticket_id=ticket.id,
        sender_user_id=principal.user.id,
        body=payload.body,
    )
    db.add(message)
    ticket.updated_at = datetime.now(timezone.utc)
    db.add(AuditEvent(
        institution_id=principal.institution.id, actor_user_id=principal.user.id,
        action="support.ticket.message_added", resource_type="grievance_ticket",
        resource_id=ticket.id, details={},
    ))
    db.commit()
    return {"id": message.id, "ticket_id": ticket.id, "created_at": message.created_at.isoformat()}


@support_router.patch("/tickets/{ticket_id}")
def update_ticket(
    ticket_id: str,
    payload: TicketUpdatePayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    if "support.manage" not in principal.access_context.roles:
        raise HTTPException(status_code=403, detail="Only support staff can update ticket status")
    ticket = db.scalar(select(GrievanceTicket).where(
        GrievanceTicket.id == ticket_id,
        GrievanceTicket.institution_id == principal.institution.id,
    ))
    if ticket is None:
        raise HTTPException(status_code=404, detail="Support ticket not found")
    if payload.assigned_to:
        assignee = db.scalar(select(User).where(
            User.id == payload.assigned_to,
            User.institution_id == principal.institution.id,
            User.is_active.is_(True),
        ))
        if assignee is None or not ({"Support Staff", "College Admin", "Principal", "Vice Principal"}.intersection({role.role for role in assignee.roles})):
            raise HTTPException(status_code=422, detail="Assignee must be active support staff or an authorized administrator")
    ticket.status = payload.status
    ticket.assigned_to = payload.assigned_to
    ticket.resolution = payload.resolution
    ticket.updated_at = datetime.now(timezone.utc)
    db.add(AuditEvent(
        institution_id=principal.institution.id, actor_user_id=principal.user.id,
        action="support.ticket.updated", resource_type="grievance_ticket",
        resource_id=ticket.id, details={"status": ticket.status},
    ))
    db.commit()
    return _ticket_dict(db, principal, ticket, include_messages=True)
