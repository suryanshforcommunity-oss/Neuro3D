import { VoxelSpacing, TumourLabelCounts, RegionVolume, AffineMatrix } from '../types';

/**
 * Calculates volume of a single voxel in milliliters (mL or cm³) directly from the 4x4 affine matrix.
 * Formula: voxelVolumeML = abs(det(affine[0:3, 0:3])) / 1000
 * Physical affine transform matrix units are assumed to be in millimeters (standard NIfTI).
 */
export function calculateAffineVoxelVolumeMl(affine: AffineMatrix): number {
  if (!affine || affine.length < 3 || affine[0].length < 3) {
    throw new Error('Invalid affine matrix: must have at least 3x3 linear submatrix');
  }

  const a00 = affine[0][0], a01 = affine[0][1], a02 = affine[0][2];
  const a10 = affine[1][0], a11 = affine[1][1], a12 = affine[1][2];
  const a20 = affine[2][0], a21 = affine[2][1], a22 = affine[2][2];

  // Determinant of 3x3 upper-left submatrix
  const det =
    a00 * (a11 * a22 - a12 * a21) -
    a01 * (a10 * a22 - a12 * a20) +
    a02 * (a10 * a21 - a11 * a20);

  const voxelMm3 = Math.abs(det);
  if (voxelMm3 === 0 || !Number.isFinite(voxelMm3)) {
    throw new Error('Singular or invalid affine matrix: determinant is zero or non-finite');
  }

  // 1000 mm³ = 1 cm³ = 1 mL
  return Number((voxelMm3 / 1000.0).toFixed(6));
}

/**
 * Calculates volume in milliliters (mL or cm³) from voxel count and spacing in millimeters.
 * Formula: Volume (mL) = voxel count * dx * dy * dz / 1000
 * 
 * Note: Never assumes 1.0mm spacing; spacing must be read directly from the NIfTI header.
 */
export function calculateVoxelVolumeMl(voxelCount: number, spacing: VoxelSpacing): number {
  if (voxelCount < 0) {
    throw new Error('Voxel count cannot be negative');
  }
  if (spacing.x <= 0 || spacing.y <= 0 || spacing.z <= 0) {
    throw new Error('Voxel spacing values must be strictly positive');
  }
  const voxelVolumeMm3 = spacing.x * spacing.y * spacing.z;
  const totalVolumeMm3 = voxelCount * voxelVolumeMm3;
  // 1000 mm³ = 1 cm³ = 1 mL
  const volumeMl = totalVolumeMm3 / 1000.0;
  return Number(volumeMl.toFixed(4));
}

/**
 * Computes composite BraTS tumour label counts according to standard challenge definitions:
 * - Label 1 (NCR): Necrotic and non-enhancing tumour core
 * - Label 2 (ED): Peritumoral edema
 * - Label 4 (ET): GD-enhancing tumour
 * 
 * Composite regions:
 * - Whole Tumour (WT) = NCR + ED + ET (labels 1, 2, 4)
 * - Tumour Core (TC) = NCR + ET (labels 1, 4)
 * - Enhancing Tumour (ET) = ET (label 4)
 */
export function computeBraTSCompositeCounts(labelCounts: {
  ncrCount: number;
  edCount: number;
  etCount: number;
}): TumourLabelCounts {
  const ncr = Math.max(0, labelCounts.ncrCount);
  const ed = Math.max(0, labelCounts.edCount);
  const et = Math.max(0, labelCounts.etCount);

  return {
    ncrCount: ncr,
    edCount: ed,
    etCount: et,
    wtCount: ncr + ed + et,
    tcCount: ncr + et,
  };
}

/**
 * Generates region volume cards data with comparison to expert mask if available.
 */
export function buildRegionVolumeSummaries(
  predictedCounts: TumourLabelCounts,
  spacing: VoxelSpacing,
  expertCounts?: TumourLabelCounts
): RegionVolume[] {
  const wtPredMl = calculateVoxelVolumeMl(predictedCounts.wtCount, spacing);
  const tcPredMl = calculateVoxelVolumeMl(predictedCounts.tcCount, spacing);
  const etPredMl = calculateVoxelVolumeMl(predictedCounts.etCount, spacing);

  let wtExpertMl: number | undefined;
  let tcExpertMl: number | undefined;
  let etExpertMl: number | undefined;

  if (expertCounts) {
    wtExpertMl = calculateVoxelVolumeMl(expertCounts.wtCount, spacing);
    tcExpertMl = calculateVoxelVolumeMl(expertCounts.tcCount, spacing);
    etExpertMl = calculateVoxelVolumeMl(expertCounts.etCount, spacing);
  }

  const calcDiff = (pred: number, exp?: number) => {
    if (exp === undefined) return { diffMl: undefined, diffPct: undefined };
    const diffMl = Number((pred - exp).toFixed(4));
    const diffPct = exp > 0 ? Number((((pred - exp) / exp) * 100).toFixed(2)) : 0;
    return { diffMl, diffPct };
  };

  const wtDiff = calcDiff(wtPredMl, wtExpertMl);
  const tcDiff = calcDiff(tcPredMl, tcExpertMl);
  const etDiff = calcDiff(etPredMl, etExpertMl);

  return [
    {
      region: 'WT',
      displayName: 'Whole Tumour (WT)',
      color: '#06B6D4', // Cyan
      description: 'Full abnormal hyperintensity zone including edema and all core tissue',
      definition: 'WT = NCR (1) + ED (2) + ET (4)',
      voxelCount: predictedCounts.wtCount,
      volumeMl: wtPredMl,
      expertVolumeMl: wtExpertMl,
      differenceMl: wtDiff.diffMl,
      differencePercentage: wtDiff.diffPct,
    },
    {
      region: 'TC',
      displayName: 'Tumour Core (TC)',
      color: '#8B5CF6', // Violet
      description: 'Gross tumour volume excluding peritumoral vasogenic edema',
      definition: 'TC = NCR (1) + ET (4)',
      voxelCount: predictedCounts.tcCount,
      volumeMl: tcPredMl,
      expertVolumeMl: tcExpertMl,
      differenceMl: tcDiff.diffMl,
      differencePercentage: tcDiff.diffPct,
    },
    {
      region: 'ET',
      displayName: 'Enhancing Tumour (ET)',
      color: '#F59E0B', // Amber
      description: 'Active, blood-brain-barrier disrupted vascularized tumour tissue',
      definition: 'ET = Label 4 (ET)',
      voxelCount: predictedCounts.etCount,
      volumeMl: etPredMl,
      expertVolumeMl: etExpertMl,
      differenceMl: etDiff.diffMl,
      differencePercentage: etDiff.diffPct,
    },
  ];
}
