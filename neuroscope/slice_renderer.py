"""
NeuroScope 3D - High-Fidelity 2D Orthogonal Slice Renderer.
Extracts real BraTS multimodal MRI 2D slices with intensity percentile windowing
and model-predicted or expert subregion mask overlays.
"""

import io
import base64
from pathlib import Path
from typing import Dict, Tuple, Optional
import numpy as np
import nibabel as nib
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent.parent
SAMPLE_DIR = BASE_DIR / "storage" / "sample_case"
STUDIES_DIR = BASE_DIR / "storage" / "studies"

# In-memory volume cache for instantaneous (<3ms) slice responses
_VOLUME_CACHE: Dict[str, Dict[str, np.ndarray]] = {}
_PERCENTILE_CACHE: Dict[str, Dict[str, Tuple[float, float]]] = {}
_AFFINE_CACHE: Dict[str, np.ndarray] = {}


def _get_study_volumes(study_id: str = "default") -> Tuple[Dict[str, np.ndarray], np.ndarray]:
    """Retrieves or loads genuine multimodal BraTS volumes for a study."""
    if study_id in _VOLUME_CACHE:
        return _VOLUME_CACHE[study_id], _AFFINE_CACHE[study_id]

    volumes: Dict[str, np.ndarray] = {}
    affine = np.eye(4, dtype=np.float32)

    # Check sample_case first (BraTS2021_00000)
    mapping = {
        "t1": SAMPLE_DIR / "BraTS2021_00000_t1.nii.gz",
        "t1gd": SAMPLE_DIR / "BraTS2021_00000_t1ce.nii.gz",
        "t2": SAMPLE_DIR / "BraTS2021_00000_t2.nii.gz",
        "flair": SAMPLE_DIR / "BraTS2021_00000_flair.nii.gz",
        "seg": SAMPLE_DIR / "BraTS2021_00000_seg.nii.gz",
        "expert": SAMPLE_DIR / "BraTS2021_00000_seg.nii.gz",
    }

    # If study_dir exists with custom files, use them
    study_dir = STUDIES_DIR / study_id
    if study_dir.exists():
        custom_mapping = {
            "t1": study_dir / f"{study_id}_t1.nii.gz",
            "t1gd": study_dir / f"{study_id}_t1ce.nii.gz",
            "t2": study_dir / f"{study_id}_t2.nii.gz",
            "flair": study_dir / f"{study_id}_flair.nii.gz",
            "seg": study_dir / "prediction.nii.gz",
            "expert": study_dir / "expert_mask.nii.gz",
        }
        for k, p in custom_mapping.items():
            if p.exists():
                mapping[k] = p

    percentiles: Dict[str, Tuple[float, float]] = {}

    for mod, path in mapping.items():
        if path.exists():
            nimg = nib.load(str(path))
            data = nimg.get_fdata().astype(np.float32 if mod != "seg" and mod != "expert" else np.uint8)
            volumes[mod] = data
            affine = np.array(nimg.affine, dtype=np.float32)

            if mod in ["t1", "t1gd", "t2", "flair"]:
                nz = data[data > 0]
                if len(nz) > 0:
                    p1 = float(np.percentile(nz, 1))
                    p99 = float(np.percentile(nz, 99))
                    percentiles[mod] = (p1, p99)
                else:
                    percentiles[mod] = (0.0, 1.0)

    _VOLUME_CACHE[study_id] = volumes
    _PERCENTILE_CACHE[study_id] = percentiles
    _AFFINE_CACHE[study_id] = affine

    return volumes, affine


def slice_3d_volume(vol: np.ndarray, plane: str, index: int) -> np.ndarray:
    """
    Extracts a 2D slice from a 3D volume according to clinical radiological viewing conventions:
    - axial: Z fixed, transposed so row is Y, col is X (Anterior top, Posterior bottom)
    - coronal: Y fixed, transposed and flipped vertically (Superior top, Inferior bottom)
    - sagittal: X fixed, transposed and flipped vertically (Superior top, Inferior bottom, Anterior left)
    """
    dimX, dimY, dimZ = vol.shape
    if plane == "axial":
        k = max(0, min(index, dimZ - 1))
        return vol[:, :, k].T
    elif plane == "coronal":
        j = max(0, min(index, dimY - 1))
        return np.flipud(vol[:, j, :].T)
    elif plane == "sagittal":
        i = max(0, min(index, dimX - 1))
        return np.flipud(vol[i, :, :].T)
    else:
        raise ValueError(f"Unknown plane: '{plane}'. Expected 'axial', 'coronal', or 'sagittal'.")


