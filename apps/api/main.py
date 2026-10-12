from __future__ import annotations

from collections import Counter
from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


app = FastAPI(
    title="EDU_ONE API",
    version="0.2.0",
    description="Free local/demo API for EDU_ONE portfolio workflows.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://edu-one-eta.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


DEMO_STUDENTS = [
    StudentSignal(student_id="BAM018", name="Aarav Kumar", department="AIML", semester=5, attendance=94, score=86, trend=5),
    StudentSignal(student_id="BAM027", name="Diya S", department="AIML", semester=5, attendance=72, score=58, trend=-6),
    StudentSignal(student_id="CSE104", name="Kavin Raj", department="CSE", semester=3, attendance=81, score=67, trend=2),
    StudentSignal(student_id="DS041", name="Meera N", department="Data Science", semester=4, attendance=63, score=49, trend=-9),
    StudentSignal(student_id="IT088", name="Nithin P", department="IT", semester=2, attendance=88, score=73, trend=4),
]


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

    return RiskResult(
        student_id=student.student_id,
        risk_level=level,
        risk_points=points,
        reason=reasons,
    )


@app.get("/")
def root() -> dict[str, str]:
    return {
        "name": "EDU_ONE API",
        "version": "0.2.0",
        "docs": "/docs",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/demo/students", response_model=list[StudentSignal])
def demo_students() -> list[StudentSignal]:
    return DEMO_STUDENTS


@app.post("/analytics/risk", response_model=RiskResult)
def student_risk(student: StudentSignal) -> RiskResult:
    return calculate_risk(student)


@app.post("/analytics/risk/batch", response_model=list[RiskResult])
def batch_risk(students: list[StudentSignal]) -> list[RiskResult]:
    return [calculate_risk(student) for student in students]


@app.get("/analytics/demo-summary")
def demo_summary() -> dict[str, object]:
    risks = [calculate_risk(student) for student in DEMO_STUDENTS]
    risk_counts = Counter(result.risk_level for result in risks)
    return {
        "students": len(DEMO_STUDENTS),
        "average_score": round(sum(student.score for student in DEMO_STUDENTS) / len(DEMO_STUDENTS), 1),
        "average_attendance": round(sum(student.attendance for student in DEMO_STUDENTS) / len(DEMO_STUDENTS), 1),
        "risk_counts": {
            "High": risk_counts.get("High", 0),
            "Medium": risk_counts.get("Medium", 0),
            "Low": risk_counts.get("Low", 0),
        },
    }
