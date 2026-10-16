import React from 'react';
import { Eye, EyeOff, Layers, Info } from 'lucide-react';
import { RegionVisibility, RegionOpacity } from '../../types';

interface TumourLegendProps {
  visibility: RegionVisibility;
  opacity: RegionOpacity;
  onToggleVisibility: (key: keyof RegionVisibility) => void;
  onChangeOpacity: (key: keyof RegionOpacity, value: number) => void;
  showSliders?: boolean;
}

export const TumourLegend: React.FC<TumourLegendProps> = ({
  visibility,
  opacity,
  onToggleVisibility,
  onChangeOpacity,
  showSliders = true,
}) => {
  const regions = [
    {
      key: 'wt' as const,
      name: 'Whole Tumour (WT)',
      colorHex: '#06B6D4',
      borderClass: 'border-cyan-500/40',
      bgClass: 'bg-cyan-500/20 text-cyan-300',
      definition: 'WT = NCR (1) + ED (2) + ET (4)',
      note: 'Outermost pathological boundary; includes edema halo and entire core.',
    },
    {
      key: 'tc' as const,
      name: 'Tumour Core (TC)',
      colorHex: '#8B5CF6',
      borderClass: 'border-violet-500/40',
      bgClass: 'bg-violet-500/20 text-violet-300',
      definition: 'TC = NCR (1) + ET (4)',
      note: 'Gross tumour core, excluding peritumoral vasogenic edema.',
    },
    {
      key: 'et' as const,
      name: 'Enhancing Tumour (ET)',
      colorHex: '#F59E0B',
      borderClass: 'border-amber-500/40',
      bgClass: 'bg-amber-500/20 text-amber-300',
      definition: 'ET = Label 4 (ET)',
      note: 'Active, contrast-enhancing rim with disrupted blood-brain-barrier.',
    },
  ];

  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3.5 text-xs select-none shadow-lg text-slate-800">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
          <Layers className="w-3.5 h-3.5 text-sky-600" />
          <span>Tumour Region Overlays</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
          <Info className="w-3 h-3 text-slate-400" />
          Nested Compartments
        </span>
      </div>

      {/* Crucial UI note about nested overlapping definition */}
      <div className="p-2 mb-2.5 rounded bg-sky-50/80 border border-sky-200/80 text-[10px] text-sky-900 leading-tight">
        <strong className="text-cyan-300">Nested Definition:</strong> Regions overlap hierarchically according to BraTS guidelines. WT encloses TC, which encloses ET. They are not disjoint compartments.
      </div>

      <div className="space-y-2">
        {/* Brain Surface Toggle */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-500/80 border border-slate-400" />
            <div>
              <span className="text-slate-800 font-semibold text-xs">Cerebral Cortex (3D Surface)</span>
              <span className="block text-[10px] text-slate-400 font-mono">Anatomical brain boundary</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showSliders && (
              <input
                type="range"
                min="0.05"
                max="0.9"
                step="0.05"
                value={opacity.brainSurface}
                onChange={e => onChangeOpacity('brainSurface', parseFloat(e.target.value))}
                className="w-16 h-1 bg-slate-200 accent-sky-600 rounded-lg appearance-none cursor-pointer"
                title={`Opacity: ${(opacity.brainSurface * 100).toFixed(0)}%`}
              />
            )}
            <button
              onClick={() => onToggleVisibility('brainSurface')}
              className={`p-1 rounded ${
                visibility.brainSurface ? 'text-sky-600 hover:text-cyan-300' : 'text-slate-600 hover:text-slate-400'
              }`}
              title={visibility.brainSurface ? 'Hide cortex surface' : 'Show cortex surface'}
            >
              {visibility.brainSurface ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Tumour Regions */}
        {regions.map(r => {
          const isVisible = visibility[r.key];
          const curOpacity = opacity[r.key];

          return (
            <div
              key={r.key}
              className={`p-2 rounded-lg border transition ${
                isVisible ? 'bg-slate-50/90 border border-slate-200 shadow-2xs' : 'bg-slate-50/40 border-slate-200/40 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: r.colorHex }}
                  />
                  <div>
                    <span className="font-semibold text-slate-800 text-xs">{r.name}</span>
                    <span className="block text-[10px] text-slate-400 font-mono">{r.definition}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {showSliders && isVisible && (
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={curOpacity}
                      onChange={e => onChangeOpacity(r.key, parseFloat(e.target.value))}
                      className="w-16 h-1 bg-slate-200 accent-sky-600 rounded-lg appearance-none cursor-pointer"
                      title={`Opacity: ${(curOpacity * 100).toFixed(0)}%`}
                    />
                  )}
                  <button
                    onClick={() => onToggleVisibility(r.key)}
                    className={`p-1 rounded ${
                      isVisible ? 'text-slate-800 hover:text-white' : 'text-slate-600 hover:text-slate-400'
                    }`}
                    title={isVisible ? `Hide ${r.name}` : `Show ${r.name}`}
                  >
                    {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <p className="mt-1 text-[10px] text-slate-400 leading-tight">{r.note}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
