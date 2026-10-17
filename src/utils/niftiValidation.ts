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
 * Validates a single NIfTI file buffer with comprehensive error detection.
 */
export async function validateNiftiFile(file: File): Promise<ValidationResult> {
  const filename = file.name.toLowerCase();

  // 1. Format-specific rejection diagnostics
  if (filename.endsWith('.dcm') || filename.endsWith('.dicom') || filename.endsWith('.ima')) {
    return {
      isValid: false,
      error: `Invalid file extension: DICOM format detected for "${file.name}". NeuroScope requires 3D co-registered NIfTI (.nii or .nii.gz). DICOM series lack single-file volumetric coordinate affines; please convert your DICOM series to 3D NIfTI with dcm2niix before uploading.`,
    };
  }

  if (
    filename.endsWith('.zip') ||
    filename.endsWith('.tar') ||
    filename.endsWith('.tar.gz') ||
    filename.endsWith('.tgz') ||
    filename.endsWith('.7z') ||
    filename.endsWith('.rar') ||
    (filename.endsWith('.gz') && !filename.endsWith('.nii.gz'))
  ) {
    return {
      isValid: false,
      error: `Invalid file extension: Compressed archive detected for "${file.name}". Please extract the archive and upload the individual .nii or .nii.gz 3D NIfTI volume directly. Archives cannot be read directly as volumetric MRI scans.`,
    };
  }

  if (
    filename.endsWith('.png') ||
    filename.endsWith('.jpg') ||
    filename.endsWith('.jpeg') ||
    filename.endsWith('.bmp') ||
    filename.endsWith('.tiff') ||
    filename.endsWith('.tif') ||
    filename.endsWith('.webp') ||
    filename.endsWith('.svg')
  ) {
    const extMatch = file.name.match(/\.[^.]+$/);
    const detectedType = extMatch ? `${extMatch[0].toUpperCase().slice(1)} 2D Image` : '2D Bitmap Image';
    return {
      isValid: false,
      error: `Invalid file extension: 2D image format detected for "${file.name}" (detected format: ${detectedType}). NeuroScope requires 3D medical volumetric MRI scans (.nii or .nii.gz) with slice depth Z > 1 and physical voxel spacing, not 2D bitmap images. 2D images cannot be reconstructed into orthogonal 3D multiplanar views or segmented volumetrically.`,
    };
  }

  if (
    filename.endsWith('.txt') ||
    filename.endsWith('.pdf') ||
    filename.endsWith('.csv') ||
    filename.endsWith('.tsv') ||
    filename.endsWith('.json') ||
    filename.endsWith('.xml') ||
    filename.endsWith('.doc') ||
    filename.endsWith('.docx')
  ) {
    const isPdf = filename.endsWith('.pdf');
    const detectedType = isPdf ? 'PDF Report Document' : 'Clinical Document / Text File';
    return {
      isValid: false,
      error: `Invalid file extension: Non-imaging document detected for "${file.name}" (detected format: ${detectedType}). Text documents and clinical reports do not contain 3D volumetric MRI voxel arrays or spatial coordinate affines. Please upload a 3D medical NIfTI neuroimaging scan (.nii or .nii.gz).`,
    };
  }

  // 2. File extension validation
  if (!filename.endsWith('.nii') && !filename.endsWith('.nii.gz')) {
    const extMatch = file.name.match(/\.[^.]+$/);
    const ext = extMatch ? extMatch[0] : 'none';
    return {
      isValid: false,
      error: `Invalid file extension: Unsupported file extension (${ext}) for "${file.name}". NeuroScope requires standard .nii or .nii.gz medical volumetric imaging files with 3D voxel arrays.`,
    };
  }

  // 3. Empty file check (0 bytes)
  if (file.size === 0) {
    return {
      isValid: false,
      error: `File "${file.name}" is empty (0 bytes). The selected file contains no binary data.`,
    };
  }

  // 4. Truncated header size check
  // An uncompressed NIfTI header is at least 348 bytes. Gzip header is at least 18 bytes.
  if (filename.endsWith('.nii') && file.size < 348) {
    return {
      isValid: false,
      error: `File "${file.name}" is truncated (${file.size} bytes). Minimum valid uncompressed NIfTI header size is 348 bytes. File is incomplete or corrupted.`,
    };
  }

  if (filename.endsWith('.nii.gz') && file.size < 40) {
    return {
      isValid: false,
      error: `File "${file.name}" is too small (${file.size} bytes) to be a valid compressed NIfTI archive. File is incomplete or truncated.`,
    };
  }

  // 5. Exceeding maximum file limit
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File "${file.name}" exceeds the maximum 1 GB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please downsample or crop the volume before uploading.`,
    };
  }

  try {
    const rawBuffer = await file.arrayBuffer();
    const sha256 = await calculateSha256(rawBuffer);

    let niftiBuffer: ArrayBuffer = rawBuffer;

    // 6. Gzip decompression check
    if (nifti.isCompressed(rawBuffer)) {
      try {
        niftiBuffer = nifti.decompress(rawBuffer) as ArrayBuffer;
        if (!niftiBuffer || niftiBuffer.byteLength < 348) {
          return {
            isValid: false,
            error: `Decompressed data from "${file.name}" is truncated (${niftiBuffer ? niftiBuffer.byteLength : 0} bytes) and does not contain a valid NIfTI header (requires at least 348 bytes).`,
          };
        }
      } catch (decompErr: unknown) {
        const msg = decompErr instanceof Error ? decompErr.message : String(decompErr);
        return {
          isValid: false,
          error: `Gzip decompression failed for "${file.name}". The archive stream is corrupted or truncated: ${msg}`,
        };
      }
    }

    // 7. NIfTI binary signature (magic bytes) verification
    if (!nifti.isNIFTI(niftiBuffer)) {
      // Check magic bytes for non-NIfTI files disguised with .nii or .nii.gz extension
      const bytes = new Uint8Array(niftiBuffer.slice(0, Math.min(niftiBuffer.byteLength, 136)));
      let detectedDesc = '';
      if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
        detectedDesc = ' (Detected file type: PDF Document)';
      } else if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        detectedDesc = ' (Detected file type: PNG 2D Image)';
      } else if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        detectedDesc = ' (Detected file type: JPEG 2D Image)';
      } else if (bytes.length >= 132 && bytes[128] === 0x44 && bytes[129] === 0x49 && bytes[130] === 0x43 && bytes[131] === 0x4D) {
        detectedDesc = ' (Detected file type: DICOM Medical Image)';
      }

      return {
        isValid: false,
        error: `File "${file.name}"${detectedDesc} does not contain a valid NIfTI header signature ('n+1', 'ni1', or 'n+2' magic number missing). The file is not a valid 3D NIfTI volumetric MRI scan. Please upload standard .nii or .nii.gz neuroimaging data.`,
      };
    }

    // 8. Header parsing
    let header: nifti.NIFTI1 | nifti.NIFTI2 | null = null;
    try {
      header = nifti.readHeader(niftiBuffer);
    } catch (headErr: unknown) {
      const msg = headErr instanceof Error ? headErr.message : String(headErr);
      return {
        isValid: false,
        error: `Malformed NIfTI header in "${file.name}". Parser error: ${msg}`,
      };
    }

    if (!header) {
      return {
        isValid: false,
        error: `Failed to parse NIfTI header from "${file.name}". Header fields could not be deserialized.`,
      };
    }

    // 9. Matrix dimensions validation (3D volumetric requirement)
    const dims = header.dims || [];
    if (dims.length < 4 || dims[1] <= 1 || dims[2] <= 1 || dims[3] <= 1) {
      const found = dims.slice(1, 4).join('×') || '0×0×0';
      return {
        isValid: false,
        error: `Invalid 3D volume: "${file.name}" has matrix dimensions (${found}). NeuroScope requires a 3D volumetric MRI scan with depth (Z) > 1.`,
      };
    }

    // Dimension upper-bound safeguard (prevent out-of-memory browser crashes)
    if (dims[1] > 2048 || dims[2] > 2048 || dims[3] > 2048) {
      return {
        isValid: false,
        error: `Dimension threshold exceeded in "${file.name}": matrix (${dims[1]}×${dims[2]}×${dims[3]}) exceeds supported resolution threshold (max 2048 voxels per axis).`,
      };
    }

    const volumeDims: VolumeDimensions = {
      dimX: dims[1],
      dimY: dims[2],
      dimZ: dims[3],
    };

    // 10. Physical voxel spacing (pixdim) validation
    const pixDims = header.pixDims || [1, 1, 1, 1];
    const spacing: VoxelSpacing = {
      x: Number((pixDims[1] || 1).toFixed(3)),
      y: Number((pixDims[2] || 1).toFixed(3)),
      z: Number((pixDims[3] || 1).toFixed(3)),
    };

    if (
      spacing.x <= 0 ||
      spacing.y <= 0 ||
      spacing.z <= 0 ||
      !Number.isFinite(spacing.x) ||
      !Number.isFinite(spacing.y) ||
      !Number.isFinite(spacing.z)
    ) {
      return {
        isValid: false,
        error: `Invalid non-positive voxel spacing in "${file.name}": (${spacing.x}, ${spacing.y}, ${spacing.z}) mm. Voxel spacing values must be positive real numbers.`,
      };
    }

    // 11. Extract or compute orientation affine
    let affine: AffineMatrix;
    if (header.affine && Array.isArray(header.affine) && header.affine.length === 4) {
      affine = header.affine as AffineMatrix;
    } else {
      affine = [
        [spacing.x, 0, 0, -(volumeDims.dimX * spacing.x) / 2],
        [0, spacing.y, 0, -(volumeDims.dimY * spacing.y) / 2],
        [0, 0, spacing.z, -(volumeDims.dimZ * spacing.z) / 2],
        [0, 0, 0, 1],
      ];
    }

    // 12. Inspect voxel payload data (NaN, Infinity, All-zero, Truncated)
    let imageBuffer: ArrayBuffer | null = null;
    let typedData: Float32Array | Int16Array | Uint8Array | null = null;
    try {
      imageBuffer = nifti.readImage(header, niftiBuffer);
      if (!imageBuffer || imageBuffer.byteLength === 0) {
        return {
          isValid: false,
          error: `Missing voxel image payload in "${file.name}". NIfTI header was read, but the voxel data block is empty.`,
        };
      }

      // Check expected byte length
      const totalVoxels = volumeDims.dimX * volumeDims.dimY * volumeDims.dimZ;
      const bitsPerVoxel = header.numBitsPerVoxel || 16;
      const expectedMinBytes = Math.floor((totalVoxels * bitsPerVoxel) / 8);

      if (imageBuffer.byteLength < expectedMinBytes * 0.95) {
        return {
          isValid: false,
          error: `Truncated voxel payload in "${file.name}". Expected ~${expectedMinBytes.toLocaleString()} bytes for ${volumeDims.dimX}×${volumeDims.dimY}×${volumeDims.dimZ} matrix, but found only ${imageBuffer.byteLength.toLocaleString()} bytes. File is incomplete.`,
        };
      }

      if (header.datatypeCode === 2) {
        typedData = new Uint8Array(imageBuffer);
      } else if (header.datatypeCode === 4) {
        typedData = new Int16Array(imageBuffer);
      } else {
        typedData = new Float32Array(imageBuffer);
      }

      let nonZeroCount = 0;
      let hasNanOrInf = false;
      const totalSamples = Math.min(typedData.length, 10000);
      const step = Math.max(1, Math.floor(typedData.length / totalSamples));

      for (let s = 0; s < typedData.length; s += step) {
        const val = typedData[s];
        if (Number.isNaN(val) || !Number.isFinite(val)) {
          hasNanOrInf = true;
          break;
        }
        if (val !== 0) {
          nonZeroCount++;
        }
      }

      if (hasNanOrInf) {
        return {
          isValid: false,
          error: `File "${file.name}" contains corrupted floating-point voxel values (NaN or Infinity). Scan cannot be normalized or displayed.`,
        };
      }

      if (nonZeroCount === 0 && typedData.length > 0) {
        return {
          isValid: false,
          error: `File "${file.name}" is a blank volume containing all zeros. No anatomical brain tissue signal detected.`,
        };
      }
    } catch (readErr: unknown) {
      const msg = readErr instanceof Error ? readErr.message : String(readErr);
      return {
        isValid: false,
        error: `Failed to read voxel payload from "${file.name}": ${msg}`,
      };
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

  // Check for duplicate sequence files across slots
  const loadedWithHashes = sequences.filter(s => s.isLoaded && s.sha256);
  const seenHashes = new Map<string, string>();
  for (const seq of loadedWithHashes) {
    if (seenHashes.has(seq.sha256!)) {
      const existingSlot = seenHashes.get(seq.sha256!);
      errors.push(
        `Duplicate file detected: "${seq.filename}" in ${seq.sequenceType} is identical to the file in ${existingSlot} (SHA-256 match). Each sequence slot must receive a distinct MRI acquisition.`
      );
    } else {
      seenHashes.set(seq.sha256!, seq.sequenceType);
    }
  }

  // Expert ground truth mask cross-consistency with MRI volume
  const expertMaskSeq = sequences.find(s => s.sequenceType === 'EXPERT_MASK' && s.isLoaded && s.header);
  if (expertMaskSeq && loadedRequired.length > 0) {
    const maskDim = expertMaskSeq.header!.dimensions;
    if (maskDim.dimX !== baseDim.dimX || maskDim.dimY !== baseDim.dimY || maskDim.dimZ !== baseDim.dimZ) {
      errors.push(
        `Expert mask dimension mismatch: Mask is ${maskDim.dimX}×${maskDim.dimY}×${maskDim.dimZ}, but MRI scan is ${baseDim.dimX}×${baseDim.dimY}×${baseDim.dimZ}. Ground truth mask must match scan dimensions.`
      );
    }
  }

  return {
    isConsistent: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Parses and decodes a NIfTI mask buffer (such as model prediction.nii.gz downloaded from backend)
 * into a typed Uint8Array label array with associated geometry.
 */
export function parseNiftiMaskBuffer(rawBuffer: ArrayBuffer): {
  mask: Uint8Array;
  dimensions: VolumeDimensions;
  spacing: VoxelSpacing;
  affine: AffineMatrix;
} {
  let niftiBuffer: ArrayBuffer = rawBuffer;
  if (nifti.isCompressed(rawBuffer)) {
    niftiBuffer = nifti.decompress(rawBuffer) as ArrayBuffer;
  }
  if (!nifti.isNIFTI(niftiBuffer)) {
    throw new Error('Downloaded prediction buffer is not a valid NIfTI format');
  }

  const header = nifti.readHeader(niftiBuffer);
  if (!header) {
    throw new Error('Unable to read NIfTI header from prediction buffer');
  }

  const imageBuffer = nifti.readImage(header, niftiBuffer);
  if (!imageBuffer) {
    throw new Error('Empty image payload in prediction NIfTI buffer');
  }

  const dimensions: VolumeDimensions = {
    dimX: header.dims[1],
    dimY: header.dims[2],
    dimZ: header.dims[3],
  };

  const spacing: VoxelSpacing = {
    x: Math.abs(header.pixDims[1]) || 1.0,
    y: Math.abs(header.pixDims[2]) || 1.0,
    z: Math.abs(header.pixDims[3]) || 1.0,
  };

  let affine: AffineMatrix;
  if (header.affine && Array.isArray(header.affine) && header.affine.length === 4) {
    affine = header.affine as AffineMatrix;
  } else {
    affine = [
      [spacing.x, 0, 0, -(dimensions.dimX * spacing.x) / 2],
      [0, spacing.y, 0, -(dimensions.dimY * spacing.y) / 2],
      [0, 0, spacing.z, -(dimensions.dimZ * spacing.z) / 2],
      [0, 0, 0, 1],
    ];
  }

  // Convert raw image data to Uint8Array labels (0, 1, 2, 4)
  const totalVoxels = dimensions.dimX * dimensions.dimY * dimensions.dimZ;
  const mask = new Uint8Array(totalVoxels);

  if (header.datatypeCode === 2) {
    // uint8
    const src = new Uint8Array(imageBuffer);
    mask.set(src.subarray(0, totalVoxels));
  } else if (header.datatypeCode === 4) {
    // int16
    const src = new Int16Array(imageBuffer);
    for (let i = 0; i < totalVoxels; i++) {
      mask[i] = Math.max(0, Math.min(255, src[i]));
    }
  } else if (header.datatypeCode === 16) {
    // float32
    const src = new Float32Array(imageBuffer);
    for (let i = 0; i < totalVoxels; i++) {
      mask[i] = Math.max(0, Math.min(255, Math.round(src[i])));
    }
  } else {
    // generic byte view
    const src = new Uint8Array(imageBuffer);
    mask.set(src.subarray(0, totalVoxels));
  }

  return { mask, dimensions, spacing, affine };
}
