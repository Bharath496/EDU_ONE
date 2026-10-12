from fastapi.testclient import TestClient

from main import app, calculate_risk, StudentSignal


client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


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
