from __future__ import annotations

from collections import Counter
from datetime import date, datetime
from typing import Any, Literal
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


app = FastAPI(
    title="EDU_ONE API",
    version="0.4.0",
    description=(
        "Zero-cost in-memory demo API for the EDU_ONE portfolio project. "
        "It is intentionally not a production student-information system."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://bharath496.github.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Role = Literal["Super Admin", "College Admin", "Faculty", "Student", "Parent"]
AttendanceStatus = Literal["present", "absent", "late", "excused"]


class DemoUser(BaseModel):
    id: str
    email: str
    name: str
    role: Role
    college_id: str
    college_name: str


class LoginRequest(BaseModel):
    email: str
    password: str = ""
    college_id: str | None = None


class RefreshRequest(BaseModel):
    refresh_token: str


class StudentSignal(BaseModel):
    student_id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    department: str = Field(default="General")
    semester: int = Field(default=1, ge=1, le=12)
    attendance: float = Field(ge=0, le=100)
    score: float = Field(ge=0, le=100)
    trend: float = Field(default=0, ge=-100, le=100)


class RiskResult(BaseModel):
    student_id: str
    risk_level: Literal["High", "Medium", "Low"]
    risk_points: int
    reason: list[str]


class StudentCreate(BaseModel):
    name: str = Field(min_length=1)
    reg_no: str = Field(min_length=1)
    department: str = "AIML"
    semester: int = Field(default=1, ge=1, le=12)
    email: str = ""
    attendance: float = Field(default=100, ge=0, le=100)
    cgpa: float = Field(default=0, ge=0, le=10)
    status: Literal["active", "inactive"] = "active"


class AttendanceRecord(BaseModel):
    student_id: str
    course_id: str
    date: str
    status: AttendanceStatus


class BulkAttendanceRequest(BaseModel):
    course_id: str
    date: str
    records: list[dict[str, str]]


class PaymentRequest(BaseModel):
    fee_id: str
    amount: float = Field(gt=0)
    method: str
    transaction_id: str | None = None


class NoticeCreate(BaseModel):
    title: str = Field(min_length=1)
    content: str = Field(min_length=1)
    target: str = "Everyone"
    priority: Literal["low", "medium", "high", "urgent"] = "medium"


class LibraryIssueRequest(BaseModel):
    book_id: str
    student_id: str


class AssignmentSubmission(BaseModel):
    content: str
    attachments: list[str] = []


class CollegeCreate(BaseModel):
    name: str = Field(min_length=1)
    code: str = Field(min_length=1)
    city: str = ""
    state: str = ""
    students: int = Field(default=0, ge=0)
    plan: str = "Starter"
    status: str = "trial"


DEMO_USERS: dict[str, DemoUser] = {
    "admin@eduone.demo": DemoUser(
        id="super-admin",
        email="admin@eduone.demo",
        name="Platform Admin",
        role="Super Admin",
        college_id="platform",
        college_name="EDU_ONE Platform Demo",
    ),
    "college.admin@eduone.demo": DemoUser(
        id="college-admin",
        email="college.admin@eduone.demo",
        name="Dr. Rajesh Kumar",
        role="College Admin",
        college_id="eduone-demo",
        college_name="EDU_ONE Demo Institution",
    ),
    "faculty@eduone.demo": DemoUser(
        id="faculty-demo",
        email="faculty@eduone.demo",
        name="Prof. Priya Sharma",
        role="Faculty",
        college_id="eduone-demo",
        college_name="EDU_ONE Demo Institution",
    ),
    "student@eduone.demo": DemoUser(
        id="student-demo",
        email="student@eduone.demo",
        name="Arjun Kumar",
        role="Student",
        college_id="eduone-demo",
        college_name="EDU_ONE Demo Institution",
    ),
    "parent@eduone.demo": DemoUser(
        id="parent-demo",
        email="parent@eduone.demo",
        name="Suresh Kumar",
        role="Parent",
        college_id="eduone-demo",
        college_name="EDU_ONE Demo Institution",
    ),
}

STUDENTS: list[dict[str, Any]] = [
    {"id": "1", "name": "Arjun Kumar", "reg_no": "24AI001", "department": "AIML", "semester": 5, "email": "arjun@eduone.demo", "attendance": 94.0, "cgpa": 8.7, "status": "active"},
    {"id": "2", "name": "Priya Sharma", "reg_no": "24AI002", "department": "AIML", "semester": 5, "email": "priya@eduone.demo", "attendance": 92.0, "cgpa": 9.1, "status": "active"},
    {"id": "3", "name": "Rahul Verma", "reg_no": "24CS003", "department": "CSE", "semester": 5, "email": "rahul@eduone.demo", "attendance": 78.0, "cgpa": 7.2, "status": "active"},
    {"id": "4", "name": "Meera N", "reg_no": "25DS010", "department": "Data Science", "semester": 3, "email": "meera@eduone.demo", "attendance": 63.0, "cgpa": 6.1, "status": "active"},
]

FACULTY = [
    {"id": "fac-1", "name": "Dr. Meera Patel", "department": "AIML", "designation": "Professor", "email": "meera.p@eduone.demo"},
    {"id": "fac-2", "name": "Dr. S. Ramesh", "department": "CSE", "designation": "Associate Professor", "email": "ramesh@eduone.demo"},
]

ATTENDANCE: list[dict[str, Any]] = []
EXAMS = [
    {"id": "exam-1", "name": "Internal Assessment II", "course_id": "AIML-501", "date": "2026-10-19", "status": "upcoming"},
    {"id": "exam-2", "name": "Database Quiz", "course_id": "CSE-302", "date": "2026-10-16", "status": "upcoming"},
]
ASSIGNMENTS = [
    {"id": "asg-1", "title": "Build a Classification Pipeline", "course_id": "AIML-502", "due_date": "2026-10-16", "status": "published", "submissions": []},
    {"id": "asg-2", "title": "SQL Query Optimization Lab", "course_id": "CSE-302", "due_date": "2026-10-18", "status": "published", "submissions": []},
]
FEES = [
    {"id": "fee-1", "student_id": "1", "fee_type": "Tuition Fee", "amount": 45000.0, "due_date": "2026-09-30", "status": "paid", "method": "UPI"},
    {"id": "fee-2", "student_id": "3", "fee_type": "Tuition Fee", "amount": 45000.0, "due_date": "2026-10-10", "status": "overdue", "method": None},
]
NOTICES = [
    {"id": "notice-1", "title": "Semester Internal Assessment Schedule", "content": "Internal assessments begin on 19 October.", "target": "Students & Faculty", "priority": "high", "published_at": "2026-10-12T08:30:00"},
]
BOOKS = [
    {"id": "book-1", "title": "Introduction to Algorithms", "author": "Thomas H. Cormen", "category": "Computer Science", "available": 7, "total": 10},
    {"id": "book-2", "title": "Pattern Recognition and Machine Learning", "author": "Christopher Bishop", "category": "AI / ML", "available": 5, "total": 8},
]
LIBRARY_ISSUES: list[dict[str, Any]] = []
COLLEGES = [
    {"id": "tenant-1", "name": "EDU_ONE Demo Institution", "code": "EDUDEMO", "city": "Coimbatore", "state": "Tamil Nadu", "students": 1240, "plan": "Campus", "status": "active"},
    {"id": "tenant-2", "name": "Northstar Institute of Technology", "code": "NIT-DEMO", "city": "Bengaluru", "state": "Karnataka", "students": 860, "plan": "Growth", "status": "active"},
]
SETTINGS: dict[str, Any] = {"platform_name": "EDU_ONE Platform Demo", "timezone": "Asia/Kolkata"}


def calculate_risk(student: StudentSignal) -> RiskResult:
    points = 0
    reasons: list[str] = []

    if student.score < 50:
        points += 3
        reasons.append("academic score below 50")
    elif student.score < 60:
        points += 2
        reasons.append("academic score below 60")
    elif student.score < 70:
        points += 1
        reasons.append("academic score below 70")

    if student.attendance < 65:
        points += 3
        reasons.append("attendance below 65%")
    elif student.attendance < 75:
        points += 2
        reasons.append("attendance below 75%")
    elif student.attendance < 85:
        points += 1
        reasons.append("attendance below 85%")

    if student.trend <= -5:
        points += 1
        reasons.append("recent performance trend is declining")

    if points >= 5:
        level: Literal["High", "Medium", "Low"] = "High"
    elif points >= 3:
        level = "Medium"
    else:
        level = "Low"

    if not reasons:
        reasons.append("student is currently on track")

    return RiskResult(student_id=student.student_id, risk_level=level, risk_points=points, reason=reasons)


def find_or_404(rows: list[dict[str, Any]], item_id: str, label: str) -> dict[str, Any]:
    item = next((row for row in rows if row["id"] == item_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail=f"{label} not found")
    return item


@app.get("/")
def root() -> dict[str, str]:
    return {"name": "EDU_ONE API", "version": "0.4.0", "docs": "/docs", "mode": "in-memory demo"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mode": "demo"}


@app.post("/auth/login")
def login(payload: LoginRequest) -> dict[str, Any]:
    user = DEMO_USERS.get(payload.email.lower())
    if user is None:
        raise HTTPException(status_code=401, detail="Unknown demo account")
    token = f"demo-{uuid4().hex}"
    return {"access_token": token, "refresh_token": f"refresh-{token}", "user": user.model_dump()}


@app.post("/auth/refresh")
def refresh(payload: RefreshRequest) -> dict[str, str]:
    if not payload.refresh_token.startswith("refresh-demo-"):
        raise HTTPException(status_code=401, detail="Invalid demo refresh token")
    token = f"demo-{uuid4().hex}"
    return {"access_token": token, "refresh_token": f"refresh-{token}"}


@app.post("/auth/logout")
def logout() -> dict[str, bool]:
    return {"success": True}


@app.get("/auth/me")
def current_user() -> dict[str, Any]:
    return DEMO_USERS["college.admin@eduone.demo"].model_dump()


@app.get("/colleges")
def colleges() -> list[dict[str, Any]]:
    return COLLEGES


@app.get("/modules")
def modules() -> list[str]:
    return [
        "students", "faculty", "attendance", "exams", "assignments", "marks",
        "fees", "library", "notices", "reports", "student-intelligence",
    ]


@app.get("/dashboard/stats")
def dashboard_stats() -> dict[str, Any]:
    average_attendance = round(sum(row["attendance"] for row in STUDENTS) / max(len(STUDENTS), 1), 1)
    outstanding = sum(row["amount"] for row in FEES if row["status"] != "paid")
    return {
        "students": len(STUDENTS),
        "faculty": len(FACULTY),
        "average_attendance": average_attendance,
        "outstanding_fees": outstanding,
        "assignments": len(ASSIGNMENTS),
        "notices": len(NOTICES),
    }


@app.get("/students")
def get_students(search: str | None = None, page: int = 1, limit: int = Query(default=50, le=200)) -> dict[str, Any]:
    rows = STUDENTS
    if search:
        needle = search.lower()
        rows = [row for row in rows if needle in row["name"].lower() or needle in row["reg_no"].lower()]
    start = max(page - 1, 0) * limit
    return {"items": rows[start:start + limit], "total": len(rows), "page": page, "limit": limit}


@app.get("/students/{student_id}")
def get_student(student_id: str) -> dict[str, Any]:
    return find_or_404(STUDENTS, student_id, "Student")


@app.post("/students", status_code=201)
def create_student(payload: StudentCreate) -> dict[str, Any]:
    row = {"id": uuid4().hex[:10], **payload.model_dump()}
    STUDENTS.insert(0, row)
    return row


@app.put("/students/{student_id}")
def update_student(student_id: str, payload: StudentCreate) -> dict[str, Any]:
    row = find_or_404(STUDENTS, student_id, "Student")
    row.update(payload.model_dump())
    return row


@app.delete("/students/{student_id}")
def delete_student(student_id: str) -> dict[str, bool]:
    row = find_or_404(STUDENTS, student_id, "Student")
    STUDENTS.remove(row)
    return {"success": True}


@app.get("/faculty")
def get_faculty(search: str | None = None, page: int = 1, limit: int = 50) -> dict[str, Any]:
    rows = FACULTY
    if search:
        needle = search.lower()
        rows = [row for row in rows if needle in row["name"].lower() or needle in row["department"].lower()]
    start = max(page - 1, 0) * limit
    return {"items": rows[start:start + limit], "total": len(rows)}


@app.get("/attendance")
def get_attendance(studentId: str | None = None, courseId: str | None = None, date: str | None = None) -> list[dict[str, Any]]:
    rows = ATTENDANCE
    if studentId:
        rows = [row for row in rows if row["student_id"] == studentId]
    if courseId:
        rows = [row for row in rows if row["course_id"] == courseId]
    if date:
        rows = [row for row in rows if row["date"] == date]
    return rows


@app.post("/attendance")
def mark_attendance(payload: AttendanceRecord) -> dict[str, Any]:
    row = {"id": uuid4().hex[:10], **payload.model_dump()}
    ATTENDANCE.append(row)
    return row


@app.post("/attendance/bulk")
def bulk_attendance(payload: BulkAttendanceRequest) -> dict[str, Any]:
    created = []
    for record in payload.records:
        student_id = record.get("studentId") or record.get("student_id")
        status = record.get("status")
        if not student_id or status not in {"present", "absent", "late", "excused"}:
            continue
        row = {"id": uuid4().hex[:10], "student_id": student_id, "course_id": payload.course_id, "date": payload.date, "status": status}
        ATTENDANCE.append(row)
        created.append(row)
    return {"created": len(created), "records": created}


@app.get("/exams")
def get_exams(upcoming: bool | None = None) -> list[dict[str, Any]]:
    if upcoming:
        return [row for row in EXAMS if row["status"] == "upcoming"]
    return EXAMS


@app.get("/assignments")
def get_assignments() -> list[dict[str, Any]]:
    return ASSIGNMENTS


@app.post("/assignments/{assignment_id}/submit")
def submit_assignment(assignment_id: str, payload: AssignmentSubmission) -> dict[str, Any]:
    assignment = find_or_404(ASSIGNMENTS, assignment_id, "Assignment")
    submission = {"id": uuid4().hex[:10], "content": payload.content, "attachments": payload.attachments, "submitted_at": datetime.now().isoformat()}
    assignment["submissions"].append(submission)
    return submission


@app.get("/fees")
def get_fees(studentId: str | None = None, status: str | None = None) -> list[dict[str, Any]]:
    rows = FEES
    if studentId:
        rows = [row for row in rows if row["student_id"] == studentId]
    if status:
        rows = [row for row in rows if row["status"] == status]
    return rows


@app.post("/fees/pay")
def pay_fee(payload: PaymentRequest) -> dict[str, Any]:
    fee = find_or_404(FEES, payload.fee_id, "Fee")
    fee.update({
        "status": "paid",
        "paid_date": date.today().isoformat(),
        "method": payload.method,
        "transaction_id": payload.transaction_id or f"DEMO-{uuid4().hex[:8].upper()}",
    })
    return fee


@app.get("/notices")
def get_notices() -> list[dict[str, Any]]:
    return NOTICES


@app.post("/notices", status_code=201)
def create_notice(payload: NoticeCreate) -> dict[str, Any]:
    row = {"id": uuid4().hex[:10], **payload.model_dump(), "published_at": datetime.now().isoformat()}
    NOTICES.insert(0, row)
    return row


@app.get("/library/books")
def library_books(search: str | None = None, category: str | None = None) -> list[dict[str, Any]]:
    rows = BOOKS
    if search:
        needle = search.lower()
        rows = [row for row in rows if needle in row["title"].lower() or needle in row["author"].lower()]
    if category:
        rows = [row for row in rows if row["category"] == category]
    return rows


@app.post("/library/issue")
def issue_book(payload: LibraryIssueRequest) -> dict[str, Any]:
    book = find_or_404(BOOKS, payload.book_id, "Book")
    if book["available"] <= 0:
        raise HTTPException(status_code=409, detail="No available copies")
    book["available"] -= 1
    issue = {"id": uuid4().hex[:10], "book_id": payload.book_id, "student_id": payload.student_id, "issued_at": date.today().isoformat(), "status": "issued"}
    LIBRARY_ISSUES.append(issue)
    return issue


@app.post("/library/return")
def return_book(payload: dict[str, str]) -> dict[str, Any]:
    issue_id = payload.get("issue_id")
    issue = find_or_404(LIBRARY_ISSUES, issue_id or "", "Library issue")
    if issue["status"] == "returned":
        return issue
    book = find_or_404(BOOKS, issue["book_id"], "Book")
    book["available"] = min(book["total"], book["available"] + 1)
    issue["status"] = "returned"
    issue["returned_at"] = date.today().isoformat()
    return issue


@app.get("/reports")
def report(type: str) -> dict[str, Any]:
    sources: dict[str, list[dict[str, Any]]] = {
        "students": STUDENTS,
        "attendance": ATTENDANCE,
        "fees": FEES,
        "assignments": ASSIGNMENTS,
        "notices": NOTICES,
    }
    rows = sources.get(type)
    if rows is None:
        raise HTTPException(status_code=400, detail="Unsupported report type")
    return {"type": type, "generated_at": datetime.now().isoformat(), "count": len(rows), "items": rows}


@app.get("/admin/colleges")
def admin_colleges() -> list[dict[str, Any]]:
    return COLLEGES


@app.post("/admin/colleges", status_code=201)
def create_college(payload: CollegeCreate) -> dict[str, Any]:
    row = {"id": uuid4().hex[:10], **payload.model_dump()}
    COLLEGES.insert(0, row)
    return row


@app.put("/admin/colleges/{college_id}")
def update_college(college_id: str, payload: CollegeCreate) -> dict[str, Any]:
    college = find_or_404(COLLEGES, college_id, "College")
    college.update(payload.model_dump())
    return college


@app.delete("/admin/colleges/{college_id}")
def delete_college(college_id: str) -> dict[str, bool]:
    college = find_or_404(COLLEGES, college_id, "College")
    COLLEGES.remove(college)
    return {"success": True}


@app.get("/admin/users")
def admin_users(role: str | None = None, collegeId: str | None = None) -> list[dict[str, Any]]:
    rows = [user.model_dump() for user in DEMO_USERS.values()]
    if role:
        rows = [row for row in rows if row["role"] == role]
    if collegeId:
        rows = [row for row in rows if row["college_id"] == collegeId]
    return rows


@app.get("/admin/analytics")
def admin_analytics(period: str | None = None) -> dict[str, Any]:
    return {
        "period": period or "current",
        "institutions": len(COLLEGES),
        "users": len(DEMO_USERS),
        "students": sum(int(row.get("students", 0)) for row in COLLEGES),
        "active_institutions": len([row for row in COLLEGES if row["status"] == "active"]),
    }


@app.get("/settings")
def get_settings() -> dict[str, Any]:
    return SETTINGS


@app.put("/settings")
def update_settings(payload: dict[str, Any]) -> dict[str, Any]:
    SETTINGS.update(payload)
    return SETTINGS


@app.post("/analytics/risk", response_model=RiskResult)
def student_risk(student: StudentSignal) -> RiskResult:
    return calculate_risk(student)


@app.post("/analytics/risk/batch", response_model=list[RiskResult])
def batch_risk(students: list[StudentSignal]) -> list[RiskResult]:
    return [calculate_risk(student) for student in students]


@app.get("/analytics/demo-summary")
def demo_summary() -> dict[str, Any]:
    signals = [
        StudentSignal(
            student_id=row["id"],
            name=row["name"],
            department=row["department"],
            semester=row["semester"],
            attendance=row["attendance"],
            score=min(100, row["cgpa"] * 10),
            trend=0,
        )
        for row in STUDENTS
    ]
    risks = [calculate_risk(student) for student in signals]
    risk_counts = Counter(result.risk_level for result in risks)
    return {
        "students": len(signals),
        "average_score": round(sum(student.score for student in signals) / max(len(signals), 1), 1),
        "average_attendance": round(sum(student.attendance for student in signals) / max(len(signals), 1), 1),
        "risk_counts": {level: risk_counts.get(level, 0) for level in ["High", "Medium", "Low"]},
    }
