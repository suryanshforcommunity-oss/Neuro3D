import { describe, it, expect } from 'vitest';
import { calculateVoxelVolumeMl, computeBraTSCompositeCounts, buildRegionVolumeSummaries } from '../src/utils/volume';
import { VoxelSpacing } from '../src/types';

describe('Volume Calculation & BraTS Nested Regions', () => {
  /**
   * Official test cube specified in requirements:
   * 20 × 20 × 20 voxels, spacing 1 × 1 × 2 mm, label 2 (Peritumoral Edema).
   * 
   * Calculations:
   * Total voxels = 20 * 20 * 20 = 8,000 voxels
   * Voxel volume = 1 mm * 1 mm * 2 mm = 2 mm³
   * Total mm³ = 8,000 * 2 = 16,000 mm³
   * In mL = 16,000 / 1000 = 16.0 mL
   * 
   * BraTS composite rules:
   * WT = NCR + ED + ET -> includes ED -> WT = 16.0 mL
   * TC = NCR + ET -> ED is NOT in TC -> TC = 0 mL
   * ET = ET -> label 4 only -> ET = 0 mL
   */
  it('correctly calculates the official test cube (20x20x20 voxels, 1x1x2 mm, label 2)', () => {
    const spacing: VoxelSpacing = { x: 1.0, y: 1.0, z: 2.0 };
    const voxelCount = 20 * 20 * 20; // 8,000

    // Only label 2 (ED) has voxels
    const counts = computeBraTSCompositeCounts({
      ncrCount: 0,
      edCount: voxelCount,
      etCount: 0,
    });

    expect(counts.wtCount).toBe(8000);
    expect(counts.tcCount).toBe(0);
    expect(counts.etCount).toBe(0);

    const wtVolume = calculateVoxelVolumeMl(counts.wtCount, spacing);
    const tcVolume = calculateVoxelVolumeMl(counts.tcCount, spacing);
    const etVolume = calculateVoxelVolumeMl(counts.etCount, spacing);

    expect(wtVolume).toBe(16.0);
    expect(tcVolume).toBe(0.0);
    expect(etVolume).toBe(0.0);
  });

  it('correctly compiles nested BraTS labels (NCR=1, ED=2, ET=4)', () => {
    // 1000 NCR, 2000 ED, 500 ET
    const counts = computeBraTSCompositeCounts({
      ncrCount: 1000,
      edCount: 2000,
      etCount: 500,
    });

    expect(counts.wtCount).toBe(3500); // 1000 + 2000 + 500
    expect(counts.tcCount).toBe(1500); // 1000 + 500
    expect(counts.etCount).toBe(500);  // 500
  });

  it('handles isotropic 1mm spacing', () => {
    const spacing: VoxelSpacing = { x: 1.0, y: 1.0, z: 1.0 };
    const volume = calculateVoxelVolumeMl(1000, spacing);
    expect(volume).toBe(1.0); // 1000 * 1mm³ / 1000 = 1 mL
  });

  it('handles arbitrary anisotropic voxel spacing', () => {
    const spacing: VoxelSpacing = { x: 0.5, y: 0.5, z: 1.5 };
    // 0.5 * 0.5 * 1.5 = 0.375 mm³ per voxel
    // 4000 voxels * 0.375 mm³ = 1500 mm³ = 1.5 mL
    const volume = calculateVoxelVolumeMl(4000, spacing);
    expect(volume).toBe(1.5);
  });

  it('throws an error for non-positive voxel spacing', () => {
    expect(() => calculateVoxelVolumeMl(100, { x: 0, y: 1, z: 1 })).toThrow();
    expect(() => calculateVoxelVolumeMl(100, { x: 1, y: -0.5, z: 1 })).toThrow();
  });

  it('calculates differences against expert mask when provided', () => {
    const spacing: VoxelSpacing = { x: 1.0, y: 1.0, z: 1.0 };
    const predCounts = computeBraTSCompositeCounts({ ncrCount: 1000, edCount: 1000, etCount: 1000 }); // WT: 3000 mL
    const expertCounts = computeBraTSCompositeCounts({ ncrCount: 800, edCount: 1000, etCount: 1000 }); // WT: 2800 mL

    const summaries = buildRegionVolumeSummaries(predCounts, spacing, expertCounts);
    const wtSummary = summaries.find(s => s.region === 'WT')!;

    expect(wtSummary.volumeMl).toBe(3.0);
    expect(wtSummary.expertVolumeMl).toBe(2.8);
    expect(wtSummary.differenceMl).toBe(0.2);
    expect(wtSummary.differencePercentage).toBeCloseTo(7.14, 1);
  });
});
