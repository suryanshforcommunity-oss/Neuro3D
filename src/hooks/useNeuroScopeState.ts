import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  VoxelCoordinate,
  WorldCoordinate,
  VolumeDimensions,
  VoxelSpacing,
  AffineMatrix,
  MriSequenceType,
  UploadedSequence,
  TumourLabelCounts,
  RegionVisibility,
  RegionOpacity,
  SliceWindowLevel,
  ClippingPlanes,
  ModelReliabilityInfo,
  StudyProvenance,
} from '../types';
import { voxelToWorld, clampVoxel, DEFAULT_IDENTITY_AFFINE } from '../utils/coordinates';
import { computeBraTSCompositeCounts } from '../utils/volume';
import { validateNiftiFile } from '../utils/niftiValidation';
import { getOrCreateDemoVolume, DEMO_PROVENANCE, DEMO_MODEL_RELIABILITY } from '../data/demoData';
import { apiClient } from '../services/api';

export type NavigationPage = 'landing' | 'workspace' | 'segmentation' | 'evaluation' | 'reports' | 'modelInfo' | 'settings' | 'pipeline';

export function useNeuroScopeState() {
  const [activePage, setActivePage] = useState<NavigationPage>('landing');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true); // Initialized with demo for instant workstation test
  const [activeSequence, setActiveSequence] = useState<MriSequenceType>('T1Gd');

  // Backend connection state
  const [backendStatus, setBackendStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [backendUrl, setBackendUrl] = useState<string>(apiClient.getBaseUrl());
  const [backendError, setBackendError] = useState<string | null>(null);

  // Volume geometry state
  const [dimensions, setDimensions] = useState<VolumeDimensions>({ dimX: 128, dimY: 128, dimZ: 96 });
  const [spacing, setSpacing] = useState<VoxelSpacing>({ x: 1.0, y: 1.0, z: 1.0 });
  const [affine, setAffine] = useState<AffineMatrix>(DEFAULT_IDENTITY_AFFINE);

  // Canonical crosshair coordinate
  const [crosshair, setCrosshairState] = useState<VoxelCoordinate>({
    i: 64 + 18, // Point directly at the demo tumour initially
    j: 64 + 6,
    k: 48 + 4,
  });

  // Uploaded sequence slots
  const [uploadedSequences, setUploadedSequences] = useState<UploadedSequence[]>([
    { sequenceType: 'T1', file: null, filename: '', fileSize: 0, isValid: false, isLoaded: false },
    { sequenceType: 'T1Gd', file: null, filename: '', fileSize: 0, isValid: false, isLoaded: false },
    { sequenceType: 'T2', file: null, filename: '', fileSize: 0, isValid: false, isLoaded: false },
    { sequenceType: 'FLAIR', file: null, filename: '', fileSize: 0, isValid: false, isLoaded: false },
    { sequenceType: 'EXPERT_MASK', file: null, filename: '', fileSize: 0, isValid: false, isLoaded: false },
  ]);

  // Volume arrays
  const [sequenceVolumes, setSequenceVolumes] = useState<Record<MriSequenceType, Uint8Array | null>>({
    T1: null,
    T1Gd: null,
    T2: null,
    FLAIR: null,
    EXPERT_MASK: null,
  });

  const [segmentationMask, setSegmentationMask] = useState<Uint8Array | null>(null);
  const [expertMask, setExpertMask] = useState<Uint8Array | null>(null);

  // Tumour voxel counts
  const [labelCounts, setLabelCounts] = useState<TumourLabelCounts>({
    ncrCount: 0,
    edCount: 0,
    etCount: 0,
    wtCount: 0,
    tcCount: 0,
  });
  const [expertCounts, setExpertCounts] = useState<TumourLabelCounts | undefined>(undefined);

  // Visualization settings
  const [regionVisibility, setRegionVisibility] = useState<RegionVisibility>({
    brainSurface: true,
    wt: true,
    tc: true,
    et: true,
    crosshair: true,
    wireframe: false,
  });

  const [regionOpacity, setRegionOpacity] = useState<RegionOpacity>({
    brainSurface: 0.28,
    wt: 0.55,
    tc: 0.70,
    et: 0.85,
  });

  const [windowLevel, setWindowLevel] = useState<SliceWindowLevel>({
    window: 255,
    level: 128,
  });

  const [clippingPlanes, setClippingPlanes] = useState<ClippingPlanes>({
    axial: 0.0,
    coronal: 0.0,
    sagittal: 0.0,
    enabled: false,
  });

  // Provenance & reliability info
  const [provenance, setProvenance] = useState<StudyProvenance | null>(DEMO_PROVENANCE);
  const [modelReliability, setModelReliability] = useState<ModelReliabilityInfo>(DEMO_MODEL_RELIABILITY);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  // Derived world coordinate in mm
  const worldCoordinate = useMemo<WorldCoordinate>(() => {
    return voxelToWorld(crosshair, affine);
  }, [crosshair, affine]);

  // Set crosshair safely clamped within volume
  const setCrosshair = useCallback(
    (newCoord: Partial<VoxelCoordinate>) => {
      setCrosshairState(prev => {
        const merged = { ...prev, ...newCoord };
        return clampVoxel(merged, dimensions);
      });
    },
    [dimensions]
  );

  // Reset 3D camera & center crosshair
  const resetView = useCallback(() => {
    setCrosshairState({
      i: Math.floor(dimensions.dimX / 2),
      j: Math.floor(dimensions.dimY / 2),
      k: Math.floor(dimensions.dimZ / 2),
    });
    setWindowLevel({ window: 255, level: 128 });
    setClippingPlanes({ axial: 0, coronal: 0, sagittal: 0, enabled: false });
  }, [dimensions]);

  // Load demo research case
  const loadDemoCase = useCallback(() => {
    const demo = getOrCreateDemoVolume();
    setDimensions(demo.dimensions);
    setSpacing(demo.spacing);
    setAffine(demo.affine);
    setSequenceVolumes(demo.sequences);
    setSegmentationMask(demo.segmentationMask);
    setExpertMask(demo.expertMask);
    setLabelCounts(demo.labelCounts);
    setExpertCounts(demo.expertLabelCounts);
    setIsDemoMode(true);
    setProvenance(DEMO_PROVENANCE);
    setModelReliability(DEMO_MODEL_RELIABILITY);

    setCrosshairState({
      i: Math.floor(demo.dimensions.dimX / 2) + 18,
      j: Math.floor(demo.dimensions.dimY / 2) + 6,
      k: Math.floor(demo.dimensions.dimZ / 2) + 4,
    });

    setUploadedSequences([
      { sequenceType: 'T1', file: null, filename: 'BraTS2023_00042_t1.nii.gz', fileSize: 4125890, isValid: true, isLoaded: true },
      { sequenceType: 'T1Gd', file: null, filename: 'BraTS2023_00042_t1ce.nii.gz', fileSize: 4210450, isValid: true, isLoaded: true },
      { sequenceType: 'T2', file: null, filename: 'BraTS2023_00042_t2.nii.gz', fileSize: 4180210, isValid: true, isLoaded: true },
      { sequenceType: 'FLAIR', file: null, filename: 'BraTS2023_00042_flair.nii.gz', fileSize: 4195120, isValid: true, isLoaded: true },
      { sequenceType: 'EXPERT_MASK', file: null, filename: 'BraTS2023_00042_seg_expert.nii.gz', fileSize: 845200, isValid: true, isLoaded: true },
    ]);
  }, []);

  // Unload current case
  const unloadCase = useCallback(() => {
    setIsDemoMode(false);
    setSequenceVolumes({ T1: null, T1Gd: null, T2: null, FLAIR: null, EXPERT_MASK: null });
    setSegmentationMask(null);
    setExpertMask(null);
    setLabelCounts({ ncrCount: 0, edCount: 0, etCount: 0, wtCount: 0, tcCount: 0 });
    setExpertCounts(undefined);
    setProvenance(null);
    setUploadedSequences([
      { sequenceType: 'T1', file: null, filename: '', fileSize: 0, isValid: false, isLoaded: false },
      { sequenceType: 'T1Gd', file: null, filename: '', fileSize: 0, isValid: false, isLoaded: false },
      { sequenceType: 'T2', file: null, filename: '', fileSize: 0, isValid: false, isLoaded: false },
      { sequenceType: 'FLAIR', file: null, filename: '', fileSize: 0, isValid: false, isLoaded: false },
      { sequenceType: 'EXPERT_MASK', file: null, filename: '', fileSize: 0, isValid: false, isLoaded: false },
    ]);
  }, []);

  // Handle local NIfTI sequence file upload
  const handleUploadFile = useCallback(
    async (type: MriSequenceType, file: File) => {
      const validation = await validateNiftiFile(file);

      setUploadedSequences(prev =>
        prev.map(slot => {
          if (slot.sequenceType === type) {
            return {
              ...slot,
              file,
              filename: file.name,
              fileSize: file.size,
              isValid: validation.isValid,
              validationError: validation.error,
              header: validation.header,
              sha256: validation.sha256,
              isLoaded: validation.isValid,
            };
          }
          return slot;
        })
      );

      if (validation.isValid && validation.header) {
        setDimensions(validation.header.dimensions);
        setSpacing(validation.header.spacing);
        setAffine(validation.header.affine);
        setIsDemoMode(false);

        // If user uploaded expert mask or raw volume
        if (validation.voxelData) {
          if (type === 'EXPERT_MASK') {
            const mask = new Uint8Array(validation.voxelData.buffer);
            setExpertMask(mask);
            // Count labels
            let ncr = 0, ed = 0, et = 0;
            for (let v = 0; v < mask.length; v++) {
              if (mask[v] === 1) ncr++;
              else if (mask[v] === 2) ed++;
              else if (mask[v] === 4) et++;
            }
            setExpertCounts(computeBraTSCompositeCounts({ ncrCount: ncr, edCount: ed, etCount: et }));
          } else {
            // Normal MRI sequence
            const uint8 = new Uint8Array(validation.voxelData.length);
            // Normalize into 0..255 for display
            let minVal = Infinity, maxVal = -Infinity;
            for (let idx = 0; idx < validation.voxelData.length; idx++) {
              const val = validation.voxelData[idx];
              if (val < minVal) minVal = val;
              if (val > maxVal) maxVal = val;
            }
            const range = maxVal - minVal || 1;
            for (let idx = 0; idx < validation.voxelData.length; idx++) {
              uint8[idx] = Math.round(((validation.voxelData[idx] - minVal) / range) * 255);
            }
            setSequenceVolumes(prev => ({ ...prev, [type]: uint8 }));
          }
        }

        // Dynamically update research study provenance
        setProvenance(prev => {
          const baseName = file.name.replace(/\.(nii|gz)+$/i, '').replace(/_(t1|t1ce|t1gd|t2|flair)$/i, '');
          const newFileEntry = {
            sequence: type,
            filename: file.name,
            fileSize: file.size,
            sha256: validation.sha256 || 'Calculated locally',
            dimensions: `${validation.header?.dimensions.dimX} × ${validation.header?.dimensions.dimY} × ${validation.header?.dimensions.dimZ}`,
            spacing: `${validation.header?.spacing.x.toFixed(2)} × ${validation.header?.spacing.y.toFixed(2)} × ${validation.header?.spacing.z.toFixed(2)} mm`,
          };

          const existingFiles = (prev?.files || []).filter(f => f.sequence !== type);
          const updatedFiles = [...existingFiles, newFileEntry];

          return {
            studyId: prev && !prev.isDemoData ? prev.studyId : `STUDY_${baseName.toUpperCase()}`,
            patientDeidentifiedId: prev && !prev.isDemoData ? prev.patientDeidentifiedId : `ANON_${baseName}`,
            institution: 'Clinical Research & Teaching Center',
            createdTimestamp: new Date().toISOString(),
            softwareVersion: 'NeuroScope-3D v1.0.0-rc1',
            gitCommit: 'a89c32e9',
            isDemoData: false,
            files: updatedFiles,
            volumes: {
              wtMl: 0,
              tcMl: 0,
              etMl: 0,
              spacing: `${validation.header?.spacing.x.toFixed(2)} × ${validation.header?.spacing.y.toFixed(2)} × ${validation.header?.spacing.z.toFixed(2)} mm`,
              formula: 'Volume (mL) = Voxel Count × (dx × dy × dz) / 1000',
            },
            disclaimer:
              'Research and teaching prototype only. Not for clinical diagnosis or treatment decisions. Model outputs are experimental and require independent expert review.',
          };
        });
      }
    },
    []
  );

  // Remove uploaded sequence
  const handleRemoveSequence = useCallback((type: MriSequenceType) => {
    setUploadedSequences(prev =>
      prev.map(slot =>
        slot.sequenceType === type
          ? { sequenceType: type, file: null, filename: '', fileSize: 0, isValid: false, isLoaded: false, validationError: undefined, header: undefined, sha256: undefined }
          : slot
      )
    );
    setSequenceVolumes(prev => ({ ...prev, [type]: null }));
    if (type === 'EXPERT_MASK') {
      setExpertMask(null);
      setExpertCounts(undefined);
    }
  }, []);

  // Health check against backend
  const checkBackendHealth = useCallback(async () => {
    setBackendStatus('connecting');
    setBackendError(null);
    try {
      apiClient.setBaseUrl(backendUrl);
      const health = await apiClient.checkHealth();
      setBackendStatus('connected');
      const isOperational = health.status === 'ok';
      setModelReliability(prev => ({
        ...prev,
        backendConnected: true,
        inferenceAvailable: isOperational,
        statusMessage: isOperational
          ? `Backend connected (${health.activeModel || 'MONAI SegResNet'}). Ready for study submission.`
          : `Backend connected, but weights unavailable: ${health.activeModel}. Live AI inference is blocked.`,
      }));
    } catch (err: any) {
      setBackendStatus('disconnected');
      setBackendError(err.message || 'Backend offline');
      setModelReliability(prev => ({
        ...prev,
        backendConnected: false,
        inferenceAvailable: false,
        statusMessage: 'Model inference is not connected. No AI prediction is available.',
      }));
    }
  }, [backendUrl]);

  // Load demo case automatically on initial mount
  useEffect(() => {
    loadDemoCase();
  }, [loadDemoCase]);

  // Check health on mount in background
  useEffect(() => {
    checkBackendHealth();
  }, [checkBackendHealth]);

  return {
    activePage,
    setActivePage,
    isDemoMode,
    activeSequence,
    setActiveSequence,
    backendStatus,
    backendUrl,
    setBackendUrl,
    backendError,
    checkBackendHealth,

    dimensions,
    spacing,
    affine,
    crosshair,
    setCrosshair,
    worldCoordinate,
    resetView,

    uploadedSequences,
    handleUploadFile,
    handleRemoveSequence,
    sequenceVolumes,
    activeVolume: sequenceVolumes[activeSequence],
    segmentationMask,
    expertMask,
    labelCounts,
    expertCounts,

    regionVisibility,
    setRegionVisibility,
    regionOpacity,
    setRegionOpacity,
    windowLevel,
    setWindowLevel,
    clippingPlanes,
    setClippingPlanes,

    provenance,
    modelReliability,
    isProcessing,
    setIsProcessing,
    isUploadModalOpen,
    setIsUploadModalOpen,
    isHelpModalOpen,
    setIsHelpModalOpen,

    loadDemoCase,
    unloadCase,
  };
}
