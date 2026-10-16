"""
NeuroScope 3D - Physical Volume Quantification & Overlap Metrics.
"""

from typing import Dict, Tuple, Optional, Any
import numpy as np

from neuroscope.config import LABEL_NCR, LABEL_ED, LABEL_ET


def calculate_volume_ml(voxel_count: int, spacing: Tuple[float, float, float]) -> float:
    """
    Calculates physical volume in milliliters (mL or cm³) from voxel count and 3D spacing.
    Formula: Volume (mL) = Voxel Count * dx * dy * dz / 1000
    Never assumes 1.0 mm isotropic spacing; spacing must be read directly from NIfTI header.
    """
    if voxel_count < 0:
        raise ValueError("Voxel count cannot be negative")
    dx, dy, dz = spacing
    if dx <= 0 or dy <= 0 or dz <= 0:
        raise ValueError(f"Voxel spacing must be strictly positive: ({dx}, {dy}, {dz})")

    voxel_volume_mm3 = dx * dy * dz
    total_mm3 = voxel_count * voxel_volume_mm3
    return round(float(total_mm3 / 1000.0), 4)


def compute_brats_composite_counts(label_map: np.ndarray) -> Dict[str, int]:
    """
    Computes hierarchical BraTS composite counts from discrete integer label map:
    - Label 1: Necrotic & Non-Enhancing Core (NCR)
    - Label 2: Peritumoral Edema (ED)
    - Label 4: Enhancing Tumour (ET)

    Composite targets:
    - Whole Tumour (WT) = NCR (1) + ED (2) + ET (4)
    - Tumour Core (TC) = NCR (1) + ET (4)
    - Enhancing Tumour (ET) = ET (4)
    """
    ncr_count = int(np.count_nonzero(label_map == LABEL_NCR))
    ed_count = int(np.count_nonzero(label_map == LABEL_ED))
    et_count = int(np.count_nonzero(label_map == LABEL_ET))

    wt_count = ncr_count + ed_count + et_count
    tc_count = ncr_count + et_count

    return {
        "ncr_count": ncr_count,
        "ed_count": ed_count,
        "et_count": et_count,
        "wt_count": wt_count,
        "tc_count": tc_count,
    }


def compute_dice_score(pred_binary: np.ndarray, expert_binary: np.ndarray) -> float:
    """Computes Dice Similarity Coefficient (DSC): 2 * |P ∩ G| / (|P| + |G|)."""
    p = pred_binary.astype(bool)
    g = expert_binary.astype(bool)

    intersection = np.logical_and(p, g).sum()
    total = p.sum() + g.sum()

    if total == 0:
        return 1.0  # Both empty, perfect concordance
    return round(float((2.0 * intersection) / total), 4)


def compute_sensitivity(pred_binary: np.ndarray, expert_binary: np.ndarray) -> float:
    """Computes Sensitivity (Recall / True Positive Rate): |P ∩ G| / |G|."""
    p = pred_binary.astype(bool)
    g = expert_binary.astype(bool)

    g_sum = g.sum()
    if g_sum == 0:
        return 1.0

    intersection = np.logical_and(p, g).sum()
    return round(float(intersection / g_sum), 4)


def compute_evaluation_metrics(pred_label_map: np.ndarray, expert_label_map: np.ndarray) -> Dict[str, float]:
    """Computes real case-specific Dice and Sensitivity metrics for WT, TC, and ET."""
    if pred_label_map.shape != expert_label_map.shape:
        raise ValueError(f"Mask shape mismatch: {pred_label_map.shape} vs {expert_label_map.shape}")

    # WT: Labels 1, 2, 4
    pred_wt = np.isin(pred_label_map, [LABEL_NCR, LABEL_ED, LABEL_ET])
    exp_wt = np.isin(expert_label_map, [LABEL_NCR, LABEL_ED, LABEL_ET])

    # TC: Labels 1, 4
    pred_tc = np.isin(pred_label_map, [LABEL_NCR, LABEL_ET])
    exp_tc = np.isin(expert_label_map, [LABEL_NCR, LABEL_ET])

    # ET: Label 4
    pred_et = (pred_label_map == LABEL_ET)
    exp_et = (expert_label_map == LABEL_ET)

    return {
        "wt_dice": compute_dice_score(pred_wt, exp_wt),
        "tc_dice": compute_dice_score(pred_tc, exp_tc),
        "et_dice": compute_dice_score(pred_et, exp_et),
        "wt_sensitivity": compute_sensitivity(pred_wt, exp_wt),
        "tc_sensitivity": compute_sensitivity(pred_tc, exp_tc),
        "et_sensitivity": compute_sensitivity(pred_et, exp_et),
    }
