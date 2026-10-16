"""
NeuroScope 3D - FastAPI Server Application.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from neuroscope.config import RESEARCH_DISCLAIMER
from neuroscope.retention import cleanup_expired_studies
from api.routes import health, studies, auth_routes, patient_routes

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run data retention cleanup on startup to remove expired study directories."""
    cleanup_expired_studies()
    yield

app = FastAPI(
    title="NeuroScope 3D — Medical Imaging Brain Tumour Segmentation API",
    description=(
        f"Backend server for NeuroScope 3D. {RESEARCH_DISCLAIMER}"
    ),
    version="1.0.0-rc2",
    lifespan=lifespan,
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",  # Permissive for local workstation development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(studies.router)
app.include_router(auth_routes.router)
app.include_router(patient_routes.router)


@app.get("/")
def root():
    return {
        "name": "NeuroScope 3D API",
        "version": "1.0.0-rc2",
        "docs": "/docs",
        "health": "/api/v1/health",
        "disclaimer": RESEARCH_DISCLAIMER,
    }
