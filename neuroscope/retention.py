"""
NeuroScope 3D - 24-Hour Study Data Retention & Cleanup Module.
"""

import time
import shutil
from pathlib import Path
from typing import List, Optional

from neuroscope.config import STUDIES_DIR, RETENTION_SECONDS


def cleanup_expired_studies(
    studies_dir: Optional[Path] = None,
    max_age_seconds: float = RETENTION_SECONDS,
) -> List[str]:
    """
    Purges uploaded patient studies and intermediate tensors older than the retention threshold.
    Default retention period is 24 hours (86,400 seconds).
    Returns list of purged study IDs.
    """
    target_dir = studies_dir or STUDIES_DIR
    if not target_dir.exists():
        return []

    now = time.time()
    purged_study_ids: List[str] = []

    for study_folder in target_dir.iterdir():
        if not study_folder.is_dir():
            continue

        try:
            # Protect permanent demonstration examinations from transient session cleanup
            if study_folder.name.startswith("study_exam_"):
                continue

            mtime = study_folder.stat().st_mtime
            age = now - mtime

            if age >= max_age_seconds:
                study_id = study_folder.name
                shutil.rmtree(study_folder)
                purged_study_ids.append(study_id)
        except Exception:
            continue

    return purged_study_ids
