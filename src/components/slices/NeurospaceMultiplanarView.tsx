import React, { useState, useEffect, useMemo } from 'react';
import { NeurospaceSlice2D, SliceRenderResult } from './NeurospaceSlice2D';
import {
  VoxelCoordinate,
  VolumeDimensions,
  VoxelSpacing,
  AffineMatrix,
  SliceWindowLevel,
  RegionVisibility,
  RegionOpacity,
  MriSequenceType,
} from '../../types';

export interface NeurospaceMultiplanarViewProps {
  crosshair: VoxelCoordinate;
  onUpdateCrosshair: (coord: Partial<VoxelCoordinate>) => void;
  dimensions: VolumeDimensions;
  spacing: VoxelSpacing;
  affine: AffineMatrix;
  volumeData: Uint8Array | null;
  segmentationMask: Uint8Array | null;
  expertMask: Uint8Array | null;
  visibility: RegionVisibility;
  opacity: RegionOpacity;
  windowLevel: SliceWindowLevel;
  onChangeWindowLevel: (wl: SliceWindowLevel) => void;
  activeSequence?: MriSequenceType;
  onSelectSequence?: (seq: MriSequenceType) => void;
  onCenterTumour?: () => void;
}

export const NeurospaceMultiplanarView: React.FC<NeurospaceMultiplanarViewProps> = ({
  crosshair,
  onUpdateCrosshair,
  dimensions,
  affine,
  volumeData,
  segmentationMask,
  expertMask,
  visibility,
  opacity,
  windowLevel,
  activeSequence = 'T1Gd',
  onSelectSequence,
  onCenterTumour,
}) => {
  // Use real BraTS dimensions if available (240 x 240 x 155) or fallback to prop dimensions
  const isBratsCase = dimensions.dimX === 240 || dimensions.dimZ === 155;
  const dimX = isBratsCase ? 240 : dimensions.dimX;
  const dimY = isBratsCase ? 240 : dimensions.dimY;
  const dimZ = isBratsCase ? 155 : dimensions.dimZ;

  const curX = Math.max(0, Math.min(dimX - 1, crosshair.i));
  const curY = Math.max(0, Math.min(dimY - 1, crosshair.j));
  const curZ = Math.max(0, Math.min(dimZ - 1, crosshair.k));

  // Compute physical millimeter coordinates using 4x4 affine
  const worldX = Math.round(
    affine[0][0] * curX + affine[0][1] * curY + affine[0][2] * curZ + affine[0][3]
  );
  const worldY = Math.round(
    affine[1][0] * curX + affine[1][1] * curY + affine[1][2] * curZ + affine[1][3]
  );
  const worldZ = Math.round(
    affine[2][0] * curX + affine[2][1] * curY + affine[2][2] * curZ + affine[2][3]
  );

  // Genuine BraTS real MRI slices fetched from backend
  const [axialData, setAxialData] = useState<SliceRenderResult | null>(null);
  const [coronalData, setCoronalData] = useState<SliceRenderResult | null>(null);
  const [sagittalData, setSagittalData] = useState<SliceRenderResult | null>(null);

  // Fetch Axial real MRI slice
  useEffect(() => {
    let isCancelled = false;
    const params = new URLSearchParams({
      plane: 'axial',
      index: String(curZ),
      modality: activeSequence.toLowerCase(),
      show_wt: String(visibility.wt),
      show_tc: String(visibility.tc),
      show_et: String(visibility.et),
      wt_opacity: String(opacity.wt),
      tc_opacity: String(opacity.tc),
      et_opacity: String(opacity.et),
      render_mode: 'predicted',
    });

    fetch(`http://127.0.0.1:8000/api/v1/studies/default/slice?${params.toString()}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!isCancelled && data && data.image) setAxialData(data);
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [curZ, activeSequence, visibility.wt, visibility.tc, visibility.et, opacity.wt, opacity.tc, opacity.et]);

  // Fetch Coronal real MRI slice
  useEffect(() => {
    let isCancelled = false;
    const params = new URLSearchParams({
      plane: 'coronal',
      index: String(curY),
      modality: activeSequence.toLowerCase(),
      show_wt: String(visibility.wt),
      show_tc: String(visibility.tc),
      show_et: String(visibility.et),
      wt_opacity: String(opacity.wt),
      tc_opacity: String(opacity.tc),
      et_opacity: String(opacity.et),
      render_mode: 'predicted',
    });

    fetch(`http://127.0.0.1:8000/api/v1/studies/default/slice?${params.toString()}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!isCancelled && data && data.image) setCoronalData(data);
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [curY, activeSequence, visibility.wt, visibility.tc, visibility.et, opacity.wt, opacity.tc, opacity.et]);

  // Fetch Sagittal real MRI slice
  useEffect(() => {
    let isCancelled = false;
    const params = new URLSearchParams({
      plane: 'sagittal',
      index: String(curX),
      modality: activeSequence.toLowerCase(),
      show_wt: String(visibility.wt),
      show_tc: String(visibility.tc),
      show_et: String(visibility.et),
      wt_opacity: String(opacity.wt),
      tc_opacity: String(opacity.tc),
      et_opacity: String(opacity.et),
      render_mode: 'predicted',
    });

    fetch(`http://127.0.0.1:8000/api/v1/studies/default/slice?${params.toString()}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!isCancelled && data && data.image) setSagittalData(data);
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [curX, activeSequence, visibility.wt, visibility.tc, visibility.et, opacity.wt, opacity.tc, opacity.et]);

  // In-memory fallback extraction for offline resilience
  const fallbackSlices = useMemo(() => {
    if (!volumeData || volumeData.length < dimX * dimY * dimZ) {
      return {
        axialVol: null,
        axialSeg: null,
        axialExp: null,
        coronalVol: null,
        coronalSeg: null,
        coronalExp: null,
        sagittalVol: null,
        sagittalSeg: null,
        sagittalExp: null,
      };
    }

    const strideY = dimX;
    const strideZ = dimX * dimY;

    // 1. Axial
    const axialVol = new Uint8Array(dimX * dimY);
    const axialSeg = segmentationMask ? new Uint8Array(dimX * dimY) : null;
    const axialExp = expertMask ? new Uint8Array(dimX * dimY) : null;
    const zOffset = curZ * strideZ;
    for (let y = 0; y < dimY; y++) {
      const yOffset = y * strideY;
      for (let x = 0; x < dimX; x++) {
        const targetIdx = x + y * dimX;
        const srcIdx = x + yOffset + zOffset;
        axialVol[targetIdx] = volumeData[srcIdx];
        if (axialSeg && segmentationMask) axialSeg[targetIdx] = segmentationMask[srcIdx];
        if (axialExp && expertMask) axialExp[targetIdx] = expertMask[srcIdx];
      }
    }

    // 2. Coronal
    const coronalVol = new Uint8Array(dimX * dimZ);
    const coronalSeg = segmentationMask ? new Uint8Array(dimX * dimZ) : null;
    const coronalExp = expertMask ? new Uint8Array(dimX * dimZ) : null;
    const yFixedOffset = curY * strideY;
    for (let z = 0; z < dimZ; z++) {
      const srcZ = dimZ - 1 - z;
      const zRowOffset = srcZ * strideZ;
      for (let x = 0; x < dimX; x++) {
        const targetIdx = x + z * dimX;
        const srcIdx = x + yFixedOffset + zRowOffset;
        coronalVol[targetIdx] = volumeData[srcIdx];
        if (coronalSeg && segmentationMask) coronalSeg[targetIdx] = segmentationMask[srcIdx];
        if (coronalExp && expertMask) coronalExp[targetIdx] = expertMask[srcIdx];
      }
    }

    // 3. Sagittal
    const sagittalVol = new Uint8Array(dimY * dimZ);
    const sagittalSeg = segmentationMask ? new Uint8Array(dimY * dimZ) : null;
    const sagittalExp = expertMask ? new Uint8Array(dimY * dimZ) : null;
    const xFixed = curX;
    for (let z = 0; z < dimZ; z++) {
      const srcZ = dimZ - 1 - z;
      const zRowOffset = srcZ * strideZ;
      for (let y = 0; y < dimY; y++) {
        const targetIdx = y + z * dimY;
        const srcIdx = xFixed + y * strideY + zRowOffset;
        sagittalVol[targetIdx] = volumeData[srcIdx];
        if (sagittalSeg && segmentationMask) sagittalSeg[targetIdx] = segmentationMask[srcIdx];
        if (sagittalExp && expertMask) sagittalExp[targetIdx] = expertMask[srcIdx];
      }
    }

    return {
      axialVol,
      axialSeg,
      axialExp,
      coronalVol,
      coronalSeg,
      coronalExp,
      sagittalVol,
      sagittalSeg,
      sagittalExp,
    };
  }, [volumeData, segmentationMask, expertMask, dimX, dimY, dimZ, curX, curY, curZ]);

  const sequences: { key: MriSequenceType; label: string; desc: string }[] = [
    { key: 'T1', label: 'T1', desc: 'Native anatomical baseline' },
    { key: 'T1Gd', label: 'T1Gd', desc: 'Post-contrast active enhancement' },
    { key: 'T2', label: 'T2', desc: 'T2 hyperintense fluid & edema' },
    { key: 'FLAIR', label: 'FLAIR', desc: 'Free-water suppressed oedema' },
  ];

  return (
    <div className="panel-card multiplanar-panel select-none">
      {/* Multiplanar Header & Crosshair Status */}
      <div className="multiplanar-header">
        <div className="flex items-center justify-between w-full flex-wrap gap-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="panel-title">Linked Orthogonal 2D MRI Views</h2>
            {onCenterTumour && (
              <button
                onClick={onCenterTumour}
                className="btn-center-tumour cursor-pointer"
                title="Jump crosshair to suspected tumour centroid"
              >
                🎯 Center on Suspected Tumour
              </button>
            )}
          </div>

          <div className="multiplanar-controls-group">
            {/* Segmented Sequence Selector */}
            <div className="sequence-segmented-bar">
              <span className="sequence-selector-label">SEQUENCE:</span>
              <div className="segmented-control">
                {sequences.map(seq => {
                  const isSelected = activeSequence === seq.key;
                  return (
                    <button
                      key={seq.key}
                      type="button"
                      onClick={() => onSelectSequence?.(seq.key)}
                      className={`segmented-btn ${isSelected ? 'selected' : ''}`}
                      title={seq.desc}
                    >
                      {seq.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Coordinate Readout HUD */}
            <div className="coordinate-hud-card">
              <div className="hud-line">
                <span className="hud-label">WORLD:</span>
                <span className="hud-val">
                  X: {worldX >= 0 ? '+' : ''}{worldX} mm &nbsp;|&nbsp;
                  Y: {worldY >= 0 ? '+' : ''}{worldY} mm &nbsp;|&nbsp;
                  Z: {worldZ >= 0 ? '+' : ''}{worldZ} mm
                </span>
              </div>
              <div className="hud-line">
                <span className="hud-label">VOXEL:</span>
                <span className="hud-voxel-val">[{curX}, {curY}, {curZ}]</span>
              </div>
            </div>
          </div>
        </div>

        <p className="panel-desc">
          Synchronized Axial, Coronal, and Sagittal planes with model-predicted subregion overlays
        </p>
      </div>

      {/* 3 Orthogonal Views in 3 Columns */}
      <div className="multiplanar-grid">
        {/* Axial Slice Panel */}
        <NeurospaceSlice2D
          plane="axial"
          currentIndex={curZ}
          maxIndex={dimZ - 1}
          dimCols={axialData?.width || dimX}
          dimRows={axialData?.height || dimY}
          crosshairPixel={{ col: curX, row: curY }}
          sliceData={axialData}
          volumeSlice={fallbackSlices.axialVol}
          segSlice={fallbackSlices.axialSeg}
          expertSlice={fallbackSlices.axialExp}
          worldMm={worldZ}
          showWt={visibility.wt}
          showTc={visibility.tc}
          showEt={visibility.et}
          opacityWt={opacity.wt}
          opacityTc={opacity.tc}
          opacityEt={opacity.et}
          windowLevel={windowLevel}
          onIndexChange={idx => onUpdateCrosshair({ k: idx })}
          onSliceClick={(col, row) => onUpdateCrosshair({ i: col, j: row })}
        />

        {/* Coronal Slice Panel */}
        <NeurospaceSlice2D
          plane="coronal"
          currentIndex={curY}
          maxIndex={dimY - 1}
          dimCols={coronalData?.width || dimX}
          dimRows={coronalData?.height || dimZ}
          crosshairPixel={{ col: curX, row: (coronalData ? 154 - curZ : dimZ - 1 - curZ) }}
          sliceData={coronalData}
          volumeSlice={fallbackSlices.coronalVol}
          segSlice={fallbackSlices.coronalSeg}
          expertSlice={fallbackSlices.coronalExp}
          worldMm={worldY}
          showWt={visibility.wt}
          showTc={visibility.tc}
          showEt={visibility.et}
          opacityWt={opacity.wt}
          opacityTc={opacity.tc}
          opacityEt={opacity.et}
          windowLevel={windowLevel}
          onIndexChange={idx => onUpdateCrosshair({ j: idx })}
          onSliceClick={(col, row) =>
            onUpdateCrosshair({ i: col, k: coronalData ? 154 - row : dimZ - 1 - row })
          }
        />

        {/* Sagittal Slice Panel */}
        <NeurospaceSlice2D
          plane="sagittal"
          currentIndex={curX}
          maxIndex={dimX - 1}
          dimCols={sagittalData?.width || dimY}
          dimRows={sagittalData?.height || dimZ}
          crosshairPixel={{ col: curY, row: (sagittalData ? 154 - curZ : dimZ - 1 - curZ) }}
          sliceData={sagittalData}
          volumeSlice={fallbackSlices.sagittalVol}
          segSlice={fallbackSlices.sagittalSeg}
          expertSlice={fallbackSlices.sagittalExp}
          worldMm={worldX}
          showWt={visibility.wt}
          showTc={visibility.tc}
          showEt={visibility.et}
          opacityWt={opacity.wt}
          opacityTc={opacity.tc}
          opacityEt={opacity.et}
          windowLevel={windowLevel}
          onIndexChange={idx => onUpdateCrosshair({ i: idx })}
          onSliceClick={(col, row) =>
            onUpdateCrosshair({ j: col, k: sagittalData ? 154 - row : dimZ - 1 - row })
          }
        />
      </div>
    </div>
  );
};
