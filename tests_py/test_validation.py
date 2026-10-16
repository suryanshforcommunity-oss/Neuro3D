"""
Unit tests for server-side NiBabel NIfTI validation.
"""

from pathlib import Path
import pytest
import numpy as np
import nibabel as nib

from neuroscope.validation import (
    validate_single_nifti,
    validate_study_sequences,
    ValidationError,
    compute_sha256,
)
from tests_py.conftest import create_synthetic_nifti


def test_validation_nonexistent_file(temp_dir):
    missing_file = temp_dir / "nonexistent.nii.gz"
    with pytest.raises(ValidationError, match="File not found"):
        validate_single_nifti(missing_file)


def test_validation_empty_file(temp_dir):
    empty_file = temp_dir / "empty.nii.gz"
    empty_file.write_bytes(b"")
    with pytest.raises(ValidationError, match="empty \\(0 bytes\\)"):
        validate_single_nifti(empty_file)


def test_validation_invalid_extension(temp_dir):
    txt_file = temp_dir / "scan.txt"
    txt_file.write_text("not a nifti")
    with pytest.raises(ValidationError, match="Invalid extension"):
        validate_single_nifti(txt_file)


def test_validation_corrupt_nifti(temp_dir):
    corrupt_file = temp_dir / "corrupt.nii.gz"
    corrupt_file.write_bytes(b"PK\x03\x04randomjunknotanifti")
    with pytest.raises(ValidationError, match="NiBabel failed to parse"):
        validate_single_nifti(corrupt_file)


def test_validation_rejects_2d_slice(temp_dir):
    slice_path = temp_dir / "slice2d.nii.gz"
    data = np.ones((64, 64), dtype=np.float32)
    affine = np.eye(4)
    nimg = nib.Nifti1Image(data, affine)
    nib.save(nimg, str(slice_path))

    with pytest.raises(ValidationError, match="2D or degenerate volume"):
        validate_single_nifti(slice_path)


def test_validation_rejects_non_positive_spacing(temp_dir):
    invalid_path = temp_dir / "bad_zooms.nii"
    data = np.random.rand(16, 16, 16).astype(np.float32)
    nimg = nib.Nifti1Image(data, np.eye(4))
    nib.save(nimg, str(invalid_path))

    # Overwrite pixdim[1] directly at offset 80 in raw NIfTI binary header with NaN
    import struct
    with open(invalid_path, "r+b") as f:
        f.seek(80)
        f.write(struct.pack("<f", float("nan")))

    with pytest.raises(ValidationError, match="invalid non-positive voxel spacing"):
        validate_single_nifti(invalid_path)


def test_validation_rejects_nan_inf_voxels(temp_dir):
    nan_path = temp_dir / "nan_voxels.nii.gz"
    data = np.ones((16, 16, 16), dtype=np.float32)
    data[8, 8, 8] = np.nan
    create_synthetic_nifti(nan_path, shape=(16, 16, 16), data=data)

    with pytest.raises(ValidationError, match="non-finite \\(NaN or Inf\\)"):
        validate_single_nifti(nan_path)

    inf_path = temp_dir / "inf_voxels.nii.gz"
    data[8, 8, 8] = np.inf
    create_synthetic_nifti(inf_path, shape=(16, 16, 16), data=data)

    with pytest.raises(ValidationError, match="non-finite \\(NaN or Inf\\)"):
        validate_single_nifti(inf_path)


def test_validation_rejects_all_zero_and_constant_signal(temp_dir):
    zeros_path = temp_dir / "all_zeros.nii.gz"
    create_synthetic_nifti(zeros_path, shape=(16, 16, 16), data=np.zeros((16, 16, 16), dtype=np.float32))

    with pytest.raises(ValidationError, match="constant or all-zero signal"):
        validate_single_nifti(zeros_path)

    const_path = temp_dir / "constant.nii.gz"
    create_synthetic_nifti(const_path, shape=(16, 16, 16), data=np.full((16, 16, 16), 42.0, dtype=np.float32))

    with pytest.raises(ValidationError, match="constant or all-zero signal"):
        validate_single_nifti(const_path)


def test_validation_valid_nifti(temp_dir):
    valid_path = temp_dir / "valid_brain.nii.gz"
    create_synthetic_nifti(valid_path, shape=(32, 32, 32), zooms=(1.0, 1.0, 1.5))

    info = validate_single_nifti(valid_path)
    assert info["filename"] == "valid_brain.nii.gz"
    assert info["shape"] == (32, 32, 32)
    assert info["spacing"] == (1.0, 1.0, 1.5)
    assert len(info["sha256"]) == 64
    assert info["file_size"] > 0


def test_study_validation_missing_modality(synthetic_study):
    # Omit T2
    incomplete_study = {
        "T1": synthetic_study["T1"],
        "T1Gd": synthetic_study["T1Gd"],
        "FLAIR": synthetic_study["FLAIR"],
    }
    result = validate_study_sequences(incomplete_study)
    assert not result["is_valid"]
    assert any("Missing required modalities: T2" in err for err in result["errors"])


def test_study_validation_shape_mismatch(synthetic_study, temp_dir):
    # Create mismatched T2 with shape (48, 48, 48) instead of (32, 32, 32)
    mismatched_t2 = create_synthetic_nifti(temp_dir / "mismatched_t2.nii.gz", shape=(48, 48, 48))
    test_study = dict(synthetic_study)
    test_study["T2"] = mismatched_t2

    result = validate_study_sequences(test_study)
    assert not result["is_valid"]
    assert any("Volume shape mismatch" in err for err in result["errors"])


def test_study_validation_affine_mismatch(synthetic_study, temp_dir):
    # Create shifted affine for FLAIR (shift by 10.0 mm)
    shifted_affine = np.diag([1.0, 1.0, 2.0, 1.0])
    shifted_affine[0, 3] = 10.0
    shifted_flair = create_synthetic_nifti(
        temp_dir / "shifted_flair.nii.gz", shape=(32, 32, 32), affine=shifted_affine
    )
    test_study = dict(synthetic_study)
    test_study["FLAIR"] = shifted_flair

    result = validate_study_sequences(test_study)
    assert not result["is_valid"]
    assert any("Spatial affine mismatch" in err for err in result["errors"])


def test_study_validation_success(synthetic_study):
    result = validate_study_sequences(synthetic_study)
    assert result["is_valid"]
    assert len(result["errors"]) == 0
    assert len(result["headers"]) == 4
    for mod in ["T1", "T1Gd", "T2", "FLAIR"]:
        assert mod in result["headers"]
        assert len(result["headers"][mod]["sha256"]) == 64
