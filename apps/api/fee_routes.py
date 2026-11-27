"""Tenant-scoped invoices and payment verification workflows."""
from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth_routes import AuthPrincipal, get_current_principal
from authorization import AuthorizationError, authorize
from database import get_db
from models import AuditEvent, FeeInvoice, FeePayment, ParentStudentLink, StudentProfile, User

router = APIRouter(prefix="/v1/fees", tags=["fees"])


class InvoiceCreatePayload(BaseModel):
    student_profile_id: str
    invoice_number: str = Field(min_length=1, max_length=60)
    fee_type: str = Field(min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=300)
    amount: float = Field(gt=0, le=10_000_000)
    due_date: date


class PaymentCreatePayload(BaseModel):
    amount: float = Field(gt=0, le=10_000_000)
    method: Literal["upi", "bank_transfer", "cash", "cheque", "dd"]
    payment_reference: str | None = Field(default=None, max_length=120)


def _paid_amount(db: Session, invoice_id: str) -> Decimal:
    value = db.scalar(select(func.coalesce(func.sum(FeePayment.amount), 0)).where(
        FeePayment.invoice_id == invoice_id,
        FeePayment.status == "verified",
    ))
    return Decimal(str(value or 0))


def _pending_amount(db: Session, invoice_id: str) -> Decimal:
    value = db.scalar(select(func.coalesce(func.sum(FeePayment.amount), 0)).where(
        FeePayment.invoice_id == invoice_id,
        FeePayment.status == "pending",
    ))
    return Decimal(str(value or 0))


def _invoice_dict(db: Session, invoice: FeeInvoice) -> dict:
    amount = Decimal(str(invoice.amount))
    paid = _paid_amount(db, invoice.id)
    outstanding = max(Decimal("0"), amount - paid)
    state = invoice.status
    if outstanding > 0 and invoice.due_date < date.today() and state in {"issued", "partially_paid"}:
        state = "overdue"
    return {
        "id": invoice.id,
        "student_profile_id": invoice.student_profile_id,
        "invoice_number": invoice.invoice_number,
        "fee_type": invoice.fee_type,
        "description": invoice.description,
        "amount": float(amount),
        "paid_amount": float(paid),
        "outstanding_amount": float(outstanding),
        "due_date": invoice.due_date.isoformat(),
        "status": state,
    }


def _load_invoice(db: Session, principal: AuthPrincipal, invoice_id: str) -> FeeInvoice:
    invoice = db.scalar(select(FeeInvoice).where(
        FeeInvoice.id == invoice_id,
        FeeInvoice.institution_id == principal.institution.id,
    ))
    if invoice is None:
        raise HTTPException(status_code=404, detail="Fee invoice not found")
    return invoice


def _authorize_invoice_read(principal: AuthPrincipal, invoice: FeeInvoice, db: Session) -> None:
    profile = db.scalar(select(StudentProfile).where(
        StudentProfile.id == invoice.student_profile_id,
        StudentProfile.institution_id == principal.institution.id,
    ))
    if profile is None:
        raise HTTPException(status_code=404, detail="Student profile not found")
    try:
        authorize(
            principal.access_context,
            permission="fees.read",
            resource_institution_id=invoice.institution_id,
            owner_user_id=profile.user_id,
            student_id=profile.id,
        )
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You cannot access this fee record") from exc


@router.get("/invoices")
def list_invoices(
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
    status_filter: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=25, ge=1, le=100),
) -> dict:
    context = principal.access_context
    query = select(FeeInvoice).where(FeeInvoice.institution_id == principal.institution.id)
    if "College Admin" in context.roles or "Accounts" in context.roles:
        authorize(context, permission="fees.read", resource_institution_id=principal.institution.id)
    elif "Student" in context.roles:
        query = query.where(FeeInvoice.student_profile_id.in_(context.own_student_ids))
    elif "Parent" in context.roles:
        query = query.where(FeeInvoice.student_profile_id.in_(context.linked_student_ids))
    else:
        raise HTTPException(status_code=403, detail="You do not have access to fee records")
    if status_filter == "overdue":
        query = query.where(FeeInvoice.status.in_(["issued", "partially_paid"]), FeeInvoice.due_date < date.today())
    elif status_filter in {"issued", "partially_paid"}:
        query = query.where(FeeInvoice.status == status_filter, FeeInvoice.due_date >= date.today())
    elif status_filter:
        query = query.where(FeeInvoice.status == status_filter)
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = db.scalars(query.order_by(FeeInvoice.due_date.desc()).offset((page - 1) * limit).limit(limit)).all()
    return {"items": [_invoice_dict(db, row) for row in rows], "total": total, "page": page, "limit": limit}


