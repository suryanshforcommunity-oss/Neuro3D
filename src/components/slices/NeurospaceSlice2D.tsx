import React, { useRef, useEffect, useMemo } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

export type AnatomicalPlane = 'axial' | 'coronal' | 'sagittal';

export interface SliceRenderResult {
  image?: string;
  width?: number;
  height?: number;
  has_mask?: boolean;
  active_voxels?: number;
  world_coord_mm?: number;
}

export const PLANE_METADATA: Record<
  AnatomicalPlane,
  {
    title: string;
    subtitle: string;
    normalAxis: string;
    labels: { top: string; bottom: string; left: string; right: string };
  }
> = {
  axial: {
    title: 'AXIAL',
    subtitle: 'Horizontal (Z-axis)',
    normalAxis: 'Z',
    labels: { top: 'A', bottom: 'P', left: 'R', right: 'L' },
  },
  coronal: {
    title: 'CORONAL',
    subtitle: 'Frontal (Y-axis)',
    normalAxis: 'Y',
    labels: { top: 'S', bottom: 'I', left: 'R', right: 'L' },
  },
  sagittal: {
    title: 'SAGITTAL',
    subtitle: 'Profile (X-axis)',
    normalAxis: 'X',
    labels: { top: 'S', bottom: 'I', left: 'A', right: 'P' },
  },
};

export interface NeurospaceSlice2DProps {
  plane: AnatomicalPlane;
  currentIndex: number;
  maxIndex: number;
  dimCols: number;
  dimRows: number;
  colSpacing?: number;
  rowSpacing?: number;
  crosshairPixel: { col: number; row: number };
  volumeSlice: Uint8Array | null;
  segSlice: Uint8Array | null;
  expertSlice?: Uint8Array | null;
  sliceData?: SliceRenderResult | null;
  isLoading?: boolean;
  worldMm?: number;
  showWt?: boolean;
  showTc?: boolean;
  showEt?: boolean;
  opacityWt?: number;
  opacityTc?: number;
  opacityEt?: number;
  viewMode?: 'predicted' | 'expert' | 'agreement';
  windowLevel?: { window: number; level: number };
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onIndexChange: (idx: number) => void;
  onSliceClick: (col: number, row: number) => void;
}

