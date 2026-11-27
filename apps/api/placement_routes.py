"""Placement opportunities and student application tracking."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth_routes import AuthPrincipal, get_current_principal
from authorization import AuthorizationError, ROLE_PERMISSIONS, authorize
from database import get_db
from models import AuditEvent, PlacementApplication, PlacementOpportunity, StudentProfile, User

router = APIRouter(prefix="/v1/placements", tags=["placements"])


class OpportunityCreatePayload(BaseModel):
    company: str = Field(min_length=1, max_length=180)
    title: str = Field(min_length=1, max_length=180)
    description: str = Field(min_length=1, max_length=12000)
    location: str | None = Field(default=None, max_length=160)
    employment_type: Literal["full_time", "internship", "part_time", "contract"]
    eligibility_text: str | None = Field(default=None, max_length=6000)
    application_deadline: datetime


class OpportunityStatusPayload(BaseModel):
    status: Literal["draft", "published", "closed"]


class PlacementApplyPayload(BaseModel):
    application_note: str | None = Field(default=None, max_length=6000)


class ApplicationStatusPayload(BaseModel):
    status: Literal["shortlisted", "interview", "selected", "rejected"]


def _require_manage(principal: AuthPrincipal) -> None:
    try:
        authorize(principal.access_context, permission="placements.manage", resource_institution_id=principal.institution.id)
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="Only placement staff can manage opportunities and applications") from exc


def _opportunity_dict(item: PlacementOpportunity) -> dict:
    return {
        "id": item.id, "company": item.company, "title": item.title,
        "description": item.description, "location": item.location,
        "employment_type": item.employment_type, "eligibility_text": item.eligibility_text,
        "application_deadline": item.application_deadline.isoformat(), "status": item.status,
    }


def _application_dict(db: Session, item: PlacementApplication) -> dict:
    opportunity = db.get(PlacementOpportunity, item.opportunity_id)
    profile = db.get(StudentProfile, item.student_profile_id)
    user = db.get(User, profile.user_id) if profile else None
    return {
        "id": item.id, "opportunity_id": item.opportunity_id,
        "opportunity_title": opportunity.title if opportunity else None,
        "company": opportunity.company if opportunity else None,
        "student_profile_id": item.student_profile_id,
        "registration_number": profile.registration_number if profile else None,
        "student_name": user.full_name if user else None,
        "application_note": item.application_note, "status": item.status,
        "applied_at": item.applied_at.isoformat(),
    }


@router.get("/opportunities")
def list_opportunities(
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
    status_filter: str | None = Query(default=None, alias="status"),
) -> list[dict]:
    try:
        authorize(principal.access_context, permission="placements.read", resource_institution_id=principal.institution.id)
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You cannot view placement opportunities") from exc
    query = select(PlacementOpportunity).where(PlacementOpportunity.institution_id == principal.institution.id)
    can_manage = any("placements.manage" in ROLE_PERMISSIONS.get(role, frozenset()) for role in principal.roles)
    if not can_manage:
        query = query.where(PlacementOpportunity.status == "published")
    elif status_filter:
        query = query.where(PlacementOpportunity.status == status_filter)
    rows = db.scalars(query.order_by(PlacementOpportunity.application_deadline)).all()
    return [_opportunity_dict(row) for row in rows]


@router.post("/opportunities", status_code=status.HTTP_201_CREATED)
def create_opportunity(
    payload: OpportunityCreatePayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    _require_manage(principal)
    if payload.application_deadline.tzinfo is None or payload.application_deadline <= datetime.now(timezone.utc):
        raise HTTPException(status_code=422, detail="Application deadline must be timezone-aware and in the future")
    item = PlacementOpportunity(
        institution_id=principal.institution.id,
        company=payload.company.strip(), title=payload.title.strip(),
        description=payload.description, location=payload.location,
        employment_type=payload.employment_type, eligibility_text=payload.eligibility_text,
        application_deadline=payload.application_deadline,
        status="published", created_by=principal.user.id,
    )
    db.add(item)
    db.flush()
    db.add(AuditEvent(
        institution_id=principal.institution.id, actor_user_id=principal.user.id,
        action="placements.opportunity.created", resource_type="placement_opportunity",
        resource_id=item.id, details={},
    ))
    db.commit()
    return _opportunity_dict(item)


@router.patch("/opportunities/{opportunity_id}/status")
def update_opportunity_status(
    opportunity_id: str,
    payload: OpportunityStatusPayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    _require_manage(principal)
    item = db.scalar(select(PlacementOpportunity).where(
        PlacementOpportunity.id == opportunity_id,
        PlacementOpportunity.institution_id == principal.institution.id,
    ))
    if item is None:
        raise HTTPException(status_code=404, detail="Placement opportunity not found")
    item.status = payload.status
    db.add(AuditEvent(
        institution_id=principal.institution.id, actor_user_id=principal.user.id,
        action="placements.opportunity.status_updated", resource_type="placement_opportunity",
        resource_id=item.id, details={"status": item.status},
    ))
    db.commit()
    return _opportunity_dict(item)


@router.post("/opportunities/{opportunity_id}/apply", status_code=status.HTTP_201_CREATED)
def apply_to_opportunity(
    opportunity_id: str,
    payload: PlacementApplyPayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    if "Student" not in principal.roles:
        raise HTTPException(status_code=403, detail="Only student accounts can apply")
    profile = db.scalar(select(StudentProfile).where(
        StudentProfile.institution_id == principal.institution.id,
        StudentProfile.user_id == principal.user.id,
        StudentProfile.is_active.is_(True),
    ))
    if profile is None:
        raise HTTPException(status_code=404, detail="Student profile not found")
    try:
        authorize(
            principal.access_context, permission="placements.apply",
            resource_institution_id=principal.institution.id,
            owner_user_id=profile.user_id, student_id=profile.id,
        )
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You cannot apply from this student account") from exc
    item = db.scalar(select(PlacementOpportunity).where(
        PlacementOpportunity.id == opportunity_id,
        PlacementOpportunity.institution_id == principal.institution.id,
        PlacementOpportunity.status == "published",
    ))
    if item is None:
        raise HTTPException(status_code=404, detail="Placement opportunity not found")
    deadline = item.application_deadline if item.application_deadline.tzinfo else item.application_deadline.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > deadline:
        raise HTTPException(status_code=409, detail="The application deadline has passed")
    application = PlacementApplication(
        institution_id=principal.institution.id,
        opportunity_id=item.id,
        student_profile_id=profile.id,
        application_note=payload.application_note,
        status="applied",
    )
    db.add(application)
    try:
        db.flush()
        db.add(AuditEvent(
            institution_id=principal.institution.id, actor_user_id=principal.user.id,
            action="placements.application.submitted", resource_type="placement_application",
            resource_id=application.id, details={"opportunity_id": item.id},
        ))
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="You have already applied to this opportunity") from exc
    return _application_dict(db, application)


@router.get("/applications/me")
def my_applications(
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> list[dict]:
    if "Student" not in principal.roles:
        raise HTTPException(status_code=403, detail="This endpoint is available to student accounts")
    profile = db.scalar(select(StudentProfile).where(
        StudentProfile.institution_id == principal.institution.id,
        StudentProfile.user_id == principal.user.id,
    ))
    if profile is None:
        raise HTTPException(status_code=404, detail="Student profile not found")
    rows = db.scalars(select(PlacementApplication).where(
        PlacementApplication.institution_id == principal.institution.id,
        PlacementApplication.student_profile_id == profile.id,
    ).order_by(PlacementApplication.applied_at.desc())).all()
    return [_application_dict(db, row) for row in rows]


@router.get("/opportunities/{opportunity_id}/applications")
def list_opportunity_applications(
    opportunity_id: str,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> list[dict]:
    _require_manage(principal)
    item = db.scalar(select(PlacementOpportunity).where(
        PlacementOpportunity.id == opportunity_id,
        PlacementOpportunity.institution_id == principal.institution.id,
    ))
    if item is None:
        raise HTTPException(status_code=404, detail="Placement opportunity not found")
    rows = db.scalars(select(PlacementApplication).where(
        PlacementApplication.institution_id == principal.institution.id,
        PlacementApplication.opportunity_id == item.id,
    ).order_by(PlacementApplication.applied_at)).all()
    return [_application_dict(db, row) for row in rows]


@router.patch("/applications/{application_id}/status")
def update_application_status(
    application_id: str,
    payload: ApplicationStatusPayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    _require_manage(principal)
    item = db.scalar(select(PlacementApplication).where(
        PlacementApplication.id == application_id,
        PlacementApplication.institution_id == principal.institution.id,
    ))
    if item is None:
        raise HTTPException(status_code=404, detail="Placement application not found")
    item.status = payload.status
    item.status_updated_by = principal.user.id
    item.updated_at = datetime.now(timezone.utc)
    db.add(AuditEvent(
        institution_id=principal.institution.id, actor_user_id=principal.user.id,
        action="placements.application.status_updated", resource_type="placement_application",
        resource_id=item.id, details={"status": item.status},
    ))
    db.commit()
    return _application_dict(db, item)
