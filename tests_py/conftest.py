"""
Pytest fixtures for NeuroScope 3D test suite.
"""

import tempfile
from pathlib import Path
from typing import Dict, Tuple
import pytest
import numpy as np
import nibabel as nib
import torch

from neuroscope.model import build_segresnet_model


@pytest.fixture
def temp_dir():
    with tempfile.TemporaryDirectory() as td:
        yield Path(td)


def create_synthetic_nifti(
    filepath: Path,
    shape: Tuple[int, int, int] = (32, 32, 32),
    zooms: Tuple[float, float, float] = (1.0, 1.0, 1.0),
    affine: np.ndarray = None,
    data: np.ndarray = None,
) -> Path:
    """Helper to generate a valid 3D NIfTI file with controllable properties."""
    if affine is None:
        affine = np.diag([zooms[0], zooms[1], zooms[2], 1.0])
        affine[0, 3] = -shape[0] * zooms[0] / 2
        affine[1, 3] = -shape[1] * zooms[1] / 2
        affine[2, 3] = -shape[2] * zooms[2] / 2

    if data is None:
        # Create a sphere of simulated brain tissue with non-zero variance
        data = np.zeros(shape, dtype=np.float32)
        center = np.array(shape) // 2
        radius = min(shape) // 3
        coords = np.indices(shape)
        y, x, z = coords[0], coords[1], coords[2]
        dist = np.sqrt((x - center[1])**2 + (y - center[0])**2 + (z - center[2])**2)
        mask = dist <= radius
        # Add gradient intensity
        data[mask] = 100.0 + (x[mask] + y[mask] + z[mask]) * 2.0

    nimg = nib.Nifti1Image(data, affine)
    nimg.header.set_zooms(zooms)
    filepath.parent.mkdir(parents=True, exist_ok=True)
    nib.save(nimg, str(filepath))
    return filepath


@pytest.fixture
def synthetic_study(temp_dir) -> Dict[str, Path]:
    """Generates 4 co-registered synthetic NIfTI sequences."""
    shape = (32, 32, 32)
    zooms = (1.0, 1.0, 2.0)
    affine = np.diag([1.0, 1.0, 2.0, 1.0])

    t1_path = create_synthetic_nifti(temp_dir / "t1.nii.gz", shape=shape, zooms=zooms, affine=affine)
    t1ce_path = create_synthetic_nifti(temp_dir / "t1ce.nii.gz", shape=shape, zooms=zooms, affine=affine)
    t2_path = create_synthetic_nifti(temp_dir / "t2.nii.gz", shape=shape, zooms=zooms, affine=affine)
    flair_path = create_synthetic_nifti(temp_dir / "flair.nii.gz", shape=shape, zooms=zooms, affine=affine)

    return {
        "T1": t1_path,
        "T1Gd": t1ce_path,
        "T2": t2_path,
        "FLAIR": flair_path,
    }


@pytest.fixture
def synthetic_weights(temp_dir) -> Path:
    """Creates a temporary weights file for test inference."""
    weights_path = temp_dir / "test_weights.pt"
    model = build_segresnet_model()
    torch.save(model.state_dict(), str(weights_path))
    return weights_path
