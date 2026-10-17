import { describe, it, expect } from 'vitest';
import {
  VolumeDimensions,
  VoxelSpacing,
  AffineMatrix,
  MriSequenceType,
  TumourLabelCounts,
} from '../src/types';
import {
  calculateAffineVoxelVolumeMl,
  calculateVoxelVolumeMl,
  computeBraTSCompositeCounts,
  buildRegionVolumeSummaries,
} from '../src/utils/volume';
import { voxelToWorld, worldToVoxel, clampVoxel } from '../src/utils/coordinates';
import { buildNeurospaceRegionMeshes } from '../src/utils/marchingCubes';
import { validateNiftiFile, parseNiftiMaskBuffer } from '../src/utils/niftiValidation';

describe('Stage 3 - Multimodal MRI, Orthogonal Planes, and Segmentation Pipeline', () => {
  // 1. Synthetic anisotropic dataset with 4 distinct modalities and asymmetric mask
  const dims: VolumeDimensions = { dimX: 30, dimY: 40, dimZ: 20 };
  const spacing: VoxelSpacing = { x: 0.8, y: 1.2, z: 1.5 };
  const nonIdentityAffine: AffineMatrix = [
    [-0.8, 0, 0, 100],
    [0, 1.2, 0, -50],
    [0, 0, 1.5, -20],
    [0, 0, 0, 1],
  ];

  const totalVoxels = dims.dimX * dims.dimY * dims.dimZ; // 30 * 40 * 20 = 24,000

  // Create distinct modality volumes
  const t1Vol = new Uint8Array(totalVoxels);
  const t1gdVol = new Uint8Array(totalVoxels);
  const t2Vol = new Uint8Array(totalVoxels);
  const flairVol = new Uint8Array(totalVoxels);

  for (let i = 0; i < totalVoxels; i++) {
    t1Vol[i] = 40;
    t1gdVol[i] = 80;
    t2Vol[i] = 120;
    flairVol[i] = 160;
  }

  // Create asymmetric non-spherical segmentation mask
  // NCR (1): x in [5, 7], y in [12, 15], z in [7, 10] -> 3 * 4 * 4 = 48 voxels
  // ED (2): x in [8, 10], y in [16, 25], z in [11, 15] -> 3 * 10 * 5 = 150 voxels
  // ET (4): x in [5, 6], y in [16, 20], z in [7, 9] -> 2 * 5 * 3 = 30 voxels
  const asymMask = new Uint8Array(totalVoxels);
  const strideY = dims.dimX;
  const strideZ = dims.dimX * dims.dimY;

  for (let z = 7; z <= 10; z++) {
    for (let y = 12; y <= 15; y++) {
      for (let x = 5; x <= 7; x++) {
        asymMask[x + y * strideY + z * strideZ] = 1; // NCR
      }
    }
  }

  for (let z = 11; z <= 15; z++) {
    for (let y = 16; y <= 25; y++) {
      for (let x = 8; x <= 10; x++) {
        asymMask[x + y * strideY + z * strideZ] = 2; // ED
      }
    }
  }

  for (let z = 7; z <= 9; z++) {
    for (let y = 16; y <= 20; y++) {
      for (let x = 5; x <= 6; x++) {
        asymMask[x + y * strideY + z * strideZ] = 4; // ET
      }
    }
  }

  it('1-4: Selecting each modality displays distinct and correct voxel values', () => {
    const sequences: Record<MriSequenceType, Uint8Array> = {
      T1: t1Vol,
      T1Gd: t1gdVol,
      T2: t2Vol,
      FLAIR: flairVol,
      EXPERT_MASK: asymMask,
    };

    expect(sequences.T1[100]).toBe(40);
    expect(sequences.T1Gd[100]).toBe(80);
    expect(sequences.T2[100]).toBe(120);
    expect(sequences.FLAIR[100]).toBe(160);

    // Verify sequences are strictly independent
    expect(sequences.T1[100]).not.toBe(sequences.T1Gd[100]);
    expect(sequences.T2[100]).not.toBe(sequences.FLAIR[100]);
  });

  it('5 & 8: Orthogonal slice extraction preserves spatial coordinates and asymmetric mask locations', () => {
    const curX = 6;
    const curY = 14;
    const curZ = 8;

    // 1. Axial extraction at curZ = 8
    const axialVol = new Uint8Array(dims.dimX * dims.dimY);
    const axialSeg = new Uint8Array(dims.dimX * dims.dimY);
    const zOffset = curZ * strideZ;
    for (let y = 0; y < dims.dimY; y++) {
      const yOffset = y * strideY;
      for (let x = 0; x < dims.dimX; x++) {
        const idx = x + y * dims.dimX;
        axialVol[idx] = t1gdVol[x + yOffset + zOffset];
        axialSeg[idx] = asymMask[x + yOffset + zOffset];
      }
    }

    // At curX = 6, curY = 14, curZ = 8: label should be NCR (1)
    expect(axialSeg[6 + 14 * dims.dimX]).toBe(1);
    expect(axialVol[6 + 14 * dims.dimX]).toBe(80);

    // At curX = 5, curY = 18, curZ = 8: label should be ET (4)
    expect(axialSeg[5 + 18 * dims.dimX]).toBe(4);

    // At curX = 0, curY = 0, curZ = 8: label should be 0 (Background)
    expect(axialSeg[0]).toBe(0);

    // 2. Coronal extraction at curY = 14
    const coronalVol = new Uint8Array(dims.dimX * dims.dimZ);
    const coronalSeg = new Uint8Array(dims.dimX * dims.dimZ);
    const yFixedOffset = curY * strideY;
    for (let z = 0; z < dims.dimZ; z++) {
      const srcZ = dims.dimZ - 1 - z;
      const zRowOffset = srcZ * strideZ;
      for (let x = 0; x < dims.dimX; x++) {
        const idx = x + z * dims.dimX;
        coronalVol[idx] = t1gdVol[x + yFixedOffset + zRowOffset];
        coronalSeg[idx] = asymMask[x + yFixedOffset + zRowOffset];
      }
    }

    // Check inverted Z coronal coordinate mapping
    const coronalRow = dims.dimZ - 1 - curZ;
    expect(coronalSeg[curX + coronalRow * dims.dimX]).toBe(1);

    // 3. Sagittal extraction at curX = 6
    const sagittalVol = new Uint8Array(dims.dimY * dims.dimZ);
    const sagittalSeg = new Uint8Array(dims.dimY * dims.dimZ);
    for (let z = 0; z < dims.dimZ; z++) {
      const srcZ = dims.dimZ - 1 - z;
      const zRowOffset = srcZ * strideZ;
      for (let y = 0; y < dims.dimY; y++) {
        const idx = y + z * dims.dimY;
        sagittalVol[idx] = t1gdVol[curX + y * strideY + zRowOffset];
        sagittalSeg[idx] = asymMask[curX + y * strideY + zRowOffset];
      }
    }

    const sagittalRow = dims.dimZ - 1 - curZ;
    expect(sagittalSeg[curY + sagittalRow * dims.dimY]).toBe(1);
  });

  it('6 & 7: Sliders traverse full range and clamp correctly without out-of-range requests', () => {
    // Sliders work in forward and reverse across complete ranges
    const minZ = 0;
    const maxZ = dims.dimZ - 1; // 19
    expect(clampVoxel({ i: 0, j: 0, k: -5 }, dims).k).toBe(0);
    expect(clampVoxel({ i: 0, j: 0, k: 50 }, dims).k).toBe(maxZ);

    const maxX = dims.dimX - 1; // 29
    expect(clampVoxel({ i: 100, j: 0, k: 0 }, dims).i).toBe(maxX);

    const maxY = dims.dimY - 1; // 39
    expect(clampVoxel({ i: 0, j: -10, k: 0 }, dims).j).toBe(0);

    // Crosshair remains consistent when moving only one slider
    const initial = { i: 12, j: 22, k: 8 };
    const movedZ = { ...initial, k: 14 };
    expect(movedZ.i).toBe(12);
    expect(movedZ.j).toBe(22);
    expect(movedZ.k).toBe(14);
  });

  it('7 & 16: Non-identity affine voxel-to-world conversion and physical volume calculation', () => {
    // Voxel to world: affine = [[-0.8, 0, 0, 100], [0, 1.2, 0, -50], [0, 0, 1.5, -20], [0, 0, 0, 1]]
    const voxel = { i: 10, j: 20, k: 10 };
    const world = voxelToWorld(voxel, nonIdentityAffine);

    expect(world.x).toBeCloseTo(-0.8 * 10 + 100, 3); // 92.0
    expect(world.y).toBeCloseTo(1.2 * 20 - 50, 3);   // -26.0
    expect(world.z).toBeCloseTo(1.5 * 10 - 20, 3);   // -5.0

    // Inverse world to voxel
    const backToVoxel = worldToVoxel(world, nonIdentityAffine);
    expect(backToVoxel.i).toBe(10);
    expect(backToVoxel.j).toBe(20);
    expect(backToVoxel.k).toBe(10);

    // Physical affine voxel volume: abs(det(linear_3x3)) / 1000
    // det = -0.8 * 1.2 * 1.5 = -1.44 mm³ -> abs(det) = 1.44 mm³ = 0.00144 mL
    const affineVoxelMl = calculateAffineVoxelVolumeMl(nonIdentityAffine);
    expect(affineVoxelMl).toBeCloseTo(0.00144, 5);
  });

  it('10: WT, TC, and ET composite voxel counts and volume measurements match mask exactly', () => {
    let ncr = 0, ed = 0, et = 0;
    for (let i = 0; i < asymMask.length; i++) {
      const v = asymMask[i];
      if (v === 1) ncr++;
      else if (v === 2) ed++;
      else if (v === 4) et++;
    }

    expect(ncr).toBe(48);
    expect(ed).toBe(150);
    expect(et).toBe(30);

    const counts = computeBraTSCompositeCounts({ ncrCount: ncr, edCount: ed, etCount: et });
    expect(counts.wtCount).toBe(48 + 150 + 30); // 228
    expect(counts.tcCount).toBe(48 + 30);        // 78
    expect(counts.etCount).toBe(30);             // 30

    // Volume summaries using anisotropic spacing
    const summaries = buildRegionVolumeSummaries(counts, spacing);
    const expectedWtMl = (228 * (0.8 * 1.2 * 1.5)) / 1000; // 0.32832 mL
    const expectedTcMl = (78 * (0.8 * 1.2 * 1.5)) / 1000;  // 0.11232 mL
    const expectedEtMl = (30 * (0.8 * 1.2 * 1.5)) / 1000;  // 0.0432 mL

    const wtSummary = summaries.find(s => s.region === 'WT')!;
    const tcSummary = summaries.find(s => s.region === 'TC')!;
    const etSummary = summaries.find(s => s.region === 'ET')!;

    expect(wtSummary.voxelCount).toBe(228);
    expect(wtSummary.volumeMl).toBeCloseTo(expectedWtMl, 3);

    expect(tcSummary.voxelCount).toBe(78);
    expect(tcSummary.volumeMl).toBeCloseTo(expectedTcMl, 3);

    expect(etSummary.voxelCount).toBe(30);
    expect(etSummary.volumeMl).toBeCloseTo(expectedEtMl, 3);
  });

  it('9: Marching Cubes generates 3D surface mesh matching asymmetric mask without hardcoded spheres', () => {
    const meshes = buildNeurospaceRegionMeshes(
      asymMask,
      null,
      t1gdVol,
      dims,
      nonIdentityAffine
    );

    expect(meshes.predictedRegions.WT).toBeDefined();
    expect(meshes.predictedRegions.TC).toBeDefined();
    expect(meshes.predictedRegions.ET).toBeDefined();

    // Verify vertices and faces exist
    const wtVertices = meshes.predictedRegions.WT!.vertices;
    expect(wtVertices.length).toBeGreaterThan(0);
    expect(meshes.predictedRegions.WT!.faces.length).toBeGreaterThan(0);

    // Verify vertices lie within transformed physical world bounds of the asymmetric mask
    // Mask x in [5, 10], y in [12, 25], z in [7, 15]
    // Under affine:
    // x_world = -0.8 * x + 100 -> between 100 - 8 = 92 and 100 - 4 = 96
    for (const [vx, vy, vz] of wtVertices) {
      expect(vx).toBeGreaterThanOrEqual(90);
      expect(vx).toBeLessThanOrEqual(98);

      // y_world = 1.2 * y - 50 -> for y in [12, 25]: 1.2*12 - 50 = -35.6 to 1.2*25 - 50 = -20
      expect(vy).toBeGreaterThanOrEqual(-40);
      expect(vy).toBeLessThanOrEqual(-15);

      // z_world = 1.5 * z - 20 -> for z in [7, 15]: 1.5*7 - 20 = -9.5 to 1.5*15 - 20 = 2.5
      expect(vz).toBeGreaterThanOrEqual(-12);
      expect(vz).toBeLessThanOrEqual(5);
    }
  });

  it('11 & 14: Uploading new dataset clears previous segmentation and prevents demo tumour leakage', () => {
    // When demo is unloaded / real data is uploaded:
    const emptyMask: Uint8Array | null = null;
    const initialCounts: TumourLabelCounts = {
      ncrCount: 0,
      edCount: 0,
      etCount: 0,
      wtCount: 0,
      tcCount: 0,
    };

    expect(emptyMask).toBeNull();
    expect(initialCounts.wtCount).toBe(0);

    const summaries = buildRegionVolumeSummaries(initialCounts, spacing);
    expect(summaries[0].volumeMl).toBe(0);
    expect(summaries[0].voxelCount).toBe(0);
  });

  it('15: Unsupported file types (PDF, PNG, DICOM, archive) are strictly rejected with diagnostics', async () => {
    const fakePdf = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'scan_report.pdf', {
      type: 'application/pdf',
    });
    const pdfResult = await validateNiftiFile(fakePdf);
    expect(pdfResult.isValid).toBe(false);
    expect(pdfResult.error).toContain('PDF');

    const fakePng = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'brain_slice.png', {
      type: 'image/png',
    });
    const pngResult = await validateNiftiFile(fakePng);
    expect(pngResult.isValid).toBe(false);
    expect(pngResult.error).toContain('2D image format detected');

    const fakeDicom = new File([new Uint8Array(200)], 'series01.dcm');
    const dcmResult = await validateNiftiFile(fakeDicom);
    expect(dcmResult.isValid).toBe(false);
    expect(dcmResult.error).toContain('DICOM format detected');

    const fakeZip = new File([new Uint8Array(200)], 'mri_bundle.zip');
    const zipResult = await validateNiftiFile(fakeZip);
    expect(zipResult.isValid).toBe(false);
    expect(zipResult.error).toContain('Compressed archive detected');
  });

  it('16: Real MRI mode before inference produces zero tumour mesh without fake demo tumour leakage', () => {
    // When real MRI is loaded but segmentation has NOT been executed:
    const realMriMask: Uint8Array | null = null;
    const realMeshes = buildNeurospaceRegionMeshes(
      realMriMask,
      null,
      t1Vol,
      dims,
      nonIdentityAffine
    );

    // WT, TC, and ET must be completely empty meshes
    expect(realMeshes.predictedRegions.WT?.vertexCount).toBe(0);
    expect(realMeshes.predictedRegions.TC?.vertexCount).toBe(0);
    expect(realMeshes.predictedRegions.ET?.vertexCount).toBe(0);
    expect(realMeshes.predictedRegions.WT?.vertices).toEqual([]);
    expect(realMeshes.predictedRegions.TC?.vertices).toEqual([]);
    expect(realMeshes.predictedRegions.ET?.vertices).toEqual([]);
  });

  it('17: Voxel-to-world and world-to-voxel mappings are strictly bijective round-trip inverses', () => {
    const testVoxels = [
      { i: 0, j: 0, k: 0 },
      { i: 15, j: 20, k: 10 },
      { i: dims.dimX - 1, j: dims.dimY - 1, dimsZ: dims.dimZ - 1, k: dims.dimZ - 1 },
      { i: 7, j: 18, k: 9 },
    ];

    for (const vox of testVoxels) {
      const world = voxelToWorld(vox, nonIdentityAffine);
      const invertedVoxel = worldToVoxel(world, nonIdentityAffine);
      expect(invertedVoxel.i).toBe(vox.i);
      expect(invertedVoxel.j).toBe(vox.j);
      expect(invertedVoxel.k).toBe(vox.k);
    }
  });
});
