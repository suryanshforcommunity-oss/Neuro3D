"""
Unit tests for volume quantification, BraTS composite definitions, and overlap metrics.
"""

import pytest
import numpy as np

from neuroscope.volume import (
    calculate_volume_ml,
    compute_brats_composite_counts,
    compute_dice_score,
    compute_sensitivity,
    compute_evaluation_metrics,
)
from neuroscope.config import LABEL_BACKGROUND, LABEL_NCR, LABEL_ED, LABEL_ET


def test_volume_isotropic_spacing():
    # 1,000 voxels at 1x1x1 mm = 1.0 mL
    vol = calculate_volume_ml(1000, (1.0, 1.0, 1.0))
    assert vol == 1.0


def test_volume_anisotropic_spacing():
    # 2,000 voxels at 0.5x0.5x2.0 mm (0.5 mm³ per voxel) = 1.0 mL
    vol = calculate_volume_ml(2000, (0.5, 0.5, 2.0))
    assert vol == 1.0


def test_volume_known_test_cube():
    # 20x20x20 cube = 8,000 voxels at 1x1x2 mm (2 mm³ per voxel) = 16.0 mL
    voxel_count = 20 * 20 * 20
    vol = calculate_volume_ml(voxel_count, (1.0, 1.0, 2.0))
    assert vol == 16.0


def test_volume_invalid_inputs():
    with pytest.raises(ValueError, match="Voxel count cannot be negative"):
        calculate_volume_ml(-5, (1.0, 1.0, 1.0))

    with pytest.raises(ValueError, match="strictly positive"):
        calculate_volume_ml(100, (1.0, 0.0, 1.0))

    with pytest.raises(ValueError, match="strictly positive"):
        calculate_volume_ml(100, (1.0, 1.0, -0.5))


def test_brats_composite_counts():
    label_map = np.zeros((20, 20, 20), dtype=np.uint8)
    label_map[0:5, 0:5, 0:5] = LABEL_NCR  # 125 voxels of NCR
    label_map[5:10, 0:5, 0:5] = LABEL_ED   # 125 voxels of ED
    label_map[10:15, 0:5, 0:5] = LABEL_ET  # 125 voxels of ET

    counts = compute_brats_composite_counts(label_map)
    assert counts["ncr_count"] == 125
    assert counts["ed_count"] == 125
    assert counts["et_count"] == 125
    assert counts["wt_count"] == 375  # NCR + ED + ET
    assert counts["tc_count"] == 250  # NCR + ET


def test_dice_score_edge_cases():
    a = np.ones((10, 10), dtype=bool)
    b = np.ones((10, 10), dtype=bool)
    assert compute_dice_score(a, b) == 1.0

    # Non-overlapping
    c = np.zeros((10, 10), dtype=bool)
    c[0:5, :] = True
    d = np.zeros((10, 10), dtype=bool)
    d[5:10, :] = True
    assert compute_dice_score(c, d) == 0.0

    # Both empty
    empty_a = np.zeros((10, 10), dtype=bool)
    empty_b = np.zeros((10, 10), dtype=bool)
    assert compute_dice_score(empty_a, empty_b) == 1.0


def test_sensitivity_score():
    g = np.zeros(100, dtype=bool)
    g[:50] = True  # 50 positives in ground truth

    p = np.zeros(100, dtype=bool)
    p[:25] = True  # Detected 25 of them

    assert compute_sensitivity(p, g) == 0.5


def test_compute_evaluation_metrics():
    # Create identical predicted and ground truth maps
    pred = np.zeros((16, 16, 16), dtype=np.uint8)
    expert = np.zeros((16, 16, 16), dtype=np.uint8)

    pred[2:6, 2:6, 2:6] = LABEL_NCR
    pred[6:10, 2:6, 2:6] = LABEL_ED
    pred[10:14, 2:6, 2:6] = LABEL_ET

    expert[2:6, 2:6, 2:6] = LABEL_NCR
    expert[6:10, 2:6, 2:6] = LABEL_ED
    expert[10:14, 2:6, 2:6] = LABEL_ET

    metrics = compute_evaluation_metrics(pred, expert)
    assert metrics["wt_dice"] == 1.0
    assert metrics["tc_dice"] == 1.0
    assert metrics["et_dice"] == 1.0
    assert metrics["wt_sensitivity"] == 1.0
    assert metrics["tc_sensitivity"] == 1.0
    assert metrics["et_sensitivity"] == 1.0


def test_evaluation_metrics_both_empty():
    pred = np.zeros((10, 10, 10), dtype=np.uint8)
    expert = np.zeros((10, 10, 10), dtype=np.uint8)
    metrics = compute_evaluation_metrics(pred, expert)
    assert metrics["wt_dice"] == 1.0
    assert metrics["tc_dice"] == 1.0
    assert metrics["et_dice"] == 1.0


def test_evaluation_metrics_false_positives_only():
    # Prediction has tumor voxels, but expert ground truth is completely healthy (0)
    pred = np.zeros((10, 10, 10), dtype=np.uint8)
    pred[2:5, 2:5, 2:5] = LABEL_ET
    expert = np.zeros((10, 10, 10), dtype=np.uint8)
    metrics = compute_evaluation_metrics(pred, expert)
    assert metrics["wt_dice"] == 0.0
    assert metrics["tc_dice"] == 0.0
    assert metrics["et_dice"] == 0.0


def test_evaluation_metrics_false_negatives_only():
    # Expert has tumor, but model predicted nothing (missed detection)
    pred = np.zeros((10, 10, 10), dtype=np.uint8)
    expert = np.zeros((10, 10, 10), dtype=np.uint8)
    expert[2:5, 2:5, 2:5] = LABEL_ET
    metrics = compute_evaluation_metrics(pred, expert)
    assert metrics["wt_dice"] == 0.0
    assert metrics["et_dice"] == 0.0
    assert metrics["et_sensitivity"] == 0.0


def test_evaluation_metrics_spatial_misalignment():
    # Both have 27 voxels of ET, but at different non-overlapping coordinates
    pred = np.zeros((20, 20, 20), dtype=np.uint8)
    expert = np.zeros((20, 20, 20), dtype=np.uint8)
    pred[0:3, 0:3, 0:3] = LABEL_ET
    expert[10:13, 10:13, 10:13] = LABEL_ET
    metrics = compute_evaluation_metrics(pred, expert)
    assert metrics["et_dice"] == 0.0
    assert metrics["et_sensitivity"] == 0.0
