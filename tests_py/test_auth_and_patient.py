"""
NeuroScope 3D - Authentication & Patient Portal Verification Tests.
Verifies role separation, secure password verification, longitudinal trend calculations,
and server-side authorization barriers.
"""

import pytest
from fastapi.testclient import TestClient
from api.main import app
from api.auth import hash_password, verify_password, generate_session_token, verify_session_token

client = TestClient(app)


def test_password_hashing():
    raw = "SecureClinicalPass2026!"
    hashed = hash_password(raw)
    assert hashed != raw
    assert "$" in hashed
    assert verify_password(hashed, raw) is True
    assert verify_password(hashed, "WrongPass123") is False


def test_session_token_lifecycle():
    token = generate_session_token("pat_001", "patient")
    verified = verify_session_token(token)
    assert verified is not None
    assert verified["user_id"] == "pat_001"
    assert verified["role"] == "patient"

    # Corrupted signature
    tampered = token[:-4] + "ffff"
    assert verify_session_token(tampered) is None


def test_doctor_login_success():
    res = client.post("/api/v1/auth/login", json={
        "identifier": "doctor@neuroscope.ai",
        "password": "NeuroScope2026!",
        "role": "doctor"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["role"] == "doctor"
    assert "Dr. Sarah Chen" in data["user"]["name"]
    assert "passwordHash" not in data["user"]


def test_patient_login_success():
    # Login via patient ID
    res = client.post("/api/v1/auth/login", json={
        "identifier": "PAT-2026-0042",
        "password": "PatientPass2026!",
        "role": "patient"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["role"] == "patient"
    assert data["user"]["name"] == "Aarav Sharma"


def test_login_invalid_credentials_rejected():
    res = client.post("/api/v1/auth/login", json={
        "identifier": "PAT-2026-0042",
        "password": "WrongPassword!",
        "role": "patient"
    })
    assert res.status_code == 401
    assert "Invalid credentials" in res.json()["detail"]


def test_patient_dashboard_authorization_and_records():
    # Login as patient
    login_res = client.post("/api/v1/auth/login", json={
        "identifier": "PAT-2026-0042",
        "password": "PatientPass2026!",
        "role": "patient"
    })
    token = login_res.json()["token"]

    # Access patient dashboard
    dash_res = client.get("/api/v1/patient/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert dash_res.status_code == 200
    data = dash_res.json()
    assert data["patient"]["name"] == "Aarav Sharma"
    assert len(data["examinations"]) == 3
    assert data["trend"]["hasComparison"] is True
    assert data["trend"]["percentageChange"] == -7.3
    assert data["trend"]["absoluteDifferenceMl"] == -2.35
    assert "Decrease in measured segmented volume" in data["trend"]["trendLabel"]
    
    # Verify anatomical location timeline
    assert len(data["trend"]["timeline"]) == 3
    assert data["trend"]["timeline"][0]["location"] == "Right Frontoparietal Region"


def test_cross_role_access_barrier():
    # Login as doctor
    doc_res = client.post("/api/v1/auth/login", json={
        "identifier": "doctor@neuroscope.ai",
        "password": "NeuroScope2026!",
        "role": "doctor"
    })
    doc_token = doc_res.json()["token"]

    # Doctor token attempting to access patient dashboard
    forbidden_res = client.get("/api/v1/patient/dashboard", headers={"Authorization": f"Bearer {doc_token}"})
    assert forbidden_res.status_code == 403


def test_patient_report_endpoint():
    login_res = client.post("/api/v1/auth/login", json={
        "identifier": "PAT-2026-0042",
        "password": "PatientPass2026!",
        "role": "patient"
    })
    token = login_res.json()["token"]

    report_res = client.get(
        "/api/v1/patient/report/STUDY_2026_03_PAT0042",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert report_res.status_code == 200
    report = report_res.json()
    assert report["patientName"] == "Aarav Sharma"
    assert report["volumes"]["wtVolumeMl"] == 29.75
    assert "whatThisMeans" in report["plainLanguageExplanation"]
