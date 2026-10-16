import React, { useState } from 'react';
import {
  Layers,
  HelpCircle,
  ExternalLink,
  Activity,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { TumourLabelCounts, VoxelSpacing, RegionVolume } from '../../types';
import { buildRegionVolumeSummaries } from '../../utils/volume';
import { VolumeDetailsModal } from './VolumeDetailsModal';

interface RegionVolumeCardsProps {
  labelCounts: TumourLabelCounts;
  spacing: VoxelSpacing;
  expertCounts?: TumourLabelCounts;
  isDemoMode: boolean;
}

export const RegionVolumeCards: React.FC<RegionVolumeCardsProps> = ({
  labelCounts,
  spacing,
  expertCounts,
  isDemoMode,
}) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const regionSummaries: RegionVolume[] = React.useMemo(() => {
    return buildRegionVolumeSummaries(labelCounts, spacing, expertCounts);
  }, [labelCounts, spacing, expertCounts]);

  return (
    <div className="space-y-3 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="font-semibold text-slate-200 text-xs uppercase tracking-wider font-mono">
            Tumour Volumetric Quantification
          </h3>
        </div>
        <button
          onClick={() => setShowDetails(true)}
          className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Formula & Spacing</span>
        </button>
      </div>

      {/* Grid of Region Cards: WT, TC, ET */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {regionSummaries.map(item => {
          const hasExpert = item.expertVolumeMl !== undefined;
          const diffMl = item.differenceMl ?? 0;
          const isOver = diffMl > 0;

          return (
            <div
              key={item.region}
              className="bg-[#0F1424] border border-[#1E293B] rounded-xl p-3.5 hover:border-slate-700 transition relative overflow-hidden group shadow-md"
            >
              {/* Color accent header strip */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: item.color }}
              />

              <div className="flex items-center justify-between mb-1 mt-0.5">
                <span className="font-semibold text-slate-200 text-xs">{item.displayName}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {item.definition}
                </span>
              </div>

              {/* Main Volume readout */}
              <div className="my-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono tracking-tight text-white">
                    {item.volumeMl.toFixed(2)}
                  </span>
                  <span className="text-xs font-mono font-medium text-slate-400">mL (cm³)</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {item.voxelCount.toLocaleString()} voxels
                </div>
              </div>

              {/* Expert mask comparison if available */}
              {hasExpert ? (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Expert Ground Truth:</span>
                    <span className="text-slate-200 font-semibold">{item.expertVolumeMl?.toFixed(2)} mL</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Discrepancy:</span>
                    <span
                      className={`flex items-center gap-0.5 font-semibold ${
                        Math.abs(diffMl) < 0.5
                          ? 'text-emerald-400'
                          : isOver
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {isOver ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {diffMl > 0 ? `+${diffMl.toFixed(2)}` : diffMl.toFixed(2)} mL ({item.differencePercentage}%)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                  No expert ground truth mask loaded for comparison
                </div>
              )}
            </div>
          );
        })}
      </div>

      <VolumeDetailsModal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        spacing={spacing}
        labelCounts={labelCounts}
        expertCounts={expertCounts}
      />
    </div>
  );
};
