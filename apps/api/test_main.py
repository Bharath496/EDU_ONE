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


def test_staff_login() -> None:
    response = client.post(
        "/auth/login",
        json={"email": "staff@eduone.demo", "password": ""},
    )
    assert response.status_code == 200
    assert response.json()["user"]["role"] == "Staff"


def test_academic_course_workflow() -> None:
    created = client.post(
        "/academics/courses",
        json={
            "code": "CI-501",
            "name": "CI Course",
            "credits": 3,
            "department": "AIML",
            "semester": 5,
            "day": "Wednesday",
            "start_time": "10:00",
            "end_time": "11:00",
            "room": "CI Lab",
            "status": "active",
        },
    )
    assert created.status_code == 201
    course_id = created.json()["id"]

    fetched = client.get("/academics/courses", params={"department": "AIML"})
    assert fetched.status_code == 200
    assert any(item["id"] == course_id for item in fetched.json())

    deleted = client.delete(f"/academics/courses/{course_id}")
    assert deleted.status_code == 200


def test_communication_message_workflow() -> None:
    created = client.post(
        "/communication/messages",
        json={
            "sender": "CI Faculty",
            "sender_role": "Faculty",
            "recipient": "Students",
            "subject": "CI Message",
            "body": "Message created by API test.",
        },
    )
    assert created.status_code == 201
    message_id = created.json()["id"]
    assert created.json()["unread"] is True

    read = client.post(f"/communication/messages/{message_id}/read")
    assert read.status_code == 200
    assert read.json()["unread"] is False


def test_support_ticket_workflow() -> None:
    created = client.post(
        "/support/tickets",
        json={
            "title": "CI Support Ticket",
            "category": "Technical",
            "created_by": "CI User",
            "priority": "medium",
        },
    )
    assert created.status_code == 201
    ticket_id = created.json()["id"]
    assert created.json()["status"] == "open"

    updated = client.put(
        f"/support/tickets/{ticket_id}",
        json={"status": "resolved"},
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "resolved"
