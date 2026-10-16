import { describe, it, expect } from 'vitest';
import {
  validateSequenceConsistency,
  validateNiftiFile,
  MAX_FILE_SIZE_BYTES,
} from '../src/utils/niftiValidation';
import { UploadedSequence } from '../src/types';
import * as pako from 'pako';

describe('NIfTI File & Sequence Consistency Validation (Judges Failure Pack)', () => {
  it('identifies maximum file size limit as 1 GB (1,073,741,824 bytes)', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(1024 * 1024 * 1024);
  });

  it('rejects unsupported file extensions (e.g. .dcm, .png, .txt)', async () => {
    const file = new File(['dummy content'], 'scan.dcm', { type: 'application/dicom' });
    const result = await validateNiftiFile(file);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Invalid file extension');
  });

  it('rejects empty (0 byte) files', async () => {
    const file = new File([], 'brain_t1.nii.gz');
    const result = await validateNiftiFile(file);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('is empty (0 bytes)');
  });

  it('rejects corrupt gzip files with clear error message', async () => {
    // Gzip magic number 0x1f, 0x8b followed by corrupt junk
    const corruptGzip = new Uint8Array([0x1f, 0x8b, 0x08, 0x00, 0xff, 0xff, 0xff, 0xff]);
    const file = new File([corruptGzip], 'corrupt.nii.gz');
    const result = await validateNiftiFile(file);
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects non-NIfTI files disguised with a .nii.gz extension', async () => {
    // Valid gzip archive containing plain text, not a NIfTI header
    const textData = new TextEncoder().encode('This is a plain text file, not a neuroimaging volume.');
    const compressed = pako.gzip(textData);
    const file = new File([compressed], 'fake_scan.nii.gz');
    const result = await validateNiftiFile(file);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('does not contain a valid NIfTI header');
  });

  it('detects missing sequences (e.g. only 3 of 4 required modalities loaded)', () => {
    const sequences: UploadedSequence[] = [
      {
        sequenceType: 'T1',
        file: null,
        filename: 't1.nii.gz',
        fileSize: 1000,
        isValid: true,
        isLoaded: true,
        header: {
          dimensions: { dimX: 240, dimY: 240, dimZ: 155 },
          spacing: { x: 1, y: 1, z: 1 },
          affine: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
          datatype: 16,
          bitsPerVoxel: 32,
          description: 'T1',
        },
      },
      {
        sequenceType: 'T1Gd',
        file: null,
        filename: 't1ce.nii.gz',
        fileSize: 1000,
        isValid: true,
        isLoaded: true,
        header: {
          dimensions: { dimX: 240, dimY: 240, dimZ: 155 },
          spacing: { x: 1, y: 1, z: 1 },
          affine: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
          datatype: 16,
          bitsPerVoxel: 32,
          description: 'T1Gd',
        },
      },
      {
        sequenceType: 'T2',
        file: null,
        filename: 't2.nii.gz',
        fileSize: 1000,
        isValid: true,
        isLoaded: true,
        header: {
          dimensions: { dimX: 240, dimY: 240, dimZ: 155 },
          spacing: { x: 1, y: 1, z: 1 },
          affine: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
          datatype: 16,
          bitsPerVoxel: 32,
          description: 'T2',
        },
      },
      // Missing FLAIR!
    ];

    const result = validateSequenceConsistency(sequences);
    expect(result.isConsistent).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes('Missing required sequence') && e.includes('FLAIR'))).toBe(true);
  });

  it('detects mismatched shapes across sequences', () => {
    const sequences: UploadedSequence[] = [
      {
        sequenceType: 'T1',
        file: null,
        filename: 't1.nii.gz',
        fileSize: 1000,
        isValid: true,
        isLoaded: true,
        header: {
          dimensions: { dimX: 240, dimY: 240, dimZ: 155 },
          spacing: { x: 1, y: 1, z: 1 },
          affine: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
          datatype: 16,
          bitsPerVoxel: 32,
          description: 'T1',
        },
      },
      {
        sequenceType: 'T1Gd',
        file: null,
        filename: 't1ce.nii.gz',
        fileSize: 1000,
        isValid: true,
        isLoaded: true,
        header: {
          dimensions: { dimX: 240, dimY: 240, dimZ: 155 },
          spacing: { x: 1, y: 1, z: 1 },
          affine: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
          datatype: 16,
          bitsPerVoxel: 32,
          description: 'T1Gd',
        },
      },
      {
        sequenceType: 'T2',
        file: null,
        filename: 't2.nii.gz',
        fileSize: 1000,
        isValid: true,
        isLoaded: true,
        header: {
          dimensions: { dimX: 256, dimY: 256, dimZ: 160 }, // MISMATCH!
          spacing: { x: 1, y: 1, z: 1 },
          affine: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
          datatype: 16,
          bitsPerVoxel: 32,
          description: 'T2',
        },
      },
      {
        sequenceType: 'FLAIR',
        file: null,
        filename: 'flair.nii.gz',
        fileSize: 1000,
        isValid: true,
        isLoaded: true,
        header: {
          dimensions: { dimX: 240, dimY: 240, dimZ: 155 },
          spacing: { x: 1, y: 1, z: 1 },
          affine: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
          datatype: 16,
          bitsPerVoxel: 32,
          description: 'FLAIR',
        },
      },
    ];

    const result = validateSequenceConsistency(sequences);
    expect(result.isConsistent).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Volume shape mismatch');
  });

  it('detects mismatched spatial affines across sequences', () => {
    const sequences: UploadedSequence[] = [
      {
        sequenceType: 'T1',
        file: null,
        filename: 't1.nii.gz',
        fileSize: 1000,
        isValid: true,
        isLoaded: true,
        header: {
          dimensions: { dimX: 240, dimY: 240, dimZ: 155 },
          spacing: { x: 1, y: 1, z: 1 },
          affine: [[1, 0, 0, -120], [0, 1, 0, -120], [0, 0, 1, -77], [0, 0, 0, 1]],
          datatype: 16,
          bitsPerVoxel: 32,
          description: 'T1',
        },
      },
      {
        sequenceType: 'T1Gd',
        file: null,
        filename: 't1ce.nii.gz',
        fileSize: 1000,
        isValid: true,
        isLoaded: true,
        header: {
          dimensions: { dimX: 240, dimY: 240, dimZ: 155 },
          spacing: { x: 1, y: 1, z: 1 },
          affine: [[1, 0, 0, -120], [0, 1, 0, -120], [0, 0, 1, -77], [0, 0, 0, 1]],
          datatype: 16,
          bitsPerVoxel: 32,
          description: 'T1Gd',
        },
      },
      {
        sequenceType: 'T2',
        file: null,
        filename: 't2.nii.gz',
        fileSize: 1000,
        isValid: true,
        isLoaded: true,
        header: {
          dimensions: { dimX: 240, dimY: 240, dimZ: 155 },
          spacing: { x: 1, y: 1, z: 1 },
          // Substantially different translation affine (not co-registered!)
          affine: [[1, 0, 0, 50], [0, 1, 0, 30], [0, 0, 1, 20], [0, 0, 0, 1]],
          datatype: 16,
          bitsPerVoxel: 32,
          description: 'T2',
        },
      },
      {
        sequenceType: 'FLAIR',
        file: null,
        filename: 'flair.nii.gz',
        fileSize: 1000,
        isValid: true,
        isLoaded: true,
        header: {
          dimensions: { dimX: 240, dimY: 240, dimZ: 155 },
          spacing: { x: 1, y: 1, z: 1 },
          affine: [[1, 0, 0, -120], [0, 1, 0, -120], [0, 0, 1, -77], [0, 0, 0, 1]],
          datatype: 16,
          bitsPerVoxel: 32,
          description: 'FLAIR',
        },
      },
    ];

    const result = validateSequenceConsistency(sequences);
    expect(result.isConsistent).toBe(false);
    expect(result.errors.some(e => e.includes('Spatial affine mismatch'))).toBe(true);
  });

  it('validates matching dimensions and affines across all 4 sequences successfully', () => {
    const baseAffine = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]] as any;
    const baseDim = { dimX: 240, dimY: 240, dimZ: 155 };
    const baseSpacing = { x: 1, y: 1, z: 1 };

    const sequences: UploadedSequence[] = (['T1', 'T1Gd', 'T2', 'FLAIR'] as const).map(type => ({
      sequenceType: type,
      file: null,
      filename: `${type.toLowerCase()}.nii.gz`,
      fileSize: 1000,
      isValid: true,
      isLoaded: true,
      header: {
        dimensions: baseDim,
        spacing: baseSpacing,
        affine: baseAffine,
        datatype: 16,
        bitsPerVoxel: 32,
        description: type,
      },
    }));

    const result = validateSequenceConsistency(sequences);
    expect(result.isConsistent).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('rejects DICOM files with dcm2niix conversion recommendation', async () => {
    const file = new File(['dummy dicom header'], 'brain_t1.dcm', { type: 'application/dicom' });
    const result = await validateNiftiFile(file);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('DICOM format detected');
    expect(result.error).toContain('dcm2niix');
  });

  it('rejects archive files with extraction guidance', async () => {
    const file = new File(['dummy zip bytes'], 'study_bundle.zip', { type: 'application/zip' });
    const result = await validateNiftiFile(file);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Compressed archive detected');
    expect(result.error).toContain('extract');
  });

  it('rejects 2D image formats with 3D volumetric requirement explanation', async () => {
    const pngFile = new File(['dummy png data'], 'slice.png', { type: 'image/png' });
    const result = await validateNiftiFile(pngFile);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('2D image format detected');
    expect(result.error).toContain('3D medical volumetric');
  });

  it('rejects truncated NIfTI files smaller than minimum header size', async () => {
    const file = new File([new Uint8Array(100)], 'broken.nii');
    const result = await validateNiftiFile(file);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('is truncated');
    expect(result.error).toContain('Minimum valid uncompressed NIfTI header size is 348 bytes');
  });

  it('detects duplicate files uploaded across different sequence slots', () => {
    const baseDim = { dimX: 240, dimY: 240, dimZ: 155 };
    const baseSpacing = { x: 1, y: 1, z: 1 };
    const baseAffine = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]] as any;

    const sequences: UploadedSequence[] = [
      {
        sequenceType: 'T1',
        file: null,
        filename: 't1_scan.nii.gz',
        fileSize: 1000,
        isValid: true,
        isLoaded: true,
        sha256: 'abc123def456789',
        header: { dimensions: baseDim, spacing: baseSpacing, affine: baseAffine, datatype: 16, bitsPerVoxel: 32, description: 'T1' },
      },
      {
        sequenceType: 'T1Gd',
        file: null,
        filename: 'duplicate_copy.nii.gz',
        fileSize: 1000,
        isValid: true,
        isLoaded: true,
        sha256: 'abc123def456789', // Exact same SHA-256 as T1!
        header: { dimensions: baseDim, spacing: baseSpacing, affine: baseAffine, datatype: 16, bitsPerVoxel: 32, description: 'T1Gd' },
      },
      {
        sequenceType: 'T2',
        file: null,
        filename: 't2.nii.gz',
        fileSize: 1000,
        isValid: true,
        isLoaded: true,
        sha256: 'xyz789t2',
        header: { dimensions: baseDim, spacing: baseSpacing, affine: baseAffine, datatype: 16, bitsPerVoxel: 32, description: 'T2' },
      },
      {
        sequenceType: 'FLAIR',
        file: null,
        filename: 'flair.nii.gz',
        fileSize: 1000,
        isValid: true,
        isLoaded: true,
        sha256: 'flair001',
        header: { dimensions: baseDim, spacing: baseSpacing, affine: baseAffine, datatype: 16, bitsPerVoxel: 32, description: 'FLAIR' },
      },
    ];

    const result = validateSequenceConsistency(sequences);
    expect(result.isConsistent).toBe(false);
    expect(result.errors.some(e => e.includes('Duplicate file detected'))).toBe(true);
  });

  it('detects dimension mismatch between Expert Mask and MRI volume', () => {
    const baseDim = { dimX: 240, dimY: 240, dimZ: 155 };
    const baseSpacing = { x: 1, y: 1, z: 1 };
    const baseAffine = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]] as any;

    const sequences: UploadedSequence[] = [
      {
        sequenceType: 'T1',
        file: null,
        filename: 't1.nii.gz',
        fileSize: 1000,
        isValid: true,
        isLoaded: true,
        header: { dimensions: baseDim, spacing: baseSpacing, affine: baseAffine, datatype: 16, bitsPerVoxel: 32, description: 'T1' },
      },
      {
        sequenceType: 'T1Gd',
        file: null,
        filename: 't1ce.nii.gz',
        fileSize: 1000,
        isValid: true,
        isLoaded: true,
        header: { dimensions: baseDim, spacing: baseSpacing, affine: baseAffine, datatype: 16, bitsPerVoxel: 32, description: 'T1Gd' },
      },
      {
        sequenceType: 'T2',
        file: null,
        filename: 't2.nii.gz',
        fileSize: 1000,
        isValid: true,
        isLoaded: true,
        header: { dimensions: baseDim, spacing: baseSpacing, affine: baseAffine, datatype: 16, bitsPerVoxel: 32, description: 'T2' },
      },
      {
        sequenceType: 'FLAIR',
        file: null,
        filename: 'flair.nii.gz',
        fileSize: 1000,
        isValid: true,
        isLoaded: true,
        header: { dimensions: baseDim, spacing: baseSpacing, affine: baseAffine, datatype: 16, bitsPerVoxel: 32, description: 'FLAIR' },
      },
      {
        sequenceType: 'EXPERT_MASK',
        file: null,
        filename: 'wrong_size_mask.nii.gz',
        fileSize: 500,
        isValid: true,
        isLoaded: true,
        header: {
          dimensions: { dimX: 128, dimY: 128, dimZ: 96 }, // Mismatched matrix!
          spacing: { x: 1, y: 1, z: 1 },
          affine: baseAffine,
          datatype: 2,
          bitsPerVoxel: 8,
          description: 'MASK',
        },
      },
    ];

    const result = validateSequenceConsistency(sequences);
    expect(result.isConsistent).toBe(false);
    expect(result.errors.some(e => e.includes('Expert mask dimension mismatch'))).toBe(true);
  });

  it('rejects archive files (.zip, .tar.gz) with clear extraction instructions', async () => {
    const file = new File(['dummy archive content'], 'patient_scans.zip', { type: 'application/zip' });
    const result = await validateNiftiFile(file);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Compressed archive detected');
    expect(result.error).toContain('Please extract the archive');
  });

  it('rejects 2D images (.jpg, .png) with medical 3D volumetric guidance', async () => {
    const file = new File(['dummy png content'], 'slice_axial.png', { type: 'image/png' });
    const result = await validateNiftiFile(file);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('2D image format detected');
    expect(result.error).toContain('NeuroScope requires 3D medical volumetric MRI scans');
  });

  it('rejects document files (.pdf, .txt) with clear non-imaging guidance', async () => {
    const file = new File(['clinical notes'], 'radiology_report.pdf', { type: 'application/pdf' });
    const result = await validateNiftiFile(file);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Non-imaging document detected');
  });

  it('rejects truncated uncompressed .nii files smaller than 348 bytes', async () => {
    const file = new File([new Uint8Array(120)], 'truncated_scan.nii');
    const result = await validateNiftiFile(file);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('is truncated (120 bytes)');
    expect(result.error).toContain('Minimum valid uncompressed NIfTI header size is 348 bytes');
  });

  it('rejects truncated compressed .nii.gz files smaller than 40 bytes', async () => {
    const file = new File([new Uint8Array(20)], 'truncated_archive.nii.gz');
    const result = await validateNiftiFile(file);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('is too small (20 bytes) to be a valid compressed NIfTI archive');
  });
});

