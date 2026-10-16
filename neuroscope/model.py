"""
NeuroScope 3D - MONAI SegResNet Model Architecture & Bundle Manager.
"""

from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import torch
import torch.nn as nn
from monai.networks.nets import SegResNet

from neuroscope.config import MODELS_DIR

# Default bundle filename
DEFAULT_BUNDLE_WEIGHTS = MODELS_DIR / "brats_mri_segmentation.pt"

MODEL_METADATA: Dict[str, Any] = {
    "name": "MONAI SegResNet (BraTS 2023 Bundle)",
    "version": "1.2.0-rc2",
    "architecture": "3D Encoder-Decoder with Residual Squeeze-and-Excitation Blocks",
    "license": "Apache-2.0 (Research & Teaching Use Only)",
    "input_channels": 4,
    "input_channel_order": ["T1Gd", "T1", "T2", "FLAIR"],
    "output_channels": 3,
    "output_channel_names": ["TC (Tumour Core)", "WT (Whole Tumour)", "ET (Enhancing Tumour)"],
    "discrete_labels": {
        "NCR": 1,
        "ED": 2,
        "ET": 4,
        "Background": 0,
    },
    "reference": "Myronenko, A. '3D MRI brain tumor segmentation using autoencoder regularization.' MICCAI 2018.",
}


def build_segresnet_model() -> nn.Module:
    """
    Constructs the official MONAI SegResNet architecture for BraTS:
    - 4 input channels (T1Gd, T1, T2, FLAIR)
    - 3 output probability channels (TC, WT, ET)
    - 16 initial convolutional filters
    - Squeeze-and-Excitation residual blocks
    """
    model = SegResNet(
        spatial_dims=3,
        in_channels=4,
        out_channels=3,
        init_filters=16,
        blocks_down=[1, 2, 2, 4],
        blocks_up=[1, 1, 1],
        dropout_prob=0.2,
    )
    return model


def get_model_status(weights_path: Optional[Path] = None) -> Dict[str, Any]:
    """Inspects whether genuine pretrained weights are present on disk."""
    path = weights_path or DEFAULT_BUNDLE_WEIGHTS
    has_weights = path.exists() and path.stat().st_size > 0

    return {
        "model_name": MODEL_METADATA["name"],
        "version": MODEL_METADATA["version"],
        "license": MODEL_METADATA["license"],
        "architecture": MODEL_METADATA["architecture"],
        "weights_path": str(path),
        "weights_present": has_weights,
        "status_message": (
            "Model weights loaded and operational."
            if has_weights
            else f"Model inference is not connected. Pretrained weights file '{path.name}' not found."
        ),
    }


def load_model(
    weights_path: Optional[Path] = None,
    device: Optional[torch.device] = None,
) -> Tuple[nn.Module, bool, str]:
    """
    Loads the SegResNet model.
    Returns:
    - model instance in eval mode
    - boolean indicating whether genuine pretrained weights were loaded
    - status message string
    """
    target_device = device or (torch.device("cuda") if torch.cuda.is_available() else torch.device("cpu"))
    model = build_segresnet_model().to(target_device)
    model.eval()

    path = weights_path or DEFAULT_BUNDLE_WEIGHTS
    if path.exists() and path.stat().st_size > 0:
        try:
            state_dict = torch.load(str(path), map_location=target_device, weights_only=True)
            model.load_state_dict(state_dict)
            return model, True, "Pretrained MONAI SegResNet weights loaded successfully."
        except Exception as e:
            return model, False, f"Failed to load weights from {path.name}: {str(e)}"

    return model, False, f"Weights file '{path.name}' not found. Model uninitialized."
