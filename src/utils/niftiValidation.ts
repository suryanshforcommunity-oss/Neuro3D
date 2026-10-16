import * as nifti from 'nifti-reader-js';
import { NiftiHeaderInfo, UploadedSequence, VolumeDimensions, VoxelSpacing, AffineMatrix } from '../types';

export const MAX_FILE_SIZE_BYTES = 1024 * 1024 * 1024; // 1 GB limit

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  header?: NiftiHeaderInfo;
  sha256?: string;
  voxelData?: Float32Array | Int16Array | Uint8Array;
}

/**
 * Calculates SHA-256 hash of an ArrayBuffer in hex format using Web Crypto API.
 */
export async function calculateSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates a single NIfTI file buffer.
 */
export async function validateNiftiFile(file: File): Promise<ValidationResult> {
  const filename = file.name.toLowerCase();
  if (!filename.endsWith('.nii') && !filename.endsWith('.nii.gz')) {
    return {
      isValid: false,
      error: `Invalid file extension for "${file.name}". Only .nii and .nii.gz are supported.`,
    };
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: `File "${file.name}" is empty (0 bytes).`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File "${file.name}" exceeds the maximum 1 GB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
    };
  }

  try {
    const rawBuffer = await file.arrayBuffer();
    const sha256 = await calculateSha256(rawBuffer);

    let niftiBuffer: ArrayBuffer = rawBuffer;
    if (nifti.isCompressed(rawBuffer)) {
      niftiBuffer = nifti.decompress(rawBuffer) as ArrayBuffer;
    }

    if (!nifti.isNIFTI(niftiBuffer)) {
      return {
        isValid: false,
        error: `File "${file.name}" does not contain a valid NIfTI header (magic number missing or corrupt).`,
      };
    }

    const header = nifti.readHeader(niftiBuffer);
    if (!header) {
      return {
        isValid: false,
        error: `Failed to parse NIfTI header from "${file.name}".`,
      };
    }

    // dims: [dimCount, dimX, dimY, dimZ, ...]
    const dims = header.dims || [];
    if (dims.length < 4 || dims[1] <= 1 || dims[2] <= 1 || dims[3] <= 1) {
      return {
        isValid: false,
        error: `File "${file.name}" is not a valid 3D volume. Found dimensions: ${dims.slice(1, 4).join('×')}.`,
      };
    }

    const volumeDims: VolumeDimensions = {
      dimX: dims[1],
      dimY: dims[2],
      dimZ: dims[3],
    };

    // pixDims: [qfac, dx, dy, dz, ...]
    const pixDims = header.pixDims || [1, 1, 1, 1];
    const spacing: VoxelSpacing = {
      x: Number((pixDims[1] || 1).toFixed(3)),
      y: Number((pixDims[2] || 1).toFixed(3)),
      z: Number((pixDims[3] || 1).toFixed(3)),
    };

    if (spacing.x <= 0 || spacing.y <= 0 || spacing.z <= 0 || !Number.isFinite(spacing.x)) {
      return {
        isValid: false,
        error: `Invalid non-positive voxel spacing in "${file.name}": (${spacing.x}, ${spacing.y}, ${spacing.z}) mm.`,
      };
    }

    // Extract affine or build from sform/qform
    let affine: AffineMatrix;
    if (header.affine && Array.isArray(header.affine) && header.affine.length === 4) {
      affine = header.affine as AffineMatrix;
    } else {
      // Fallback orientation with voxel spacing
      affine = [
        [spacing.x, 0, 0, -(volumeDims.dimX * spacing.x) / 2],
        [0, spacing.y, 0, -(volumeDims.dimY * spacing.y) / 2],
        [0, 0, spacing.z, -(volumeDims.dimZ * spacing.z) / 2],
        [0, 0, 0, 1],
      ];
    }

    // Inspect voxel data
    let imageBuffer: ArrayBuffer | null = null;
    let typedData: Float32Array | Int16Array | Uint8Array | null = null;
    try {
      imageBuffer = nifti.readImage(header, niftiBuffer);
      if (imageBuffer) {
        // Sample check for constant / all-zero or NaN values
        if (header.datatypeCode === 2) {
          typedData = new Uint8Array(imageBuffer);
        } else if (header.datatypeCode === 4) {
          typedData = new Int16Array(imageBuffer);
        } else {
          typedData = new Float32Array(imageBuffer);
        }

        let nonZeroCount = 0;
        let hasNan = false;
        const totalSamples = Math.min(typedData.length, 5000);
        const step = Math.max(1, Math.floor(typedData.length / totalSamples));

        for (let s = 0; s < typedData.length; s += step) {
          const val = typedData[s];
          if (Number.isNaN(val) || !Number.isFinite(val)) {
            hasNan = true;
            break;
          }
          if (val !== 0) {
            nonZeroCount++;
          }
        }

        if (hasNan) {
          return {
            isValid: false,
            error: `File "${file.name}" contains non-finite (NaN or Inf) voxel values.`,
          };
        }

        if (nonZeroCount === 0 && typedData.length > 0) {
          return {
            isValid: false,
            error: `File "${file.name}" contains an all-zero constant image. No anatomical signal detected.`,
          };
        }
      }
    } catch {
      // Non-fatal if partial preview fails, but valid header
    }

    const headerInfo: NiftiHeaderInfo = {
      dimensions: volumeDims,
      spacing,
      affine,
      datatype: header.datatypeCode || 0,
      bitsPerVoxel: header.numBitsPerVoxel || 16,
      description: header.description || 'NIfTI-1 MRI Volume',
      sha256,
    };

    return {
      isValid: true,
      header: headerInfo,
      sha256,
      voxelData: typedData || undefined,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      isValid: false,
      error: `Failed to read NIfTI file "${file.name}": ${msg}`,
    };
  }
}

