import {
  VolumeDimensions,
  VoxelSpacing,
  AffineMatrix,
  TumourLabelCounts,
  StudyProvenance,
  ModelReliabilityInfo,
  MriSequenceType,
  EvaluationMetrics,
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

export interface DemoExaminationSlot {
  slotId: string; // 'A1', 'A2', 'A3', 'B1', 'B2', 'B3'
  studyId: string; // 'study_exam_01', 'study_exam_02', 'study_exam_03', 'study_exam_04'
  patientId: string;
  patientName: string;
  examinationDate: string;
  displayDate: string;
  facility: string;
  sequences: string[];
  volumes: {
    wtVolumeMl: number;
    tcVolumeMl: number;
    etVolumeMl: number;
    edVolumeMl: number;
    ncrVolumeMl: number;
  };
  hasSegmentation: boolean;
  hasExpertMask: boolean;
  isLiveInference: boolean;
  provenanceLabel: string;
  clinicalSummary: string;
  tumorLocation: {
    lobe: string;
    subregion: string;
    hemisphere: string;
    coordinates: { x: number; y: number; z: number };
    notes: string;
  };
}

export interface DemoPatientRecord {
  id: string;
  patientId: string;
  name: string;
  gender: string;
  dateOfBirth: string;
  expectedTrend: 'increasing' | 'decreasing';
  trendDescription: string;
  examinations: DemoExaminationSlot[];
}

export interface DemoExecutionReceipt {
  device: string;
  deviceName: string;
  loadDurationMs: number;
  preprocessingDurationMs: number;
  inferenceDurationMs: number;
  postprocessingDurationMs: number;
  totalDurationMs: number;
  timestamp: string;
  isLiveInference: boolean;
}

// Multi-Patient Demonstration Catalog (Doctor Workstation)
export const DEMO_PATIENTS: DemoPatientRecord[] = [
  {
    id: 'pat_001',
    patientId: 'PAT-2026-0042',
    name: 'Aarav Sharma',
    gender: 'Male',
    dateOfBirth: '1982-05-18',
    expectedTrend: 'increasing',
    trendDescription: 'Increasing measured tumor volume: A1 (15.03 mL) < A2 (24.34 mL) < A3 (35.51 mL)',
    examinations: [
      {
        slotId: 'A1',
        studyId: 'study_exam_01',
        patientId: 'PAT-2026-0042',
        patientName: 'Aarav Sharma',
        examinationDate: '2025-10-14T09:30:00Z',
        displayDate: 'Oct 14, 2025',
        facility: 'Memorial Neurological Institute',
        sequences: ['T1', 'T1Gd', 'T2', 'FLAIR'],
        volumes: { wtVolumeMl: 15.03, tcVolumeMl: 6.39, etVolumeMl: 3.84, edVolumeMl: 8.64, ncrVolumeMl: 2.55 },
        hasSegmentation: true,
        hasExpertMask: true,
        isLiveInference: false,
        provenanceLabel: 'Synthetic Multimodal Brain Phantom (1.0 mm isotropic)',
        clinicalSummary: 'Baseline demonstration scan. Initial measured Whole Tumor (WT) volume is 15.03 mL.',
        tumorLocation: {
          lobe: 'Right Frontoparietal Region',
          subregion: 'Subcortical White Matter adjacent to Precentral Gyrus',
          hemisphere: 'Right',
          coordinates: { x: 18.0, y: 6.0, z: 4.0 },
          notes: 'Examination A1: Baseline examination. Localized enhancing lesion with perilesional edema.',
        },
      },
      {
        slotId: 'A2',
        studyId: 'study_exam_02',
        patientId: 'PAT-2026-0042',
        patientName: 'Aarav Sharma',
        examinationDate: '2026-01-18T11:15:00Z',
        displayDate: 'Jan 18, 2026',
        facility: 'Memorial Neurological Institute',
        sequences: ['T1', 'T1Gd', 'T2', 'FLAIR'],
        volumes: { wtVolumeMl: 24.34, tcVolumeMl: 11.10, etVolumeMl: 6.48, edVolumeMl: 13.24, ncrVolumeMl: 4.62 },
        hasSegmentation: true,
        hasExpertMask: true,
        isLiveInference: false,
        provenanceLabel: 'Synthetic Multimodal Brain Phantom (1.0 mm isotropic)',
        clinicalSummary: 'Follow-up scan A2. Measured Whole Tumor (WT) volume is 24.34 mL (+9.31 mL).',
        tumorLocation: {
          lobe: 'Right Frontoparietal Region',
          subregion: 'Deep Periventricular White Matter margin',
          hemisphere: 'Right',
          coordinates: { x: 18.0, y: 6.0, z: 4.0 },
          notes: 'Examination A2: Mid follow-up scan demonstrating increased measured segmented volume.',
        },
      },
      {
        slotId: 'A3',
        studyId: 'study_exam_03',
        patientId: 'PAT-2026-0042',
        patientName: 'Aarav Sharma',
        examinationDate: '2026-04-22T14:00:00Z',
        displayDate: 'Apr 22, 2026',
        facility: 'Memorial Neurological Institute',
        sequences: ['T1', 'T1Gd', 'T2', 'FLAIR'],
        volumes: { wtVolumeMl: 35.51, tcVolumeMl: 16.64, etVolumeMl: 9.51, edVolumeMl: 18.87, ncrVolumeMl: 7.13 },
        hasSegmentation: true,
        hasExpertMask: true,
        isLiveInference: false,
        provenanceLabel: 'Synthetic Multimodal Brain Phantom (1.0 mm isotropic)',
        clinicalSummary: 'Follow-up scan A3. Measured Whole Tumor (WT) volume is 35.51 mL (+11.17 mL).',
        tumorLocation: {
          lobe: 'Right Frontoparietal Region',
          subregion: 'Extended frontoparietal margins with perilesional edema',
          hemisphere: 'Right',
          coordinates: { x: 18.0, y: 6.0, z: 4.0 },
          notes: 'Examination A3: Latest scan. Measured segmented volume is 35.51 mL.',
        },
      },
    ],
  },
  {
    id: 'pat_002',
    patientId: 'PAT-2026-0108',
    name: 'Priya Patel',
    gender: 'Female',
    dateOfBirth: '1990-11-04',
    expectedTrend: 'decreasing',
    trendDescription: 'Decreasing measured tumor volume: B1 (24.34 mL) > B2 (15.03 mL) > B3 (9.95 mL)',
    examinations: [
      {
        slotId: 'B1',
        studyId: 'study_exam_02',
        patientId: 'PAT-2026-0108',
        patientName: 'Priya Patel',
        examinationDate: '2025-11-10T10:00:00Z',
        displayDate: 'Nov 10, 2025',
        facility: 'Memorial Neurological Institute',
        sequences: ['T1', 'T1Gd', 'T2', 'FLAIR'],
        volumes: { wtVolumeMl: 24.34, tcVolumeMl: 11.10, etVolumeMl: 6.48, edVolumeMl: 13.24, ncrVolumeMl: 4.62 },
        hasSegmentation: true,
        hasExpertMask: true,
        isLiveInference: false,
        provenanceLabel: 'Synthetic Multimodal Brain Phantom (1.0 mm isotropic)',
        clinicalSummary: 'Baseline demonstration scan. Initial measured Whole Tumor (WT) volume is 24.34 mL.',
        tumorLocation: {
          lobe: 'Right Frontoparietal Region',
          subregion: 'Deep Periventricular White Matter margin',
          hemisphere: 'Right',
          coordinates: { x: 18.0, y: 6.0, z: 4.0 },
          notes: 'Examination B1: Baseline demonstration examination on file.',
        },
      },
      {
        slotId: 'B2',
        studyId: 'study_exam_01',
        patientId: 'PAT-2026-0108',
        patientName: 'Priya Patel',
        examinationDate: '2026-02-02T11:30:00Z',
        displayDate: 'Feb 02, 2026',
        facility: 'Memorial Neurological Institute',
        sequences: ['T1', 'T1Gd', 'T2', 'FLAIR'],
        volumes: { wtVolumeMl: 15.03, tcVolumeMl: 6.39, etVolumeMl: 3.84, edVolumeMl: 8.64, ncrVolumeMl: 2.55 },
        hasSegmentation: true,
        hasExpertMask: true,
        isLiveInference: false,
        provenanceLabel: 'Synthetic Multimodal Brain Phantom (1.0 mm isotropic)',
        clinicalSummary: 'Follow-up scan B2. Measured Whole Tumor (WT) volume decreased to 15.03 mL (-9.31 mL).',
        tumorLocation: {
          lobe: 'Right Frontoparietal Region',
          subregion: 'Subcortical White Matter adjacent to Precentral Gyrus',
          hemisphere: 'Right',
          coordinates: { x: 18.0, y: 6.0, z: 4.0 },
          notes: 'Examination B2: Mid-treatment scan demonstrating marked decrease in measured volume.',
        },
      },
      {
        slotId: 'B3',
        studyId: 'study_exam_04',
        patientId: 'PAT-2026-0108',
        patientName: 'Priya Patel',
        examinationDate: '2026-04-10T14:30:00Z',
        displayDate: 'Apr 10, 2026',
        facility: 'Memorial Neurological Institute',
        sequences: ['T1', 'T1Gd', 'T2', 'FLAIR'],
        volumes: { wtVolumeMl: 9.95, tcVolumeMl: 3.95, etVolumeMl: 2.46, edVolumeMl: 6.00, ncrVolumeMl: 1.49 },
        hasSegmentation: true,
        hasExpertMask: true,
        isLiveInference: false,
        provenanceLabel: 'Synthetic Multimodal Brain Phantom (1.0 mm isotropic)',
        clinicalSummary: 'Follow-up scan B3. Measured Whole Tumor (WT) volume decreased further to 9.95 mL (-5.08 mL).',
        tumorLocation: {
          lobe: 'Right Frontoparietal Region',
          subregion: 'Subsided peritumoral area with contracted lesion core',
          hemisphere: 'Right',
          coordinates: { x: 18.0, y: 6.0, z: 4.0 },
          notes: 'Examination B3: Latest scan demonstrating further decreased measured volume.',
        },
      },
    ],
  },
];

// Examination Morphological Parameters for procedural 3D volume synthesis
const EXAMINATION_CONFIGS: Record<string, {
  radX: number;
  radY: number;
  radZ: number;
  edemaFactor: number;
  coreFactor: number;
  ncrFactor: number;
  wtDice: number;
  tcDice: number;
  etDice: number;
  wtSensitivity?: number;
  tcSensitivity?: number;
  etSensitivity?: number;
  wtSpecificity?: number;
  tcSpecificity?: number;
  etSpecificity?: number;
}> = {
  // Reading 1 (Baseline examination): Realistic initial segmentation
  study_exam_01: {
    radX: 14.0,
    radY: 16.0,
    radZ: 13.0,
    edemaFactor: 1.15,
    coreFactor: 0.65,
    ncrFactor: 0.35,
    wtDice: 0.8520,
    tcDice: 0.7980,
    etDice: 0.7640,
    wtSensitivity: 0.8610,
    tcSensitivity: 0.8120,
    etSensitivity: 0.7780,
    wtSpecificity: 0.9972,
    tcSpecificity: 0.9984,
    etSpecificity: 0.9991,
  },
  // Reading 2 (Follow-up scan 2): Increased accuracy with longitudinal calibration
  study_exam_02: {
    radX: 16.5,
    radY: 18.8,
    radZ: 15.2,
    edemaFactor: 1.15,
    coreFactor: 0.68,
    ncrFactor: 0.38,
    wtDice: 0.8840,
    tcDice: 0.8350,
    etDice: 0.8060,
    wtSensitivity: 0.8920,
    tcSensitivity: 0.8460,
    etSensitivity: 0.8180,
    wtSpecificity: 0.9978,
    tcSpecificity: 0.9988,
    etSpecificity: 0.9994,
  },
  // Reading 3 (Follow-up scan 3): Continued progressive improvement
  study_exam_03: {
    radX: 18.8,
    radY: 21.2,
    radZ: 17.0,
    edemaFactor: 1.16,
    coreFactor: 0.70,
    ncrFactor: 0.40,
    wtDice: 0.9130,
    tcDice: 0.8690,
    etDice: 0.8420,
    wtSensitivity: 0.9180,
    tcSensitivity: 0.8780,
    etSensitivity: 0.8540,
    wtSpecificity: 0.9984,
    tcSpecificity: 0.9991,
    etSpecificity: 0.9996,
  },
  // Reading 4 (Follow-up scan 4): Peak fine-tuned accuracy within realistic clinical bounds (<95%)
  study_exam_04: {
    radX: 12.2,
    radY: 14.0,
    radZ: 11.4,
    edemaFactor: 1.14,
    coreFactor: 0.62,
    ncrFactor: 0.32,
    wtDice: 0.9320,
    tcDice: 0.8910,
    etDice: 0.8680,
    wtSensitivity: 0.9360,
    tcSensitivity: 0.9020,
    etSensitivity: 0.8790,
    wtSpecificity: 0.9988,
    tcSpecificity: 0.9994,
    etSpecificity: 0.9998,
  },
};

// Default backwards-compatible provenance
export const DEMO_PROVENANCE: StudyProvenance = {
  studyId: 'study_exam_01',
  patientDeidentifiedId: 'PAT-2026-0042',
  institution: 'Memorial Neurological Institute',
  createdTimestamp: '2025-10-14T09:30:00Z',
  processedTimestamp: '2025-10-14T09:34:12Z',
  softwareVersion: 'NeuroScope-3D v1.0.0-rc1',
  gitCommit: 'b30c05a',
  isDemoData: true,
  files: [
    { sequence: 'T1', filename: 't1.nii.gz', fileSize: 4125890, sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', dimensions: '128 × 128 × 96', spacing: '1.00 × 1.00 × 1.00 mm' },
    { sequence: 'T1Gd', filename: 't1ce.nii.gz', fileSize: 4210450, sha256: '5f9b4c2b9a7f34f0e9b9c1d683a54b3834b9d0e7685f0ef3524a87c1265c719e', dimensions: '128 × 128 × 96', spacing: '1.00 × 1.00 × 1.00 mm' },
    { sequence: 'T2', filename: 't2.nii.gz', fileSize: 4180210, sha256: 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35', dimensions: '128 × 128 × 96', spacing: '1.00 × 1.00 × 1.00 mm' },
    { sequence: 'FLAIR', filename: 'flair.nii.gz', fileSize: 4195120, sha256: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce', dimensions: '128 × 128 × 96', spacing: '1.00 × 1.00 × 1.00 mm' },
    { sequence: 'EXPERT_MASK', filename: 'expert_mask.nii.gz', fileSize: 845200, sha256: '7d793037a0760186574b0282f2f435e7b1e50774690f45041ec3a700fb7b5014', dimensions: '128 × 128 × 96', spacing: '1.00 × 1.00 × 1.00 mm' },
  ],
  volumes: {
    wtMl: 15.03,
    tcMl: 6.39,
    etMl: 3.84,
    spacing: '1.00 × 1.00 × 1.00 mm',
    formula: 'Volume (mL) = Voxel Count × (dx × dy × dz) / 1000',
  },
  metrics: {
    hasExpertMask: true,
    wtDice: 0.8520,
    tcDice: 0.7980,
    etDice: 0.7640,
    wtSensitivity: 0.8610,
    tcSensitivity: 0.8120,
    etSensitivity: 0.7780,
    wtSpecificity: 0.9972,
    tcSpecificity: 0.9984,
    etSpecificity: 0.9991,
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
  statusMessage: 'Model inference is not connected. Operating in demonstration mode.',
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

// Cache for synthesized 3D volume arrays
const cachedDemoVolumes: Record<string, SyntheticVolumeData> = {};

/**
 * Procedurally generates an anatomically illustrative 3D brain phantom for any of the 4 demonstration examinations.
 * Matches exact dimensions (128x128x96), 1.0mm spacing, and tissue intensity profiles.
 */
export function getOrCreateDemoVolume(studyId: string = 'study_exam_01'): SyntheticVolumeData {
  if (cachedDemoVolumes[studyId]) {
    return cachedDemoVolumes[studyId];
  }

  const cfg = EXAMINATION_CONFIGS[studyId] || EXAMINATION_CONFIGS['study_exam_01'];

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

  // Tumour center in right hemisphere
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
          // Lateral ventricles
          const ventLeft = Math.pow((i - (centerX - 9)) / 6, 2) + Math.pow((j - centerY) / 18, 2) + Math.pow((k - centerZ) / 10, 2);
          const ventRight = Math.pow((i - (centerX + 9)) / 6, 2) + Math.pow((j - centerY) / 18, 2) + Math.pow((k - centerZ) / 10, 2);
          const isVentricle = ventLeft < 1.0 || ventRight < 1.0;

          let t1Val = isVentricle ? 25 : 140;
          let t1ceVal = t1Val;
          let t2Val = isVentricle ? 245 : 95;
          let flairVal = isVentricle ? 15 : 110;

          // Tumour distance calculation using exam-specific radii
          const tdx = (i - tumourCenterX) / cfg.radX;
          const tdy = (j - tumourCenterY) / cfg.radY;
          const tdz = (k - tumourCenterZ) / cfg.radZ;
          const tumourDistSq = tdx * tdx + tdy * tdy + tdz * tdz;

          if (tumourDistSq < cfg.edemaFactor) {
            if (tumourDistSq < cfg.ncrFactor) {
              segMask[index] = 1;
              ncrCount++;
              t1Val = 45;
              t1ceVal = 50;
              t2Val = 180;
              flairVal = 160;
            } else if (tumourDistSq < cfg.coreFactor) {
              segMask[index] = 4;
              etCount++;
              t1Val = 120;
              t1ceVal = 240;
              t2Val = 160;
              flairVal = 220;
            } else {
              segMask[index] = 2;
              edCount++;
              t1Val = 80;
              t1ceVal = 85;
              t2Val = 230;
              flairVal = 245;
            }

            // Expert ground truth with natural boundary perturbation
            const expertDistSq = tumourDistSq + Math.sin(i * 0.5) * 0.04;
            if (expertDistSq < cfg.edemaFactor * 0.98) {
              if (expertDistSq < cfg.ncrFactor * 0.98) {
                expertMask[index] = 1;
                expNcrCount++;
              } else if (expertDistSq < cfg.coreFactor * 0.98) {
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

  const generatedVolume: SyntheticVolumeData = {
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

  cachedDemoVolumes[studyId] = generatedVolume;
  return generatedVolume;
}

/**
 * Builds tailored study provenance for any demonstration examination slot.
 */
export function getDemoProvenanceForSlot(
  slot: DemoExaminationSlot,
  receipt?: DemoExecutionReceipt | null,
  liveMetrics?: EvaluationMetrics | null
): StudyProvenance {
  const cfg = EXAMINATION_CONFIGS[slot.studyId] || EXAMINATION_CONFIGS['study_exam_01'];

  return {
    studyId: slot.studyId,
    patientDeidentifiedId: slot.patientId,
    institution: slot.facility,
    createdTimestamp: slot.examinationDate,
    processedTimestamp: receipt ? receipt.timestamp : slot.examinationDate,
    softwareVersion: 'NeuroScope-3D v1.0.0-rc1',
    gitCommit: 'b30c05a',
    isDemoData: true,
    files: [
      { sequence: 'T1', filename: `${slot.studyId}_t1.nii.gz`, fileSize: 4125890, sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', dimensions: '128 × 128 × 96', spacing: '1.00 × 1.00 × 1.00 mm' },
      { sequence: 'T1Gd', filename: `${slot.studyId}_t1ce.nii.gz`, fileSize: 4210450, sha256: '5f9b4c2b9a7f34f0e9b9c1d683a54b3834b9d0e7685f0ef3524a87c1265c719e', dimensions: '128 × 128 × 96', spacing: '1.00 × 1.00 × 1.00 mm' },
      { sequence: 'T2', filename: `${slot.studyId}_t2.nii.gz`, fileSize: 4180210, sha256: 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35', dimensions: '128 × 128 × 96', spacing: '1.00 × 1.00 × 1.00 mm' },
      { sequence: 'FLAIR', filename: `${slot.studyId}_flair.nii.gz`, fileSize: 4195120, sha256: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce', dimensions: '128 × 128 × 96', spacing: '1.00 × 1.00 × 1.00 mm' },
      { sequence: 'EXPERT_MASK', filename: `${slot.studyId}_expert_mask.nii.gz`, fileSize: 845200, sha256: '7d793037a0760186574b0282f2f435e7b1e50774690f45041ec3a700fb7b5014', dimensions: '128 × 128 × 96', spacing: '1.00 × 1.00 × 1.00 mm' },
    ],
    volumes: {
      wtMl: slot.volumes.wtVolumeMl,
      tcMl: slot.volumes.tcVolumeMl,
      etMl: slot.volumes.etVolumeMl,
      spacing: '1.00 × 1.00 × 1.00 mm',
      formula: 'Volume (mL) = Voxel Count × (dx × dy × dz) / 1000',
    },
    metrics: liveMetrics || {
      hasExpertMask: true,
      wtDice: cfg.wtDice,
      tcDice: cfg.tcDice,
      etDice: cfg.etDice,
      wtSensitivity: cfg.wtSensitivity ?? 0.8610,
      tcSensitivity: cfg.tcSensitivity ?? 0.8120,
      etSensitivity: cfg.etSensitivity ?? 0.7780,
      wtSpecificity: cfg.wtSpecificity ?? 0.9972,
      tcSpecificity: cfg.tcSpecificity ?? 0.9984,
      etSpecificity: cfg.etSpecificity ?? 0.9991,
    },
    disclaimer:
      'Research and teaching prototype only. Not for clinical diagnosis or treatment decisions. Model outputs are experimental and require independent expert review.',
  };
}
