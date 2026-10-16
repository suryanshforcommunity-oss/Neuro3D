"""
Unit tests for preprocessing, MONAI SegResNet pipeline, label conversion, resampling, and affine preservation.
"""

from pathlib import Path
import pytest
import numpy as np
import nibabel as nib
import torch

from neuroscope.model import build_segresnet_model, load_model, get_model_status
from neuroscope.preprocessing import normalize_intensity, load_and_preprocess_sequences
from neuroscope.inference import (
    convert_channels_to_brats_labels,
    resample_label_map_nearest_neighbor,
    run_model_inference,
)
from neuroscope.config import (
    LABEL_BACKGROUND,
    LABEL_NCR,
    LABEL_ED,
    LABEL_ET,
    MODEL_CHANNEL_ORDER,
)


def test_segresnet_architecture():
    model = build_segresnet_model()
    # Check in_channels
    assert model.in_channels == 4
    # Check forward pass output shape (1, 3, D, H, W)
    dummy_input = torch.zeros(1, 4, 16, 16, 16)
    with torch.no_grad():
        out = model(dummy_input)
    assert out.shape == (1, 3, 16, 16, 16)


def test_intensity_normalization():
    # Synthetic slice with background (0) and foreground (100 to 200)
    data = np.zeros((20, 20), dtype=np.float32)
    data[5:15, 5:15] = np.random.uniform(100.0, 200.0, size=(10, 10))

    norm = normalize_intensity(data)
    # Background must remain strictly 0.0
    assert np.all(norm[data == 0] == 0.0)
    # Foreground must have zero-mean and unit-variance
    fg = norm[data > 0]
    assert np.isclose(np.mean(fg), 0.0, atol=1e-5)
    assert np.isclose(np.std(fg), 1.0, atol=1e-5)


def test_brats_label_conversion():
    # 4 voxel cases:
    # 1. Background: [0, 0, 0]
    # 2. Edema (WT only): TC=0.1, WT=0.9, ET=0.1
    # 3. Necrotic Core (TC + WT, no ET): TC=0.8, WT=0.9, ET=0.1
    # 4. Enhancing Tumour (ET + TC + WT): TC=0.9, WT=0.9, ET=0.9
    tc_prob = np.array([0.0, 0.1, 0.8, 0.9])
    wt_prob = np.array([0.0, 0.9, 0.9, 0.9])
    et_prob = np.array([0.0, 0.1, 0.1, 0.9])

    labels = convert_channels_to_brats_labels(tc_prob, wt_prob, et_prob, threshold=0.5)

    assert labels[0] == LABEL_BACKGROUND  # 0
    assert labels[1] == LABEL_ED          # 2
    assert labels[2] == LABEL_NCR         # 1
    assert labels[3] == LABEL_ET          # 4


def test_nearest_neighbor_label_resampling():
    # Create small discrete map containing 0, 1, 2, 4
    orig = np.zeros((8, 8, 8), dtype=np.uint8)
    orig[1:3, 1:3, 1:3] = LABEL_NCR  # 1
    orig[3:5, 3:5, 3:5] = LABEL_ED   # 2
    orig[5:7, 5:7, 5:7] = LABEL_ET   # 4

    # Upsample to (16, 16, 16)
    resampled = resample_label_map_nearest_neighbor(orig, (16, 16, 16))
    assert resampled.shape == (16, 16, 16)
    assert resampled.dtype == np.uint8

    unique_vals = set(np.unique(resampled))
    # Must NOT have any interpolated values (such as 3)
    assert unique_vals.issubset({0, 1, 2, 4})


def test_safe_failure_without_weights(synthetic_study, temp_dir):
    out_path = temp_dir / "output.nii.gz"
    nonexistent_weights = temp_dir / "does_not_exist.pt"

    with pytest.raises(RuntimeError, match="Cannot execute live AI inference"):
        run_model_inference(
            sequence_paths=synthetic_study,
            output_path=out_path,
            weights_path=nonexistent_weights,
        )

    # Verify no fake output was generated
    assert not out_path.exists()


def test_end_to_end_inference_and_affine_preservation(synthetic_study, synthetic_weights, temp_dir):
    out_path = temp_dir / "test_prediction.nii.gz"

    result = run_model_inference(
        sequence_paths=synthetic_study,
        output_path=out_path,
        weights_path=synthetic_weights,
        roi_size=(32, 32, 32),
    )

    assert out_path.exists()
    assert result["output_path"] == str(out_path)

    # Inspect output NIfTI
    out_nimg = nib.load(str(out_path))
    in_nimg = nib.load(str(synthetic_study["T1Gd"]))

    # 1. Output grid shape must match input grid exactly
    assert out_nimg.shape == in_nimg.shape

    # 2. Affine matrix must be preserved
    assert np.allclose(out_nimg.affine, in_nimg.affine, atol=1e-4)

    # 3. Zooms must match
    assert np.allclose(out_nimg.header.get_zooms(), in_nimg.header.get_zooms(), atol=1e-4)

    # 4. Labels must be strictly BraTS discrete {0, 1, 2, 4}
    out_labels = set(np.unique(out_nimg.get_fdata().astype(np.uint8)))
    assert out_labels.issubset({0, 1, 2, 4})


def test_inference_reproducibility(synthetic_study, synthetic_weights, temp_dir):
    out1 = temp_dir / "run1.nii.gz"
    out2 = temp_dir / "run2.nii.gz"

    run_model_inference(synthetic_study, out1, weights_path=synthetic_weights, roi_size=(32, 32, 32))
    run_model_inference(synthetic_study, out2, weights_path=synthetic_weights, roi_size=(32, 32, 32))

    data1 = nib.load(str(out1)).get_fdata()
    data2 = nib.load(str(out2)).get_fdata()

    # Fixed seed must ensure 100% bitwise reproducibility
    np.testing.assert_array_equal(data1, data2)
