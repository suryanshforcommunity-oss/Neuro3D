"""
NeuroScope 3D - Authentication & User Management.
Provides secure password hashing (PBKDF2-HMAC-SHA256), token generation,
and role-based access control for Doctors and Patients.
"""

import os
import json
import hmac
import hashlib
import secrets
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, EmailStr

from neuroscope.config import STORAGE_DIR

USERS_FILE = STORAGE_DIR / "users.json"
AUTH_SECRET = os.environ.get("NEUROSCOPE_AUTH_SECRET", "neuroscope_clinical_jwt_secret_key_2026_salt")


def hash_password(password: str, salt: Optional[str] = None) -> str:
    """Hashes a password using PBKDF2-HMAC-SHA256 with a cryptographically secure salt."""
    if not salt:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000,
    )
    return f"{salt}${key.hex()}"


def verify_password(stored_hash: str, password_attempt: str) -> bool:
    """Securely verifies a password attempt against stored PBKDF2 hash using constant-time comparison."""
    try:
        salt, key_hex = stored_hash.split("$", 1)
        attempt_key = hashlib.pbkdf2_hmac(
            "sha256",
            password_attempt.encode("utf-8"),
            salt.encode("utf-8"),
            100_000,
        )
        return hmac.compare_digest(key_hex, attempt_key.hex())
    except Exception:
        return False


def generate_session_token(user_id: str, role: str) -> str:
    """Generates a secure HMAC-signed session token containing user ID, role, and expiration timestamp."""
    exp = int((datetime.now(timezone.utc) + timedelta(days=7)).timestamp())
    payload = f"{user_id}:{role}:{exp}"
    signature = hmac.new(AUTH_SECRET.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{payload}:{signature}"


def verify_session_token(token: str) -> Optional[Dict[str, str]]:
    """Verifies HMAC signature and expiration on a session token."""
    try:
        parts = token.split(":")
        if len(parts) != 4:
            return None
        user_id, role, exp_str, signature = parts
        expected_sig = hmac.new(
            AUTH_SECRET.encode("utf-8"),
            f"{user_id}:{role}:{exp_str}".encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(signature, expected_sig):
            return None

        exp_timestamp = int(exp_str)
        current_timestamp = int(datetime.now(timezone.utc).timestamp())
        if current_timestamp > exp_timestamp:
            return None

        return {"user_id": user_id, "role": role}
    except Exception:
        return None


def get_default_users() -> Dict[str, Dict[str, Any]]:
    """Pre-configured secure default accounts for Doctor and Patient roles."""
    return {
        # Doctor account
        "doc_001": {
            "id": "doc_001",
            "email": "doctor@neuroscope.ai",
            "username": "dr.chen",
            "role": "doctor",
            "name": "Dr. Sarah Chen, MD",
            "department": "Neuroradiology & Neurosurgery",
            "licenseNumber": "MED-NY-849201",
            "passwordHash": hash_password("NeuroScope2026!"),
            "createdAt": "2026-01-10T08:00:00Z",
        },
        # Patient account 1
        "pat_001": {
            "id": "pat_001",
            "patientId": "PAT-2026-0042",
            "email": "patient@neuroscope.ai",
            "username": "aarav.sharma",
            "role": "patient",
            "name": "Aarav Sharma",
            "dateOfBirth": "1982-05-18",
            "gender": "Male",
            "treatingDoctor": "Dr. Sarah Chen, MD",
            "hospital": "Memorial Neurological Institute",
            "passwordHash": hash_password("PatientPass2026!"),
            "createdAt": "2026-02-15T10:30:00Z",
        },
        # Patient account 2
        "pat_002": {
            "id": "pat_002",
            "patientId": "PAT-2026-0108",
            "email": "priya.patel@example.com",
            "username": "priya.patel",
            "role": "patient",
            "name": "Priya Patel",
            "dateOfBirth": "1990-11-04",
            "gender": "Female",
            "treatingDoctor": "Dr. Sarah Chen, MD",
            "hospital": "Memorial Neurological Institute",
            "passwordHash": hash_password("PatientPass2026!"),
            "createdAt": "2026-03-01T14:15:00Z",
        },
    }


def init_users_store():
    """Initializes the secure user store if not present."""
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    if not USERS_FILE.exists():
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(get_default_users(), f, indent=2)


def load_users() -> Dict[str, Dict[str, Any]]:
    """Loads all user records from secure storage."""
    init_users_store()
    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        users = get_default_users()
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2)
        return users


def save_users(users: Dict[str, Dict[str, Any]]):
    """Saves user records to disk."""
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2)


def authenticate_user(identifier: str, password: str, expected_role: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Authenticates a user by email, username, or patient ID.
    Enforces role matching if expected_role is provided.
    """
    users = load_users()
    id_lower = identifier.strip().lower()

    for user in users.values():
        matches_id = (
            user.get("email", "").lower() == id_lower
            or user.get("username", "").lower() == id_lower
            or user.get("patientId", "").lower() == id_lower
        )
        if matches_id:
            if verify_password(user["passwordHash"], password):
                if expected_role and user.get("role") != expected_role:
                    return None  # Role mismatch
                return user
    return None
