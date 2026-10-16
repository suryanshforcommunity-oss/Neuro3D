import React from 'react';
import { Eye, EyeOff, Layers, X } from 'lucide-react';
import { RegionVisibility, RegionOpacity } from '../../types';

interface TumourLegendProps {
  visibility: RegionVisibility;
  opacity: RegionOpacity;
  onToggleVisibility: (key: keyof RegionVisibility) => void;
  onChangeOpacity: (key: keyof RegionOpacity, value: number) => void;
  showSliders?: boolean;
  onClose?: () => void;
}

export const TumourLegend: React.FC<TumourLegendProps> = ({
  visibility,
  opacity,
  onToggleVisibility,
  onChangeOpacity,
  showSliders = true,
  onClose,
}) => {
  const layers = [
    {
      key: 'brainSurface' as const,
      name: 'Brain Surface (Gray)',
      tag: 'Brain',
      colorHex: '#64748b',
      isTumour: false,
    },
    {
      key: 'wt' as const,
      name: 'Whole Tumor (Blue)',
      tag: 'WT',
      colorHex: '#06B6D4',
      isTumour: true,
    },
    {
      key: 'tc' as const,
      name: 'Tumor Core (Purple)',
      tag: 'TC',
      colorHex: '#8B5CF6',
      isTumour: true,
    },
    {
      key: 'et' as const,
      name: 'Active Tumor (Amber)',
      tag: 'ET',
      colorHex: '#F59E0B',
      isTumour: true,
    },
  ];

  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3 text-xs select-none shadow-xl text-slate-800 animate-in fade-in zoom-in-95 duration-150 w-64">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
          <Layers className="w-3.5 h-3.5 text-sky-600" />
          <span>3D Tumor Layers</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Close layers panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Layer rows */}
      <div className="space-y-1.5">
        {layers.map(layer => {
          const isVisible = visibility[layer.key];
          const curOpacity = opacity[layer.key];

          return (
            <div
              key={layer.key}
              className={`px-2 py-1.5 rounded-xl border transition flex items-center justify-between gap-2 ${
                isVisible
                  ? 'bg-slate-50/80 border-slate-200 text-slate-900'
                  : 'bg-slate-50/40 border-slate-200/60 opacity-50 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: layer.colorHex }}
                />
                <span className="font-semibold text-xs truncate">
                  {layer.name}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {showSliders && isVisible && (
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={curOpacity}
                    onChange={e => onChangeOpacity(layer.key, parseFloat(e.target.value))}
                    className="w-14 h-1.5 bg-slate-300 accent-sky-600 rounded-lg appearance-none cursor-pointer"
                    title={`Opacity: ${(curOpacity * 100).toFixed(0)}%`}
                  />
                )}
                <button
                  onClick={() => onToggleVisibility(layer.key)}
                  className={`p-1 rounded-md transition ${
                    isVisible
                      ? 'text-sky-700 hover:text-sky-900 hover:bg-sky-50'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                  title={isVisible ? `Hide ${layer.name}` : `Show ${layer.name}`}
                >
                  {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
