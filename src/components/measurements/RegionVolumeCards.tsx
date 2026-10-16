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
          <Activity className="w-4 h-4 text-sky-600" />
          <h3 className="font-bold text-slate-950 text-xs uppercase tracking-wider">
            Tumor Size & Volume Measurements
          </h3>
        </div>
        <button
          onClick={() => setShowDetails(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-sky-800 hover:text-sky-950 bg-sky-50 hover:bg-sky-100 border border-sky-300 px-3 py-1.5 rounded-xl transition shadow-2xs"
        >
          <HelpCircle className="w-3.5 h-3.5 text-sky-700" />
          <span>How Size Is Calculated</span>
        </button>
      </div>

      {/* Grid of Region Cards: WT, TC, ET */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {regionSummaries.map(item => {
          const hasExpert = item.expertVolumeMl !== undefined;
          const diffMl = item.differenceMl ?? 0;
          const isOver = diffMl > 0;

          return (
            <div
              key={item.region}
              className="bg-white border border-slate-300 rounded-2xl p-4 hover:border-sky-400 hover:shadow-md transition-all relative overflow-hidden group shadow-xs"
            >
              {/* Color accent header strip */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: item.color }}
              />

              <div className="flex items-center justify-between mb-2 mt-0.5">
                <span className="font-bold text-slate-950 text-sm">{item.displayName}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-300">
                  {item.definition}
                </span>
              </div>

              {/* Main Volume readout */}
              <div className="my-2.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black font-mono tracking-tight text-slate-950">
                    {item.volumeMl.toFixed(2)}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700">mL (cm³)</span>
                </div>
                <div className="text-xs text-slate-700 font-mono font-semibold mt-0.5">
                  {item.voxelCount.toLocaleString()} 3D pixels (voxels)
                </div>
              </div>

              {/* Expert mask comparison if available */}
              {hasExpert ? (
                <div className="mt-3 pt-2.5 border-t border-slate-200 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>Doctor's Hand-Drawn Size:</span>
                    <span className="text-slate-950 font-bold">{item.expertVolumeMl?.toFixed(2)} mL</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 font-medium">Difference:</span>
                    <span
                      className={`flex items-center gap-1 font-bold ${
                        Math.abs(diffMl) < 0.5
                          ? 'text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200'
                          : isOver
                          ? 'text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200'
                          : 'text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200'
                      }`}
                    >
                      {isOver ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {diffMl > 0 ? `+${diffMl.toFixed(2)}` : diffMl.toFixed(2)} mL ({item.differencePercentage}%)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-3 pt-2.5 border-t border-slate-200 text-xs text-slate-600 font-mono font-medium">
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
