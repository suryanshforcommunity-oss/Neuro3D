import { describe, it, expect } from 'vitest';
import {
  voxelToWorld,
  worldToVoxel,
  clampVoxel,
  getOrientationFromAffine,
  DEFAULT_IDENTITY_AFFINE,
} from '../src/utils/coordinates';
import { AffineMatrix } from '../src/types';

describe('Coordinate Transformations & Spatial Affines', () => {
  it('correctly maps voxel indices to world millimeters using identity affine', () => {
    const voxel = { i: 50, j: 60, k: 70 };
    const world = voxelToWorld(voxel, DEFAULT_IDENTITY_AFFINE);

    expect(world.x).toBe(50);
    expect(world.y).toBe(60);
    expect(world.z).toBe(70);
  });

  it('correctly maps voxel indices with scaling and centering translation', () => {
    // 2mm isotropic spacing centered at -128, -128, -128
    const affine: AffineMatrix = [
      [2, 0, 0, -128],
      [0, 2, 0, -128],
      [0, 0, 2, -128],
      [0, 0, 0, 1],
    ];

    const voxel = { i: 64, j: 64, k: 64 };
    const world = voxelToWorld(voxel, affine);

    expect(world.x).toBe(0); // 2*64 - 128 = 0
    expect(world.y).toBe(0);
    expect(world.z).toBe(0);
  });

  it('inverts world coordinates back to voxel coordinates', () => {
    const affine: AffineMatrix = [
      [1.5, 0, 0, -90],
      [0, 1.5, 0, -120],
      [0, 0, 2.0, -50],
      [0, 0, 0, 1],
    ];

    const originalVoxel = { i: 40, j: 50, k: 30 };
    const world = voxelToWorld(originalVoxel, affine);
    const recoveredVoxel = worldToVoxel(world, affine);

    expect(recoveredVoxel.i).toBe(40);
    expect(recoveredVoxel.j).toBe(50);
    expect(recoveredVoxel.k).toBe(30);
  });

  it('properly clamps voxel coordinates to volume boundaries', () => {
    const dims = { dimX: 100, dimY: 100, dimZ: 50 };

    const outOfBounds = { i: -10, j: 150, k: 25 };
    const clamped = clampVoxel(outOfBounds, dims);

    expect(clamped.i).toBe(0);
    expect(clamped.j).toBe(99);
    expect(clamped.k).toBe(25);
  });

  it('detects orientation codes from affine matrices', () => {
    // Standard RAS orientation
    const rasAffine: AffineMatrix = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
    expect(getOrientationFromAffine(rasAffine)).toBe('RAS');

    // LPI orientation
    const lpiAffine: AffineMatrix = [
      [-1, 0, 0, 0],
      [0, -1, 0, 0],
      [0, 0, -1, 0],
      [0, 0, 0, 1],
    ];
    expect(getOrientationFromAffine(lpiAffine)).toBe('LPI');
  });
});
