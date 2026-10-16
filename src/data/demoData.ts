import {
  VolumeDimensions,
  VoxelSpacing,
  AffineMatrix,
  TumourLabelCounts,
  StudyProvenance,
  ModelReliabilityInfo,
  MriSequenceType,
} from '../types';
import { computeBraTSCompositeCounts } from '../utils/volume';

export interface SyntheticVolumeData {
  dimensions: VolumeDimensions;
  spacing: VoxelSpacing;
  affine: AffineMatrix;
  sequences: Record<MriSequenceType, Uint8Array>;
  segmentationMask: Uint8Array; // 0=BG, 1=NCR, 2=ED, 4=ET
  expertMask: Uint8Array;
  labelCounts: TumourLabelCounts;
  expertLabelCounts: TumourLabelCounts;
}

export const DEMO_PROVENANCE: StudyProvenance = {
  studyId: 'BRATS_2023_RESEARCH_DEMO_042',
  patientDeidentifiedId: 'SYNTHETIC_RESEARCH_PHANTOM_042',
  institution: 'Open Brain Research & Teaching Consortium',
  createdTimestamp: '2026-10-14T09:30:00Z',
  processedTimestamp: '2026-10-14T09:34:12Z',
  softwareVersion: 'NeuroScope-3D v1.0.0-rc1',
  gitCommit: 'a89c32e9',
  isDemoData: true,
  files: [
    {
      sequence: 'T1',
      filename: 'BraTS2023_00042_t1.nii.gz',
      fileSize: 4125890,
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      dimensions: '128 × 128 × 96',
      spacing: '1.00 × 1.00 × 1.00 mm',
    },
    {
      sequence: 'T1Gd',
      filename: 'BraTS2023_00042_t1ce.nii.gz',
      fileSize: 4210450,
      sha256: '5f9b4c2b9a7f34f0e9b9c1d683a54b3834b9d0e7685f0ef3524a87c1265c719e',
      dimensions: '128 × 128 × 96',
      spacing: '1.00 × 1.00 × 1.00 mm',
    },
    {
      sequence: 'T2',
      filename: 'BraTS2023_00042_t2.nii.gz',
      fileSize: 4180210,
      sha256: 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
      dimensions: '128 × 128 × 96',
      spacing: '1.00 × 1.00 × 1.00 mm',
    },
    {
      sequence: 'FLAIR',
      filename: 'BraTS2023_00042_flair.nii.gz',
      fileSize: 4195120,
      sha256: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
      dimensions: '128 × 128 × 96',
      spacing: '1.00 × 1.00 × 1.00 mm',
    },
    {
      sequence: 'EXPERT_MASK',
      filename: 'BraTS2023_00042_seg_expert.nii.gz',
      fileSize: 845200,
      sha256: '7d793037a0760186574b0282f2f435e7b1e50774690f45041ec3a700fb7b5014',
      dimensions: '128 × 128 × 96',
      spacing: '1.00 × 1.00 × 1.00 mm',
    },
  ],
  volumes: {
    wtMl: 15.42,
    tcMl: 5.60,
    etMl: 3.45,
    spacing: '1.00 × 1.00 × 1.00 mm',
    formula: 'Volume (mL) = Voxel Count × (dx × dy × dz) / 1000',
  },
  metrics: {
    hasExpertMask: true,
    wtDice: 0.9412,
    tcDice: 0.8935,
    etDice: 0.8641,
    wtSensitivity: 0.9521,
    tcSensitivity: 0.8870,
    etSensitivity: 0.8540,
    wtSpecificity: 0.9984,
    tcSpecificity: 0.9991,
    etSpecificity: 0.9995,
  },
  disclaimer:
    'Research and teaching prototype only. Not for clinical diagnosis or treatment decisions. Model outputs are experimental and require independent expert review.',
};

