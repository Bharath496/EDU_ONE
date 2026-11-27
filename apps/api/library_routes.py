"""Tenant-scoped library catalogue, circulation and fines."""
from __future__ import annotations

import os
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth_routes import AuthPrincipal, get_current_principal
from authorization import AuthorizationError, authorize
from database import get_db
from models import AuditEvent, LibraryBook, LibraryLoan, StudentProfile, User

router = APIRouter(prefix="/v1/library", tags=["library"])


class BookCreatePayload(BaseModel):
    isbn: str = Field(min_length=5, max_length=20)
    title: str = Field(min_length=1, max_length=220)
    author: str = Field(min_length=1, max_length=180)
    category: str | None = Field(default=None, max_length=80)
    publisher: str | None = Field(default=None, max_length=160)
    total_copies: int = Field(default=1, ge=0, le=10000)


class LoanCreatePayload(BaseModel):
    book_id: str
    student_profile_id: str
    due_date: date


def _require_permission(principal: AuthPrincipal, permission: str) -> None:
    try:
        authorize(principal.access_context, permission=permission, resource_institution_id=principal.institution.id)
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You do not have permission for this library action") from exc


def _book_dict(book: LibraryBook) -> dict:
    return {
        "id": book.id, "isbn": book.isbn, "title": book.title,
        "author": book.author, "category": book.category, "publisher": book.publisher,
        "total_copies": book.total_copies, "available_copies": book.available_copies,
        "is_active": book.is_active,
    }


def _loan_dict(db: Session, loan: LibraryLoan) -> dict:
    book = db.get(LibraryBook, loan.book_id)
    profile = db.get(StudentProfile, loan.student_profile_id)
    state = loan.status
    if state == "issued" and loan.due_date < date.today():
        state = "overdue"
    return {
        "id": loan.id, "book_id": loan.book_id,
        "book_title": book.title if book else None,
        "student_profile_id": loan.student_profile_id,
        "registration_number": profile.registration_number if profile else None,
        "issued_at": loan.issued_at.isoformat(), "due_date": loan.due_date.isoformat(),
        "returned_at": loan.returned_at.isoformat() if loan.returned_at else None,
        "status": state, "fine_amount": float(loan.fine_amount),
    }


def _authorize_loan_read(principal: AuthPrincipal, loan: LibraryLoan, db: Session) -> None:
    profile = db.scalar(select(StudentProfile).where(
        StudentProfile.id == loan.student_profile_id,
        StudentProfile.institution_id == principal.institution.id,
    ))
    if profile is None:
        raise HTTPException(status_code=404, detail="Student profile not found")
    try:
        authorize(
            principal.access_context,
            permission="library.read",
            resource_institution_id=loan.institution_id,
            owner_user_id=profile.user_id,
            student_id=profile.id,
        )
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You cannot view this library loan") from exc


@router.get("/books")
def list_books(
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=25, ge=1, le=100),
) -> dict:
    _require_permission(principal, "library.read")
    query = select(LibraryBook).where(
        LibraryBook.institution_id == principal.institution.id,
        LibraryBook.is_active.is_(True),
    )
    if search:
        needle = f"%{search.strip()}%"
        query = query.where(LibraryBook.title.ilike(needle) | LibraryBook.author.ilike(needle) | LibraryBook.isbn.ilike(needle))
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = db.scalars(query.order_by(LibraryBook.title).offset((page - 1) * limit).limit(limit)).all()
    return {"items": [_book_dict(row) for row in rows], "total": total, "page": page, "limit": limit}


@router.post("/books", status_code=status.HTTP_201_CREATED)
def create_book(
    payload: BookCreatePayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    _require_permission(principal, "library.manage")
    book = LibraryBook(
        institution_id=principal.institution.id,
        isbn=payload.isbn.strip(),
        title=payload.title.strip(),
        author=payload.author.strip(),
        category=payload.category,
        publisher=payload.publisher,
        total_copies=payload.total_copies,
        available_copies=payload.total_copies,
    )
    db.add(book)
    try:
        db.flush()
        db.add(AuditEvent(
            institution_id=principal.institution.id, actor_user_id=principal.user.id,
            action="library.book.created", resource_type="library_book",
            resource_id=book.id, details={"total_copies": payload.total_copies},
        ))
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="This ISBN already exists in the institution") from exc
    db.refresh(book)
    return _book_dict(book)


