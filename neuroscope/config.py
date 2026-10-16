"""
NeuroScope 3D - Global Configuration & Hardware Detection.
"""

import os
from pathlib import Path
from typing import Dict, Any, List

# Workspace root directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Storage and model paths
MODELS_DIR = BASE_DIR / "models"
STORAGE_DIR = BASE_DIR / "storage"
STUDIES_DIR = STORAGE_DIR / "studies"

# Ensure directories exist
MODELS_DIR.mkdir(parents=True, exist_ok=True)
STUDIES_DIR.mkdir(parents=True, exist_ok=True)

# Data retention policy (24 hours)
RETENTION_HOURS = 24
RETENTION_SECONDS = RETENTION_HOURS * 3600

# File size limit (1 GB)
MAX_FILE_SIZE_BYTES = 1024 * 1024 * 1024

# BraTS modalities and exact channel order for MONAI SegResNet
REQUIRED_MODALITIES: List[str] = ["T1", "T1Gd", "T2", "FLAIR"]
MODEL_CHANNEL_ORDER: List[str] = ["T1Gd", "T1", "T2", "FLAIR"]

# BraTS standard discrete labels
LABEL_BACKGROUND = 0
LABEL_NCR = 1  # Necrotic and Non-Enhancing Tumour Core
LABEL_ED = 2   # Peritumoral Edema
LABEL_ET = 4   # Enhancing Tumour

# Mandatory regulatory disclaimer
RESEARCH_DISCLAIMER = (
    "Research and teaching prototype only. Not for clinical diagnosis or treatment decisions. "
    "Model outputs are experimental and require independent expert review."
)

PREDICTION_LABEL_PHRASE = "Suspected tumour region predicted by the model."


def get_hardware_info() -> Dict[str, Any]:
    """Inspects hardware environment for CUDA GPU availability."""
    cuda_available = False
    device_name = "CPU (Fallback Execution)"
    device_memory_mb = 0
    pytorch_version = "Not Loaded"

    try:
        import torch
        pytorch_version = torch.__version__
        if torch.cuda.is_available():
            cuda_available = True
            device_name = torch.cuda.get_device_name(0)
            device_memory_mb = round(torch.cuda.get_device_properties(0).total_memory / (1024 * 1024))
    except Exception:
        pass

    return {
        "cuda_available": cuda_available,
        "device_name": device_name,
        "device_memory_mb": device_memory_mb,
        "pytorch_version": pytorch_version,
    }
