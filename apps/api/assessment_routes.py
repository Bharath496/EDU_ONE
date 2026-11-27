"""Database-backed exams, results, assignments and submissions."""
from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from academic_routes import _authorize_course, _load_course, _visible_course_query
from auth_routes import AuthPrincipal, get_current_principal
from authorization import AuthorizationError, authorize
from database import get_db
from models import (
    AcademicCourse,
    Assignment,
    AssignmentSubmission,
    AuditEvent,
    CourseEnrollment,
    Exam,
    ExamResult,
    StudentProfile,
)

exam_router = APIRouter(prefix="/v1/exams", tags=["exams"])
result_router = APIRouter(prefix="/v1/results", tags=["results"])
assignment_router = APIRouter(prefix="/v1/assignments", tags=["assignments"])


class ExamCreatePayload(BaseModel):
    course_id: str
    code: str = Field(min_length=1, max_length=40)
    title: str = Field(min_length=1, max_length=180)
    exam_type: Literal["internal", "midterm", "final", "quiz", "practical"]
    start_at: datetime
    end_at: datetime
    max_marks: float = Field(gt=0, le=1000)


class ResultEntryPayload(BaseModel):
    student_profile_id: str
    marks_obtained: float = Field(ge=0, le=1000)
    grade: str | None = Field(default=None, max_length=8)
    remarks: str | None = Field(default=None, max_length=300)


class BulkResultsPayload(BaseModel):
    results: list[ResultEntryPayload] = Field(min_length=1, max_length=500)


class AssignmentCreatePayload(BaseModel):
    course_id: str
    title: str = Field(min_length=1, max_length=180)
    description: str = Field(min_length=1, max_length=10000)
    due_at: datetime
    max_marks: float = Field(gt=0, le=1000)


class AssignmentSubmissionPayload(BaseModel):
    content: str = Field(min_length=1, max_length=20000)


class GradeSubmissionPayload(BaseModel):
    marks_obtained: float = Field(ge=0, le=1000)
    feedback: str | None = Field(default=None, max_length=10000)


def _exam_dict(exam: Exam) -> dict:
    return {
        "id": exam.id, "course_id": exam.course_id, "code": exam.code,
        "title": exam.title, "exam_type": exam.exam_type,
        "start_at": exam.start_at.isoformat(), "end_at": exam.end_at.isoformat(),
        "max_marks": float(exam.max_marks), "status": exam.status,
    }


def _assignment_dict(item: Assignment) -> dict:
    return {
        "id": item.id, "course_id": item.course_id, "title": item.title,
        "description": item.description, "due_at": item.due_at.isoformat(),
        "max_marks": float(item.max_marks), "status": item.status,
    }


def _student_course_scope(principal: AuthPrincipal, profile: StudentProfile, course: AcademicCourse, permission: str) -> None:
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
            resource_institution_id=profile.institution_id,
            owner_user_id=profile.user_id,
            student_id=profile.id,
            scope_type=scope_type,
            scope_id=scope_id,
        )
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You cannot access this student's academic record") from exc


def _visible_course_ids(db: Session, principal: AuthPrincipal) -> set[str]:
    return {row.id for row in db.scalars(_visible_course_query(db, principal)).all()}


@exam_router.get("")
def list_exams(
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
    course_id: str | None = None,
) -> list[dict]:
    course_ids = _visible_course_ids(db, principal)
    if course_id and course_id not in course_ids:
        raise HTTPException(status_code=403, detail="You are not assigned or enrolled in this course")
    query = select(Exam).where(
        Exam.institution_id == principal.institution.id,
        Exam.course_id.in_([course_id] if course_id else course_ids),
    )
    if {"Student", "Parent"}.intersection(principal.roles):
        query = query.where(Exam.status.in_(["published", "completed"]))
    rows = db.scalars(query.order_by(Exam.start_at)).all()
    return [_exam_dict(row) for row in rows]


