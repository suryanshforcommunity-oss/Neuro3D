"""
NeuroScope 3D - Multimodal MRI Preprocessing Pipeline.
"""

from pathlib import Path
from typing import Dict, Tuple, List, Optional
import numpy as np
import nibabel as nib

from neuroscope.config import MODEL_CHANNEL_ORDER


def normalize_intensity(data: np.ndarray) -> np.ndarray:
    """
    Performs standard BraTS intensity normalization:
    Z-score normalization computed exclusively on non-zero brain foreground voxels:
    z = (x - mean) / std
    Zero-background air voxels remain exactly 0.0.
    """
    normalized = np.zeros_like(data, dtype=np.float32)
    mask = data > 0
    if np.any(mask):
        mean = float(np.mean(data[mask]))
        std = float(np.std(data[mask]))
        if std > 1e-6:
            normalized[mask] = (data[mask] - mean) / std
        else:
            normalized[mask] = data[mask] - mean
    return normalized


def load_and_preprocess_sequences(
    sequence_paths: Dict[str, Path]
) -> Tuple[np.ndarray, np.ndarray, nib.Nifti1Header, Tuple[int, int, int]]:
    """
    Loads the 4 MRI modalities in the exact channel order required by the MONAI SegResNet:
    Channel 0: T1Gd (T1 contrast-enhanced)
    Channel 1: T1 (T1 native)
    Channel 2: T2
    Channel 3: FLAIR

    Applies non-zero foreground z-score intensity normalization to each channel.
    Returns:
    - Stacked 4D tensor of shape (4, dimX, dimY, dimZ)
    - Original affine matrix (4x4)
    - Original NIfTI header
    - Original 3D spatial shape (dimX, dimY, dimZ)
    """
    for mod in MODEL_CHANNEL_ORDER:
        if mod not in sequence_paths or not sequence_paths[mod].exists():
            raise ValueError(f"Missing required sequence '{mod}' for model preprocessing.")

    base_nimg = nib.load(str(sequence_paths[MODEL_CHANNEL_ORDER[0]]))
    original_affine = base_nimg.affine.copy()
    original_header = base_nimg.header.copy()
    original_shape = base_nimg.header.get_data_shape()[:3]

    channels: List[np.ndarray] = []
    for mod in MODEL_CHANNEL_ORDER:
        nimg = nib.load(str(sequence_paths[mod]))
        raw_data = nimg.get_fdata(dtype=np.float32)
        norm_channel = normalize_intensity(raw_data)
        channels.append(norm_channel)

    # Stack along channel axis: shape (4, H, W, D)
    stacked_4d = np.stack(channels, axis=0)

    return stacked_4d, original_affine, original_header, original_shape