/**
 * Validates cross-sequence consistency across the 4 required MRI modalities (T1, T1Gd, T2, FLAIR).
 */
export function validateSequenceConsistency(sequences: UploadedSequence[]): {
  isConsistent: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const requiredTypes = ['T1', 'T1Gd', 'T2', 'FLAIR'] as const;
  const loadedRequired = sequences.filter(s => s.isLoaded && s.header && requiredTypes.includes(s.sequenceType as any));

  if (loadedRequired.length === 0) {
    return {
      isConsistent: false,
      errors: ['No MRI sequences loaded. Please upload T1, T1Gd, T2, and FLAIR volumes.'],
      warnings: [],
    };
  }

  const missing = requiredTypes.filter(t => !sequences.some(s => s.isLoaded && s.sequenceType === t));
  if (missing.length > 0) {
    errors.push(`Missing required sequence(s): ${missing.join(', ')}. All 4 modalities (T1, T1Gd, T2, FLAIR) are strictly required for BraTS segmentation.`);
  }

  // Check matching volume dimensions and spatial affines
  const baseSequence = loadedRequired[0];
  const baseDim = baseSequence.header!.dimensions;
  const baseSpacing = baseSequence.header!.spacing;
  const baseAffine = baseSequence.header!.affine;

  for (let idx = 1; idx < loadedRequired.length; idx++) {
    const seq = loadedRequired[idx];
    const dim = seq.header!.dimensions;
    const spacing = seq.header!.spacing;
    const affine = seq.header!.affine;

    if (dim.dimX !== baseDim.dimX || dim.dimY !== baseDim.dimY || dim.dimZ !== baseDim.dimZ) {
      errors.push(
        `Volume shape mismatch: ${seq.sequenceType} is ${dim.dimX}×${dim.dimY}×${dim.dimZ}, but ${baseSequence.sequenceType} is ${baseDim.dimX}×${baseDim.dimY}×${baseDim.dimZ}. All sequences must be co-registered with identical dimensions.`
      );
    }

    // Affine matrix consistency check
    if (affine && baseAffine) {
      let affineDiff = 0;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          affineDiff += Math.abs(affine[r][c] - baseAffine[r][c]);
        }
      }
      if (affineDiff > 0.5) {
        errors.push(
          `Spatial affine mismatch: ${seq.sequenceType} and ${baseSequence.sequenceType} have differing orientation or translation affines (diff: ${affineDiff.toFixed(2)}). Sequences must be in the same physical space.`
        );
      }
    }

    const spacingDiffX = Math.abs(spacing.x - baseSpacing.x);
    const spacingDiffY = Math.abs(spacing.y - baseSpacing.y);
    const spacingDiffZ = Math.abs(spacing.z - baseSpacing.z);

    if (spacingDiffX > 0.05 || spacingDiffY > 0.05 || spacingDiffZ > 0.05) {
      warnings.push(
        `Voxel spacing discrepancy between ${seq.sequenceType} (${spacing.x}, ${spacing.y}, ${spacing.z} mm) and ${baseSequence.sequenceType} (${baseSpacing.x}, ${baseSpacing.y}, ${baseSpacing.z} mm). Resampling recommended.`
      );
    }
  }

  return {
    isConsistent: errors.length === 0,
    errors,
    warnings,
  };
}
