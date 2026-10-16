import React from 'react';
import { SlicePanel } from './SlicePanel';
import {
  VoxelCoordinate,
  VolumeDimensions,
  VoxelSpacing,
  AffineMatrix,
  SliceWindowLevel,
  RegionVisibility,
  RegionOpacity,
} from '../../types';
import { Sliders, Sun, Contrast } from 'lucide-react';

interface OrthogonalSliceViewProps {
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
}

export const OrthogonalSliceView: React.FC<OrthogonalSliceViewProps> = ({
  crosshair,
  onUpdateCrosshair,
  dimensions,
  spacing,
  affine,
  volumeData,
  segmentationMask,
  expertMask,
  visibility,
  opacity,
  windowLevel,
  onChangeWindowLevel,
}) => {
  const presets = [
    { label: 'Standard', w: 255, l: 128 },
    { label: 'Brain Soft Tissue', w: 100, l: 60 },
    { label: 'High Contrast', w: 160, l: 90 },
    { label: 'Tumour Hyperintensity', w: 190, l: 140 },
  ];

  return (
    <div className="flex flex-col h-full bg-white p-2.5 gap-2.5">
      {/* Window / Level Control Bar */}
      <div className="h-9 bg-slate-50/90 border border-slate-200/90 rounded-xl px-3.5 flex items-center justify-between text-xs select-none shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[11px] font-semibold">
            <Sliders className="w-3.5 h-3.5 text-sky-600" />
            <span>WINDOW / LEVEL:</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono font-medium">W: {windowLevel.window}</span>
            <input
              type="range"
              min="10"
              max="500"
              value={windowLevel.window}
              onChange={e => onChangeWindowLevel({ ...windowLevel, window: parseInt(e.target.value) })}
              className="w-20 h-1.5 bg-slate-200 accent-sky-600 rounded-lg appearance-none cursor-pointer"
              title="Window (Contrast width)"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono font-medium">L: {windowLevel.level}</span>
            <input
              type="range"
              min="0"
              max="255"
              value={windowLevel.level}
              onChange={e => onChangeWindowLevel({ ...windowLevel, level: parseInt(e.target.value) })}
              className="w-20 h-1.5 bg-slate-200 accent-sky-600 rounded-lg appearance-none cursor-pointer"
              title="Level (Brightness center)"
            />
          </div>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-1">
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => onChangeWindowLevel({ window: p.w, level: p.l })}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition ${
                windowLevel.window === p.w && windowLevel.level === p.l
                  ? 'bg-sky-50 text-sky-700 font-semibold border border-sky-300 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Orthogonal Panels: Axial, Coronal, Sagittal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1 min-h-0">
        <SlicePanel
          plane="axial"
          title="Axial (Transverse • Z)"
          crosshair={crosshair}
          onUpdateCrosshair={onUpdateCrosshair}
          dimensions={dimensions}
          spacing={spacing}
          affine={affine}
          volumeData={volumeData}
          segmentationMask={segmentationMask}
          expertMask={expertMask}
          visibility={visibility}
          opacity={opacity}
          windowLevel={windowLevel}
          className="h-full min-h-[220px]"
        />

        <SlicePanel
          plane="coronal"
          title="Coronal (Frontal • Y)"
          crosshair={crosshair}
          onUpdateCrosshair={onUpdateCrosshair}
          dimensions={dimensions}
          spacing={spacing}
          affine={affine}
          volumeData={volumeData}
          segmentationMask={segmentationMask}
          expertMask={expertMask}
          visibility={visibility}
          opacity={opacity}
          windowLevel={windowLevel}
          className="h-full min-h-[220px]"
        />

        <SlicePanel
          plane="sagittal"
          title="Sagittal (Lateral • X)"
          crosshair={crosshair}
          onUpdateCrosshair={onUpdateCrosshair}
          dimensions={dimensions}
          spacing={spacing}
          affine={affine}
          volumeData={volumeData}
          segmentationMask={segmentationMask}
          expertMask={expertMask}
          visibility={visibility}
          opacity={opacity}
          windowLevel={windowLevel}
          className="h-full min-h-[220px]"
        />
      </div>
    </div>
  );
};
