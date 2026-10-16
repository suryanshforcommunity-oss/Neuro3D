import React from 'react';
import { BrainViewer3D } from '../components/viewer/BrainViewer3D';
import { OrthogonalSliceView } from '../components/slices/OrthogonalSliceView';
import { RegionVolumeCards } from '../components/measurements/RegionVolumeCards';
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
} from '../types';

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
  onToggleVisibility: (key: keyof RegionVisibility) => void;
  onChangeOpacity: (key: keyof RegionOpacity, value: number) => void;
  onChangeWindowLevel: (wl: SliceWindowLevel) => void;
  onChangeClipping: (clipping: ClippingPlanes) => void;
  onResetCamera: () => void;
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
  onToggleVisibility,
  onChangeOpacity,
  onChangeWindowLevel,
  onChangeClipping,
  onResetCamera,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-3 gap-3 bg-[#080B12]">
      {/* Upper Main Interactive Grid: Large 3D Viewport + 3 Synchronized Slice Panels */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[460px]">
        {/* Left Column: 3D Brain Viewer (5 cols) */}
        <div className="lg:col-span-5 h-full rounded-2xl border border-[#1E293B] overflow-hidden shadow-2xl bg-[#090C16] relative flex flex-col">
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
        </div>

        {/* Right Column: 3 Orthogonal Slices (Axial, Coronal, Sagittal) (7 cols) */}
        <div className="lg:col-span-7 h-full rounded-2xl border border-[#1E293B] overflow-hidden shadow-2xl bg-[#090C16] flex flex-col">
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
        </div>
      </div>

      {/* Lower Section: Volumetric Region Cards */}
      <div className="flex-shrink-0">
        <RegionVolumeCards
          labelCounts={labelCounts}
          spacing={spacing}
          expertCounts={expertCounts}
          isDemoMode={isDemoMode}
        />
      </div>
    </div>
  );
};
