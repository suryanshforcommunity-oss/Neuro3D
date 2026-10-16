"""
NeuroScope 3D - Sliding-Window Inference & BraTS Label Conversion Module.
"""

from pathlib import Path
from typing import Dict, Tuple, Optional, Any
import numpy as np
import scipy.ndimage
import torch
import nibabel as nib
from monai.inferers import SlidingWindowInferer

from neuroscope.config import (
    LABEL_BACKGROUND,
    LABEL_NCR,
    LABEL_ED,
    LABEL_ET,
    RESEARCH_DISCLAIMER,
)
from neuroscope.model import load_model, DEFAULT_BUNDLE_WEIGHTS
from neuroscope.preprocessing import load_and_preprocess_sequences


def convert_channels_to_brats_labels(
    tc_prob: np.ndarray,
    wt_prob: np.ndarray,
    et_prob: np.ndarray,
    threshold: float = 0.5,
) -> np.ndarray:
    """
    Converts 3 sigmoid probability channels into official BraTS integer label maps:
    Channel 0: TC (Tumour Core = NCR + ET)
    Channel 1: WT (Whole Tumour = NCR + ED + ET)
    Channel 2: ET (Enhancing Tumour = ET)

    BraTS Label Assignment Rules:
    - ET (label 4): Active enhancing tumour (ET > threshold)
    - NCR (label 1): Necrotic core (TC > threshold without ET)
    - ED (label 2): Peritumoral edema (WT > threshold without TC)
    - Background (label 0): Non-tumour tissue

    Returns:
    - 3D numpy array of dtype np.uint8 containing strictly {0, 1, 2, 4}
    """
    label_map = np.zeros_like(wt_prob, dtype=np.uint8)

    wt_mask = wt_prob > threshold
    tc_mask = tc_prob > threshold
    et_mask = et_prob > threshold

    # Hierarchical assignment: outer-to-inner
    label_map[wt_mask] = LABEL_ED   # Edema (Label 2)
    label_map[tc_mask] = LABEL_NCR  # Necrotic Core (Label 1)
    label_map[et_mask] = LABEL_ET   # Enhancing Tumour (Label 4)

    return label_map


def resample_label_map_nearest_neighbor(
    label_map: np.ndarray,
    target_shape: Tuple[int, int, int],
) -> np.ndarray:
    """
    Resamples a discrete label map to target shape using nearest-neighbour interpolation (order=0).
    Guarantees that discrete integer labels (0, 1, 2, 4) remain unblurred.
    """
    if label_map.shape == target_shape:
        return label_map

    zoom_factors = [
        target_shape[i] / label_map.shape[i] for i in range(3)
    ]
    resampled = scipy.ndimage.zoom(
        label_map,
        zoom=zoom_factors,
        order=0,  # Nearest-neighbour
        mode="nearest",
    )
    return resampled.astype(np.uint8)


def run_model_inference(
    sequence_paths: Dict[str, Path],
    output_path: Path,
    weights_path: Optional[Path] = None,
    roi_size: Tuple[int, int, int] = (128, 128, 128),
    sw_overlap: float = 0.5,
) -> Dict[str, Any]:
    """
    Executes full MONAI SegResNet sliding-window inference:
    1. Loads sequences in channel order: [T1Gd, T1, T2, FLAIR]
    2. Applies non-zero z-score normalization
    3. Runs sliding-window inference with fixed seed
    4. Converts output channels into discrete BraTS labels (1, 2, 4)
    5. Preserves native input shape and spatial affine
    6. Saves prediction as .nii.gz

    Strict Regulatory & Verification Constraint:
    If pretrained weights are not present on disk, raises RuntimeError.
    Never invents or substitutes a fake mask as live AI output.
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model, has_weights, status_msg = load_model(weights_path=weights_path, device=device)

    if not has_weights:
        raise RuntimeError(
            f"Cannot execute live AI inference: {status_msg} "
            f"Please download the MONAI 'brats_mri_segmentation' bundle weights to '{DEFAULT_BUNDLE_WEIGHTS}'."
        )

    # Preprocess inputs
    stacked_4d, original_affine, original_header, original_shape = load_and_preprocess_sequences(sequence_paths)

    # Set deterministic evaluation seed
    torch.manual_seed(42)
    np.random.seed(42)

    # Convert to PyTorch tensor with batch dimension: (1, 4, H, W, D)
    tensor_input = torch.from_numpy(stacked_4d).unsqueeze(0).to(device)

    # Sliding-window inferer with Gaussian blending
    inferer = SlidingWindowInferer(
        roi_size=roi_size,
        sw_batch_size=1,
        overlap=sw_overlap,
        mode="gaussian",
    )

    with torch.no_grad():
        raw_output = inferer(tensor_input, model)
        # Apply sigmoid to convert logits to probabilities
        probs = torch.sigmoid(raw_output).squeeze(0).cpu().numpy()

    tc_prob = probs[0]  # Channel 0: TC
    wt_prob = probs[1]  # Channel 1: WT
    et_prob = probs[2]  # Channel 2: ET

    # Convert to BraTS labels
    discrete_labels = convert_channels_to_brats_labels(tc_prob, wt_prob, et_prob, threshold=0.5)

    # Resample back to original spatial grid if necessary
    final_label_map = resample_label_map_nearest_neighbor(discrete_labels, original_shape)

    # Save output NIfTI preserving exact input affine matrix and setting uint8 datatype for segmentation labels
    output_path.parent.mkdir(parents=True, exist_ok=True)
    out_nimg = nib.Nifti1Image(final_label_map, original_affine, original_header)
    out_nimg.set_data_dtype(np.uint8)
    nib.save(out_nimg, str(output_path))

    return {
        "output_path": str(output_path),
        "shape": final_label_map.shape,
        "labels": np.unique(final_label_map).tolist(),
        "disclaimer": RESEARCH_DISCLAIMER,
    }
