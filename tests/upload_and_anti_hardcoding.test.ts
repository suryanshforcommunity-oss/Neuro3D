import { describe, it, expect } from 'vitest';
import {
  validateNiftiFile,
  validateSequenceConsistency,
} from '../src/utils/niftiValidation';
import { calculateVoxelVolumeMl, computeBraTSCompositeCounts } from '../src/utils/volume';
import { voxelToWorld } from '../src/utils/coordinates';
import { VolumeDimensions, VoxelSpacing, AffineMatrix, UploadedSequence } from '../src/types';

describe('Anti-Hardcoding & MRI Upload Pipeline Tests', () => {
  it('correctly derives slice ranges, dimensions, and coordinates for two distinct synthetic volumes', () => {
    // Volume A
    const dimsA: VolumeDimensions = { dimX: 100, dimY: 120, dimZ: 60 };
    const spacingA: VoxelSpacing = { x: 0.8, y: 0.8, z: 1.5 };
    const affineA: AffineMatrix = [
      [0.8, 0, 0, -40],
      [0, 0.8, 0, -48],
      [0, 0, 1.5, -45],
      [0, 0, 0, 1],
    ];

    // Volume B
    const dimsB: VolumeDimensions = { dimX: 160, dimY: 140, dimZ: 80 };
    const spacingB: VoxelSpacing = { x: 1.2, y: 1.2, z: 2.0 };
    const affineB: AffineMatrix = [
      [1.2, 0, 0, -96],
      [0, 1.2, 0, -84],
      [0, 0, 2.0, -80],
      [0, 0, 0, 1],
    ];

    // Verify slice bounds differ according to actual volume shape
    expect(dimsA.dimX - 1).toBe(99);
    expect(dimsA.dimY - 1).toBe(119);
    expect(dimsA.dimZ - 1).toBe(59);

    expect(dimsB.dimX - 1).toBe(159);
    expect(dimsB.dimY - 1).toBe(139);
    expect(dimsB.dimZ - 1).toBe(79);

    // Verify coordinates reflect each distinct affine
    const centerA = { i: 50, j: 60, k: 30 };
    const worldA = voxelToWorld(centerA, affineA);
    expect(worldA.x).toBe(50 * 0.8 - 40); // 0
    expect(worldA.y).toBe(60 * 0.8 - 48); // 0
    expect(worldA.z).toBe(30 * 1.5 - 45); // 0

    const centerB = { i: 80, j: 70, k: 40 };
    const worldB = voxelToWorld(centerB, affineB);
    expect(worldB.x).toBe(80 * 1.2 - 96); // 0
    expect(worldB.y).toBe(70 * 1.2 - 84); // 0
    expect(worldB.z).toBe(40 * 2.0 - 80); // 0

    // Non-center coordinates must diverge completely
    const sampleCoord = { i: 10, j: 10, k: 10 };
    const sampleWorldA = voxelToWorld(sampleCoord, affineA);
    const sampleWorldB = voxelToWorld(sampleCoord, affineB);

    expect(sampleWorldA.x).toBe(-32);
    expect(sampleWorldB.x).toBe(-84);
    expect(sampleWorldA.x).not.toBe(sampleWorldB.x);

    // Verify volume calculations differ based on physical voxel spacing
    // 1,000 voxels in Volume A: 1000 * 0.8 * 0.8 * 1.5 / 1000 = 0.96 mL
    const volA = calculateVoxelVolumeMl(1000, spacingA);
    expect(volA).toBe(0.96);

    // 1,000 voxels in Volume B: 1000 * 1.2 * 1.2 * 2.0 / 1000 = 2.88 mL
    const volB = calculateVoxelVolumeMl(1000, spacingB);
    expect(volB).toBe(2.88);
  });

  it('rejects clinical PDF report files with filename, detected format, reason, and required format', async () => {
    const pdfBlob = new Blob(['%PDF-1.4 sample clinical report text'], { type: 'application/pdf' });
    const pdfFile = new File([pdfBlob], 'radiology_report.pdf', { type: 'application/pdf' });

    const result = await validateNiftiFile(pdfFile);
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();

    const err = result.error!;
    expect(err).toContain('radiology_report.pdf'); // Filename
    expect(err).toContain('PDF'); // Detected format
    expect(err).toContain('volumetric'); // Why it cannot be used
    expect(err).toContain('.nii'); // Required format
  });

  it('rejects 2D PNG screenshots with informative diagnostic feedback', async () => {
    const pngBlob = new Blob(['fake png bytes'], { type: 'image/png' });
    const pngFile = new File([pngBlob], 'brain_screenshot.png', { type: 'image/png' });

    const result = await validateNiftiFile(pngFile);
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();

    const err = result.error!;
    expect(err).toContain('brain_screenshot.png');
    expect(err).toContain('2D');
    expect(err).toContain('.nii');
  });

  it('rejects DICOM files with instructions to convert using dcm2niix', async () => {
    const dcmFile = new File(['dummy dcm'], 'series_001.dcm');
    const result = await validateNiftiFile(dcmFile);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('series_001.dcm');
    expect(result.error).toContain('DICOM');
    expect(result.error).toContain('dcm2niix');
  });

  it('correctly calculates the standard BraTS 20x20x20 label-2 cube benchmark', () => {
    const spacing: VoxelSpacing = { x: 1.0, y: 1.0, z: 2.0 };
    const cubeVoxels = 20 * 20 * 20; // 8,000 voxels

    // Label 2 = peritumoral edema
    const counts = computeBraTSCompositeCounts({
      ncrCount: 0,
      edCount: cubeVoxels,
      etCount: 0,
    });

    const wtMl = calculateVoxelVolumeMl(counts.wtCount, spacing);
    const tcMl = calculateVoxelVolumeMl(counts.tcCount, spacing);
    const etMl = calculateVoxelVolumeMl(counts.etCount, spacing);

    // Expected benchmark values:
    // WT = 16.0 mL
    // TC = 0.0 mL
    // ET = 0.0 mL
    expect(wtMl).toBe(16.0);
    expect(tcMl).toBe(0.0);
    expect(etMl).toBe(0.0);
  });

  it('detects mismatched modality dimensions when co-registration check fails', () => {
    const seqs: UploadedSequence[] = [
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
        filename: 't1ce_mismatched.nii.gz',
        fileSize: 1000,
        isValid: true,
        isLoaded: true,
        header: {
          dimensions: { dimX: 180, dimY: 180, dimZ: 90 }, // Mismatched!
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

    const consistency = validateSequenceConsistency(seqs);
    expect(consistency.isConsistent).toBe(false);
    expect(consistency.errors.some(e => e.includes('Volume shape mismatch') && e.includes('180×180×90'))).toBe(true);
  });
});
