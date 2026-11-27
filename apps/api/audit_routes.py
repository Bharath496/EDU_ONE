"""Institution-scoped audit event read API."""
from __future__ import annotations

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from auth_routes import AuthPrincipal, get_current_principal
from authorization import AuthorizationError, authorize
from database import get_db
from models import AuditEvent, User

router = APIRouter(prefix="/v1/audit", tags=["audit"])


@router.get("")
def list_audit_events(
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
    action: str | None = Query(default=None, max_length=100),
    resource_type: str | None = Query(default=None, max_length=80),
    actor_user_id: str | None = None,
    start_at: datetime | None = None,
    end_at: datetime | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=1, le=200),
) -> dict:
    try:
        authorize(
            principal.access_context,
            permission="audit.read",
            resource_institution_id=principal.institution.id,
        )
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You cannot read institutional audit events") from exc

    filters = [AuditEvent.institution_id == principal.institution.id]
    if action:
        filters.append(AuditEvent.action == action.strip())
    if resource_type:
        filters.append(AuditEvent.resource_type == resource_type.strip())
    if actor_user_id:
        filters.append(AuditEvent.actor_user_id == actor_user_id)
    if start_at:
        filters.append(AuditEvent.created_at >= start_at)
    if end_at:
        filters.append(AuditEvent.created_at <= end_at)
    if start_at and end_at and end_at < start_at:
        raise HTTPException(status_code=422, detail="end_at must be after start_at")

    query = select(AuditEvent).where(*filters)
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = db.execute(
        query.outerjoin(
            User,
            and_(
                User.id == AuditEvent.actor_user_id,
                User.institution_id == principal.institution.id,
            ),
        )
        .add_columns(User.full_name, User.email)
        .order_by(AuditEvent.created_at.desc(), AuditEvent.id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()
    items = [{
        "id": event.id,
        "action": event.action,
        "resource_type": event.resource_type,
        "resource_id": event.resource_id,
        "actor_user_id": event.actor_user_id,
        "actor_name": actor_name,
        "actor_email": actor_email,
        "details": event.details,
        "created_at": event.created_at.isoformat(),
    } for event, actor_name, actor_email in rows]
    return {"items": items, "total": total, "page": page, "limit": limit}
