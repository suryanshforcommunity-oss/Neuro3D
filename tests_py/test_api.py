"""
Integration tests for FastAPI endpoints defined in src/services/api.ts contract.
"""

import io
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from api.main import app
from neuroscope.config import STUDIES_DIR
from tests_py.conftest import create_synthetic_nifti


@pytest.fixture
def client():
    return TestClient(app)


def test_api_health_check(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["ok", "degraded", "maintenance"]
    assert "version" in data
    assert "monaiVersion" in data
    assert "cudaAvailable" in data
    assert "activeModel" in data
    assert "timestamp" in data


def test_api_upload_invalid_modality(client, temp_dir):
    # Upload invalid empty file for T1
    empty_file = temp_dir / "empty.nii.gz"
    empty_file.write_bytes(b"")

    valid_file = temp_dir / "valid.nii.gz"
    create_synthetic_nifti(valid_file)

    files = {
        "t1": ("t1.nii.gz", open(empty_file, "rb"), "application/gzip"),
        "t1ce": ("t1ce.nii.gz", open(valid_file, "rb"), "application/gzip"),
        "t2": ("t2.nii.gz", open(valid_file, "rb"), "application/gzip"),
        "flair": ("flair.nii.gz", open(valid_file, "rb"), "application/gzip"),
    }

    res = client.post("/api/v1/studies", files=files)
    assert res.status_code == 400
    detail = res.json()["detail"]
    assert "NIfTI sequence validation failed" in detail["message"]


def test_api_upload_and_lifecycle(client, synthetic_study, synthetic_weights):
    # 1. Upload valid 4 sequences
    files = {
        "t1": ("t1.nii.gz", open(synthetic_study["T1"], "rb"), "application/gzip"),
        "t1ce": ("t1ce.nii.gz", open(synthetic_study["T1Gd"], "rb"), "application/gzip"),
        "t2": ("t2.nii.gz", open(synthetic_study["T2"], "rb"), "application/gzip"),
        "flair": ("flair.nii.gz", open(synthetic_study["FLAIR"], "rb"), "application/gzip"),
    }
    data = {"deidentified_id": "TEST_PATIENT_001"}

    upload_res = client.post("/api/v1/studies", files=files, data=data)
    assert upload_res.status_code == 200
    upload_data = upload_res.json()
    study_id = upload_data["studyId"]
    assert upload_data["status"] == "uploaded"
    assert "retentionExpiresAt" in upload_data
    assert len(upload_data["sequenceHashes"]) == 4

    # 2. Check study initial status
    status_res = client.get(f"/api/v1/studies/{study_id}/status")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["studyId"] == study_id
    assert status_data["status"] == "pending"

    # 3. Trigger segmentation without valid weights -> explicit failure state
    seg_res_fail = client.post(
        f"/api/v1/studies/{study_id}/segment",
        json={"modelName": "MONAI SegResNet"},
        params={"weights_path": "nonexistent_weights.pt"},
    )
    assert seg_res_fail.status_code == 200
    seg_data_fail = seg_res_fail.json()
    assert seg_data_fail["status"] == "failed"
    assert "INFERENCE BLOCKED" in seg_data_fail["message"]

    # Status should reflect error
    status_fail = client.get(f"/api/v1/studies/{study_id}/status").json()
    assert status_fail["status"] == "error"
    assert "INFERENCE BLOCKED" in status_fail["errorMessage"]

    # 4. Trigger segmentation with test weights
    seg_res_ok = client.post(
        f"/api/v1/studies/{study_id}/segment",
        json={"modelName": "MONAI SegResNet"},
        params={"weights_path": str(synthetic_weights)},
    )
    assert seg_res_ok.status_code == 200
    seg_data_ok = seg_res_ok.json()
    assert seg_data_ok["status"] == "queued"

    # Since TestClient executes background tasks synchronously by default:
    # 5. Check status ready
    status_ready = client.get(f"/api/v1/studies/{study_id}/status").json()
    assert status_ready["status"] == "ready"
    assert status_ready["progress"] == 100

    # 6. Check results endpoint
    results_res = client.get(f"/api/v1/studies/{study_id}/results")
    assert results_res.status_code == 200
    results_data = results_res.json()
    assert results_data["studyId"] == study_id
    assert "wtVolumeMl" in results_data["volumes"]
    assert "tcVolumeMl" in results_data["volumes"]
    assert "etVolumeMl" in results_data["volumes"]
    assert len(results_data["volumes"]["voxelSpacingMm"]) == 3

    # 7. Check report endpoint
    report_res = client.get(f"/api/v1/studies/{study_id}/report")
    assert report_res.status_code == 200
    report_data = report_res.json()
    assert report_data["studyId"] == study_id
    assert "provenance" in report_data["reportJson"]
    assert "results" in report_data["reportJson"]

    # 8. Check prediction NIfTI download endpoint
    nifti_res = client.get(f"/api/v1/studies/{study_id}/prediction.nii.gz")
    assert nifti_res.status_code == 200
    assert len(nifti_res.content) > 0


def test_api_maintenance_cleanup(client):
    res = client.post("/api/v1/maintenance/cleanup", params={"max_age_seconds": 0})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "purged_count" in data
