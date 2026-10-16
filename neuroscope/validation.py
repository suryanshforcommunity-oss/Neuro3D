"""
NeuroScope 3D - Server-Side NiBabel NIfTI Validation Module.
"""

import hashlib
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
import numpy as np
import nibabel as nib

from neuroscope.config import MAX_FILE_SIZE_BYTES, REQUIRED_MODALITIES


class ValidationError(Exception):
    """Raised when an input scan fails integrity or medical imaging constraints."""
    pass


def compute_sha256(filepath: Path) -> str:
    """Computes SHA-256 hash of a file for cryptographic provenance."""
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def validate_single_nifti(filepath: Path) -> Dict[str, Any]:
    """
    Validates a single NIfTI file using NiBabel:
    - File existence & size <= 1 GB
    - Valid .nii or .nii.gz extension
    - 3D volume verification (rejects 2D inputs)
    - Positive voxel spacing
    - Finite voxel values (no NaNs or Infs)
    - Non-constant, non-zero anatomical signal
    """
    if not filepath.exists():
        raise ValidationError(f"File not found: {filepath.name}")

    file_size = filepath.stat().st_size
    if file_size == 0:
        raise ValidationError(f"File '{filepath.name}' is empty (0 bytes).")

    if file_size > MAX_FILE_SIZE_BYTES:
        mb_size = file_size / (1024 * 1024)
        raise ValidationError(f"File '{filepath.name}' exceeds the 1 GB maximum limit ({mb_size:.1f} MB).")

    lower_name = filepath.name.lower()
    if not (lower_name.endswith(".nii") or lower_name.endswith(".nii.gz")):
        raise ValidationError(f"Invalid extension for '{filepath.name}'. Expected .nii or .nii.gz.")

    try:
        nimg = nib.load(str(filepath))
    except Exception as e:
        raise ValidationError(f"NiBabel failed to parse '{filepath.name}': corrupt or invalid NIfTI header ({str(e)}).")

    shape = nimg.header.get_data_shape()
    if len(shape) < 3 or any(d <= 1 for d in shape[:3]):
        raise ValidationError(
            f"File '{filepath.name}' is a 2D or degenerate volume (shape: {shape}). A 3D volumetric MRI is required."
        )

    zooms = nimg.header.get_zooms()
    if any(z <= 0 or not np.isfinite(z) for z in zooms[:3]):
        raise ValidationError(f"File '{filepath.name}' has invalid non-positive voxel spacing: {zooms[:3]} mm.")

    # Inspect voxel data for non-finite values and constant/all-zero signal
    try:
        data = nimg.get_fdata(dtype=np.float32)
    except Exception as e:
        raise ValidationError(f"Failed to read voxel array from '{filepath.name}': {str(e)}")

    if not np.all(np.isfinite(data)):
        raise ValidationError(f"File '{filepath.name}' contains non-finite (NaN or Inf) voxel values.")

    # Check for all-zero or zero-variance volume
    if np.all(data == 0) or np.std(data) < 1e-7:
        raise ValidationError(f"File '{filepath.name}' contains constant or all-zero signal. No brain anatomy detected.")

    sha256_hash = compute_sha256(filepath)

    return {
        "filename": filepath.name,
        "file_size": file_size,
        "shape": shape[:3],
        "spacing": tuple(round(float(z), 3) for z in zooms[:3]),
        "affine": nimg.affine.tolist(),
        "sha256": sha256_hash,
        "dtype": str(nimg.header.get_data_dtype()),
    }


def validate_study_sequences(sequences: Dict[str, Path]) -> Dict[str, Any]:
    """
    Validates cross-sequence consistency across the 4 required BraTS modalities:
    - Checks for missing modalities (T1, T1Gd, T2, FLAIR)
    - Verifies matching volume shape (dimX, dimY, dimZ)
    - Verifies spatial affine matrix alignment
    """
    errors: List[str] = []
    warnings: List[str] = []
    validated_headers: Dict[str, Any] = {}

    # Check for missing required modalities
    missing = [m for m in REQUIRED_MODALITIES if m not in sequences or not sequences[m].exists()]
    if missing:
        errors.append(f"Missing required modalities: {', '.join(missing)}. All 4 sequences (T1, T1Gd, T2, FLAIR) are required.")

    # Validate individual files
    for mod, path in sequences.items():
        if path and path.exists():
            try:
                info = validate_single_nifti(path)
                validated_headers[mod] = info
            except ValidationError as ve:
                errors.append(f"[{mod}] {str(ve)}")

    # If any required modalities failed validation, return immediately
    if errors or len(validated_headers) < len(REQUIRED_MODALITIES):
        return {
            "is_valid": False,
            "errors": errors,
            "warnings": warnings,
            "headers": validated_headers,
        }

    # Cross-check shapes and affines against base modality
    base_mod = REQUIRED_MODALITIES[0]
    base_info = validated_headers[base_mod]
    base_shape = base_info["shape"]
    base_affine = np.array(base_info["affine"], dtype=np.float64)

    for mod in REQUIRED_MODALITIES[1:]:
        info = validated_headers[mod]
        cur_shape = info["shape"]
        cur_affine = np.array(info["affine"], dtype=np.float64)

        if cur_shape != base_shape:
            errors.append(
                f"Volume shape mismatch: {mod} is {cur_shape}, but {base_mod} is {base_shape}. "
                f"All sequences must be rigidly co-registered to the same matrix grid."
            )

        # Affine matrix alignment check (tolerance of 0.5 mm in translation/rotation)
        if not np.allclose(cur_affine, base_affine, atol=0.5):
            affine_diff = float(np.max(np.abs(cur_affine - base_affine)))
            errors.append(
                f"Spatial affine mismatch between {mod} and {base_mod} (max discrepancy: {affine_diff:.2f} mm). "
                f"Sequences must share the same physical world coordinate system."
            )

    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "headers": validated_headers,
    }
