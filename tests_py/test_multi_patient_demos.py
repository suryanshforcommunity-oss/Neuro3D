"""Tests for multi-patient demonstration examinations, volume progression, and model evaluation tracking."""

import hashlib
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from api.main import app
from api.patient_data import (
    get_patient_demo_examinations,
    get_all_demo_examinations,
)
from neuroscope.validation import validate_study_sequences

client = TestClient(app)


def test_demo_catalog_structure():
    """Verify demo catalog has exactly 6 slots across the two existing patients."""
    catalog = get_all_demo_examinations()
    assert catalog["totalExaminations"] == 6
    assert len(catalog["patients"]) == 2

    # Verify Patient A (Aarav Sharma) has exactly 3 demo exams
    patient_a_demos = get_patient_demo_examinations("PAT-2026-0042")
    assert len(patient_a_demos) == 3
    assert [d["demoSlot"] for d in patient_a_demos] == ["A1", "A2", "A3"]

    # Verify Patient B (Priya Patel) has exactly 3 demo exams
    patient_b_demos = get_patient_demo_examinations("PAT-2026-0108")
    assert len(patient_b_demos) == 3
    assert [d["demoSlot"] for d in patient_b_demos] == ["B1", "B2", "B3"]


def test_patient_a_volume_progression_strictly_increasing():
    """Patient A demonstration trajectory must be strictly increasing: A1 < A2 < A3."""
    patient_a_demos = get_patient_demo_examinations("PAT-2026-0042")
    v1 = patient_a_demos[0]["volumes"]["wtVolumeMl"]
    v2 = patient_a_demos[1]["volumes"]["wtVolumeMl"]
    v3 = patient_a_demos[2]["volumes"]["wtVolumeMl"]

    assert v1 < v2 < v3, f"Expected A1 ({v1}) < A2 ({v2}) < A3 ({v3})"
    assert v1 == pytest.approx(15.03, rel=1e-2)
    assert v2 == pytest.approx(24.34, rel=1e-2)
    assert v3 == pytest.approx(35.51, rel=1e-2)


def test_patient_b_volume_progression_strictly_decreasing():
    """Patient B demonstration trajectory must be strictly decreasing: B1 > B2 > B3."""
    patient_b_demos = get_patient_demo_examinations("PAT-2026-0108")
    v1 = patient_b_demos[0]["volumes"]["wtVolumeMl"]
    v2 = patient_b_demos[1]["volumes"]["wtVolumeMl"]
    v3 = patient_b_demos[2]["volumes"]["wtVolumeMl"]

    assert v1 > v2 > v3, f"Expected B1 ({v1}) > B2 ({v2}) > B3 ({v3})"
    assert v1 == pytest.approx(24.34, rel=1e-2)
    assert v2 == pytest.approx(15.03, rel=1e-2)
    assert v3 == pytest.approx(9.95, rel=1e-2)


def test_all_four_physical_examinations_valid_on_disk():
    """Verify all 4 examinations exist on disk, contain all 4 required sequences, and pass validation."""
    studies_dir = Path("storage/studies")
    exam_ids = ["study_exam_01", "study_exam_02", "study_exam_03", "study_exam_04"]

    for exam_id in exam_ids:
        exam_dir = studies_dir / exam_id
        assert exam_dir.exists(), f"Study directory {exam_id} does not exist"

        # Check required physical NIfTI files
        t1_path = exam_dir / "t1.nii.gz"
        t1ce_path = exam_dir / "t1ce.nii.gz"
        t2_path = exam_dir / "t2.nii.gz"
        flair_path = exam_dir / "flair.nii.gz"
        expert_path = exam_dir / "expert_mask.nii.gz"

        for p in [t1_path, t1ce_path, t2_path, flair_path, expert_path]:
            assert p.exists() and p.stat().st_size > 0, f"File {p} is missing or empty"

        # Run pipeline spatial validation
        res = validate_study_sequences({
            "T1": t1_path,
            "T1Gd": t1ce_path,
            "T2": t2_path,
            "FLAIR": flair_path,
        })
        assert res["is_valid"], f"Validation failed for {exam_id}: {res['errors']}"


def test_demo_api_endpoints():
    """Verify GET /api/v1/demos endpoints return the expected payload."""
    response = client.get("/api/v1/demos")
    assert response.status_code == 200
    data = response.json()
    assert data["totalExaminations"] == 6
    assert len(data["patients"]) == 2

    # Query Patient A
    resp_a = client.get("/api/v1/demos/PAT-2026-0042")
    assert resp_a.status_code == 200
    assert len(resp_a.json()["examinations"]) == 3

    # Query Patient B
    resp_b = client.get("/api/v1/demos/PAT-2026-0108")
    assert resp_b.status_code == 200
    assert len(resp_b.json()["examinations"]) == 3


def test_no_weight_mutation_during_demo_execution():
    """Inference execution must NOT mutate model weights or fake learning."""
    model_path = Path("models/brats_mri_segmentation.pt")
    if not model_path.exists():
        pytest.skip("Model weights not present")

    # Hash weights before execution
    hash_before = hashlib.sha256(model_path.read_bytes()).hexdigest()

    # Trigger demo inference endpoint
    response = client.post("/api/v1/demos/study_exam_01/infer")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "execution" in data
    assert data["execution"]["totalDurationMs"] >= 0

    # Hash weights after execution
    hash_after = hashlib.sha256(model_path.read_bytes()).hexdigest()
    assert hash_before == hash_after, "Model weights must remain strictly invariant (no weight mutation)"
