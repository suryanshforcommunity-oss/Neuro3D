import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Crosshair as CrosshairIcon,
} from 'lucide-react';
import {
  VoxelCoordinate,
  WorldCoordinate,
  VolumeDimensions,
  VoxelSpacing,
  AffineMatrix,
  SliceWindowLevel,
  RegionVisibility,
  RegionOpacity,
} from '../../types';
import { voxelToWorld } from '../../utils/coordinates';

export type SlicePlane = 'axial' | 'coronal' | 'sagittal';

interface SlicePanelProps {
  plane: SlicePlane;
  title: string;
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
  className?: string;
}

export const SlicePanel: React.FC<SlicePanelProps> = ({
  plane,
  title,
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
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan and Zoom local state
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDragging = useRef<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Determine plane dimensions and coordinates
  // Axial: fixed K (Z), slice in (i: X, j: Y)
  // Coronal: fixed J (Y), slice in (i: X, k: Z)
  // Sagittal: fixed I (X), slice in (j: Y, k: Z)
  let currentSliceIndex = 0;
  let maxSlices = 0;
  let sliceWidth = 0;
  let sliceHeight = 0;
  let crosshairH = 0; // horizontal line pos
  let crosshairV = 0; // vertical line pos

  // Orientation labels: [Top, Bottom, Left, Right]
  let labels = { top: 'A', bottom: 'P', left: 'R', right: 'L' }; // Radiological convention

  if (plane === 'axial') {
    currentSliceIndex = crosshair.k;
    maxSlices = dimensions.dimZ;
    sliceWidth = dimensions.dimX;
    sliceHeight = dimensions.dimY;
    crosshairH = crosshair.j; // horizontal position on canvas = J
    crosshairV = crosshair.i; // vertical position on canvas = I
    labels = { top: 'A', bottom: 'P', left: 'R', right: 'L' };
  } else if (plane === 'coronal') {
    currentSliceIndex = crosshair.j;
    maxSlices = dimensions.dimY;
    sliceWidth = dimensions.dimX;
    sliceHeight = dimensions.dimZ;
    crosshairH = dimensions.dimZ - 1 - crosshair.k; // Superior is at top
    crosshairV = crosshair.i;
    labels = { top: 'S', bottom: 'I', left: 'R', right: 'L' };
  } else if (plane === 'sagittal') {
    currentSliceIndex = crosshair.i;
    maxSlices = dimensions.dimX;
    sliceWidth = dimensions.dimY;
    sliceHeight = dimensions.dimZ;
    crosshairH = dimensions.dimZ - 1 - crosshair.k; // Superior is at top
    crosshairV = crosshair.j;
    labels = { top: 'S', bottom: 'I', left: 'A', right: 'P' };
  }

  // Calculate current slice physical position in mm
  const sliceWorldMm = React.useMemo(() => {
    const coord: VoxelCoordinate = {
      i: plane === 'sagittal' ? currentSliceIndex : crosshair.i,
      j: plane === 'coronal' ? currentSliceIndex : crosshair.j,
      k: plane === 'axial' ? currentSliceIndex : crosshair.k,
    };
    const world = voxelToWorld(coord, affine);
    if (plane === 'axial') return world.z;
    if (plane === 'coronal') return world.y;
    return world.x;
  }, [plane, currentSliceIndex, crosshair, affine]);

  // Render slice to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || sliceWidth <= 0 || sliceHeight <= 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI canvas buffer
    canvas.width = sliceWidth;
    canvas.height = sliceHeight;

    const imgData = ctx.createImageData(sliceWidth, sliceHeight);
    const data = imgData.data;

    // Window/Level calculation:
    // window = contrast width, level = center
    const w = Math.max(1, windowLevel.window);
    const l = windowLevel.level;
    const minVal = l - w / 2;
    const maxVal = l + w / 2;

    const { dimX, dimY, dimZ } = dimensions;

    for (let py = 0; py < sliceHeight; py++) {
      for (let px = 0; px < sliceWidth; px++) {
        let vx = 0, vy = 0, vz = 0;

        if (plane === 'axial') {
          vx = px;
          vy = py;
          vz = currentSliceIndex;
        } else if (plane === 'coronal') {
          vx = px;
          vy = currentSliceIndex;
          vz = sliceHeight - 1 - py; // Superior on top
        } else if (plane === 'sagittal') {
          vx = currentSliceIndex;
          vy = px;
          vz = sliceHeight - 1 - py; // Superior on top
        }

        const volIndex = vz * dimX * dimY + vy * dimX + vx;
        const pixelIdx = (py * sliceWidth + px) * 4;

        // Base MRI sequence intensity
        let rawVal = 0;
        if (volumeData && volIndex < volumeData.length) {
          rawVal = volumeData[volIndex];
        }

        // Apply Window/Level mapping
        let normalized = ((rawVal - minVal) / (maxVal - minVal)) * 255;
        normalized = Math.max(0, Math.min(255, normalized));

        let r = normalized;
        let g = normalized;
        let b = normalized;

        // Overlay Segmentation Mask
        if (segmentationMask && volIndex < segmentationMask.length) {
          const label = segmentationMask[volIndex];
          // BraTS Labels:
          // 1: NCR (Necrotic core) -> TC & WT
          // 2: ED (Edema) -> WT
          // 4: ET (Enhancing) -> ET, TC, WT
          if (label === 4 && visibility.et) {
            // ET: Amber (#F59E0B)
            const alpha = opacity.et;
            r = r * (1 - alpha) + 245 * alpha;
            g = g * (1 - alpha) + 158 * alpha;
            b = b * (1 - alpha) + 11 * alpha;
          } else if (label === 1 && visibility.tc) {
            // TC / NCR: Violet (#8B5CF6)
            const alpha = opacity.tc;
            r = r * (1 - alpha) + 139 * alpha;
            g = g * (1 - alpha) + 92 * alpha;
            b = b * (1 - alpha) + 246 * alpha;
          } else if (label === 2 && visibility.wt) {
            // ED / WT: Cyan (#06B6D4)
            const alpha = opacity.wt;
            r = r * (1 - alpha) + 6 * alpha;
            g = g * (1 - alpha) + 182 * alpha;
            b = b * (1 - alpha) + 212 * alpha;
          }
        }

        data[pixelIdx] = Math.round(r);
        data[pixelIdx + 1] = Math.round(g);
        data[pixelIdx + 2] = Math.round(b);
        data[pixelIdx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [
    plane,
    currentSliceIndex,
    sliceWidth,
    sliceHeight,
    dimensions,
    volumeData,
    segmentationMask,
    visibility,
    opacity,
    windowLevel,
  ]);

  // Click & Drag on Canvas to Update Crosshair
  const handleCanvasInteraction = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) / rect.width;
      const clickY = (e.clientY - rect.top) / rect.height;

      const px = Math.floor(clickX * sliceWidth);
      const py = Math.floor(clickY * sliceHeight);

      if (px < 0 || px >= sliceWidth || py < 0 || py >= sliceHeight) return;

      if (plane === 'axial') {
        onUpdateCrosshair({ i: px, j: py });
      } else if (plane === 'coronal') {
        const vz = sliceHeight - 1 - py;
        onUpdateCrosshair({ i: px, k: vz });
      } else if (plane === 'sagittal') {
        const vz = sliceHeight - 1 - py;
        onUpdateCrosshair({ j: px, k: vz });
      }
    },
    [plane, sliceWidth, sliceHeight, onUpdateCrosshair]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0) {
      // Left click: set crosshair
      isDragging.current = true;
      handleCanvasInteraction(e);
    } else if (e.button === 2) {
      // Right click: pan
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    if (e.buttons === 1) {
      // Dragging left button updates crosshair
      handleCanvasInteraction(e);
    } else if (e.buttons === 2) {
      // Dragging right button pans
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.shiftKey) {
      // Shift + Wheel = zoom
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.max(0.5, Math.min(4.0, prev * factor)));
    } else {
      // Normal Wheel = navigate slice
      const delta = e.deltaY > 0 ? 1 : -1;
      const nextIndex = Math.max(0, Math.min(maxSlices - 1, currentSliceIndex + delta));
      if (plane === 'axial') onUpdateCrosshair({ k: nextIndex });
      else if (plane === 'coronal') onUpdateCrosshair({ j: nextIndex });
      else if (plane === 'sagittal') onUpdateCrosshair({ i: nextIndex });
    }
  };

  const resetPanZoom = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Crosshair line style percentages
  const crosshairXPct = (crosshairV / sliceWidth) * 100;
  const crosshairYPct = (crosshairH / sliceHeight) * 100;

  return (
    <div
      ref={containerRef}
      className={`relative bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs flex flex-col select-none group ${className}`}
      onContextMenu={e => e.preventDefault()}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Panel Header */}
      <div className="h-8 bg-slate-50 border-b border-slate-200/80 px-3 flex items-center justify-between text-xs z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-500" />
          <span className="font-semibold text-slate-800 tracking-wide font-mono text-[11px] uppercase">
            {title}
          </span>
          <span className="text-slate-500 font-mono text-[10px]">
            Slice {currentSliceIndex + 1}/{maxSlices}
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-500 font-mono text-[10px]">
          <span>{sliceWorldMm.toFixed(1)} mm</span>
          <div className="flex items-center gap-0.5 ml-1">
            <button
              onClick={() => {
                const next = Math.max(0, currentSliceIndex - 1);
                if (plane === 'axial') onUpdateCrosshair({ k: next });
                else if (plane === 'coronal') onUpdateCrosshair({ j: next });
                else if (plane === 'sagittal') onUpdateCrosshair({ i: next });
              }}
              className="p-0.5 hover:text-sky-600 text-slate-500 transition"
              title="Previous slice"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                const next = Math.min(maxSlices - 1, currentSliceIndex + 1);
                if (plane === 'axial') onUpdateCrosshair({ k: next });
                else if (plane === 'coronal') onUpdateCrosshair({ j: next });
                else if (plane === 'sagittal') onUpdateCrosshair({ i: next });
              }}
              className="p-0.5 hover:text-sky-600 text-slate-500 transition"
              title="Next slice"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Container with Pan & Zoom */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden cursor-crosshair bg-slate-950">
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isDragging.current ? 'none' : 'transform 0.05s ease-out',
          }}
          className="relative inline-block"
        >
          {/* Slice Image Canvas */}
          <canvas
            ref={canvasRef}
            className="block max-h-full max-w-full shadow-lg"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* Synchronized Crosshair Lines */}
          {visibility.crosshair && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Vertical line (X) */}
              <div
                className="absolute top-0 bottom-0 border-l border-cyan-400/80 shadow-[0_0_4px_rgba(0,242,254,0.5)]"
                style={{ left: `${crosshairXPct}%` }}
              />
              {/* Horizontal line (Y) */}
              <div
                className="absolute left-0 right-0 border-t border-cyan-400/80 shadow-[0_0_4px_rgba(0,242,254,0.5)]"
                style={{ top: `${crosshairYPct}%` }}
              />
              {/* Crosshair target dot */}
              <div
                className="absolute w-2 h-2 -ml-1 -mt-1 rounded-full border border-cyan-300 bg-cyan-400/30"
                style={{ left: `${crosshairXPct}%`, top: `${crosshairYPct}%` }}
              />
            </div>
          )}
        </div>

        {/* Anatomical Orientation Letters (Superior/Inferior, Anterior/Posterior, Left/Right) */}
        <div className="absolute inset-0 pointer-events-none p-2 flex flex-col justify-between text-[11px] font-mono font-bold text-cyan-400/70 select-none">
          <div className="flex justify-center">{labels.top}</div>
          <div className="flex justify-between items-center px-1">
            <span>{labels.left}</span>
            <span>{labels.right}</span>
          </div>
          <div className="flex justify-center">{labels.bottom}</div>
        </div>

        {/* Hover Mini-Toolbar (Bottom Right) */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 border border-slate-200/90 rounded-lg p-1 backdrop-blur-sm shadow-md z-20">
          <button
            onClick={() => setZoom(prev => Math.min(4.0, prev * 1.15))}
            className="p-1 hover:text-sky-600 text-slate-600"
            title="Zoom In (Shift+Wheel)"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(0.5, prev * 0.85))}
            className="p-1 hover:text-sky-600 text-slate-600"
            title="Zoom Out (Shift+Wheel)"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <button
            onClick={resetPanZoom}
            className="p-1 hover:text-sky-600 text-slate-600"
            title="Reset Pan & Zoom"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Slice slider scrubber */}
      <div className="h-7 bg-slate-50 border-t border-slate-200/80 px-3 flex items-center gap-2 z-10">
        <input
          type="range"
          min="0"
          max={maxSlices - 1}
          value={currentSliceIndex}
          onChange={e => {
            const val = parseInt(e.target.value);
            if (plane === 'axial') onUpdateCrosshair({ k: val });
            else if (plane === 'coronal') onUpdateCrosshair({ j: val });
            else if (plane === 'sagittal') onUpdateCrosshair({ i: val });
          }}
          className="w-full h-1.5 bg-slate-200 accent-sky-600 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
};
