import { VoxelCoordinate, WorldCoordinate, AffineMatrix, VolumeDimensions } from '../types';

/**
 * Standard identity 4x4 affine matrix.
 */
export const DEFAULT_IDENTITY_AFFINE: AffineMatrix = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1],
];

/**
 * Transforms voxel index (i, j, k) to physical world coordinates (x, y, z) in millimeters.
 * Using matrix multiplication: [x, y, z, 1]^T = Affine * [i, j, k, 1]^T
 */
export function voxelToWorld(voxel: VoxelCoordinate, affine: AffineMatrix = DEFAULT_IDENTITY_AFFINE): WorldCoordinate {
  const { i, j, k } = voxel;
  const x = affine[0][0] * i + affine[0][1] * j + affine[0][2] * k + affine[0][3];
  const y = affine[1][0] * i + affine[1][1] * j + affine[1][2] * k + affine[1][3];
  const z = affine[2][0] * i + affine[2][1] * j + affine[2][2] * k + affine[2][3];

  return {
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
    z: Number(z.toFixed(2)),
  };
}

/**
 * Inverts a 4x4 affine matrix.
 */
export function invertAffine(m: AffineMatrix): AffineMatrix | null {
  // Extract 3x3 rotational/scaling component and 3x1 translation
  const a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], tx = m[0][3];
  const a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], ty = m[1][3];
  const a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], tz = m[2][3];

  const det =
    a00 * (a11 * a22 - a12 * a21) -
    a01 * (a10 * a22 - a12 * a20) +
    a02 * (a10 * a21 - a11 * a20);

  if (Math.abs(det) < 1e-9) {
    return null; // Singular matrix, non-invertible
  }

  const invDet = 1.0 / det;

  const b00 = (a11 * a22 - a12 * a21) * invDet;
  const b01 = (a02 * a21 - a01 * a22) * invDet;
  const b02 = (a01 * a12 - a02 * a11) * invDet;

  const b10 = (a12 * a20 - a10 * a22) * invDet;
  const b11 = (a00 * a22 - a02 * a20) * invDet;
  const b12 = (a02 * a10 - a00 * a12) * invDet;

  const b20 = (a10 * a21 - a11 * a20) * invDet;
  const b21 = (a01 * a20 - a00 * a21) * invDet;
  const b22 = (a00 * a11 - a01 * a10) * invDet;

  // Translation in inverse matrix: -R^-1 * T
  const itx = -(b00 * tx + b01 * ty + b02 * tz);
  const ity = -(b10 * tx + b11 * ty + b12 * tz);
  const itz = -(b20 * tx + b21 * ty + b22 * tz);

  return [
    [b00, b01, b02, itx],
    [b10, b11, b12, ity],
    [b20, b21, b22, itz],
    [0, 0, 0, 1],
  ];
}

/**
 * Transforms world coordinates (x, y, z) in mm back to voxel coordinate (i, j, k).
 */
export function worldToVoxel(world: WorldCoordinate, affine: AffineMatrix = DEFAULT_IDENTITY_AFFINE): VoxelCoordinate {
  const inv = invertAffine(affine);
  if (!inv) {
    return { i: Math.round(world.x), j: Math.round(world.y), k: Math.round(world.z) };
  }
  const i = inv[0][0] * world.x + inv[0][1] * world.y + inv[0][2] * world.z + inv[0][3];
  const j = inv[1][0] * world.x + inv[1][1] * world.y + inv[1][2] * world.z + inv[1][3];
  const k = inv[2][0] * world.x + inv[2][1] * world.y + inv[2][2] * world.z + inv[2][3];

  return {
    i: Math.round(i),
    j: Math.round(j),
    k: Math.round(k),
  };
}

/**
 * Clamps voxel coordinates within volume boundaries.
 */
export function clampVoxel(coord: VoxelCoordinate, dims: VolumeDimensions): VoxelCoordinate {
  return {
    i: Math.max(0, Math.min(dims.dimX - 1, coord.i)),
    j: Math.max(0, Math.min(dims.dimY - 1, coord.j)),
    k: Math.max(0, Math.min(dims.dimZ - 1, coord.k)),
  };
}

/**
 * Infers 3-letter anatomical orientation code (e.g. RAS, LPI) from affine matrix.
 */
export function getOrientationFromAffine(affine: AffineMatrix): string {
  const axes = ['x', 'y', 'z'] as const;
  const letters: string[] = [];

  for (let col = 0; col < 3; col++) {
    const val0 = affine[0][col];
    const val1 = affine[1][col];
    const val2 = affine[2][col];

    const abs0 = Math.abs(val0);
    const abs1 = Math.abs(val1);
    const abs2 = Math.abs(val2);

    if (abs0 >= abs1 && abs0 >= abs2) {
      letters.push(val0 > 0 ? 'R' : 'L');
    } else if (abs1 >= abs0 && abs1 >= abs2) {
      letters.push(val1 > 0 ? 'A' : 'P');
    } else {
      letters.push(val2 > 0 ? 'S' : 'I');
    }
  }

  return letters.join('');
}