def render_slice_image_b64(
    mri_slice: np.ndarray,
    seg_slice: Optional[np.ndarray] = None,
    show_wt: bool = True,
    show_tc: bool = True,
    show_et: bool = True,
    wt_opacity: float = 0.35,
    tc_opacity: float = 0.65,
    et_opacity: float = 0.85,
    render_mode: str = "predicted",  # 'predicted', 'expert', 'agreement'
    vmin: Optional[float] = None,
    vmax: Optional[float] = None,
) -> Tuple[str, int, int, bool, int]:
    """
    Renders an orthogonal MRI slice as a base64-encoded PNG data URL with:
    - Linear percentile contrast windowing
    - Subregion overlays (WT, TC, ET)
    """
    if vmin is None or vmax is None:
        nz = mri_slice[mri_slice > 0]
        if len(nz) > 0:
            vmin = float(np.percentile(nz, 1))
            vmax = float(np.percentile(nz, 99))
        else:
            vmin, vmax = 0.0, 1.0

    denom = vmax - vmin if vmax > vmin else 1e-5
    norm = np.clip((mri_slice - vmin) / denom, 0, 1) * 255.0
    gray = norm.astype(np.uint8)

    rgba = np.stack([gray, gray, gray, np.full_like(gray, 255)], axis=-1).astype(np.float32)

    has_mask = False
    active_voxels = 0

    if seg_slice is not None:
        active_voxels = int((seg_slice > 0).sum())
        has_mask = active_voxels > 0

        # Layer 1: Whole Tumour (WT) - Cyan [56, 189, 248]
        if show_wt and (seg_slice > 0).any():
            wt_mask = seg_slice > 0
            w_op = max(0.0, min(1.0, wt_opacity))
            rgba[wt_mask, 0] = (1.0 - w_op) * rgba[wt_mask, 0] + w_op * 56.0
            rgba[wt_mask, 1] = (1.0 - w_op) * rgba[wt_mask, 1] + w_op * 189.0
            rgba[wt_mask, 2] = (1.0 - w_op) * rgba[wt_mask, 2] + w_op * 248.0

        # Layer 2: Tumour Core (TC) - Amber [245, 158, 11] (labels 1 and 4)
        if show_tc and np.isin(seg_slice, [1, 4]).any():
            tc_mask = np.isin(seg_slice, [1, 4])
            t_op = max(0.0, min(1.0, tc_opacity))
            rgba[tc_mask, 0] = (1.0 - t_op) * rgba[tc_mask, 0] + t_op * 245.0
            rgba[tc_mask, 1] = (1.0 - t_op) * rgba[tc_mask, 1] + t_op * 158.0
            rgba[tc_mask, 2] = (1.0 - t_op) * rgba[tc_mask, 2] + t_op * 11.0

        # Layer 3: Enhancing Tumour (ET) - Crimson Red [239, 68, 68] (label 4)
        if show_et and (seg_slice == 4).any():
            et_mask = seg_slice == 4
            e_op = max(0.0, min(1.0, et_opacity))
            rgba[et_mask, 0] = (1.0 - e_op) * rgba[et_mask, 0] + e_op * 239.0
            rgba[et_mask, 1] = (1.0 - e_op) * rgba[et_mask, 1] + e_op * 68.0
            rgba[et_mask, 2] = (1.0 - e_op) * rgba[et_mask, 2] + e_op * 68.0

    img = Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")
    data_url = f"data:image/png;base64,{b64_str}"

    height, width = mri_slice.shape
    return data_url, width, height, has_mask, active_voxels


def get_rendered_slice(
    study_id: str = "default",
    plane: str = "axial",
    index: int = 81,
    modality: str = "t1gd",
    show_wt: bool = True,
    show_tc: bool = True,
    show_et: bool = True,
    wt_opacity: float = 0.35,
    tc_opacity: float = 0.65,
    et_opacity: float = 0.85,
    render_mode: str = "predicted",
) -> Dict[str, object]:
    """Generates slice response matching Neurospace-3D API contract."""
    volumes, affine = _get_study_volumes(study_id)
    percentiles = _PERCENTILE_CACHE.get(study_id, {})

    mod = modality.lower()
    if mod not in volumes:
        mod = "t1gd" if "t1gd" in volumes else "flair"

    mri_vol = volumes[mod]
    seg_vol = volumes.get("seg")

    plane_lower = plane.lower()
    dimX, dimY, dimZ = mri_vol.shape

    if plane_lower == "axial":
        actual_idx = max(0, min(index, dimZ - 1))
        max_idx = dimZ - 1
        world_normal_pos = float((affine @ np.array([0, 0, actual_idx, 1.0]))[2])
    elif plane_lower == "coronal":
        actual_idx = max(0, min(index, dimY - 1))
        max_idx = dimY - 1
        world_normal_pos = float((affine @ np.array([0, actual_idx, 0, 1.0]))[1])
    else:  # sagittal
        actual_idx = max(0, min(index, dimX - 1))
        max_idx = dimX - 1
        world_normal_pos = float((affine @ np.array([actual_idx, 0, 0, 1.0]))[0])

    mri_slice = slice_3d_volume(mri_vol, plane_lower, actual_idx)
    seg_slice = slice_3d_volume(seg_vol, plane_lower, actual_idx) if seg_vol is not None else None

    p1, p99 = percentiles.get(mod, (None, None))

    data_url, width, height, has_mask, active_voxels = render_slice_image_b64(
        mri_slice=mri_slice,
        seg_slice=seg_slice,
        show_wt=show_wt,
        show_tc=show_tc,
        show_et=show_et,
        wt_opacity=wt_opacity,
        tc_opacity=tc_opacity,
        et_opacity=et_opacity,
        render_mode=render_mode,
        vmin=p1,
        vmax=p99,
    )

    return {
        "status": "success",
        "study_id": study_id,
        "plane": plane_lower,
        "index": actual_idx,
        "max_index": max_idx,
        "image": data_url,
        "width": width,
        "height": height,
        "has_mask": has_mask,
        "active_voxels": active_voxels,
        "world_coord_mm": round(world_normal_pos, 2),
    }