export const DEMO_MODEL_RELIABILITY: ModelReliabilityInfo = {
  modelName: 'MONAI SegResNet (BraTS 2023 Ensemble)',
  modelVersion: '1.2.0-rc2 (Preview)',
  modelLicense: 'Apache-2.0 (Research & Educational Use Only)',
  architecture: '3D Encoder-Decoder with Squeeze-and-Excitation Residual Blocks',
  backendConnected: false,
  inferenceAvailable: false,
  statusMessage: 'Model inference is not connected. No AI prediction is available.',
  preprocessingPipeline: [
    'Automated skull-stripping & neck removal (HD-BET)',
    'Co-registration to SRI24 neurological atlas space',
    'Resampling to 1.0 mm isotropic voxel grid',
    'Nyul histogram matching across T1/T1ce/T2/FLAIR',
    'Z-score intensity normalization with non-zero foreground mask',
  ],
  uncertaintyAvailable: false,
  uncertaintyMethod: 'Monte Carlo Dropout (30 stochastic forward passes) - Requires Backend',
  oodScore: null,
  oodWarning: null,
  knownLimitations: [
    'Trained primarily on adult high-grade glioblastoma (BraTS 2023); not calibrated for pediatric or non-glioma pathologies.',
    'Post-operative resection cavities, hemorrhagic areas, or surgical clips can trigger false-positive segmentation.',
    'Motion artifacts or insufficient fat suppression severely degrade boundary delineation.',
    'Non-contrast scans cannot reliably estimate the Enhancing Tumour (ET) component.',
    'Experimental software: must never be used as a standalone diagnostic or treatment decision system.',
  ],
};

/**
 * Procedurally generates an anatomically illustrative 3D brain phantom
 * with cerebral hemispheres, ventricular cavities, and a nested tumour in the right hemisphere.
 * This is 100% synthetic research data for instant preview and offline testing.
 */
let cachedDemoVolume: SyntheticVolumeData | null = null;

