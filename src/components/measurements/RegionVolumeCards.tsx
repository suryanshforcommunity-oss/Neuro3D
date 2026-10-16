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
    <div className="space-y-2.5 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-600" />
          <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider font-mono">
            Tumour Volumetric Quantification
          </h3>
        </div>
        <button
          onClick={() => setShowDetails(true)}
          className="flex items-center gap-1 text-[11px] font-mono text-sky-600 hover:text-sky-700 font-medium transition"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Formula & Spacing</span>
        </button>
      </div>

      {/* Grid of Region Cards: WT, TC, ET */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {regionSummaries.map(item => {
          const hasExpert = item.expertVolumeMl !== undefined;
          const diffMl = item.differenceMl ?? 0;
          const isOver = diffMl > 0;

          return (
            <div
              key={item.region}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 hover:border-sky-300 hover:shadow-md transition-all relative overflow-hidden group shadow-xs"
            >
              {/* Color accent header strip */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: item.color }}
              />

              <div className="flex items-center justify-between mb-1.5 mt-0.5">
                <span className="font-semibold text-slate-800 text-xs">{item.displayName}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  {item.definition}
                </span>
              </div>

              {/* Main Volume readout */}
              <div className="my-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono tracking-tight text-slate-900">
                    {item.volumeMl.toFixed(2)}
                  </span>
                  <span className="text-xs font-mono font-medium text-slate-500">mL (cm³)</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {item.voxelCount.toLocaleString()} voxels
                </div>
              </div>

              {/* Expert mask comparison if available */}
              {hasExpert ? (
                <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between text-slate-500">
                    <span>Expert Ground Truth:</span>
                    <span className="text-slate-800 font-semibold">{item.expertVolumeMl?.toFixed(2)} mL</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Discrepancy:</span>
                    <span
                      className={`flex items-center gap-0.5 font-semibold ${
                        Math.abs(diffMl) < 0.5
                          ? 'text-emerald-600'
                          : isOver
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {isOver ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {diffMl > 0 ? `+${diffMl.toFixed(2)}` : diffMl.toFixed(2)} mL ({item.differencePercentage}%)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
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
