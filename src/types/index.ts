// Type definitions for NeuroScope 3D

export type MriSequenceType = 'T1' | 'T1Gd' | 'T2' | 'FLAIR' | 'EXPERT_MASK';

export type TumourRegion = 'WT' | 'TC' | 'ET';

export interface VoxelCoordinate {
  i: number; // Sagittal coordinate (0 to dimX - 1)
  j: number; // Coronal coordinate (0 to dimY - 1)
  k: number; // Axial coordinate (0 to dimZ - 1)
}

export interface WorldCoordinate {
  x: number; // Physical mm along X (Right-Left)
  y: number; // Physical mm along Y (Anterior-Posterior)
  z: number; // Physical mm along Z (Inferior-Superior)
}

export interface VolumeDimensions {
  dimX: number;
  dimY: number;
  dimZ: number;
}

export interface VoxelSpacing {
  x: number; // mm
  y: number; // mm
  z: number; // mm
}

export type AffineMatrix = [
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number]
];

export interface NiftiHeaderInfo {
  dimensions: VolumeDimensions;
  spacing: VoxelSpacing;
  affine: AffineMatrix;
  datatype: number;
  bitsPerVoxel: number;
  description: string;
  sha256?: string;
  minIntensity?: number;
  maxIntensity?: number;
}

export interface UploadedSequence {
  sequenceType: MriSequenceType;
  file: File | null;
  filename: string;
  fileSize: number;
  sha256?: string;
  isValid: boolean;
  validationError?: string;
  header?: NiftiHeaderInfo;
  isLoaded: boolean;
}

export interface TumourLabelCounts {
  ncrCount: number; // label 1: Necrotic / Non-enhancing core
  edCount: number;  // label 2: Peritumoral Edema
  etCount: number;  // label 4: Enhancing Tumour
  wtCount: number;  // WT = NCR + ED + ET
  tcCount: number;  // TC = NCR + ET
}

export interface RegionVolume {
  region: TumourRegion;
  displayName: string;
  color: string;
  description: string;
  definition: string;
  voxelCount: number;
  volumeMl: number; // mL = cm³
  expertVolumeMl?: number;
  differenceMl?: number;
  differencePercentage?: number;
}

export interface EvaluationMetrics {
  hasExpertMask: boolean;
  wtDice?: number;
  tcDice?: number;
  etDice?: number;
  wtSensitivity?: number;
  tcSensitivity?: number;
  etSensitivity?: number;
  wtSpecificity?: number;
  tcSpecificity?: number;
  etSpecificity?: number;
}

export interface ModelReliabilityInfo {
  modelName: string;
  modelVersion: string;
  modelLicense: string;
  architecture: string;
  backendConnected: boolean;
  inferenceAvailable: boolean;
  statusMessage: string;
  preprocessingPipeline: string[];
  uncertaintyAvailable: boolean;
  uncertaintyMethod: string;
  oodScore: number | null;
  oodWarning: string | null;
  knownLimitations: string[];
}

export interface StudyProvenance {
  studyId: string;
  patientDeidentifiedId: string;
  institution: string;
  createdTimestamp: string;
  processedTimestamp?: string;
  softwareVersion: string;
  gitCommit: string;
  isDemoData: boolean;
  files: {
    sequence: MriSequenceType;
    filename: string;
    fileSize: number;
    sha256: string;
    dimensions: string;
    spacing: string;
  }[];
  volumes: {
    wtMl: number;
    tcMl: number;
    etMl: number;
    spacing: string;
    formula: string;
  };
  metrics?: EvaluationMetrics;
  disclaimer: string;
}

export interface SliceWindowLevel {
  window: number; // Contrast width
  level: number;  // Brightness center
}

export interface RegionVisibility {
  brainSurface: boolean;
  wt: boolean; // Whole tumour
  tc: boolean; // Tumour core
  et: boolean; // Enhancing tumour
  crosshair: boolean;
  wireframe: boolean;
}

export interface RegionOpacity {
  brainSurface: number;
  wt: number;
  tc: number;
  et: number;
}

export interface ClippingPlanes {
  axial: number;    // -1 to 1 (normalized cut position)
  coronal: number;
  sagittal: number;
  enabled: boolean;
}

export type DatasetState =
  | 'NO_DATASET'
  | 'DEMO_ACTIVE'
  | 'MRI_LOADING'
  | 'MRI_READY'
  | 'WAITING_FOR_MODALITIES'
  | 'INFERENCE_RUNNING'
  | 'INFERENCE_SUCCESS'
  | 'INFERENCE_FAILED'
  | 'SEGMENTATION_UNAVAILABLE'
  | 'UNSUPPORTED_FILE';

export type SegmentationSource = 'demo' | 'model' | 'expert' | 'none';

export interface ActiveDataset {
  datasetId: string;
  source: 'demo' | 'real';
  datasetState: DatasetState;
  segmentationSource: SegmentationSource;
  loadedSequences: MriSequenceType[];
  activeSequence: MriSequenceType;
  dimensions: VolumeDimensions;
  spacing: VoxelSpacing;
  affine: AffineMatrix;
  currentVoxel: VoxelCoordinate;
  hasSegmentation: boolean;
  inferenceError?: string | null;
  inferenceProgress?: number;
  inferenceCurrentStep?: string;
  voxelVolumeMl: number;
}
