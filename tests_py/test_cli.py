"""
Unit tests for the neuroscope CLI.
"""

from pathlib import Path
import pytest
import numpy as np
import nibabel as nib

from neuroscope.cli import create_parser, handle_predict
from tests_py.conftest import create_synthetic_nifti
from neuroscope.config import LABEL_ED, LABEL_ET


def test_cli_parser_help():
    parser = create_parser()
    with pytest.raises(SystemExit) as exc:
        parser.parse_args(["predict", "--help"])
    assert exc.value.code == 0


def test_cli_validation_failure(temp_dir, capsys):
    parser = create_parser()
    # Provide non-existent files
    args = parser.parse_args([
        "predict",
        "--t1", str(temp_dir / "missing_t1.nii.gz"),
        "--t1ce", str(temp_dir / "missing_t1ce.nii.gz"),
        "--t2", str(temp_dir / "missing_t2.nii.gz"),
        "--flair", str(temp_dir / "missing_flair.nii.gz"),
        "--out", str(temp_dir / "out.nii.gz"),
    ])

    exit_code = handle_predict(args)
    captured = capsys.readouterr()

    assert exit_code == 1
    assert "[VALIDATION FAILED]" in captured.out


def test_cli_blocked_when_weights_missing(synthetic_study, temp_dir, capsys):
    parser = create_parser()
    missing_weights = temp_dir / "missing_weights.pt"
    out_file = temp_dir / "cli_out.nii.gz"

    args = parser.parse_args([
        "predict",
        "--t1", str(synthetic_study["T1"]),
        "--t1ce", str(synthetic_study["T1Gd"]),
        "--t2", str(synthetic_study["T2"]),
        "--flair", str(synthetic_study["FLAIR"]),
        "--out", str(out_file),
        "--weights", str(missing_weights),
    ])

    exit_code = handle_predict(args)
    captured = capsys.readouterr()

    assert exit_code == 2
    assert "[INFERENCE BLOCKED]" in captured.out
    assert not out_file.exists()


def test_cli_prediction_success_with_weights(synthetic_study, synthetic_weights, temp_dir, capsys):
    parser = create_parser()
    out_file = temp_dir / "cli_out.nii.gz"

    args = parser.parse_args([
        "predict",
        "--t1", str(synthetic_study["T1"]),
        "--t1ce", str(synthetic_study["T1Gd"]),
        "--t2", str(synthetic_study["T2"]),
        "--flair", str(synthetic_study["FLAIR"]),
        "--out", str(out_file),
        "--weights", str(synthetic_weights),
    ])

    exit_code = handle_predict(args)
    captured = capsys.readouterr()

    assert exit_code == 0
    assert "Segmentation NIfTI exported successfully" in captured.out
    assert "Whole Tumour (WT)" in captured.out
    assert "Tumour Core (TC)" in captured.out
    assert "Enhancing Tumour (ET)" in captured.out
    assert out_file.exists()


def test_cli_with_expert_mask_scoring(synthetic_study, synthetic_weights, temp_dir, capsys):
    # Create an expert mask
    expert_file = temp_dir / "expert.nii.gz"
    mask_data = np.zeros((32, 32, 32), dtype=np.uint8)
    mask_data[8:16, 8:16, 8:16] = LABEL_ED
    mask_data[12:16, 12:16, 12:16] = LABEL_ET
    create_synthetic_nifti(expert_file, shape=(32, 32, 32), zooms=(1.0, 1.0, 2.0), data=mask_data)

    out_file = temp_dir / "cli_scored_out.nii.gz"
    parser = create_parser()

    args = parser.parse_args([
        "predict",
        "--t1", str(synthetic_study["T1"]),
        "--t1ce", str(synthetic_study["T1Gd"]),
        "--t2", str(synthetic_study["T2"]),
        "--flair", str(synthetic_study["FLAIR"]),
        "--out", str(out_file),
        "--weights", str(synthetic_weights),
        "--expert", str(expert_file),
    ])

    exit_code = handle_predict(args)
    captured = capsys.readouterr()

    assert exit_code == 0
    assert "Comparing against expert ground truth mask" in captured.out
    assert "WT Dice Score (DSC)" in captured.out
    assert "TC Dice Score (DSC)" in captured.out
    assert "ET Dice Score (DSC)" in captured.out
