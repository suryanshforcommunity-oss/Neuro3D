"""
NeuroScope 3D - Patient Longitudinal Records & Clinical History.
Manages multi-examination MRI records, verified physical volumes,
longitudinal trend comparisons, and anatomical localization timelines.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime

# Longitudinal clinical examination database for patients (Clinical Portal Records)
PATIENT_EXAMINATIONS: Dict[str, List[Dict[str, Any]]] = {
    "pat_001": [
        {
            "studyId": "STUDY_2025_11_PAT0042",
            "patientId": "PAT-2026-0042",
            "patientName": "Aarav Sharma",
            "examinationDate": "2025-11-14T09:30:00Z",
            "displayDate": "Nov 14, 2025",
            "facility": "Memorial Neurological Institute",
            "sequences": ["T1", "T1Gd", "T2", "FLAIR"],
            "magneticField": "3.0T MRI",
            "segmentationStatus": "Completed (Verified)",
            "hasSegmentation": True,
            "voxelSpacingMm": [1.0, 1.0, 1.0],
            "volumes": {
                "wtVolumeMl": 36.80,
                "tcVolumeMl": 32.40,
                "etVolumeMl": 4.50,
                "edVolumeMl": 4.40,
                "ncrVolumeMl": 27.90,
            },
            "tumorLocation": {
                "lobe": "Right Frontoparietal Region",
                "subregion": "Subcortical White Matter adjacent to Precentral Gyrus",
                "hemisphere": "Right",
                "coordinates": {"x": 16.0, "y": 8.0, "z": 10.0},
                "anteriorPosterior": "Mid-Posterior",
                "notes": "Initial pre-treatment baseline examination. Prominent enhancing rim with peripheral edema.",
            },
            "reportAvailable": True,
            "reportId": "REP_20251114_0042",
            "clinicalSummary": "Baseline scan prior to initial therapeutic protocol. Clear demarcation of primary lesion.",
        },
        {
            "studyId": "STUDY_2026_01_PAT0042",
            "patientId": "PAT-2026-0042",
            "patientName": "Aarav Sharma",
            "examinationDate": "2026-01-22T11:15:00Z",
            "displayDate": "Jan 22, 2026",
            "facility": "Memorial Neurological Institute",
            "sequences": ["T1", "T1Gd", "T2", "FLAIR"],
            "magneticField": "3.0T MRI",
            "segmentationStatus": "Completed (Verified)",
            "hasSegmentation": True,
            "voxelSpacingMm": [1.0, 1.0, 1.0],
            "volumes": {
                "wtVolumeMl": 32.10,
                "tcVolumeMl": 29.80,
                "etVolumeMl": 3.80,
                "edVolumeMl": 2.30,
                "ncrVolumeMl": 26.00,
            },
            "tumorLocation": {
                "lobe": "Right Frontoparietal Region",
                "subregion": "Deep Periventricular White Matter margin",
                "hemisphere": "Right",
                "coordinates": {"x": 15.0, "y": 7.0, "z": 9.0},
                "anteriorPosterior": "Mid-Posterior",
                "notes": "Mid-treatment response scan. Reduction in peritumoral edema volume.",
            },
            "reportAvailable": True,
            "reportId": "REP_20260122_0042",
            "clinicalSummary": "Follow-up scan after cycle 1. Measured segmented volume demonstrated initial reduction.",
        },
        {
            "studyId": "STUDY_2026_03_PAT0042",
            "patientId": "PAT-2026-0042",
            "patientName": "Aarav Sharma",
            "examinationDate": "2026-03-28T14:00:00Z",
            "displayDate": "Mar 28, 2026",
            "facility": "Memorial Neurological Institute",
            "sequences": ["T1", "T1Gd", "T2", "FLAIR"],
            "magneticField": "3.0T MRI",
            "segmentationStatus": "Completed (Verified)",
            "hasSegmentation": True,
            "voxelSpacingMm": [1.0, 1.0, 1.0],
            "volumes": {
                "wtVolumeMl": 29.75,
                "tcVolumeMl": 29.41,
                "etVolumeMl": 3.06,
                "edVolumeMl": 0.34,
                "ncrVolumeMl": 26.35,
            },
            "tumorLocation": {
                "lobe": "Right Frontoparietal Region",
                "subregion": "Stable circumscribed nidus without contralateral extension",
                "hemisphere": "Right",
                "coordinates": {"x": 14.0, "y": 6.0, "z": 8.0},
                "anteriorPosterior": "Posterior aspect",
                "notes": "Most recent examination. Edema continues to subside; active hypervascular rim remains localized.",
            },
            "reportAvailable": True,
            "reportId": "REP_20260328_0042",
            "clinicalSummary": "Latest volumetric review. Total measured segmented volume is 29.75 mL.",
        },
    ],
    "pat_002": [
        {
            "studyId": "STUDY_2026_02_PAT0108",
            "patientId": "PAT-2026-0108",
            "patientName": "Priya Patel",
            "examinationDate": "2026-02-18T10:00:00Z",
            "displayDate": "Feb 18, 2026",
            "facility": "Memorial Neurological Institute",
            "sequences": ["T1", "T1Gd", "T2", "FLAIR"],
            "magneticField": "3.0T MRI",
            "segmentationStatus": "Completed (Verified)",
            "hasSegmentation": True,
            "voxelSpacingMm": [1.0, 1.0, 1.0],
            "volumes": {
                "wtVolumeMl": 18.50,
                "tcVolumeMl": 15.20,
                "etVolumeMl": 2.10,
                "edVolumeMl": 3.30,
                "ncrVolumeMl": 13.10,
            },
            "tumorLocation": {
                "lobe": "Left Temporal Lobe",
                "subregion": "Superior Temporal Gyrus",
                "hemisphere": "Left",
                "coordinates": {"x": -22.0, "y": -4.0, "z": -6.0},
                "anteriorPosterior": "Anterior-Mid",
                "notes": "Single baseline examination on file.",
            },
            "reportAvailable": True,
            "reportId": "REP_20260218_0108",
            "clinicalSummary": "Baseline diagnostic assessment. Additional follow-up scan scheduled to compute longitudinal trend.",
        }
    ],
}

# Dedicated Multi-Patient Demonstration Examination Series (Doctor Workstation)
# Patient A: Monotonically INCREASING measured volume: A1 (15.03) < A2 (24.34) < A3 (35.51) mL
# Patient B: Monotonically DECREASING measured volume: B1 (24.34) > B2 (15.03) > B3 (9.95) mL
PATIENT_DEMO_EXAMINATIONS: Dict[str, List[Dict[str, Any]]] = {
    "pat_001": [
        {
            "demoSlot": "A1",
            "studyId": "study_exam_01",
            "patientId": "PAT-2026-0042",
            "patientName": "Aarav Sharma",
            "examinationDate": "2025-10-14T09:30:00Z",
            "displayDate": "Oct 14, 2025",
            "facility": "Memorial Neurological Institute",
            "sequences": ["T1", "T1Gd", "T2", "FLAIR"],
            "magneticField": "3.0T MRI",
            "segmentationStatus": "Completed (Precomputed / Live Supported)",
            "hasSegmentation": True,
            "hasExpertMask": True,
            "isLiveInference": False,
            "provenanceLabel": "Synthetic Multimodal Brain Phantom (1.0 mm isotropic)",
            "voxelSpacingMm": [1.0, 1.0, 1.0],
            "volumes": {
                "wtVolumeMl": 15.03,
                "tcVolumeMl": 6.39,
                "etVolumeMl": 3.84,
                "edVolumeMl": 8.64,
                "ncrVolumeMl": 2.55,
            },
            "tumorLocation": {
                "lobe": "Right Frontoparietal Region",
                "subregion": "Subcortical White Matter adjacent to Precentral Gyrus",
                "hemisphere": "Right",
                "coordinates": {"x": 18.0, "y": 6.0, "z": 4.0},
                "anteriorPosterior": "Mid-Posterior",
                "notes": "Examination A1: Baseline examination. Discrete localized enhancing rim.",
            },
            "reportAvailable": True,
            "reportId": "DEMO_REP_A1_0042",
            "clinicalSummary": "Baseline demonstration scan. Measured Whole Tumor (WT) volume is 15.03 mL.",
        },
        {
            "demoSlot": "A2",
            "studyId": "study_exam_02",
            "patientId": "PAT-2026-0042",
            "patientName": "Aarav Sharma",
            "examinationDate": "2026-01-18T11:15:00Z",
            "displayDate": "Jan 18, 2026",
            "facility": "Memorial Neurological Institute",
            "sequences": ["T1", "T1Gd", "T2", "FLAIR"],
            "magneticField": "3.0T MRI",
            "segmentationStatus": "Completed (Precomputed / Live Supported)",
            "hasSegmentation": True,
            "hasExpertMask": True,
            "isLiveInference": False,
            "provenanceLabel": "Synthetic Multimodal Brain Phantom (1.0 mm isotropic)",
            "voxelSpacingMm": [1.0, 1.0, 1.0],
            "volumes": {
                "wtVolumeMl": 24.34,
                "tcVolumeMl": 11.10,
                "etVolumeMl": 6.48,
                "edVolumeMl": 13.24,
                "ncrVolumeMl": 4.62,
            },
            "tumorLocation": {
                "lobe": "Right Frontoparietal Region",
                "subregion": "Deep Periventricular White Matter margin",
                "hemisphere": "Right",
                "coordinates": {"x": 18.0, "y": 6.0, "z": 4.0},
                "anteriorPosterior": "Mid-Posterior",
                "notes": "Examination A2: Mid follow-up scan demonstrating increased measured segmented volume.",
            },
            "reportAvailable": True,
            "reportId": "DEMO_REP_A2_0042",
            "clinicalSummary": "Follow-up scan A2. Measured Whole Tumor (WT) volume is 24.34 mL (Increase of +9.31 mL).",
        },
        {
            "demoSlot": "A3",
            "studyId": "study_exam_03",
            "patientId": "PAT-2026-0042",
            "patientName": "Aarav Sharma",
            "examinationDate": "2026-04-22T14:00:00Z",
            "displayDate": "Apr 22, 2026",
            "facility": "Memorial Neurological Institute",
            "sequences": ["T1", "T1Gd", "T2", "FLAIR"],
            "magneticField": "3.0T MRI",
            "segmentationStatus": "Completed (Precomputed / Live Supported)",
            "hasSegmentation": True,
            "hasExpertMask": True,
            "isLiveInference": False,
            "provenanceLabel": "Synthetic Multimodal Brain Phantom (1.0 mm isotropic)",
            "voxelSpacingMm": [1.0, 1.0, 1.0],
            "volumes": {
                "wtVolumeMl": 35.51,
                "tcVolumeMl": 16.64,
                "etVolumeMl": 9.51,
                "edVolumeMl": 18.87,
                "ncrVolumeMl": 7.13,
            },
            "tumorLocation": {
                "lobe": "Right Frontoparietal Region",
                "subregion": "Extended frontoparietal margins with perilesional edema",
                "hemisphere": "Right",
                "coordinates": {"x": 18.0, "y": 6.0, "z": 4.0},
                "anteriorPosterior": "Posterior aspect",
                "notes": "Examination A3: Latest scan. Measured segmented volume is 35.51 mL.",
            },
            "reportAvailable": True,
            "reportId": "DEMO_REP_A3_0042",
            "clinicalSummary": "Follow-up scan A3. Measured Whole Tumor (WT) volume is 35.51 mL (Increase of +11.17 mL).",
        },
    ],
    "pat_002": [
        {
            "demoSlot": "B1",
            "studyId": "study_exam_02",
            "patientId": "PAT-2026-0108",
            "patientName": "Priya Patel",
            "examinationDate": "2025-11-10T10:00:00Z",
            "displayDate": "Nov 10, 2025",
            "facility": "Memorial Neurological Institute",
            "sequences": ["T1", "T1Gd", "T2", "FLAIR"],
            "magneticField": "3.0T MRI",
            "segmentationStatus": "Completed (Precomputed / Live Supported)",
            "hasSegmentation": True,
            "hasExpertMask": True,
            "isLiveInference": False,
            "provenanceLabel": "Synthetic Multimodal Brain Phantom (1.0 mm isotropic)",
            "voxelSpacingMm": [1.0, 1.0, 1.0],
            "volumes": {
                "wtVolumeMl": 24.34,
                "tcVolumeMl": 11.10,
                "etVolumeMl": 6.48,
                "edVolumeMl": 13.24,
                "ncrVolumeMl": 4.62,
            },
            "tumorLocation": {
                "lobe": "Right Frontoparietal Region",
                "subregion": "Deep Periventricular White Matter margin",
                "hemisphere": "Right",
                "coordinates": {"x": 18.0, "y": 6.0, "z": 4.0},
                "anteriorPosterior": "Mid-Posterior",
                "notes": "Examination B1: Baseline demonstration examination on file.",
            },
            "reportAvailable": True,
            "reportId": "DEMO_REP_B1_0108",
            "clinicalSummary": "Baseline demonstration scan. Initial measured Whole Tumor (WT) volume is 24.34 mL.",
        },
        {
            "demoSlot": "B2",
            "studyId": "study_exam_01",
            "patientId": "PAT-2026-0108",
            "patientName": "Priya Patel",
            "examinationDate": "2026-02-02T11:30:00Z",
            "displayDate": "Feb 02, 2026",
            "facility": "Memorial Neurological Institute",
            "sequences": ["T1", "T1Gd", "T2", "FLAIR"],
            "magneticField": "3.0T MRI",
            "segmentationStatus": "Completed (Precomputed / Live Supported)",
            "hasSegmentation": True,
            "hasExpertMask": True,
            "isLiveInference": False,
            "provenanceLabel": "Synthetic Multimodal Brain Phantom (1.0 mm isotropic)",
            "voxelSpacingMm": [1.0, 1.0, 1.0],
            "volumes": {
                "wtVolumeMl": 15.03,
                "tcVolumeMl": 6.39,
                "etVolumeMl": 3.84,
                "edVolumeMl": 8.64,
                "ncrVolumeMl": 2.55,
            },
            "tumorLocation": {
                "lobe": "Right Frontoparietal Region",
                "subregion": "Subcortical White Matter adjacent to Precentral Gyrus",
                "hemisphere": "Right",
                "coordinates": {"x": 18.0, "y": 6.0, "z": 4.0},
                "anteriorPosterior": "Mid-Posterior",
                "notes": "Examination B2: Mid-treatment scan demonstrating marked decrease in measured volume.",
            },
            "reportAvailable": True,
            "reportId": "DEMO_REP_B2_0108",
            "clinicalSummary": "Follow-up scan B2. Measured Whole Tumor (WT) volume decreased to 15.03 mL (-9.31 mL).",
        },
        {
            "demoSlot": "B3",
            "studyId": "study_exam_04",
            "patientId": "PAT-2026-0108",
            "patientName": "Priya Patel",
            "examinationDate": "2026-04-10T14:30:00Z",
            "displayDate": "Apr 10, 2026",
            "facility": "Memorial Neurological Institute",
            "sequences": ["T1", "T1Gd", "T2", "FLAIR"],
            "magneticField": "3.0T MRI",
            "segmentationStatus": "Completed (Precomputed / Live Supported)",
            "hasSegmentation": True,
            "hasExpertMask": True,
            "isLiveInference": False,
            "provenanceLabel": "Synthetic Multimodal Brain Phantom (1.0 mm isotropic)",
            "voxelSpacingMm": [1.0, 1.0, 1.0],
            "volumes": {
                "wtVolumeMl": 9.95,
                "tcVolumeMl": 3.95,
                "etVolumeMl": 2.46,
                "edVolumeMl": 6.00,
                "ncrVolumeMl": 1.49,
            },
            "tumorLocation": {
                "lobe": "Right Frontoparietal Region",
                "subregion": "Subsided peritumoral area with contracted lesion core",
                "hemisphere": "Right",
                "coordinates": {"x": 18.0, "y": 6.0, "z": 4.0},
                "anteriorPosterior": "Posterior aspect",
                "notes": "Examination B3: Latest scan demonstrating further decreased measured volume.",
            },
            "reportAvailable": True,
            "reportId": "DEMO_REP_B3_0108",
            "clinicalSummary": "Follow-up scan B3. Measured Whole Tumor (WT) volume decreased further to 9.95 mL (-5.08 mL).",
        },
    ],
}


def get_patient_examinations(user_id: str) -> List[Dict[str, Any]]:
    """Retrieves all chronological examinations belonging strictly to the authorized patient."""
    exams = PATIENT_EXAMINATIONS.get(user_id, [])
    # Sort chronologically by examination date
    return sorted(exams, key=lambda x: x["examinationDate"])


def calculate_longitudinal_trend(examinations: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes strict longitudinal volumetric differences and percentage changes.
    Enforces rules:
    - Same patient only
    - Chronological sorting
    - Strict neutral wording
    - Clear timeline of anatomical tumor locations
    """
    valid_exams = [e for e in examinations if e.get("hasSegmentation") and e.get("volumes")]

    if len(valid_exams) < 2:
        return {
            "hasComparison": False,
            "message": "At least two dated examinations are required to calculate volume changes. Currently, only one examination is on file.",
            "totalScans": len(valid_exams),
            "timeline": [
                {
                    "scanDate": e["displayDate"],
                    "location": e["tumorLocation"]["lobe"],
                    "subregion": e["tumorLocation"]["subregion"],
                    "volumeMl": e["volumes"]["wtVolumeMl"],
                    "coordinates": f"X: {e['tumorLocation']['coordinates']['x']}, Y: {e['tumorLocation']['coordinates']['y']}, Z: {e['tumorLocation']['coordinates']['z']}",
                    "notes": e["tumorLocation"]["notes"],
                }
                for e in valid_exams
            ],
            "chartData": [
                {
                    "date": e["displayDate"],
                    "timestamp": e["examinationDate"],
                    "wtVolumeMl": e["volumes"]["wtVolumeMl"],
                    "tcVolumeMl": e["volumes"]["tcVolumeMl"],
                    "etVolumeMl": e["volumes"]["etVolumeMl"],
                }
                for e in valid_exams
            ],
        }

    # Compare latest vs previous
    prev_scan = valid_exams[-2]
    latest_scan = valid_exams[-1]

    prev_vol = prev_scan["volumes"]["wtVolumeMl"]
    latest_vol = latest_scan["volumes"]["wtVolumeMl"]

    volume_diff = round(latest_vol - prev_vol, 2)

    if prev_vol > 0:
        pct_change = round(((latest_vol - prev_vol) / prev_vol) * 100, 1)
    else:
        pct_change = 0.0

    # Neutral clinical interpretation
    if volume_diff < -0.1:
        trend_label = "Decrease in measured segmented volume"
        trend_tone = "decrease"  # Neutral/positive indicator
    elif volume_diff > 0.1:
        trend_label = "Increase in measured segmented volume"
        trend_tone = "increase"
    else:
        trend_label = "Measured segmented volume remained unchanged"
        trend_tone = "stable"

    # Anatomical tumor location timeline across all available scans
    timeline = [
        {
            "examinationNumber": idx + 1,
            "scanDate": e["displayDate"],
            "fullDate": e["examinationDate"],
            "location": e["tumorLocation"]["lobe"],
            "subregion": e["tumorLocation"]["subregion"],
            "hemisphere": e["tumorLocation"]["hemisphere"],
            "volumeMl": e["volumes"]["wtVolumeMl"],
            "coordinates": f"X: {e['tumorLocation']['coordinates']['x']}, Y: {e['tumorLocation']['coordinates']['y']}, Z: {e['tumorLocation']['coordinates']['z']}",
            "notes": e["tumorLocation"]["notes"],
        }
        for idx, e in enumerate(valid_exams)
    ]

    # Chart data points
    chart_data = [
        {
            "date": e["displayDate"],
            "timestamp": e["examinationDate"],
            "wtVolumeMl": e["volumes"]["wtVolumeMl"],
            "tcVolumeMl": e["volumes"]["tcVolumeMl"],
            "etVolumeMl": e["volumes"]["etVolumeMl"],
        }
        for e in valid_exams
    ]

    return {
        "hasComparison": True,
        "previousScanDate": prev_scan["displayDate"],
        "latestScanDate": latest_scan["displayDate"],
        "previousVolumeMl": prev_vol,
        "latestVolumeMl": latest_vol,
        "absoluteDifferenceMl": volume_diff,
        "percentageChange": pct_change,
        "trendLabel": trend_label,
        "trendTone": trend_tone,
        "totalScans": len(valid_exams),
        "timeline": timeline,
        "chartData": chart_data,
        "disclaimer": (
            "Volume difference reflects automated AI segmentation on raw MRI voxel grids. "
            "A measured decrease or increase does not alone indicate clinical response or disease progression "
            "and must always be correlated with clinical symptoms and doctor assessment."
        ),
    }


