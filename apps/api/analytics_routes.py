"""Missingness-aware, explainable student-support analytics."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from auth_routes import AuthPrincipal, get_current_principal
from authorization import AuthorizationError, authorize
from database import get_db
from models import AttendanceRecord, AttendanceSession, Exam, ExamResult, StudentProfile, User
from student_routes import _student_query

router = APIRouter(prefix="/v1/analytics", tags=["analytics"])

STUDENT_REPORT_ROLES = {
    "College Admin", "Principal", "Vice Principal", "HOD", "Class Advisor",
    "Exam Cell", "Placement Officer", "Admissions",
}


def _risk_result(attendance_percentage: float | None, marks_percentage: float | None, attendance_sessions: int, published_exams: int) -> dict:
    if attendance_percentage is None and marks_percentage is None:
        return {
            "risk_level": "insufficient_data",
            "risk_score": None,
            "reasons": [],
            "review_required": False,
        }

    points = 0
    reasons: list[str] = []
    if marks_percentage is not None:
        if marks_percentage < 50:
            points += 3
            reasons.append("published marks below 50%")
        elif marks_percentage < 60:
            points += 2
            reasons.append("published marks below 60%")
        elif marks_percentage < 70:
            points += 1
            reasons.append("published marks below 70%")

    if attendance_percentage is not None:
        if attendance_percentage < 65:
            points += 3
            reasons.append("attendance below 65%")
        elif attendance_percentage < 75:
            points += 2
            reasons.append("attendance below 75%")
        elif attendance_percentage < 85:
            points += 1
            reasons.append("attendance below 85%")

    level = "high" if points >= 5 else "medium" if points >= 3 else "watch" if points >= 1 else "on_track"
    return {
        "risk_level": level,
        "risk_score": points,
        "reasons": reasons,
        "review_required": level in {"high", "medium"},
    }


@router.get("/student-risk")
def student_risk_report(
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=100, ge=1, le=200),
) -> dict:
    roles = principal.access_context.roles
    if not roles.intersection(STUDENT_REPORT_ROLES):
        raise HTTPException(status_code=403, detail="This role cannot read student-support analytics")

    query = _student_query(principal, db)
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    profiles = db.scalars(
        query.order_by(StudentProfile.registration_number)
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()
    profile_ids = [profile.id for profile in profiles]
    attendance_by_student: dict[str, tuple[int, int]] = {}
    marks_by_student: dict[str, tuple[float, float, int]] = {}

    if profile_ids:
        attendance_rows = db.execute(
            select(
                AttendanceRecord.student_profile_id,
                func.sum(case((AttendanceRecord.status.in_(["present", "late"]), 1), else_=0)),
                func.sum(case((AttendanceRecord.status.in_(["present", "absent", "late"]), 1), else_=0)),
            )
            .join(AttendanceSession, AttendanceSession.id == AttendanceRecord.session_id)
            .where(
                AttendanceRecord.institution_id == principal.institution.id,
                AttendanceRecord.student_profile_id.in_(profile_ids),
                AttendanceSession.institution_id == principal.institution.id,
                AttendanceSession.status == "locked",
            )
            .group_by(AttendanceRecord.student_profile_id)
        ).all()
        attendance_by_student = {
            student_id: (int(attended or 0), int(total_sessions or 0))
            for student_id, attended, total_sessions in attendance_rows
        }

        marks_rows = db.execute(
            select(
                ExamResult.student_profile_id,
                func.sum(ExamResult.marks_obtained),
                func.sum(Exam.max_marks),
                func.count(ExamResult.id),
            )
            .join(Exam, Exam.id == ExamResult.exam_id)
            .where(
                ExamResult.institution_id == principal.institution.id,
                ExamResult.student_profile_id.in_(profile_ids),
                ExamResult.is_published.is_(True),
                Exam.institution_id == principal.institution.id,
                Exam.status == "published",
            )
            .group_by(ExamResult.student_profile_id)
        ).all()
        marks_by_student = {
            student_id: (float(obtained or 0), float(maximum or 0), int(exam_count or 0))
            for student_id, obtained, maximum, exam_count in marks_rows
        }

    items = []
    summary = {"high": 0, "medium": 0, "watch": 0, "on_track": 0, "insufficient_data": 0}
    for profile in profiles:
        try:
            scope_type = "department" if "HOD" in roles else "class" if "Class Advisor" in roles else None
            scope_id = profile.department_id if scope_type == "department" else profile.class_id if scope_type == "class" else None
            authorize(
                principal.access_context,
                permission="reports.read",
                resource_institution_id=principal.institution.id,
                scope_type=scope_type,
                scope_id=scope_id,
            )
        except AuthorizationError as exc:
            raise HTTPException(status_code=403, detail="You cannot read analytics for this student scope") from exc

        attended, attendance_total = attendance_by_student.get(profile.id, (0, 0))
        attendance_percentage = round(attended * 100 / attendance_total, 1) if attendance_total else None
        marks_obtained, marks_maximum, published_exams = marks_by_student.get(profile.id, (0.0, 0.0, 0))
        marks_percentage = round(marks_obtained * 100 / marks_maximum, 1) if marks_maximum else None
        risk = _risk_result(attendance_percentage, marks_percentage, attendance_total, published_exams)
        summary[risk["risk_level"]] += 1
        user = db.get(User, profile.user_id)
        items.append({
            "student_profile_id": profile.id,
            "registration_number": profile.registration_number,
            "student_name": user.full_name if user else None,
            "department_id": profile.department_id,
            "class_id": profile.class_id,
            "attendance_percentage": attendance_percentage,
            "attendance_sessions": attendance_total,
            "average_marks_percentage": marks_percentage,
            "published_exams": published_exams,
            **risk,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "summary": summary,
        "disclaimer": "This is a transparent early-support signal, not a diagnosis or an automated decision. Missing records are reported as insufficient data, not zero. Staff must review context with the student before taking action.",
    }
