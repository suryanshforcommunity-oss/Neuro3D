import { describe, it, expect } from 'vitest';
import { VoxelCoordinate, VolumeDimensions, AffineMatrix } from '../src/types';
import { voxelToWorld, worldToVoxel, clampVoxel } from '../src/utils/coordinates';

describe('Orthogonal Sliders & Coordinate Synchronization', () => {
  const dimensions: VolumeDimensions = { dimX: 240, dimY: 240, dimZ: 155 };
  const affine: AffineMatrix = [
    [-1, 0, 0, 0],
    [0, -1, 0, 239],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];

  it('axial slider navigates across full range [0, dimZ - 1] in both directions without resetting other axes', () => {
    let crosshair: VoxelCoordinate = { i: 100, j: 120, k: 80 };

    // Move forward
    const forwardIdx = 154;
    crosshair = { ...crosshair, k: forwardIdx };
    expect(crosshair.k).toBe(154);
    expect(crosshair.i).toBe(100);
    expect(crosshair.j).toBe(120);

    // Move backward to 0
    crosshair = { ...crosshair, k: 0 };
    expect(crosshair.k).toBe(0);
    expect(crosshair.i).toBe(100);
    expect(crosshair.j).toBe(120);
  });

  it('coronal slider navigates across full range [0, dimY - 1] without resetting other axes', () => {
    let crosshair: VoxelCoordinate = { i: 50, j: 120, k: 80 };

    crosshair = { ...crosshair, j: 239 };
    expect(crosshair.j).toBe(239);
    expect(crosshair.i).toBe(50);
    expect(crosshair.k).toBe(80);

    crosshair = { ...crosshair, j: 0 };
    expect(crosshair.j).toBe(0);
    expect(crosshair.i).toBe(50);
    expect(crosshair.k).toBe(80);
  });

  it('sagittal slider navigates across full range [0, dimX - 1] without resetting other axes', () => {
    let crosshair: VoxelCoordinate = { i: 100, j: 120, k: 80 };

    crosshair = { ...crosshair, i: 239 };
    expect(crosshair.i).toBe(239);
    expect(crosshair.j).toBe(120);
    expect(crosshair.k).toBe(80);

    crosshair = { ...crosshair, i: 0 };
    expect(crosshair.i).toBe(0);
    expect(crosshair.j).toBe(120);
    expect(crosshair.k).toBe(80);
  });

  it('clicking on Axial plane synchronizes crosshair to (i = col, j = row) while preserving k', () => {
    let crosshair: VoxelCoordinate = { i: 100, j: 120, k: 75 };
    const clickedCol = 45;
    const clickedRow = 180;

    // Axial click handler: updates i and j
    crosshair = { ...crosshair, i: clickedCol, j: clickedRow };
    expect(crosshair.i).toBe(45);
    expect(crosshair.j).toBe(180);
    expect(crosshair.k).toBe(75); // preserved
  });

  it('clicking on Coronal plane synchronizes crosshair to (i = col, k = dimZ - 1 - row) while preserving j', () => {
    let crosshair: VoxelCoordinate = { i: 100, j: 120, k: 75 };
    const dimZ = dimensions.dimZ;
    const clickedCol = 60;
    const clickedRow = 20; // Near top of image (Superior)

    const expectedK = dimZ - 1 - clickedRow; // 155 - 1 - 20 = 134
    crosshair = { ...crosshair, i: clickedCol, k: expectedK };
    expect(crosshair.i).toBe(60);
    expect(crosshair.j).toBe(120); // preserved
    expect(crosshair.k).toBe(134);
  });

  it('clicking on Sagittal plane synchronizes crosshair to (j = col, k = dimZ - 1 - row) while preserving i', () => {
    let crosshair: VoxelCoordinate = { i: 100, j: 120, k: 75 };
    const dimZ = dimensions.dimZ;
    const clickedCol = 88;
    const clickedRow = 50;

    const expectedK = dimZ - 1 - clickedRow; // 155 - 1 - 50 = 104
    crosshair = { ...crosshair, j: clickedCol, k: expectedK };
    expect(crosshair.i).toBe(100); // preserved
    expect(crosshair.j).toBe(88);
    expect(crosshair.k).toBe(104);
  });

  it('correctly clamps crosshair coordinate when switching to a smaller volume', () => {
    const originalCrosshair: VoxelCoordinate = { i: 200, j: 220, k: 140 };
    const smallerDims: VolumeDimensions = { dimX: 128, dimY: 128, dimZ: 96 };

    const clamped = clampVoxel(originalCrosshair, smallerDims);
    expect(clamped.i).toBe(127);
    expect(clamped.j).toBe(127);
    expect(clamped.k).toBe(95);
  });

  it('computes world coordinates using active affine matrix with negative directions and translations', () => {
    const testCrosshair: VoxelCoordinate = { i: 109, j: 138, k: 81 };
    const world = voxelToWorld(testCrosshair, affine);

    expect(world.x).toBe(-109);
    expect(world.y).toBe(101);
    expect(world.z).toBe(81);

    const backToVoxel = worldToVoxel(world, affine);
    expect(backToVoxel.i).toBe(109);
    expect(backToVoxel.j).toBe(138);
    expect(backToVoxel.k).toBe(81);
  });
});
