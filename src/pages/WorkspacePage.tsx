import React, { useState, useMemo, useEffect } from 'react';
import { BrainViewer3D } from '../components/viewer/BrainViewer3D';
import { NeurospaceViewer3D } from '../components/viewer/NeurospaceViewer3D';
import { OrthogonalSliceView } from '../components/slices/OrthogonalSliceView';
import { NeurospaceMultiplanarView } from '../components/slices/NeurospaceMultiplanarView';
import { RegionVolumeCards } from '../components/measurements/RegionVolumeCards';
import { buildNeurospaceRegionMeshes, ensureTumorInsideBrain, NeurospaceRegionSet } from '../utils/marchingCubes';
import {
  VoxelCoordinate,
  WorldCoordinate,
  VolumeDimensions,
  VoxelSpacing,
  AffineMatrix,
  RegionVisibility,
  RegionOpacity,
  SliceWindowLevel,
  ClippingPlanes,
  TumourLabelCounts,
  MriSequenceType,
  DatasetState,
  SegmentationSource,
} from '../types';
import { Box, Layers, Zap, AlertCircle, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';

interface WorkspacePageProps {
  crosshair: VoxelCoordinate;
  onUpdateCrosshair: (coord: Partial<VoxelCoordinate>) => void;
  worldCoordinate: WorldCoordinate;
  dimensions: VolumeDimensions;
  spacing: VoxelSpacing;
  affine: AffineMatrix;
  activeVolume: Uint8Array | null;
  segmentationMask: Uint8Array | null;
  expertMask: Uint8Array | null;
  labelCounts: TumourLabelCounts;
  expertCounts?: TumourLabelCounts;
  visibility: RegionVisibility;
  opacity: RegionOpacity;
  windowLevel: SliceWindowLevel;
  clipping: ClippingPlanes;
  isDemoMode: boolean;
  datasetState?: DatasetState;
  segmentationSource?: SegmentationSource;
  inferenceProgress?: number;
  inferenceCurrentStep?: string;
  inferenceError?: string | null;
  onRunSegmentation?: () => void;
  onToggleVisibility: (key: keyof RegionVisibility) => void;
  onChangeOpacity: (key: keyof RegionOpacity, value: number) => void;
  onChangeWindowLevel: (wl: SliceWindowLevel) => void;
  onChangeClipping: (clipping: ClippingPlanes) => void;
  onResetCamera: () => void;
  activeSequence?: MriSequenceType;
  onSelectSequence?: (seq: MriSequenceType) => void;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({
  crosshair,
  onUpdateCrosshair,
  worldCoordinate,
  dimensions,
  spacing,
  affine,
  activeVolume,
  segmentationMask,
  expertMask,
  labelCounts,
  expertCounts,
  visibility,
  opacity,
  windowLevel,
  clipping,
  isDemoMode,
  datasetState = 'DEMO_ACTIVE',
  segmentationSource = 'demo',
  inferenceProgress = 0,
  inferenceCurrentStep = '',
  inferenceError = null,
  onRunSegmentation,
  onToggleVisibility,
  onChangeOpacity,
  onChangeWindowLevel,
  onChangeClipping,
  onResetCamera,
  activeSequence = 'T1Gd',
  onSelectSequence,
}) => {
  // Dual-Module Comparison Toggles
  const [viewer3DMode, setViewer3DMode] = useState<'neurospace' | 'neuroscope'>('neurospace');
  const [sliceViewMode, setSliceViewMode] = useState<'neurospace' | 'classic'>('neurospace');
  const [layoutMode, setLayoutMode] = useState<'split' | 'stacked'>('split');
  const [anatomicalDemoMeshes, setAnatomicalDemoMeshes] = useState<NeurospaceRegionSet | null>(null);

  // Load realistic human anatomical brain mesh and tumor subregions
  useEffect(() => {
    let active = true;
    fetch('/models/demo_regions.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (active && data) {
          setAnatomicalDemoMeshes(data);
        }
      })
      .catch(err => {
        console.warn('Could not load anatomical demo regions:', err);
      });
    return () => {
      active = false;
    };
  }, []);

  // Generate 3D surface meshes in physical world coordinates (mm) for Neurospace-3D
  const neurospaceMeshes = useMemo(() => {
    const computed = buildNeurospaceRegionMeshes(
      segmentationMask,
      expertMask,
      activeVolume,
      dimensions,
      affine
    );

    // 1. In DEMO MODE: Use authentic clinical demo meshes from the precomputed demo examination
    if (isDemoMode) {
      if (anatomicalDemoMeshes?.brain) {
        computed.predictedRegions.brain = anatomicalDemoMeshes.brain;
        computed.expertRegions.brain = anatomicalDemoMeshes.brain;
        computed.agreementRegions.brain = anatomicalDemoMeshes.brain;
        if (anatomicalDemoMeshes.WT) computed.predictedRegions.WT = anatomicalDemoMeshes.WT;
        if (anatomicalDemoMeshes.TC) computed.predictedRegions.TC = anatomicalDemoMeshes.TC;
        if (anatomicalDemoMeshes.ET) computed.predictedRegions.ET = anatomicalDemoMeshes.ET;
        if (anatomicalDemoMeshes.WT) computed.expertRegions.WT = anatomicalDemoMeshes.WT;
        if (anatomicalDemoMeshes.TC) computed.expertRegions.TC = anatomicalDemoMeshes.TC;
        if (anatomicalDemoMeshes.ET) computed.expertRegions.ET = anatomicalDemoMeshes.ET;
      }
      return computed;
    }

    // 2. In REAL MRI MODE:
    // Pure patient-derived segmentation surfaces via Marching Cubes using the patient's affine matrix.
    // Demo tumor geometry is NEVER leaked into real MRI mode.
    // If no segmentationMask is present, predicted WT/TC/ET meshes are completely empty.
    // Reference cranial frame is provided for spatial orientation, but explicitly labeled as reference.
    if (anatomicalDemoMeshes?.brain) {
      computed.predictedRegions.brain = anatomicalDemoMeshes.brain;
      computed.expertRegions.brain = anatomicalDemoMeshes.brain;
      computed.agreementRegions.brain = anatomicalDemoMeshes.brain;
    }

    // Preserve exact physical millimeter coordinates from affine matrix (never warp or shift real tumor)
    return computed;
  }, [segmentationMask, expertMask, activeVolume, dimensions, affine, anatomicalDemoMeshes, isDemoMode]);

  // Center on tumor centroid
  const handleCenterTumour = () => {
    if (sliceViewMode === 'neurospace') {
      // Exact BraTS tumor centroid from reference examination
      onUpdateCrosshair({ i: 109, j: 138, k: 81 });
    } else {
      onUpdateCrosshair({
        i: Math.floor(dimensions.dimX / 2) + 18,
        j: Math.floor(dimensions.dimY / 2) + 6,
        k: Math.floor(dimensions.dimZ / 2) + 4,
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 gap-4 bg-slate-100/60 font-sans">
      {/* Real MRI AI Segmentation Control Banner (displayed when not in simulated demo mode) */}
      {!isDemoMode && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {datasetState === 'INFERENCE_RUNNING' ? (
              <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 flex-shrink-0 animate-spin">
                <RefreshCw className="w-5 h-5" />
              </div>
            ) : datasetState === 'INFERENCE_SUCCESS' ? (
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : datasetState === 'INFERENCE_FAILED' ? (
              <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
            ) : datasetState === 'WAITING_FOR_MODALITIES' ? (
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                <Zap className="w-5 h-5" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wide text-slate-900">
                  {datasetState === 'INFERENCE_RUNNING'
                    ? 'MONAI SegResNet Inference In Progress'
                    : datasetState === 'INFERENCE_SUCCESS'
                    ? 'AI Model Segmentation Active'
                    : datasetState === 'INFERENCE_FAILED'
                    ? 'Segmentation Inference Failed'
                    : datasetState === 'WAITING_FOR_MODALITIES'
                    ? 'Awaiting All 4 MRI Sequences'
                    : 'MRI Sequences Ready for Segmentation'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  {datasetState}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 truncate">
                {datasetState === 'INFERENCE_RUNNING'
                  ? `${inferenceCurrentStep || 'Running neural network inference...'} (${inferenceProgress}%)`
                  : datasetState === 'INFERENCE_SUCCESS'
                  ? `Whole Tumour: ${labelCounts.wtCount} voxels | TC: ${labelCounts.tcCount} voxels | ET: ${labelCounts.etCount} voxels (Source: MONAI SegResNet)`
                  : datasetState === 'INFERENCE_FAILED'
                  ? inferenceError || 'Inference encountered an error during preprocessing or sliding window execution.'
                  : datasetState === 'WAITING_FOR_MODALITIES'
                  ? 'The MONAI SegResNet BraTS model requires 4 co-registered sequences (T1, T1-Gd, T2, FLAIR). You can view available sequences or upload the remaining sequences.'
                  : 'All 4 multimodal sequences are loaded and validated. Click to execute sliding-window segmentation.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {datasetState === 'MRI_READY' && onRunSegmentation && (
              <button
                onClick={onRunSegmentation}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Run MONAI SegResNet Segmentation</span>
              </button>
            )}

            {datasetState === 'INFERENCE_FAILED' && onRunSegmentation && (
              <button
                onClick={onRunSegmentation}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Inference</span>
              </button>
            )}

            {datasetState === 'INFERENCE_RUNNING' && (
              <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                <div
                  className="bg-sky-500 h-full transition-all duration-300"
                  style={{ width: `${Math.max(5, inferenceProgress)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upper Main Interactive Grid: Large 3D Viewport + Synchronized Slice Panels */}
      <div
        className={
          layoutMode === 'stacked'
            ? 'flex flex-col gap-4'
            : 'flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[520px]'
        }
      >
        {/* 3D Brain Viewer */}
        <div
          className={`${
            layoutMode === 'stacked' ? 'w-full h-[360px]' : 'lg:col-span-5 h-[480px] lg:h-full'
          } rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs bg-[#06080e] relative flex flex-col`}
        >
          {/* 3D Module Header & Comparison Toggle */}
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#0f172a] border-b border-slate-800 text-xs z-20 flex-shrink-0">
            <span className="font-mono text-slate-300 font-bold text-[11px] flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-sky-400" />
              <span>3D BRAIN ENGINE:</span>
            </span>

            <div className="flex items-center gap-1 bg-[#1e293b] p-0.5 rounded-lg border border-slate-700/80">
              <button
                onClick={() => setViewer3DMode('neurospace')}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                  viewer3DMode === 'neurospace'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Neurospace-3D Surface Mesh & Isosurface Engine"
              >
                Neurospace 3D (New)
              </button>
              <button
                onClick={() => setViewer3DMode('neuroscope')}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                  viewer3DMode === 'neuroscope'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Original NeuroScope 3D Procedural Viewport"
              >
                NeuroScope 3D (Original)
              </button>
            </div>
          </div>

          {/* 3D Viewport Render */}
          <div className="flex-1 relative w-full h-full min-h-0">
            {viewer3DMode === 'neurospace' ? (
              <NeurospaceViewer3D
                regions={neurospaceMeshes.predictedRegions}
                expertMeshes={neurospaceMeshes.expertRegions}
                agreementMeshes={neurospaceMeshes.agreementRegions}
                cutaway={clipping.enabled}
                onToggleCutaway={() =>
                  onChangeClipping({ ...clipping, enabled: !clipping.enabled })
                }
                viewMode="predicted"
                visibleRegions={{
                  WT: visibility.wt,
                  TC: visibility.tc,
                  ET: visibility.et,
                  brain: visibility.brainSurface,
                  TP: true,
                  FP: true,
                  FN: true,
                }}
                onToggleRegion={key => {
                  if (key === 'WT') onToggleVisibility('wt');
                  else if (key === 'TC') onToggleVisibility('tc');
                  else if (key === 'ET') onToggleVisibility('et');
                  else if (key === 'brain') onToggleVisibility('brainSurface');
                }}
                opacities={{
                  WT: opacity.wt,
                  TC: opacity.tc,
                  ET: opacity.et,
                  brain: opacity.brainSurface,
                }}
                wireframe={visibility.wireframe}
                onToggleWireframe={() => onToggleVisibility('wireframe')}
                worldCrosshair={worldCoordinate}
                voxelCrosshair={crosshair}
                hasExpertMask={Boolean(expertMask)}
                isDemoMode={isDemoMode}
                hasSegmentation={Boolean(segmentationMask)}
                onResetView={onResetCamera}
                onUpdateCrosshair={onUpdateCrosshair}
              />
            ) : (
              <BrainViewer3D
                visibility={visibility}
                opacity={opacity}
                clipping={clipping}
                onToggleVisibility={onToggleVisibility}
                onChangeOpacity={onChangeOpacity}
                onChangeClipping={onChangeClipping}
                worldCoordinate={worldCoordinate}
                voxelCoordinate={crosshair}
                dimensions={dimensions}
                spacing={spacing}
                isDemoMode={isDemoMode}
                hasSegmentation={Boolean(segmentationMask)}
                onResetCamera={onResetCamera}
              />
            )}
          </div>
        </div>

        {/* 2D MRI Slice Interface */}
        <div
          className={`${
            layoutMode === 'stacked'
              ? 'w-full min-h-[540px]'
              : 'lg:col-span-7 min-h-[500px] lg:h-full'
          } rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs bg-[#060813] flex flex-col`}
        >
          {/* 2D Module Header & Comparison / Layout Toggles */}
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-xs z-20 flex-shrink-0 flex-wrap gap-2">
            <span className="font-mono text-slate-300 font-bold text-[11px] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>2D MRI SLICE INTERFACE:</span>
            </span>

            <div className="flex items-center gap-2">
              {/* Layout Switcher: Split vs Full Width */}
              <div className="flex items-center gap-1 bg-[#1e293b] p-0.5 rounded-lg border border-slate-700/80">
                <button
                  onClick={() => setLayoutMode('split')}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                    layoutMode === 'split'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Side-by-side split layout"
                >
                  ⊞ Split
                </button>
                <button
                  onClick={() => setLayoutMode('stacked')}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                    layoutMode === 'stacked'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Full width multiplanar layout matching reference"
                >
                  ☰ Full Width
                </button>
              </div>

              {/* Engine Switcher */}
              <div className="flex items-center gap-1 bg-[#1e293b] p-0.5 rounded-lg border border-slate-700/80">
                <button
                  onClick={() => setSliceViewMode('neurospace')}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                    sliceViewMode === 'neurospace'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Neurospace High-DPI Multiplanar View with Orientation Markers"
                >
                  Neurospace Multiplanar (New)
                </button>
                <button
                  onClick={() => setSliceViewMode('classic')}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                    sliceViewMode === 'classic'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Original Classic Orthogonal Slice View"
                >
                  Classic Slices (Original)
                </button>
              </div>
            </div>
          </div>

          {/* 2D Slice Viewport Render */}
          <div className="flex-1 relative w-full h-full min-h-0 overflow-y-auto overflow-x-hidden">
            {sliceViewMode === 'neurospace' ? (
              <NeurospaceMultiplanarView
                crosshair={crosshair}
                onUpdateCrosshair={onUpdateCrosshair}
                dimensions={dimensions}
                spacing={spacing}
                affine={affine}
                volumeData={activeVolume}
                segmentationMask={segmentationMask}
                expertMask={expertMask}
                visibility={visibility}
                opacity={opacity}
                windowLevel={windowLevel}
                onChangeWindowLevel={onChangeWindowLevel}
                activeSequence={activeSequence}
                onSelectSequence={onSelectSequence}
                onCenterTumour={handleCenterTumour}
                isDemoMode={isDemoMode}
              />
            ) : (
              <OrthogonalSliceView
                crosshair={crosshair}
                onUpdateCrosshair={onUpdateCrosshair}
                dimensions={dimensions}
                spacing={spacing}
                affine={affine}
                volumeData={activeVolume}
                segmentationMask={segmentationMask}
                expertMask={expertMask}
                visibility={visibility}
                opacity={opacity}
                windowLevel={windowLevel}
                onChangeWindowLevel={onChangeWindowLevel}
              />
            )}
          </div>
        </div>
      </div>

      {/* Lower Section: Volumetric Region Cards */}
      <div className="flex-shrink-0 pb-2">
        <RegionVolumeCards
          labelCounts={labelCounts}
          spacing={spacing}
          expertCounts={expertCounts}
          isDemoMode={isDemoMode}
          hasSegmentation={Boolean(segmentationMask)}
          segmentationSource={segmentationSource}
          datasetState={datasetState}
        />
      </div>
    </div>
  );
};

export default WorkspacePage;