@exam_router.post("", status_code=status.HTTP_201_CREATED)
def create_exam(
    payload: ExamCreatePayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    try:
        authorize(principal.access_context, permission="exams.manage", resource_institution_id=principal.institution.id)
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You cannot create examinations") from exc
    course = _load_course(db, principal, payload.course_id)
    if payload.start_at.tzinfo is None or payload.end_at.tzinfo is None or payload.end_at <= payload.start_at:
        raise HTTPException(status_code=422, detail="Exam start and end must be timezone-aware and end after start")
    exam = Exam(
        institution_id=principal.institution.id, course_id=course.id,
        code=payload.code.strip().upper(), title=payload.title.strip(),
        exam_type=payload.exam_type, start_at=payload.start_at, end_at=payload.end_at,
        max_marks=Decimal(str(payload.max_marks)), created_by=principal.user.id,
    )
    db.add(exam)
    try:
        db.flush()
        db.add(AuditEvent(
            institution_id=principal.institution.id, actor_user_id=principal.user.id,
            action="exams.created", resource_type="exam", resource_id=exam.id, details={},
        ))
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Exam code already exists in this institution") from exc
    db.refresh(exam)
    return _exam_dict(exam)


@exam_router.post("/{exam_id}/publish")
def publish_exam(
    exam_id: str,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    try:
        authorize(principal.access_context, permission="exams.manage", resource_institution_id=principal.institution.id)
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="You cannot publish examinations") from exc
    exam = db.scalar(select(Exam).where(Exam.id == exam_id, Exam.institution_id == principal.institution.id))
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    exam.status = "published"
    db.add(AuditEvent(
        institution_id=principal.institution.id, actor_user_id=principal.user.id,
        action="exams.published", resource_type="exam", resource_id=exam.id, details={},
    ))
    db.commit()
    return _exam_dict(exam)


@exam_router.post("/{exam_id}/results")
def enter_exam_results(
    exam_id: str,
    payload: BulkResultsPayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    exam = db.scalar(select(Exam).where(Exam.id == exam_id, Exam.institution_id == principal.institution.id))
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    course = _load_course(db, principal, exam.course_id)
    _authorize_course(principal, course, "marks.write")
    if exam.status == "draft":
        raise HTTPException(status_code=409, detail="Publish the exam before entering marks")
    ids = [row.student_profile_id for row in payload.results]
    if len(ids) != len(set(ids)):
        raise HTTPException(status_code=422, detail="Duplicate student IDs are not allowed")
    if any(row.marks_obtained > float(exam.max_marks) for row in payload.results):
        raise HTTPException(status_code=422, detail="Marks cannot exceed the exam maximum")
    enrolled = set(db.scalars(select(CourseEnrollment.student_profile_id).where(
        CourseEnrollment.institution_id == principal.institution.id,
        CourseEnrollment.course_id == course.id,
        CourseEnrollment.status == "active",
        CourseEnrollment.student_profile_id.in_(ids),
    )).all())
    if enrolled != set(ids):
        raise HTTPException(status_code=422, detail="Results can only be entered for students enrolled in this course")
    existing = set(db.scalars(select(ExamResult.student_profile_id).where(
        ExamResult.exam_id == exam.id,
        ExamResult.student_profile_id.in_(ids),
    )).all())
    if existing:
        raise HTTPException(status_code=409, detail="Results already exist for one or more students")
    for item in payload.results:
        db.add(ExamResult(
            institution_id=principal.institution.id, exam_id=exam.id,
            student_profile_id=item.student_profile_id,
            marks_obtained=Decimal(str(item.marks_obtained)),
            grade=item.grade, remarks=item.remarks, entered_by=principal.user.id,
        ))
    db.add(AuditEvent(
        institution_id=principal.institution.id, actor_user_id=principal.user.id,
        action="exam.results.entered", resource_type="exam", resource_id=exam.id,
        details={"count": len(payload.results)},
    ))
    db.commit()
    return {"exam_id": exam.id, "entered": len(payload.results), "published": False}


@exam_router.post("/{exam_id}/publish-results")
def publish_exam_results(
    exam_id: str,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    try:
        authorize(principal.access_context, permission="marks.publish", resource_institution_id=principal.institution.id)
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail="Only the examination authority can publish results") from exc
    exam = db.scalar(select(Exam).where(Exam.id == exam_id, Exam.institution_id == principal.institution.id))
    if exam is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    now = datetime.now(timezone.utc)
    result = db.execute(
        update(ExamResult)
        .where(ExamResult.exam_id == exam.id, ExamResult.institution_id == principal.institution.id)
        .values(is_published=True, published_at=now)
    )
    exam.status = "completed"
    db.add(AuditEvent(
        institution_id=principal.institution.id, actor_user_id=principal.user.id,
        action="exam.results.published", resource_type="exam", resource_id=exam.id,
        details={"count": result.rowcount or 0},
    ))
    db.commit()
    return {"exam_id": exam.id, "published_results": result.rowcount or 0, "status": exam.status}


@result_router.get("/me")
def my_results(
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
    return _results_for_student(db, principal, profile)


@result_router.get("/students/{student_id}")
def student_results(
    student_id: str,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> list[dict]:
    profile = db.scalar(select(StudentProfile).where(
        StudentProfile.id == student_id,
        StudentProfile.institution_id == principal.institution.id,
    ))
    if profile is None:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return _results_for_student(db, principal, profile)


def _results_for_student(db: Session, principal: AuthPrincipal, profile: StudentProfile) -> list[dict]:
    rows = db.execute(
        select(ExamResult, Exam, AcademicCourse)
        .join(Exam, Exam.id == ExamResult.exam_id)
        .join(AcademicCourse, AcademicCourse.id == Exam.course_id)
        .where(
            ExamResult.institution_id == principal.institution.id,
            ExamResult.student_profile_id == profile.id,
            ExamResult.is_published.is_(True),
        )
        .order_by(Exam.start_at.desc())
    ).all()
    output = []
    for result, exam, course in rows:
        _student_course_scope(principal, profile, course, "marks.read")
        output.append({
            "id": result.id, "exam_id": exam.id, "exam_code": exam.code,
            "exam_title": exam.title, "course_id": course.id,
            "course_code": course.code, "marks_obtained": float(result.marks_obtained),
            "max_marks": float(exam.max_marks), "grade": result.grade,
            "remarks": result.remarks, "published_at": result.published_at.isoformat() if result.published_at else None,
        })
    return output


@assignment_router.get("")
def list_assignments(
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
    course_id: str | None = None,
) -> list[dict]:
    course_ids = _visible_course_ids(db, principal)
    if course_id and course_id not in course_ids:
        raise HTTPException(status_code=403, detail="You are not assigned or enrolled in this course")
    query = select(Assignment).where(
        Assignment.institution_id == principal.institution.id,
        Assignment.course_id.in_([course_id] if course_id else course_ids),
    )
    if {"Student", "Parent"}.intersection(principal.roles):
        query = query.where(Assignment.status == "published")
    return [_assignment_dict(row) for row in db.scalars(query.order_by(Assignment.due_at)).all()]


@assignment_router.post("", status_code=status.HTTP_201_CREATED)
def create_assignment(
    payload: AssignmentCreatePayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    course = _load_course(db, principal, payload.course_id)
    _authorize_course(principal, course, "assignments.manage")
    if payload.due_at.tzinfo is None:
        raise HTTPException(status_code=422, detail="Assignment due date must include a timezone")
    assignment = Assignment(
        institution_id=principal.institution.id, course_id=course.id,
        title=payload.title.strip(), description=payload.description,
        due_at=payload.due_at, max_marks=Decimal(str(payload.max_marks)),
        status="published", created_by=principal.user.id,
    )
    db.add(assignment)
    db.flush()
    db.add(AuditEvent(
        institution_id=principal.institution.id, actor_user_id=principal.user.id,
        action="assignment.created", resource_type="assignment",
        resource_id=assignment.id, details={"course_id": course.id},
    ))
    db.commit()
    db.refresh(assignment)
    return _assignment_dict(assignment)


@assignment_router.post("/{assignment_id}/submissions", status_code=status.HTTP_201_CREATED)
def submit_assignment(
    assignment_id: str,
    payload: AssignmentSubmissionPayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    if "Student" not in principal.roles:
        raise HTTPException(status_code=403, detail="Only student accounts can submit assignments")
    profile = db.scalar(select(StudentProfile).where(
        StudentProfile.institution_id == principal.institution.id,
        StudentProfile.user_id == principal.user.id,
        StudentProfile.is_active.is_(True),
    ))
    if profile is None:
        raise HTTPException(status_code=404, detail="Student profile not found")
    assignment = db.scalar(select(Assignment).where(
        Assignment.id == assignment_id,
        Assignment.institution_id == principal.institution.id,
        Assignment.status == "published",
    ))
    if assignment is None:
        raise HTTPException(status_code=404, detail="Assignment not found")
    enrollment = db.scalar(select(CourseEnrollment.id).where(
        CourseEnrollment.institution_id == principal.institution.id,
        CourseEnrollment.course_id == assignment.course_id,
        CourseEnrollment.student_profile_id == profile.id,
        CourseEnrollment.status == "active",
    ))
    if enrollment is None:
        raise HTTPException(status_code=403, detail="You are not enrolled in this assignment's course")
    now = datetime.now(timezone.utc)
    due = assignment.due_at if assignment.due_at.tzinfo else assignment.due_at.replace(tzinfo=timezone.utc)
    submission = AssignmentSubmission(
        institution_id=principal.institution.id, assignment_id=assignment.id,
        student_profile_id=profile.id, content=payload.content,
        status="late" if now > due else "submitted",
    )
    db.add(submission)
    try:
        db.flush()
        db.add(AuditEvent(
            institution_id=principal.institution.id, actor_user_id=principal.user.id,
            action="assignment.submitted", resource_type="assignment_submission",
            resource_id=submission.id, details={"assignment_id": assignment.id},
        ))
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="A submission already exists for this assignment") from exc
    return {
        "id": submission.id, "assignment_id": assignment.id,
        "student_profile_id": profile.id, "status": submission.status,
        "submitted_at": submission.submitted_at.isoformat(),
    }


@assignment_router.post("/submissions/{submission_id}/grade")
def grade_submission(
    submission_id: str,
    payload: GradeSubmissionPayload,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    submission = db.scalar(select(AssignmentSubmission).where(
        AssignmentSubmission.id == submission_id,
        AssignmentSubmission.institution_id == principal.institution.id,
    ))
    if submission is None:
        raise HTTPException(status_code=404, detail="Assignment submission not found")
    assignment = db.get(Assignment, submission.assignment_id)
    if assignment is None or assignment.institution_id != principal.institution.id:
        raise HTTPException(status_code=404, detail="Assignment not found")
    course = _load_course(db, principal, assignment.course_id)
    _authorize_course(principal, course, "marks.write")
    if payload.marks_obtained > float(assignment.max_marks):
        raise HTTPException(status_code=422, detail="Marks cannot exceed the assignment maximum")
    submission.marks_obtained = Decimal(str(payload.marks_obtained))
    submission.feedback = payload.feedback
    submission.graded_by = principal.user.id
    submission.graded_at = datetime.now(timezone.utc)
    submission.status = "graded"
    db.add(AuditEvent(
        institution_id=principal.institution.id, actor_user_id=principal.user.id,
        action="assignment.graded", resource_type="assignment_submission",
        resource_id=submission.id, details={},
    ))
    db.commit()
    return {
        "id": submission.id, "assignment_id": assignment.id,
        "student_profile_id": submission.student_profile_id,
        "marks_obtained": float(submission.marks_obtained),
        "feedback": submission.feedback, "status": submission.status,
    }


@assignment_router.get("/{assignment_id}/my-submission")
def my_assignment_submission(
    assignment_id: str,
    principal: Annotated[AuthPrincipal, Depends(get_current_principal)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    if "Student" not in principal.roles:
        raise HTTPException(status_code=403, detail="This endpoint is available to student accounts")
    profile = db.scalar(select(StudentProfile).where(
        StudentProfile.institution_id == principal.institution.id,
        StudentProfile.user_id == principal.user.id,
    ))
    if profile is None:
        raise HTTPException(status_code=404, detail="Student profile not found")
    submission = db.scalar(select(AssignmentSubmission).where(
        AssignmentSubmission.institution_id == principal.institution.id,
        AssignmentSubmission.assignment_id == assignment_id,
        AssignmentSubmission.student_profile_id == profile.id,
    ))
    if submission is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {
        "id": submission.id, "assignment_id": submission.assignment_id,
        "status": submission.status, "submitted_at": submission.submitted_at.isoformat(),
        "marks_obtained": float(submission.marks_obtained) if submission.marks_obtained is not None else None,
        "feedback": submission.feedback,
    }