@router.get("/invoices/{invoice_id}")
def get_invoice(
    invoice_id: str,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    invoice = _load_invoice(db, principal, invoice_id)
    _authorize_invoice_read(principal, invoice, db)
    return _invoice_dict(db, invoice)


@router.post("/invoices", status_code=status.HTTP_201_CREATED)
def create_invoice(
    payload: InvoiceCreatePayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    try:
        authorize(principal.access_context, permission="fees.manage", resource_institution_id=principal.institution.id)
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You cannot create fee invoices") from exc
    profile = db.scalar(select(StudentProfile).where(
        StudentProfile.id == payload.student_profile_id,
        StudentProfile.institution_id == principal.institution.id,
        StudentProfile.is_active.is_(True),
    ))
    if profile is None:
        raise HTTPException(status_code=422, detail="Student profile must belong to this institution")
    invoice = FeeInvoice(
        institution_id=principal.institution.id,
        student_profile_id=profile.id,
        invoice_number=payload.invoice_number.strip().upper(),
        fee_type=payload.fee_type.strip(),
        description=payload.description,
        amount=Decimal(str(payload.amount)),
        due_date=payload.due_date,
        issued_by=principal.user.id,
        status="issued",
    )
    db.add(invoice)
    try:
        db.flush()
        db.add(AuditEvent(
            institution_id=principal.institution.id, actor_user_id=principal.user.id,
            action="fees.invoice.created", resource_type="fee_invoice",
            resource_id=invoice.id, details={},
        ))
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Invoice number already exists") from exc
    db.refresh(invoice)
    return _invoice_dict(db, invoice)


@router.post("/invoices/{invoice_id}/payments", status_code=status.HTTP_201_CREATED)
def create_payment_request(
    invoice_id: str,
    payload: PaymentCreatePayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    invoice = _load_invoice(db, principal, invoice_id)
    _authorize_invoice_read(principal, invoice, db)
    if invoice.status in {"paid", "cancelled"}:
        raise HTTPException(status_code=409, detail="This invoice cannot accept another payment")
    amount = Decimal(str(payload.amount))
    outstanding = Decimal(str(invoice.amount)) - _paid_amount(db, invoice.id) - _pending_amount(db, invoice.id)
    if amount > outstanding or outstanding <= 0:
        raise HTTPException(status_code=422, detail="Payment amount exceeds the available invoice balance")
    payment = FeePayment(
        institution_id=principal.institution.id,
        invoice_id=invoice.id,
        amount=amount,
        method=payload.method,
        payment_reference=payload.payment_reference,
        status="pending",
        recorded_by=principal.user.id,
    )
    db.add(payment)
    try:
        db.flush()
        db.add(AuditEvent(
            institution_id=principal.institution.id, actor_user_id=principal.user.id,
            action="fees.payment.requested", resource_type="fee_payment",
            resource_id=payment.id, details={"invoice_id": invoice.id, "amount": float(amount)},
        ))
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Payment request could not be recorded") from exc
    return {"id": payment.id, "invoice_id": invoice.id, "amount": float(amount), "status": payment.status}


@router.post("/payments/{payment_id}/verify")
def verify_payment(
    payment_id: str,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    try:
        authorize(principal.access_context, permission="finance.payment.record", resource_institution_id=principal.institution.id)
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="Only authorized finance staff can verify payments") from exc
    payment = db.scalar(select(FeePayment).where(
        FeePayment.id == payment_id,
        FeePayment.institution_id == principal.institution.id,
    ))
    if payment is None:
        raise HTTPException(status_code=404, detail="Payment request not found")
    if payment.status != "pending":
        raise HTTPException(status_code=409, detail="Only pending payments can be verified")
    invoice = db.scalar(select(FeeInvoice).where(FeeInvoice.id == payment.invoice_id, FeeInvoice.institution_id == principal.institution.id).with_for_update())
    if invoice is None:
        raise HTTPException(status_code=404, detail="Fee invoice not found")
    paid = _paid_amount(db, invoice.id)
    amount = Decimal(str(payment.amount))
    invoice_amount = Decimal(str(invoice.amount))
    if paid + amount > invoice_amount:
        raise HTTPException(status_code=409, detail="Verified payments would exceed the invoice amount")
    payment.status = "verified"
    payment.verified_by = principal.user.id
    payment.verified_at = datetime.now(timezone.utc)
    invoice.status = "paid" if paid + amount == invoice_amount else "partially_paid"
    db.add(AuditEvent(
        institution_id=principal.institution.id, actor_user_id=principal.user.id,
        action="fees.payment.verified", resource_type="fee_payment",
        resource_id=payment.id, details={"invoice_id": invoice.id},
    ))
    db.commit()
    return {"payment_id": payment.id, "status": payment.status, "invoice": _invoice_dict(db, invoice)}


@router.post("/payments/{payment_id}/reject")
def reject_payment(
    payment_id: str,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    try:
        authorize(principal.access_context, permission="finance.payment.record", resource_institution_id=principal.institution.id)
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="Only authorized finance staff can reject payments") from exc
    payment = db.scalar(select(FeePayment).where(
        FeePayment.id == payment_id,
        FeePayment.institution_id == principal.institution.id,
    ))
    if payment is None:
        raise HTTPException(status_code=404, detail="Payment request not found")
    if payment.status != "pending":
        raise HTTPException(status_code=409, detail="Only pending payments can be rejected")
    payment.status = "rejected"
    payment.verified_by = principal.user.id
    payment.verified_at = datetime.now(timezone.utc)
    db.add(AuditEvent(
        institution_id=principal.institution.id, actor_user_id=principal.user.id,
        action="fees.payment.rejected", resource_type="fee_payment",
        resource_id=payment.id, details={},
    ))
    db.commit()
    return {"payment_id": payment.id, "status": payment.status}


@router.get("/invoices/{invoice_id}/payments")
def list_invoice_payments(
    invoice_id: str,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> list[dict]:
    invoice = _load_invoice(db, principal, invoice_id)
    _authorize_invoice_read(principal, invoice, db)
    rows = db.scalars(select(FeePayment).where(
        FeePayment.institution_id == principal.institution.id,
        FeePayment.invoice_id == invoice.id,
    ).order_by(FeePayment.created_at.desc())).all()
    return [{
        "id": row.id, "amount": float(row.amount), "method": row.method,
        "payment_reference": row.payment_reference, "status": row.status,
        "created_at": row.created_at.isoformat(),
        "verified_at": row.verified_at.isoformat() if row.verified_at else None,
    } for row in rows]