export const NeurospaceSlice2D: React.FC<NeurospaceSlice2DProps> = ({
  plane,
  currentIndex,
  maxIndex,
  dimCols,
  dimRows,
  colSpacing = 1.0,
  rowSpacing = 1.0,
  crosshairPixel,
  volumeSlice,
  segSlice,
  expertSlice,
  sliceData,
  isLoading = false,
  worldMm,
  showWt = true,
  showTc = true,
  showEt = true,
  opacityWt = 0.35,
  opacityTc = 0.65,
  opacityEt = 0.85,
  viewMode = 'predicted',
  windowLevel = { window: 255, level: 128 },
  isExpanded = false,
  onToggleExpand,
  onIndexChange,
  onSliceClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const meta = PLANE_METADATA[plane];
  const [viewportSize, setViewportSize] = React.useState({ width: 320, height: 320 });

  // Update viewport dimensions on resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setViewportSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Effective dimensions for display
  const effectiveCols = sliceData?.width || dimCols;
  const effectiveRows = sliceData?.height || dimRows;

  // Active lesion voxels on this 2D slice
  const activeVoxelCount = useMemo(() => {
    if (sliceData?.active_voxels !== undefined) {
      return sliceData.active_voxels;
    }
    const activeSeg = viewMode === 'expert' && expertSlice ? expertSlice : segSlice;
    if (!activeSeg) return 0;
    let count = 0;
    for (let i = 0; i < activeSeg.length; i++) {
      if (activeSeg[i] > 0) count++;
    }
    return count;
  }, [sliceData, segSlice, expertSlice, viewMode]);

  const hasMask = sliceData?.has_mask ?? activeVoxelCount > 0;

  // Compute physical aspect ratio and letterbox parameters to prevent anatomical distortion
  const sx = colSpacing && colSpacing > 0 ? colSpacing : 1.0;
  const sy = rowSpacing && rowSpacing > 0 ? rowSpacing : 1.0;
  const aspect = (effectiveCols * sx) / Math.max(1e-4, effectiveRows * sy);

  const displayW = Math.max(1, viewportSize.width);
  const displayH = Math.max(1, viewportSize.height);

  let renderW = displayW;
  let renderH = displayW / aspect;
  if (renderH > displayH) {
    renderH = displayH;
    renderW = displayH * aspect;
  }
  const renderX = (displayW - renderW) / 2;
  const renderY = (displayH - renderH) / 2;

  // High-DPI canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

    canvas.width = Math.round(displayW * dpr);
    canvas.height = Math.round(displayH * dpr);
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    ctx.save();
    ctx.scale(dpr, dpr);
    // Medical imaging standard: crisp, non-interpolated nearest voxels (prevents blurring)
    ctx.imageSmoothingEnabled = false;

    // Clinical background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, displayW, displayH);

    // 1. If backend rendered image from genuine BraTS volume is provided, render it letterboxed
    if (sliceData?.image) {
      let isCancelled = false;
      const img = new Image();
      img.onload = () => {
        if (isCancelled) return;
        ctx.drawImage(img, renderX, renderY, renderW, renderH);
        ctx.restore();
      };
      img.src = sliceData.image;
      return () => {
        isCancelled = true;
      };
    }

    // 2. Fallback to in-memory volume slice buffer
    if (!volumeSlice || effectiveCols <= 0 || effectiveRows <= 0) {
      ctx.restore();
      return;
    }

    const imgData = ctx.createImageData(effectiveCols, effectiveRows);
    const data = imgData.data;

    const { window: win, level: lev } = windowLevel;
    const low = lev - win / 2;
    const high = lev + win / 2;
    const range = Math.max(1, high - low);

    const activeSeg = viewMode === 'expert' && expertSlice ? expertSlice : segSlice;

    for (let idx = 0; idx < effectiveCols * effectiveRows; idx++) {
      const rawVal = volumeSlice[idx];
      const normVal = Math.min(255, Math.max(0, Math.round(((rawVal - low) / range) * 255)));

      let r = normVal;
      let g = normVal;
      let b = normVal;

      if (viewMode === 'agreement' && segSlice && expertSlice) {
        const p = segSlice[idx] > 0;
        const e = expertSlice[idx] > 0;
        if (p && e) {
          r = Math.round(r * 0.3 + 16 * 0.7);
          g = Math.round(g * 0.3 + 185 * 0.7);
          b = Math.round(b * 0.3 + 129 * 0.7);
        } else if (p && !e) {
          r = Math.round(r * 0.4 + 139 * 0.6);
          g = Math.round(g * 0.4 + 92 * 0.6);
          b = Math.round(b * 0.4 + 246 * 0.6);
        } else if (!p && e) {
          r = Math.round(r * 0.4 + 245 * 0.6);
          g = Math.round(g * 0.4 + 158 * 0.6);
          b = Math.round(b * 0.4 + 11 * 0.6);
        }
      } else if (activeSeg) {
        const segVal = activeSeg[idx];
        if (segVal === 4 && showEt) {
          r = Math.round(r * (1 - opacityEt) + 239 * opacityEt);
          g = Math.round(g * (1 - opacityEt) + 68 * opacityEt);
          b = Math.round(b * (1 - opacityEt) + 68 * opacityEt);
        } else if ((segVal === 1 || segVal === 4) && showTc) {
          r = Math.round(r * (1 - opacityTc) + 245 * opacityTc);
          g = Math.round(g * (1 - opacityTc) + 158 * opacityTc);
          b = Math.round(b * (1 - opacityTc) + 11 * opacityTc);
        } else if ((segVal === 1 || segVal === 2 || segVal === 4) && showWt) {
          r = Math.round(r * (1 - opacityWt) + 56 * opacityWt);
          g = Math.round(g * (1 - opacityWt) + 189 * opacityWt);
          b = Math.round(b * (1 - opacityWt) + 248 * opacityWt);
        }
      }

      const pIdx = idx * 4;
      data[pIdx] = r;
      data[pIdx + 1] = g;
      data[pIdx + 2] = b;
      data[pIdx + 3] = 255;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = effectiveCols;
    tempCanvas.height = effectiveRows;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(imgData, 0, 0);
      ctx.drawImage(tempCanvas, renderX, renderY, renderW, renderH);
    }

    ctx.restore();
  }, [
    sliceData,
    volumeSlice,
    segSlice,
    expertSlice,
    effectiveCols,
    effectiveRows,
    renderX,
    renderY,
    renderW,
    renderH,
    displayW,
    displayH,
    showWt,
    showTc,
    showEt,
    opacityWt,
    opacityTc,
    opacityEt,
    viewMode,
    windowLevel,
  ]);

  const handlePointerInteraction = (clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container || effectiveCols <= 0 || effectiveRows <= 0) return;

    const rect = container.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    const clampedX = Math.max(renderX, Math.min(renderX + renderW, clickX));
    const clampedY = Math.max(renderY, Math.min(renderY + renderH, clickY));

    const normX = renderW > 0 ? (clampedX - renderX) / renderW : 0.5;
    const normY = renderH > 0 ? (clampedY - renderY) / renderH : 0.5;

    const col = Math.max(0, Math.min(effectiveCols - 1, Math.round(normX * (effectiveCols - 1))));
    const row = Math.max(0, Math.min(effectiveRows - 1, Math.round(normY * (effectiveRows - 1))));

    onSliceClick(col, row);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      onIndexChange(Math.min(maxIndex, currentIndex + 1));
    } else if (e.deltaY > 0) {
      onIndexChange(Math.max(0, currentIndex - 1));
    }
  };

  // Convert crosshair (col, row) to pixel positions on container matching letterboxed viewport
  const crosshairPixelX =
    renderX + (effectiveCols > 1 ? (crosshairPixel.col / (effectiveCols - 1)) * renderW : renderW / 2);
  const crosshairPixelY =
    renderY + (effectiveRows > 1 ? (crosshairPixel.row / (effectiveRows - 1)) * renderH : renderH / 2);

  const resolvedWorldMm = sliceData?.world_coord_mm !== undefined ? sliceData.world_coord_mm : worldMm;
  const worldStr =
    resolvedWorldMm !== undefined
      ? `${meta.normalAxis}: ${resolvedWorldMm >= 0 ? '+' : ''}${Math.round(resolvedWorldMm)} mm`
      : '';

  return (
    <div className="slice-card select-none">
      {/* Slice Card Header */}
      <div className="slice-header">
        <div>
          <div className="slice-title-row">
            <span className="slice-title">{meta.title}</span>
            <span className="slice-subtitle">{meta.subtitle}</span>
          </div>
          {worldStr && <div className="slice-coord-text">{worldStr}</div>}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="slice-index-pill">
            {currentIndex + 1} / {maxIndex + 1}
          </div>
          {onToggleExpand && (
            <button
              onClick={e => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition cursor-pointer"
              title={isExpanded ? 'Restore to 3-Plane View' : 'Maximize this Viewport'}
            >
              {isExpanded ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Viewport */}
      <div
        ref={containerRef}
        className="slice-viewport relative overflow-hidden"
        onMouseDown={e => {
          handlePointerInteraction(e.clientX, e.clientY);
          const handleMove = (moveEvent: MouseEvent) => {
            handlePointerInteraction(moveEvent.clientX, moveEvent.clientY);
          };
          const handleUp = () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
          };
          window.addEventListener('mousemove', handleMove);
          window.addEventListener('mouseup', handleUp);
        }}
        onWheel={handleWheel}
      >
        <canvas ref={canvasRef} className="slice-canvas" />

        {/* Anatomical Orientation Markers (A, P, S, I, R, L) */}
        <span className="anatomical-label top">{meta.labels.top}</span>
        <span className="anatomical-label bottom">{meta.labels.bottom}</span>
        <span className="anatomical-label left">{meta.labels.left}</span>
        <span className="anatomical-label right">{meta.labels.right}</span>

        {/* Synchronized Crosshair Overlay */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {/* Vertical Crosshair Line */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{
              left: `${crosshairPixelX}px`,
              width: '1px',
              borderLeft: '1.5px dashed rgba(56, 189, 248, 0.85)',
              transform: 'translateX(-50%)',
              height: '100%',
            }}
          />

          {/* Horizontal Crosshair Line */}
          <div
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              top: `${crosshairPixelY}px`,
              height: '1px',
              borderTop: '1.5px dashed rgba(56, 189, 248, 0.85)',
              transform: 'translateY(-50%)',
              width: '100%',
            }}
          />

          {/* Central Precision Reticle & Ring */}
          <div
            className="absolute pointer-events-none rounded-full flex items-center justify-center"
            style={{
              left: `${crosshairPixelX}px`,
              top: `${crosshairPixelY}px`,
              width: '12px',
              height: '12px',
              transform: 'translate(-50%, -50%)',
              border: '1.5px solid #38bdf8',
              backgroundColor: 'rgba(56, 189, 248, 0.25)',
              boxShadow: '0 0 6px rgba(56, 189, 248, 0.65)',
            }}
          >
            <div className="w-1 h-1 rounded-full bg-white" />
          </div>
        </div>

        {/* Informational overlay when sequence volume is not loaded */}
        {!volumeSlice && !sliceData?.image && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-950/80 text-slate-400 select-none pointer-events-none z-20">
            <div className="text-xs font-mono font-bold text-slate-300">Modality Not Uploaded</div>
            <div className="text-[11px] text-slate-500 mt-1">Upload {meta.title} Sequence</div>
          </div>
        )}

        {/* Subregion Indicator Badge */}
        {hasMask && (
          <div className="mask-active-badge">
            <span className="pulse-dot" />
            <span>Suspected Region ({activeVoxelCount} vox)</span>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="slice-controls-row">
        <button
          onClick={() => onIndexChange(Math.max(0, currentIndex - 1))}
          disabled={currentIndex <= 0}
          className="btn-slice-step"
          title="Previous slice (or scroll wheel)"
        >
          ◀
        </button>

        <input
          type="range"
          min="0"
          max={maxIndex}
          value={currentIndex}
          onChange={e => onIndexChange(parseInt(e.target.value, 10))}
          className="slice-slider"
        />

        <button
          onClick={() => onIndexChange(Math.min(maxIndex, currentIndex + 1))}
          disabled={currentIndex >= maxIndex}
          className="btn-slice-step"
          title="Next slice (or scroll wheel)"
        >
          ▶
        </button>
      </div>
    </div>
  );
};