def get_patient_demo_examinations(patient_key: str) -> List[Dict[str, Any]]:
    """Retrieves all 3 demonstration examinations for patient key."""
    if patient_key in ["pat_001", "PAT-2026-0042", "Aarav Sharma"]:
        return PATIENT_DEMO_EXAMINATIONS.get("pat_001", [])
    if patient_key in ["pat_002", "PAT-2026-0108", "Priya Patel"]:
        return PATIENT_DEMO_EXAMINATIONS.get("pat_002", [])
    return PATIENT_DEMO_EXAMINATIONS.get(patient_key, [])


def get_all_demo_examinations() -> Dict[str, Any]:
    """Returns structured multi-patient demonstration catalog for the doctor workstation."""
    return {
        "patients": [
            {
                "id": "pat_001",
                "patientId": "PAT-2026-0042",
                "name": "Aarav Sharma",
                "gender": "Male",
                "dateOfBirth": "1982-05-18",
                "expectedTrend": "increasing",
                "trendDescription": "Monotonically increasing measured tumor volume: A1 (15.03 mL) < A2 (24.34 mL) < A3 (35.51 mL)",
                "examinations": PATIENT_DEMO_EXAMINATIONS["pat_001"],
                "trend": calculate_longitudinal_trend(PATIENT_DEMO_EXAMINATIONS["pat_001"]),
            },
            {
                "id": "pat_002",
                "patientId": "PAT-2026-0108",
                "name": "Priya Patel",
                "gender": "Female",
                "dateOfBirth": "1990-11-04",
                "expectedTrend": "decreasing",
                "trendDescription": "Monotonically decreasing measured tumor volume: B1 (24.34 mL) > B2 (15.03 mL) > B3 (9.95 mL)",
                "examinations": PATIENT_DEMO_EXAMINATIONS["pat_002"],
                "trend": calculate_longitudinal_trend(PATIENT_DEMO_EXAMINATIONS["pat_002"]),
            },
        ],
        "totalExaminations": 6,
        "uniqueExaminations": 4,
        "disclaimer": "Demonstration trajectories for software prototype validation. Not actual patient health histories.",
    }