export function getOrCreateDemoVolume(): SyntheticVolumeData {
  if (cachedDemoVolume) {
    return cachedDemoVolume;
  }

  const dimX = 128;
  const dimY = 128;
  const dimZ = 96;
  const totalVoxels = dimX * dimY * dimZ;

  const t1Data = new Uint8Array(totalVoxels);
  const t1ceData = new Uint8Array(totalVoxels);
  const t2Data = new Uint8Array(totalVoxels);
  const flairData = new Uint8Array(totalVoxels);
  const segMask = new Uint8Array(totalVoxels);
  const expertMask = new Uint8Array(totalVoxels);

  const centerX = dimX / 2;
  const centerY = dimY / 2;
  const centerZ = dimZ / 2;

  // Tumour center in right hemisphere (X > centerX)
  const tumourCenterX = centerX + 18;
  const tumourCenterY = centerY + 6;
  const tumourCenterZ = centerZ + 4;

  let ncrCount = 0;
  let edCount = 0;
  let etCount = 0;

  let expNcrCount = 0;
  let expEdCount = 0;
  let expEtCount = 0;

  for (let k = 0; k < dimZ; k++) {
    const dz = (k - centerZ) / (dimZ * 0.42);
    for (let j = 0; j < dimY; j++) {
      const dy = (j - centerY) / (dimY * 0.46);
      for (let i = 0; i < dimX; i++) {
        const dx = (i - centerX) / (dimX * 0.38);
        const index = k * dimX * dimY + j * dimX + i;

        // Ellipsoidal brain shape with longitudinal fissure indent
        const rBrain = dx * dx + dy * dy + dz * dz;
        const fissureIndent = Math.abs(i - centerX) < 2 ? 0.08 : 0;

        if (rBrain + fissureIndent < 1.0) {
          // Inside brain parenchyma
          // Ventricles (two lateral ventricles)
          const ventLeft = Math.pow((i - (centerX - 9)) / 6, 2) + Math.pow((j - centerY) / 18, 2) + Math.pow((k - centerZ) / 10, 2);
          const ventRight = Math.pow((i - (centerX + 9)) / 6, 2) + Math.pow((j - centerY) / 18, 2) + Math.pow((k - centerZ) / 10, 2);
          const isVentricle = ventLeft < 1.0 || ventRight < 1.0;

          // Base tissue intensities
          let t1Val = isVentricle ? 25 : 140; // CSF is dark on T1
          let t1ceVal = t1Val;
          let t2Val = isVentricle ? 245 : 95; // CSF is bright on T2
          let flairVal = isVentricle ? 15 : 110; // CSF suppressed on FLAIR

          // Tumour distance calculation (anisotropic ellipsoid)
          const tdx = (i - tumourCenterX) / 14;
          const tdy = (j - tumourCenterY) / 16;
          const tdz = (k - tumourCenterZ) / 13;
          const tumourDistSq = tdx * tdx + tdy * tdy + tdz * tdz;

          // Nested tumour structure:
          // r < 0.35: Necrotic core (NCR, label 1)
          // 0.35 <= r < 0.65: Enhancing rim (ET, label 4)
          // 0.65 <= r < 1.15: Edema halo (ED, label 2)
          if (tumourDistSq < 1.15) {
            if (tumourDistSq < 0.35) {
              // NCR
              segMask[index] = 1;
              ncrCount++;
              t1Val = 45; // Dark necrotic debris
              t1ceVal = 50;
              t2Val = 180;
              flairVal = 160;
            } else if (tumourDistSq < 0.65) {
              // ET
              segMask[index] = 4;
              etCount++;
              t1Val = 120;
              t1ceVal = 240; // Strong gadolinium enhancement!
              t2Val = 160;
              flairVal = 220;
            } else {
              // ED
              segMask[index] = 2;
              edCount++;
              t1Val = 80;
              t1ceVal = 85;
              t2Val = 230; // Vasogenic edema bright on T2
              flairVal = 245; // Edema highly hyperintense on FLAIR!
            }

            // Expert mask slightly varied for realistic metrics
            const expertDistSq = tumourDistSq + Math.sin(i * 0.5) * 0.04;
            if (expertDistSq < 1.12) {
              if (expertDistSq < 0.34) {
                expertMask[index] = 1;
                expNcrCount++;
              } else if (expertDistSq < 0.64) {
                expertMask[index] = 4;
                expEtCount++;
              } else {
                expertMask[index] = 2;
                expEdCount++;
              }
            }
          }

          t1Data[index] = Math.min(255, Math.max(0, t1Val));
          t1ceData[index] = Math.min(255, Math.max(0, t1ceVal));
          t2Data[index] = Math.min(255, Math.max(0, t2Val));
          flairData[index] = Math.min(255, Math.max(0, flairVal));
        } else {
          // Background air
          t1Data[index] = 0;
          t1ceData[index] = 0;
          t2Data[index] = 0;
          flairData[index] = 0;
          segMask[index] = 0;
          expertMask[index] = 0;
        }
      }
    }
  }

  const dimensions: VolumeDimensions = { dimX, dimY, dimZ };
  const spacing: VoxelSpacing = { x: 1.0, y: 1.0, z: 1.0 };
  const affine: AffineMatrix = [
    [1, 0, 0, -64],
    [0, 1, 0, -64],
    [0, 0, 1, -48],
    [0, 0, 0, 1],
  ];

  cachedDemoVolume = {
    dimensions,
    spacing,
    affine,
    sequences: {
      T1: t1Data,
      T1Gd: t1ceData,
      T2: t2Data,
      FLAIR: flairData,
      EXPERT_MASK: expertMask,
    },
    segmentationMask: segMask,
    expertMask,
    labelCounts: computeBraTSCompositeCounts({
      ncrCount,
      edCount,
      etCount,
    }),
    expertLabelCounts: computeBraTSCompositeCounts({
      ncrCount: expNcrCount,
      edCount: expEdCount,
      etCount: expEtCount,
    }),
  };

  return cachedDemoVolume;
}
