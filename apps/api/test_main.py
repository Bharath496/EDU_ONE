from fastapi.testclient import TestClient

from main import StudentSignal, app, calculate_risk


client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_demo_login() -> None:
    response = client.post(
        "/auth/login",
        json={"email": "college.admin@eduone.demo", "password": ""},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["user"]["role"] == "College Admin"
    assert payload["access_token"].startswith("demo-")


def test_student_crud() -> None:
    created = client.post(
        "/students",
        json={
            "name": "CI Student",
            "reg_no": "CI001",
            "department": "AIML",
            "semester": 5,
            "email": "ci@eduone.demo",
            "attendance": 88,
            "cgpa": 8.1,
            "status": "active",
        },
    )
    assert created.status_code == 201
    student_id = created.json()["id"]
    fetched = client.get(f"/students/{student_id}")
    assert fetched.status_code == 200
    assert fetched.json()["reg_no"] == "CI001"
    deleted = client.delete(f"/students/{student_id}")
    assert deleted.status_code == 200


def test_fee_payment() -> None:
    response = client.post(
        "/fees/pay",
        json={"fee_id": "fee-2", "amount": 45000, "method": "Demo UPI"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "paid"


def test_notice_creation() -> None:
    response = client.post(
        "/notices",
        json={
            "title": "CI Notice",
            "content": "Created by the API smoke test.",
            "priority": "medium",
            "target": "Everyone",
        },
    )
    assert response.status_code == 201
    assert response.json()["title"] == "CI Notice"


def test_library_issue_and_return() -> None:
    issued = client.post("/library/issue", json={"book_id": "book-1", "student_id": "1"})
    assert issued.status_code == 200
    issue_id = issued.json()["id"]
    returned = client.post("/library/return", json={"issue_id": issue_id})
    assert returned.status_code == 200
    assert returned.json()["status"] == "returned"


def test_high_risk_student() -> None:
    student = StudentSignal(
        student_id="TEST001",
        name="Test Student",
        department="AIML",
        semester=5,
        attendance=60,
        score=45,
        trend=-8,
    )
    result = calculate_risk(student)
    assert result.risk_level == "High"
    assert result.risk_points >= 5


def test_demo_summary() -> None:
    response = client.get("/analytics/demo-summary")
    assert response.status_code == 200
    payload = response.json()
    assert payload["students"] > 0
    assert set(payload["risk_counts"]) == {"High", "Medium", "Low"}
