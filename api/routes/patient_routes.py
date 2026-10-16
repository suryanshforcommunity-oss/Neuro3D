"""
NeuroScope 3D - Patient Portal API Routes.
Enforces strict server-side authorization: patients may access only their own records.
Provides patient dashboard data, longitudinal volume comparisons, tumor localization timeline,
and patient-friendly medical reports.
"""

from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Optional, Dict, Any, List

from api.auth import verify_session_token, load_users
from api.patient_data import get_patient_examinations, calculate_longitudinal_trend

router = APIRouter(prefix="/api/v1/patient", tags=["Patient Portal"])


def get_authorized_patient(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Dependency that enforces token validity and patient role."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Patient authentication required. Please log in with your patient account.",
        )

    token = authorization.split("Bearer ", 1)[1]
    verified = verify_session_token(token)
    if not verified:
        raise HTTPException(
            status_code=401,
            detail="Session has expired or credentials are invalid. Please log in again.",
        )

    if verified.get("role") != "patient":
        raise HTTPException(
            status_code=403,
            detail="Access restricted: This endpoint is strictly reserved for authenticated patients.",
        )

    users = load_users()
    user = users.get(verified["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="Patient account record not found.")

    return user


@router.get("/dashboard")
def get_patient_dashboard(current_user: Dict[str, Any] = Depends(get_authorized_patient)) -> Dict[str, Any]:
    """
    Returns dedicated patient dashboard data:
    - Welcome details (patient name, ID, recent scan date)
    - Full chronological history of MRI examinations
    - Longitudinal tumor growth/shrinkage tracking
    - Tumor anatomical location timeline across scans
    """
    user_id = current_user["id"]
    examinations = get_patient_examinations(user_id)
    trend = calculate_longitudinal_trend(examinations)

    latest_exam = examinations[-1] if examinations else None
    latest_date = latest_exam["displayDate"] if latest_exam else "No scans on file"

    return {
        "status": "success",
        "patient": {
            "name": current_user.get("name", "Patient"),
            "patientId": current_user.get("patientId", "Unknown"),
            "dateOfBirth": current_user.get("dateOfBirth"),
            "treatingDoctor": current_user.get("treatingDoctor"),
            "hospital": current_user.get("hospital"),
            "mostRecentScanDate": latest_date,
            "totalExaminationsOnRecord": len(examinations),
        },
        "reassuringNote": (
            "All imaging segmentations and volume calculations are computerized measurements provided to help "
            "you and your clinical care team visualize your scans. They do not constitute a self-diagnosis. "
            "Your treating neurosurgeon or oncologist will interpret these scans in the context of your overall health."
        ),
        "examinations": examinations,
        "trend": trend,
    }


@router.get("/report/{study_id}")
def get_patient_report(study_id: str, current_user: Dict[str, Any] = Depends(get_authorized_patient)) -> Dict[str, Any]:
    """
    Generates a patient-friendly medical report for a specific examination.
    Enforces record ownership: patient can only view their own study.
    """
    user_id = current_user["id"]
    examinations = get_patient_examinations(user_id)

    matched_exam = next((e for e in examinations if e["studyId"] == study_id), None)
    if not matched_exam:
        raise HTTPException(
            status_code=403,
            detail="Access denied: You do not have permission to view this medical record.",
        )

    trend = calculate_longitudinal_trend(examinations)

    return {
        "reportId": matched_exam.get("reportId", f"REP_{study_id}"),
        "studyId": matched_exam["studyId"],
        "patientName": current_user.get("name"),
        "patientId": current_user.get("patientId"),
        "examinationDate": matched_exam["displayDate"],
        "facility": matched_exam.get("facility"),
        "sequencesAcquired": matched_exam.get("sequences"),
        "magneticField": matched_exam.get("magneticField"),
        "volumes": matched_exam.get("volumes"),
        "tumorLocation": matched_exam.get("tumorLocation"),
        "trendSummary": {
            "trendLabel": trend.get("trendLabel"),
            "percentageChange": trend.get("percentageChange"),
            "absoluteDifferenceMl": trend.get("absoluteDifferenceMl"),
        } if trend.get("hasComparison") else None,
        "plainLanguageExplanation": {
            "whatIsSegmentation": (
                "Segmentation is the AI computer system's careful outline of the suspected tumor boundaries "
                "across your 3-dimensional MRI scans."
            ),
            "whatThisMeans": (
                f"Your most recent scan on {matched_exam['displayDate']} measured an automated tumor volume "
                f"of {matched_exam['volumes']['wtVolumeMl']} milliliters. "
                "The surrounding brain tissue structure has been documented for your medical team."
            ),
            "whatHappensNext": (
                "1. Your treating physician will review these images alongside your clinical symptoms.\n"
                "2. Please bring any questions to your next scheduled consultation.\n"
                "3. Your care team will determine if any adjustments to therapy or future monitoring scans are appropriate."
            ),
        },
        "disclaimer": (
            "Notice for Patients: This report contains AI-assisted quantitative measurements designed to support "
            "clinical review. Only a qualified medical specialist can provide a definitive medical diagnosis and treatment plan."
        ),
    }
