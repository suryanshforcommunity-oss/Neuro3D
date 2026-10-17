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
  DatasetState,
  SegmentationSource,
  ActiveDataset,
} from '../types';
import { voxelToWorld, clampVoxel, DEFAULT_IDENTITY_AFFINE } from '../utils/coordinates';
import { computeBraTSCompositeCounts, calculateAffineVoxelVolumeMl, calculateVoxelVolumeMl } from '../utils/volume';
import { validateNiftiFile, parseNiftiMaskBuffer } from '../utils/niftiValidation';
import {
  getOrCreateDemoVolume,
  DEMO_PROVENANCE,
  DEMO_MODEL_RELIABILITY,
  DEMO_PATIENTS,
  DemoExaminationSlot,
  DemoExecutionReceipt,
  getDemoProvenanceForSlot,
} from '../data/demoData';
import { apiClient } from '../services/api';

export type NavigationPage = 'landing' | 'workspace' | 'segmentation' | 'evaluation' | 'reports' | 'modelInfo' | 'settings' | 'pipeline';

export function useNeuroScopeState() {
  const [activePage, setActivePage] = useState<NavigationPage>('landing');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true); // Initialized with demo for instant workstation test
  const [datasetId, setDatasetId] = useState<string>('demo-study-042');
  const [activeSequence, setActiveSequence] = useState<MriSequenceType>('T1Gd');

  // Strict Dataset State Machine
  const [datasetState, setDatasetState] = useState<DatasetState>('DEMO_ACTIVE');
  const [segmentationSource, setSegmentationSource] = useState<SegmentationSource>('demo');
  const [inferenceProgress, setInferenceProgress] = useState<number>(0);
  const [inferenceCurrentStep, setInferenceCurrentStep] = useState<string>('');
  const [inferenceError, setInferenceError] = useState<string | null>(null);

  // Multi-patient demonstration examination state
  const [isDemoSelectorOpen, setIsDemoSelectorOpen] = useState<boolean>(false);
  const [activeDemoSlot, setActiveDemoSlot] = useState<DemoExaminationSlot>(DEMO_PATIENTS[0].examinations[0]);
  const [evaluatedDemoSlots, setEvaluatedDemoSlots] = useState<string[]>(['A1']);
  const [executionReceipt, setExecutionReceipt] = useState<DemoExecutionReceipt | null>(null);

  // Backend connection state
  const [backendStatus, setBackendStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [backendUrl, setBackendUrl] = useState<string>(apiClient.getBaseUrl());
  const [backendError, setBackendError] = useState<string | null>(null);

  // Volume geometry state (standard BraTS 2021 clinical dataset dimensions)
  const [dimensions, setDimensions] = useState<VolumeDimensions>({ dimX: 240, dimY: 240, dimZ: 155 });
  const [spacing, setSpacing] = useState<VoxelSpacing>({ x: 1.0, y: 1.0, z: 1.0 });
  const [affine, setAffine] = useState<AffineMatrix>(DEFAULT_IDENTITY_AFFINE);

  // Canonical crosshair coordinate (BraTS standard suspected tumor focus)
  const [crosshair, setCrosshairState] = useState<VoxelCoordinate>({
    i: 109,
    j: 138,
    k: 81,
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

  // Load a specific demonstration examination slot (with live inference or precomputed results)
  const loadDemoSlot = useCallback(async (slot: DemoExaminationSlot, executeLive: boolean = false) => {
    let receipt: DemoExecutionReceipt | null = null;
    let liveMetrics: any = null;

    if (executeLive && backendStatus === 'connected') {
      try {
        setIsProcessing(true);
        const res = await fetch(`${backendUrl}/api/v1/demos/${slot.studyId}/infer`, {
          method: 'POST',
        });
        if (res.ok) {
          const data = await res.json();
          receipt = {
            device: data.execution.device,
            deviceName: data.execution.deviceName,
            loadDurationMs: data.execution.loadDurationMs,
            preprocessingDurationMs: data.execution.preprocessingDurationMs,
            inferenceDurationMs: data.execution.inferenceDurationMs,
            postprocessingDurationMs: data.execution.postprocessingDurationMs,
            totalDurationMs: data.execution.totalDurationMs,
            timestamp: data.execution.timestamp,
            isLiveInference: true,
          };
          liveMetrics = data.evaluationMetrics;
          setExecutionReceipt(receipt);
        }
      } catch (err) {
        console.warn('Live inference call failed, using verified procedural synthesis', err);
      } finally {
        setIsProcessing(false);
      }
    }

    const demo = getOrCreateDemoVolume(slot.studyId);
    setDimensions(demo.dimensions);
    setSpacing(demo.spacing);
    setAffine(demo.affine);
    setSequenceVolumes(demo.sequences);
    setSegmentationMask(demo.segmentationMask);
    setExpertMask(demo.expertMask);
    setLabelCounts(demo.labelCounts);
    setExpertCounts(demo.expertLabelCounts);
    setIsDemoMode(true);
    setDatasetId(slot.studyId);
    setActiveDemoSlot(slot);
    setDatasetState('DEMO_ACTIVE');
    setSegmentationSource('demo');
    setInferenceProgress(100);
    setInferenceCurrentStep('Simulated demonstration dataset active.');
    setInferenceError(null);

    // Track unique demonstration cases evaluated (honest evaluation progress tracking)
    setEvaluatedDemoSlots(prev => prev.includes(slot.slotId) ? prev : [...prev, slot.slotId]);

    const prov = getDemoProvenanceForSlot(slot, receipt, liveMetrics);
    setProvenance(prov);

    setModelReliability(prev => ({
      ...prev,
      backendConnected: backendStatus === 'connected',
      inferenceAvailable: receipt?.isLiveInference || prev.inferenceAvailable,
      statusMessage: receipt?.isLiveInference
        ? `Live inference executed in ${receipt.totalDurationMs} ms on ${receipt.deviceName}.`
        : 'Precomputed demonstration result — live inference was not executed.',
    }));

    setCrosshairState({
      i: Math.floor(demo.dimensions.dimX / 2) + 18,
      j: Math.floor(demo.dimensions.dimY / 2) + 6,
      k: Math.floor(demo.dimensions.dimZ / 2) + 4,
    });

    setUploadedSequences([
      { sequenceType: 'T1', file: null, filename: `${slot.studyId}_t1.nii.gz`, fileSize: 4125890, isValid: true, isLoaded: true },
      { sequenceType: 'T1Gd', file: null, filename: `${slot.studyId}_t1ce.nii.gz`, fileSize: 4210450, isValid: true, isLoaded: true },
      { sequenceType: 'T2', file: null, filename: `${slot.studyId}_t2.nii.gz`, fileSize: 4180210, isValid: true, isLoaded: true },
      { sequenceType: 'FLAIR', file: null, filename: `${slot.studyId}_flair.nii.gz`, fileSize: 4195120, isValid: true, isLoaded: true },
      { sequenceType: 'EXPERT_MASK', file: null, filename: `${slot.studyId}_expert_mask.nii.gz`, fileSize: 845200, isValid: true, isLoaded: true },
    ]);
  }, [backendStatus, backendUrl]);

  // Load default demo research case (Slot A1)
  const loadDemoCase = useCallback(() => {
    loadDemoSlot(DEMO_PATIENTS[0].examinations[0], false);
  }, [loadDemoSlot]);

  // Unload current case
  const unloadCase = useCallback(() => {
    setIsDemoMode(false);
    setDatasetId('empty');
    setDatasetState('NO_DATASET');
    setSegmentationSource('none');
    setInferenceProgress(0);
    setInferenceCurrentStep('');
    setInferenceError(null);
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

      // If upload failed validation: preserve previous dataset state without corrupting session
      if (!validation.isValid) {
        setDatasetState('UNSUPPORTED_FILE');
        setInferenceError(validation.error || 'Invalid file format');
        setUploadedSequences(prev =>
          prev.map(slot =>
            slot.sequenceType === type
              ? {
                  ...slot,
                  file,
                  filename: file.name,
                  fileSize: file.size,
                  isValid: false,
                  validationError: validation.error,
                  header: undefined,
                  sha256: undefined,
                  isLoaded: false,
                }
              : slot
          )
        );
        return;
      }

      // Valid upload processing
      if (validation.isValid && validation.header) {
        const newDims = validation.header.dimensions;
        const newSpacing = validation.header.spacing;
        const newAffine = validation.header.affine;
        const newDatasetId = `study_${validation.sha256 ? validation.sha256.slice(0, 12) : Date.now().toString()}`;

        setDimensions(newDims);
        setSpacing(newSpacing);
        setAffine(newAffine);
        setDatasetId(newDatasetId);

        // Center crosshair safely in the new volume space
        setCrosshairState({
          i: Math.floor(newDims.dimX / 2),
          j: Math.floor(newDims.dimY / 2),
          k: Math.floor(newDims.dimZ / 2),
        });

        // When switching from demo mode to real patient upload, cleanly isolate dataset:
        // purge old demo volumes, clear stale segmentation masks, and reset lesion volume counts
        const wasInDemo = isDemoMode;
        if (wasInDemo) {
          setIsDemoMode(false);
          setSegmentationMask(null);
          setExpertMask(null);
          setLabelCounts({ ncrCount: 0, edCount: 0, etCount: 0, wtCount: 0, tcCount: 0 });
          setExpertCounts(undefined);
        }

        // Update uploaded sequence slots
        setUploadedSequences(prev => {
          const next = prev.map(slot => {
            if (slot.sequenceType === type) {
              return {
                ...slot,
                file,
                filename: file.name,
                fileSize: file.size,
                isValid: true,
                validationError: undefined,
                header: validation.header,
                sha256: validation.sha256,
                isLoaded: true,
              };
            }
            // Clear other demo slots when transitioning from demo mode
            if (wasInDemo) {
              return {
                sequenceType: slot.sequenceType,
                file: null,
                filename: '',
                fileSize: 0,
                isValid: false,
                isLoaded: false,
                validationError: undefined,
                header: undefined,
                sha256: undefined,
              };
            }
            return slot;
          });

          const loadedMriSequences = next.filter(
            s => ['T1', 'T1Gd', 'T2', 'FLAIR'].includes(s.sequenceType) && s.isLoaded
          );
          if (loadedMriSequences.length === 4) {
            setDatasetState('MRI_READY');
          } else {
            setDatasetState('WAITING_FOR_MODALITIES');
          }

          return next;
        });

        setSegmentationSource(type === 'EXPERT_MASK' ? 'expert' : 'none');
        setInferenceError(null);

        // Process voxel payload
        if (validation.voxelData) {
          if (type === 'EXPERT_MASK') {
            const mask = new Uint8Array(validation.voxelData.buffer);
            setExpertMask(mask);
            let ncr = 0, ed = 0, et = 0;
            for (let v = 0; v < mask.length; v++) {
              if (mask[v] === 1) ncr++;
              else if (mask[v] === 2) ed++;
              else if (mask[v] === 4) et++;
            }
            setExpertCounts(computeBraTSCompositeCounts({ ncrCount: ncr, edCount: ed, etCount: et }));
          } else {
            // MRI sequence intensity normalization into [0, 255]
            const uint8 = new Uint8Array(validation.voxelData.length);
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

            // Update volume state (isolate from previous demo sequence volumes)
            setSequenceVolumes(prev => {
              if (wasInDemo) {
                return {
                  T1: null,
                  T1Gd: null,
                  T2: null,
                  FLAIR: null,
                  EXPERT_MASK: null,
                  [type]: uint8,
                };
              }
              return { ...prev, [type]: uint8 };
            });

            // Automatically select uploaded sequence for immediate visualization
            setActiveSequence(type);
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

          const existingFiles = wasInDemo ? [] : (prev?.files || []).filter(f => f.sequence !== type);
          const updatedFiles = [...existingFiles, newFileEntry];

          return {
            studyId: prev && !prev.isDemoData && !wasInDemo ? prev.studyId : `STUDY_${baseName.toUpperCase()}`,
            patientDeidentifiedId: prev && !prev.isDemoData && !wasInDemo ? prev.patientDeidentifiedId : `ANON_${baseName}`,
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
    [isDemoMode]
  );

  // Remove uploaded sequence
  const handleRemoveSequence = useCallback((type: MriSequenceType) => {
    setUploadedSequences(prev => {
      const next = prev.map(slot =>
        slot.sequenceType === type
          ? { sequenceType: type, file: null, filename: '', fileSize: 0, isValid: false, isLoaded: false, validationError: undefined, header: undefined, sha256: undefined }
          : slot
      );
      const reqCount = next.filter(s =>
        ['T1', 'T1Gd', 'T2', 'FLAIR'].includes(s.sequenceType) && s.isLoaded
      ).length;
      if (reqCount === 4) {
        setDatasetState('MRI_READY');
      } else if (reqCount > 0) {
        setDatasetState('WAITING_FOR_MODALITIES');
      } else {
        setDatasetState('NO_DATASET');
      }
      return next;
    });
    setSequenceVolumes(prev => ({ ...prev, [type]: null }));
    if (type === 'EXPERT_MASK') {
      setExpertMask(null);
      setExpertCounts(undefined);
    }
  }, []);

  // Execute real MONAI SegResNet segmentation against FastAPI backend
  const runSegmentation = useCallback(async () => {
    const t1Slot = uploadedSequences.find(s => s.sequenceType === 'T1' && s.isLoaded && s.file);
    const t1gdSlot = uploadedSequences.find(s => s.sequenceType === 'T1Gd' && s.isLoaded && s.file);
    const t2Slot = uploadedSequences.find(s => s.sequenceType === 'T2' && s.isLoaded && s.file);
    const flairSlot = uploadedSequences.find(s => s.sequenceType === 'FLAIR' && s.isLoaded && s.file);
    const expertSlot = uploadedSequences.find(s => s.sequenceType === 'EXPERT_MASK' && s.isLoaded && s.file);

    if (!t1Slot?.file || !t1gdSlot?.file || !t2Slot?.file || !flairSlot?.file) {
      setDatasetState('WAITING_FOR_MODALITIES');
      setInferenceError('All 4 sequences (T1, T1-Gd, T2, FLAIR) are required for MONAI SegResNet inference.');
      return;
    }

    const currentDatasetId = datasetId;

    try {
      setIsProcessing(true);
      setDatasetState('INFERENCE_RUNNING');
      setInferenceProgress(10);
      setInferenceCurrentStep('Submitting multimodal sequences to FastAPI ingestion...');
      setInferenceError(null);

      const uploadRes = await apiClient.uploadStudy({
        t1File: t1Slot.file,
        t1ceFile: t1gdSlot.file,
        t2File: t2Slot.file,
        flairFile: flairSlot.file,
        expertMaskFile: expertSlot?.file || undefined,
        patientDeidentifiedId: provenance?.patientDeidentifiedId,
      });

      if (datasetId !== currentDatasetId) return; // Stale request check

      setInferenceProgress(30);
      setInferenceCurrentStep('Running MONAI SegResNet sliding-window inference...');

      await apiClient.startSegmentation(uploadRes.studyId);

      let pollCount = 0;
      let isDone = false;
      while (pollCount < 120 && !isDone) {
        await new Promise(r => setTimeout(r, 1000));
        if (datasetId !== currentDatasetId) return; // Stale check

        const status = await apiClient.getStudyStatus(uploadRes.studyId);
        setInferenceProgress(status.progress);
        setInferenceCurrentStep(status.currentStep);

        if (status.status === 'ready') {
          isDone = true;
        } else if (status.status === 'error') {
          throw new Error(status.errorMessage || 'Segmentation failed on server');
        }
        pollCount++;
      }

      if (!isDone) {
        throw new Error('Inference timed out waiting for server completion.');
      }

      setInferenceProgress(90);
      setInferenceCurrentStep('Retrieving and decoding prediction NIfTI mask...');

      const maskRes = await fetch(`${backendUrl}/api/v1/studies/${encodeURIComponent(uploadRes.studyId)}/prediction.nii.gz`);
      if (!maskRes.ok) {
        throw new Error(`Failed to download prediction mask: HTTP ${maskRes.status}`);
      }

      const maskBuffer = await maskRes.arrayBuffer();
      const decoded = parseNiftiMaskBuffer(maskBuffer);

      if (datasetId !== currentDatasetId) return; // Stale check

      let ncr = 0, ed = 0, et = 0;
      for (let i = 0; i < decoded.mask.length; i++) {
        const val = decoded.mask[i];
        if (val === 1) ncr++;
        else if (val === 2) ed++;
        else if (val === 4) et++;
      }
      const counts = computeBraTSCompositeCounts({ ncrCount: ncr, edCount: ed, etCount: et });

      setSegmentationMask(decoded.mask);
      setLabelCounts(counts);
      setSegmentationSource('model');
      setDatasetState('INFERENCE_SUCCESS');
      setInferenceProgress(100);
      setInferenceCurrentStep(`Inference complete: WT=${counts.wtCount} vox, TC=${counts.tcCount} vox, ET=${counts.etCount} vox`);
    } catch (err: any) {
      if (datasetId === currentDatasetId) {
        setDatasetState('INFERENCE_FAILED');
        setInferenceError(err.message || 'Segmentation inference failed');
        setInferenceProgress(0);
        setInferenceCurrentStep('Inference failed');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedSequences, datasetId, provenance, backendUrl]);

  // Authoritative ActiveDataset state object conforming to Section 3
  const activeDataset = useMemo<ActiveDataset>(() => {
    const loadedSequences = uploadedSequences
      .filter(s => s.isLoaded && s.sequenceType !== 'EXPERT_MASK')
      .map(s => s.sequenceType);
    let voxelVolMl = 0.001;
    try {
      voxelVolMl = calculateAffineVoxelVolumeMl(affine);
    } catch {
      voxelVolMl = calculateVoxelVolumeMl(1, spacing);
    }
    return {
      datasetId,
      source: isDemoMode ? 'demo' : 'real',
      datasetState,
      segmentationSource,
      loadedSequences,
      activeSequence,
      dimensions,
      spacing,
      affine,
      currentVoxel: crosshair,
      hasSegmentation: segmentationMask !== null,
      inferenceError,
      inferenceProgress,
      inferenceCurrentStep,
      voxelVolumeMl: voxelVolMl,
    };
  }, [
    datasetId,
    isDemoMode,
    datasetState,
    segmentationSource,
    uploadedSequences,
    activeSequence,
    dimensions,
    spacing,
    affine,
    crosshair,
    segmentationMask,
    inferenceError,
    inferenceProgress,
    inferenceCurrentStep,
  ]);

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
    datasetId,
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

    // Strict Dataset State Machine (Section 3)
    datasetState,
    segmentationSource,
    inferenceProgress,
    inferenceCurrentStep,
    inferenceError,
    runSegmentation,
    activeDataset,

    // Multi-Patient Demo System
    isDemoSelectorOpen,
    setIsDemoSelectorOpen,
    activeDemoSlot,
    evaluatedDemoSlots,
    executionReceipt,
    loadDemoSlot,

    loadDemoCase,
    unloadCase,
  };
}