@router.post("/loans", status_code=status.HTTP_201_CREATED)
def issue_book(
    payload: LoanCreatePayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    _require_permission(principal, "library.manage")
    if payload.due_date <= date.today():
        raise HTTPException(status_code=422, detail="Due date must be in the future")
    book = db.scalar(select(LibraryBook).where(
        LibraryBook.id == payload.book_id,
        LibraryBook.institution_id == principal.institution.id,
        LibraryBook.is_active.is_(True),
    ).with_for_update())
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    if book.available_copies < 1:
        raise HTTPException(status_code=409, detail="No copies are currently available")
    profile = db.scalar(select(StudentProfile).where(
        StudentProfile.id == payload.student_profile_id,
        StudentProfile.institution_id == principal.institution.id,
        StudentProfile.is_active.is_(True),
    ))
    if profile is None:
        raise HTTPException(status_code=422, detail="Student profile must belong to this institution")
    active_loans = db.scalar(select(func.count()).select_from(LibraryLoan).where(
        LibraryLoan.institution_id == principal.institution.id,
        LibraryLoan.student_profile_id == profile.id,
        LibraryLoan.status == "issued",
    )) or 0
    if active_loans >= 5:
        raise HTTPException(status_code=409, detail="Student has reached the active loan limit")
    book.available_copies -= 1
    loan = LibraryLoan(
        institution_id=principal.institution.id,
        book_id=book.id,
        student_profile_id=profile.id,
        issued_by=principal.user.id,
        due_date=payload.due_date,
        status="issued",
        fine_amount=Decimal("0"),
    )
    db.add(loan)
    db.flush()
    db.add(AuditEvent(
        institution_id=principal.institution.id, actor_user_id=principal.user.id,
        action="library.book.issued", resource_type="library_loan",
        resource_id=loan.id, details={"book_id": book.id, "student_profile_id": profile.id},
    ))
    db.commit()
    return _loan_dict(db, loan)


@router.get("/loans/me")
def my_loans(
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
    loans = db.scalars(select(LibraryLoan).where(
        LibraryLoan.institution_id == principal.institution.id,
        LibraryLoan.student_profile_id == profile.id,
    ).order_by(LibraryLoan.issued_at.desc())).all()
    return [_loan_dict(db, row) for row in loans]


@router.get("/loans")
def list_loans(
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
    student_profile_id: str | None = None,
    active_only: bool = False,
) -> list[dict]:
    _require_permission(principal, "library.manage")
    query = select(LibraryLoan).where(LibraryLoan.institution_id == principal.institution.id)
    if student_profile_id:
        query = query.where(LibraryLoan.student_profile_id == student_profile_id)
    if active_only:
        query = query.where(LibraryLoan.status == "issued")
    rows = db.scalars(query.order_by(LibraryLoan.issued_at.desc())).all()
    return [_loan_dict(db, row) for row in rows]


@router.post("/loans/{loan_id}/return")
def return_book(
    loan_id: str,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    _require_permission(principal, "library.manage")
    loan = db.scalar(select(LibraryLoan).where(
        LibraryLoan.id == loan_id,
        LibraryLoan.institution_id == principal.institution.id,
    ).with_for_update())
    if loan is None:
        raise HTTPException(status_code=404, detail="Library loan not found")
    if loan.status != "issued":
        raise HTTPException(status_code=409, detail="This book has already been returned")
    book = db.scalar(select(LibraryBook).where(
        LibraryBook.id == loan.book_id,
        LibraryBook.institution_id == principal.institution.id,
    ).with_for_update())
    if book is None:
        raise HTTPException(status_code=409, detail="Linked library book is unavailable")
    returned_at = datetime.now(timezone.utc)
    overdue_days = max(0, (date.today() - loan.due_date).days)
    fine_per_day = Decimal(os.getenv("LIBRARY_FINE_PER_DAY", "2.00"))
    loan.fine_amount = Decimal(overdue_days) * fine_per_day
    loan.status = "returned"
    loan.returned_at = returned_at
    loan.returned_by = principal.user.id
    book.available_copies = min(book.total_copies, book.available_copies + 1)
    db.add(AuditEvent(
        institution_id=principal.institution.id, actor_user_id=principal.user.id,
        action="library.book.returned", resource_type="library_loan",
        resource_id=loan.id, details={"fine_amount": float(loan.fine_amount), "overdue_days": overdue_days},
    ))
    db.commit()
    return _loan_dict(db, loan)
