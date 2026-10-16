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
    { label: 'Soft Tissue', w: 100, l: 60 },
    { label: 'High Contrast', w: 160, l: 90 },
    { label: 'Bright Tumor Focus', w: 190, l: 140 },
  ];

  return (
    <div className="flex flex-col h-full bg-white p-3 gap-3">
      {/* Window / Level Control Bar */}
      <div className="min-h-[40px] h-auto bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-1.5 flex flex-wrap items-center justify-between gap-2.5 text-xs select-none shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-1.5 text-slate-950 font-mono text-xs font-bold">
            <Sliders className="w-3.5 h-3.5 text-sky-600" />
            <span>IMAGE ADJUSTMENTS:</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-800 font-mono font-bold">Contrast: {windowLevel.window}</span>
            <input
              type="range"
              min="10"
              max="500"
              value={windowLevel.window}
              onChange={e => onChangeWindowLevel({ ...windowLevel, window: parseInt(e.target.value) })}
              className="w-20 h-1.5 bg-slate-300 accent-sky-600 rounded-lg appearance-none cursor-pointer"
              title="Contrast (Window width)"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-800 font-mono font-bold">Brightness: {windowLevel.level}</span>
            <input
              type="range"
              min="0"
              max="255"
              value={windowLevel.level}
              onChange={e => onChangeWindowLevel({ ...windowLevel, level: parseInt(e.target.value) })}
              className="w-20 h-1.5 bg-slate-300 accent-sky-600 rounded-lg appearance-none cursor-pointer"
              title="Brightness (Level center)"
            />
          </div>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-1.5">
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => onChangeWindowLevel({ window: p.w, level: p.l })}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition ${
                windowLevel.window === p.w && windowLevel.level === p.l
                  ? 'bg-sky-600 text-white font-bold shadow-xs border border-sky-600'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/70 border border-slate-300 bg-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Orthogonal Panels: Axial, Coronal, Sagittal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 flex-1 min-h-0">
        <SlicePanel
          plane="axial"
          title="Top View (Axial - Looking Down)"
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
          title="Front View (Coronal - Face-On)"
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
          title="Side View (Sagittal - Ear-to-Ear)"
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
