"""
Unit tests for 24-hour data retention auto-cleanup.
"""

import os
import time
from pathlib import Path

from neuroscope.retention import cleanup_expired_studies


def test_retention_cleanup_deletes_expired_studies(temp_dir):
    studies_dir = temp_dir / "studies"
    studies_dir.mkdir()

    # Study 1: Expired (25 hours old)
    expired_study = studies_dir / "study_old_001"
    expired_study.mkdir()
    (expired_study / "t1.nii.gz").write_bytes(b"dummy_data_old")

    # Study 2: Fresh (1 hour old)
    fresh_study = studies_dir / "study_fresh_002"
    fresh_study.mkdir()
    (fresh_study / "t1.nii.gz").write_bytes(b"dummy_data_fresh")

    # Artificially age study 1's mtime to 25 hours ago
    now = time.time()
    twenty_five_hours_ago = now - (25 * 3600)
    os.utime(str(expired_study), (twenty_five_hours_ago, twenty_five_hours_ago))

    # One hour ago for fresh study
    one_hour_ago = now - 3600
    os.utime(str(fresh_study), (one_hour_ago, one_hour_ago))

    # Run cleanup with standard 24h (86,400s) threshold
    purged = cleanup_expired_studies(studies_dir=studies_dir, max_age_seconds=24 * 3600)

    # Verifications
    assert "study_old_001" in purged
    assert "study_fresh_002" not in purged

    # Verify physical filesystem state
    assert not expired_study.exists(), "Expired study was not physically removed from disk."
    assert fresh_study.exists(), "Fresh study was incorrectly deleted."
    assert (fresh_study / "t1.nii.gz").exists()


def test_retention_cleanup_custom_threshold(temp_dir):
    studies_dir = temp_dir / "studies"
    studies_dir.mkdir()

    s1 = studies_dir / "study_custom_1"
    s1.mkdir()

    now = time.time()
    os.utime(str(s1), (now - 60, now - 60))  # 60 seconds old

    # Clean with 30s threshold
    purged = cleanup_expired_studies(studies_dir=studies_dir, max_age_seconds=30)
    assert "study_custom_1" in purged
    assert not s1.exists()
