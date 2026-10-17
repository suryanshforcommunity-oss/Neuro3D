import { describe, it, expect } from 'vitest';
import {
  extractSurfaceMesh,
  voxelToWorld,
  generateCorticalBrainMesh,
  buildNeurospaceRegionMeshes,
} from '../src/utils/marchingCubes';
import { VolumeDimensions, AffineMatrix } from '../src/types';

describe('marchingCubes and Surface Mesh Extraction', () => {
  const dims: VolumeDimensions = { dimX: 16, dimY: 16, dimZ: 16 };
  const affine: AffineMatrix = [
    [1, 0, 0, -8],
    [0, 1, 0, -8],
    [0, 0, 1, -8],
    [0, 0, 0, 1],
  ];

  it('correctly maps voxel coordinates to physical world coordinates using affine', () => {
    const world = voxelToWorld(8, 8, 8, affine);
    expect(world).toEqual([0, 0, 0]);

    const corner = voxelToWorld(0, 0, 0, affine);
    expect(corner).toEqual([-8, -8, -8]);
  });

  it('returns empty mesh when input mask is empty or zero', () => {
    const emptyMask = new Uint8Array(16 * 16 * 16);
    const mesh = extractSurfaceMesh(emptyMask, dims, affine, val => val > 0);
    expect(mesh.vertexCount).toBe(0);
    expect(mesh.faceCount).toBe(0);
    expect(mesh.vertices).toEqual([]);
    expect(mesh.faces).toEqual([]);
  });

  it('extracts valid boundary surface faces and vertices from a cubic lesion', () => {
    const mask = new Uint8Array(16 * 16 * 16);
    // Create a 4x4x4 cube of label 4 (Enhancing Tumour) centered in the volume
    for (let z = 6; z < 10; z++) {
      for (let y = 6; y < 10; y++) {
        for (let x = 6; x < 10; x++) {
          mask[x + y * 16 + z * 256] = 4;
        }
      }
    }

    const mesh = extractSurfaceMesh(mask, dims, affine, val => val === 4);
    expect(mesh.vertexCount).toBeGreaterThan(0);
    expect(mesh.faceCount).toBeGreaterThan(0);
    // Every face must be a valid triangle of 3 vertex indices
    for (const face of mesh.faces) {
      expect(face).toHaveLength(3);
      expect(face[0]).toBeLessThan(mesh.vertexCount);
      expect(face[1]).toBeLessThan(mesh.vertexCount);
      expect(face[2]).toBeLessThan(mesh.vertexCount);
    }

    // Bounding box should enclose the 4x4x4 cube in world coordinates [-2, 2]
    expect(mesh.bbox).toBeDefined();
    expect(mesh.bbox!.min[0]).toBeCloseTo(-2, 1);
    expect(mesh.bbox!.max[0]).toBeCloseTo(2, 1);
  });

  it('generates anatomical cortical brain surface mesh with correct coordinates', () => {
    const brainMesh = generateCorticalBrainMesh(null, dims, affine);
    expect(brainMesh.vertexCount).toBeGreaterThan(100);
    expect(brainMesh.faceCount).toBeGreaterThan(100);
    expect(brainMesh.bbox).toBeDefined();
    expect(brainMesh.bbox!.min[0]).toBeLessThan(0);
    expect(brainMesh.bbox!.max[0]).toBeGreaterThan(0);
  });

  it('builds complete NeurospaceRegionSet for predicted, expert, and agreement views', () => {
    const segMask = new Uint8Array(16 * 16 * 16);
    const expertMask = new Uint8Array(16 * 16 * 16);

    // Overlapping tumor voxel
    segMask[8 + 8 * 16 + 8 * 256] = 4;
    expertMask[8 + 8 * 16 + 8 * 256] = 4;

    // Discordant voxels
    segMask[7 + 8 * 16 + 8 * 256] = 2; // FP
    expertMask[9 + 8 * 16 + 8 * 256] = 2; // FN

    const regions = buildNeurospaceRegionMeshes(segMask, expertMask, null, dims, affine);

    expect(regions.predictedRegions.brain).toBeDefined();
    expect(regions.predictedRegions.WT).toBeDefined();
    expect(regions.predictedRegions.TC).toBeDefined();
    expect(regions.predictedRegions.ET).toBeDefined();

    expect(regions.agreementRegions.TP).toBeDefined();
    expect(regions.agreementRegions.FP).toBeDefined();
    expect(regions.agreementRegions.FN).toBeDefined();

    expect(regions.agreementRegions.TP!.vertexCount).toBeGreaterThan(0);
    expect(regions.agreementRegions.FP!.vertexCount).toBeGreaterThan(0);
    expect(regions.agreementRegions.FN!.vertexCount).toBeGreaterThan(0);
  });
});
