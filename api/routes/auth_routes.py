"""
NeuroScope 3D - Authentication API Routes.
Provides login, credential validation, session token issuance, and password recovery.
"""

from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

from api.auth import (
    authenticate_user,
    generate_session_token,
    verify_session_token,
    load_users,
    save_users,
    hash_password,
)

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    identifier: str  # email, username, or patientId
    password: str
    role: Optional[str] = None  # 'doctor' or 'patient'


class LoginResponse(BaseModel):
    status: str
    token: str
    role: str
    user: Dict[str, Any]
    message: str


class ForgotPasswordRequest(BaseModel):
    identifier: str
    role: str


class ForgotPasswordResponse(BaseModel):
    status: str
    message: str


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest) -> LoginResponse:
    """Authenticates doctor or patient credentials and issues an HMAC-signed session token."""
    user = authenticate_user(req.identifier, req.password, expected_role=req.role)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials or account does not match selected role. Please check your details and try again.",
        )

    token = generate_session_token(user["id"], user["role"])

    # Return safe user profile (without passwordHash)
    safe_user = {k: v for k, v in user.items() if k != "passwordHash"}

    return LoginResponse(
        status="success",
        token=token,
        role=user["role"],
        user=safe_user,
        message=f"Welcome back, {user.get('name', 'User')}.",
    )


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(req: ForgotPasswordRequest) -> ForgotPasswordResponse:
    """Handles password reset request with secure instructions."""
    users = load_users()
    id_lower = req.identifier.strip().lower()
    found = False

    for user in users.values():
        if (
            user.get("email", "").lower() == id_lower
            or user.get("username", "").lower() == id_lower
            or user.get("patientId", "").lower() == id_lower
        ):
            found = True
            break

    # Security practice: Always return generic reassurance message to prevent account enumeration
    if found:
        return ForgotPasswordResponse(
            status="sent",
            message="If an active account exists with the provided credentials, password reset instructions have been forwarded to your registered contact channel.",
        )
    else:
        return ForgotPasswordResponse(
            status="sent",
            message="If an active account exists with the provided credentials, password reset instructions have been forwarded to your registered contact channel.",
        )


@router.get("/me")
def get_current_user_profile(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Validates session token and returns current user profile."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required.")

    token = authorization.split("Bearer ", 1)[1]
    verified = verify_session_token(token)
    if not verified:
        raise HTTPException(status_code=401, detail="Session expired or invalid token. Please log in again.")

    users = load_users()
    user = users.get(verified["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    return {k: v for k, v in user.items() if k != "passwordHash"}
