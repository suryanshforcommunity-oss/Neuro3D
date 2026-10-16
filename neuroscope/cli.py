"""
NeuroScope 3D - Command-Line Interface (CLI).
Command: neuroscope predict --t1 ... --t1ce ... --t2 ... --flair ... --out ... [--expert ...]
"""

import sys
import argparse
from pathlib import Path
import nibabel as nib
import numpy as np

from neuroscope.config import RESEARCH_DISCLAIMER, PREDICTION_LABEL_PHRASE
from neuroscope.validation import validate_study_sequences, validate_single_nifti, ValidationError
from neuroscope.inference import run_model_inference
from neuroscope.volume import (
    compute_brats_composite_counts,
    calculate_volume_ml,
    compute_evaluation_metrics,
)


def create_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="neuroscope",
        description="NeuroScope 3D — Medical Imaging Brain Tumour Segmentation CLI",
    )
    subparsers = parser.add_subparsers(dest="command", help="Subcommand to run")

    predict_parser = subparsers.add_parser("predict", help="Execute 4-sequence brain tumour segmentation")
    predict_parser.add_argument("--t1", required=True, type=Path, help="Path to T1 native NIfTI (.nii/.nii.gz)")
    predict_parser.add_argument(
        "--t1ce", "--t1gd", dest="t1ce", required=True, type=Path, help="Path to T1-Gd contrast NIfTI"
    )
    predict_parser.add_argument("--t2", required=True, type=Path, help="Path to T2 NIfTI")
    predict_parser.add_argument("--flair", required=True, type=Path, help="Path to T2-FLAIR NIfTI")
    predict_parser.add_argument("--out", required=True, type=Path, help="Output path for predicted segmentation NIfTI (.nii.gz)")
    predict_parser.add_argument("--expert", required=False, type=Path, help="Optional expert ground truth mask for scoring")
    predict_parser.add_argument("--weights", required=False, type=Path, help="Path to MONAI bundle weights (.pt)")

    return parser


def handle_predict(args: argparse.Namespace) -> int:
    print("=" * 70)
    print("NeuroScope 3D - 4-Sequence Brain MRI Segmentation Pipeline")
    print(f"Notice: {RESEARCH_DISCLAIMER}")
    print("=" * 70)

    sequences = {
        "T1": args.t1,
        "T1Gd": args.t1ce,
        "T2": args.t2,
        "FLAIR": args.flair,
    }

    # 1. Server-side sequence integrity validation
    print("\n[1/4] Validating input NIfTI modalities...")
    validation = validate_study_sequences(sequences)
    if not validation["is_valid"]:
        print("\n[VALIDATION FAILED] The study could not be processed:")
        for err in validation["errors"]:
            print(f"  * ERROR: {err}")
        return 1

    print("  [OK] All 4 required sequences verified (dimensions and affines aligned).")

    # 2. Execute inference
    print(f"\n[2/4] Initializing MONAI SegResNet inference on {sequences['T1Gd'].name}...")
    try:
        result = run_model_inference(
            sequence_paths=sequences,
            output_path=args.out,
            weights_path=args.weights,
        )
        print(f"  [OK] Segmentation NIfTI exported successfully to: {args.out}")
    except RuntimeError as re:
        print(f"\n[INFERENCE BLOCKED] {str(re)}")
        return 2
    except Exception as e:
        print(f"\n[EXECUTION ERROR] Inference failed: {str(e)}")
        return 1

    # 3. Volumetric Quantification
    print("\n[3/4] Computing physical tumour compartment volumes...")
    out_nimg = nib.load(str(args.out))
    pred_data = out_nimg.get_fdata().astype(np.uint8)
    spacing = tuple(float(z) for z in out_nimg.header.get_zooms()[:3])

    counts = compute_brats_composite_counts(pred_data)
    wt_ml = calculate_volume_ml(counts["wt_count"], spacing)
    tc_ml = calculate_volume_ml(counts["tc_count"], spacing)
    et_ml = calculate_volume_ml(counts["et_count"], spacing)

    print(f"  Voxel Spacing (dx, dy, dz): {spacing[0]:.2f} x {spacing[1]:.2f} x {spacing[2]:.2f} mm")
    print(f"  * Whole Tumour (WT)   = {wt_ml:.2f} mL ({counts['wt_count']} voxels)")
    print(f"  * Tumour Core (TC)    = {tc_ml:.2f} mL ({counts['tc_count']} voxels)")
    print(f"  * Enhancing Tumour (ET)= {et_ml:.2f} mL ({counts['et_count']} voxels)")
    print(f"  Terminology: {PREDICTION_LABEL_PHRASE}")

    # 4. Expert Ground Truth Comparison (if supplied)
    if args.expert and args.expert.exists():
        print("\n[4/4] Comparing against expert ground truth mask...")
        try:
            exp_info = validate_single_nifti(args.expert)
            exp_nimg = nib.load(str(args.expert))
            exp_data = exp_nimg.get_fdata().astype(np.uint8)

            metrics = compute_evaluation_metrics(pred_data, exp_data)
            exp_counts = compute_brats_composite_counts(exp_data)
            exp_wt_ml = calculate_volume_ml(exp_counts["wt_count"], spacing)

            print(f"  * WT Dice Score (DSC) : {metrics['wt_dice'] * 100:.2f}% (Sensitivity: {metrics['wt_sensitivity'] * 100:.2f}%)")
            print(f"  * TC Dice Score (DSC) : {metrics['tc_dice'] * 100:.2f}% (Sensitivity: {metrics['tc_sensitivity'] * 100:.2f}%)")
            print(f"  * ET Dice Score (DSC) : {metrics['et_dice'] * 100:.2f}% (Sensitivity: {metrics['et_sensitivity'] * 100:.2f}%)")
            print(f"  * Expert WT Volume    : {exp_wt_ml:.2f} mL (Discrepancy: {wt_ml - exp_wt_ml:+.2f} mL)")
        except Exception as e:
            print(f"  Warning: Expert mask comparison failed: {str(e)}")

    print("\n" + "=" * 70)
    print("Process completed.")
    return 0


def main():
    parser = create_parser()
    if len(sys.argv) == 1:
        parser.print_help()
        sys.exit(0)

    args = parser.parse_args()
    if args.command == "predict":
        sys.exit(handle_predict(args))
    else:
        parser.print_help()
        sys.exit(0)


if __name__ == "__main__":
    main()
