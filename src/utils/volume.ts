import { VoxelSpacing, TumourLabelCounts, RegionVolume } from '../types';

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
