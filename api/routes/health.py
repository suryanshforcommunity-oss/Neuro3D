"""
NeuroScope 3D - API Health Check Route.
GET /api/v1/health
"""

from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

import monai
from neuroscope.config import get_hardware_info
from neuroscope.model import get_model_status

router = APIRouter(prefix="/api/v1", tags=["Health"])


class HealthCheckResponse(BaseModel):
    status: str
    version: str
    monaiVersion: Optional[str] = None
    cudaAvailable: bool
    activeModel: str
    timestamp: str


@router.get("/health", response_model=HealthCheckResponse)
def get_health() -> HealthCheckResponse:
    hw_info = get_hardware_info()
    model_status = get_model_status()

    # If weights are missing, status is 'degraded' (truthful reporting)
    system_status = "ok" if model_status["weights_present"] else "degraded"

    return HealthCheckResponse(
        status=system_status,
        version="1.0.0-rc2",
        monaiVersion=monai.__version__,
        cudaAvailable=hw_info["cuda_available"],
        activeModel=(
            model_status["model_name"]
            if model_status["weights_present"]
            else f"{model_status['model_name']} (Weights Not Found)"
        ),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
