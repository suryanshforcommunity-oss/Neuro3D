import React from 'react';
import { Layers, Activity, Eye, EyeOff, Sliders, Info, ShieldAlert } from 'lucide-react';
import {
  TumourLabelCounts,
  VoxelSpacing,
  RegionVisibility,
  RegionOpacity,
} from '../types';
import { calculateVoxelVolumeMl } from '../utils/volume';

interface SegmentationPageProps {
  labelCounts: TumourLabelCounts;
  spacing: VoxelSpacing;
  visibility: RegionVisibility;
  opacity: RegionOpacity;
  onToggleVisibility: (key: keyof RegionVisibility) => void;
  onChangeOpacity: (key: keyof RegionOpacity, value: number) => void;
  isDemoMode: boolean;
}

export const SegmentationPage: React.FC<SegmentationPageProps> = ({
  labelCounts,
  spacing,
  visibility,
  opacity,
  onToggleVisibility,
  onChangeOpacity,
  isDemoMode,
}) => {
  const ncrMl = calculateVoxelVolumeMl(labelCounts.ncrCount, spacing);
  const edMl = calculateVoxelVolumeMl(labelCounts.edCount, spacing);
  const etMl = calculateVoxelVolumeMl(labelCounts.etCount, spacing);

  const wtMl = calculateVoxelVolumeMl(labelCounts.wtCount, spacing);
  const tcMl = calculateVoxelVolumeMl(labelCounts.tcCount, spacing);

  return (
    <div className="flex-1 p-6 max-w-5xl mx-auto space-y-6 overflow-y-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-600" />
            <span>Segmentation Compartments & Label Hierarchy</span>
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            BraTS standard definitions for Glioma Sub-regions and Hierarchical Evaluation
          </p>
        </div>

        {isDemoMode && (
          <div className="px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-xs flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            DEMO PREVIEW SEGMENTATION
          </div>
        )}
      </div>

      {/* Hierarchy Visual Explainer */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <h3 className="font-semibold text-slate-800 text-xs font-mono uppercase flex items-center gap-2 text-sky-600">
          <Layers className="w-4 h-4" />
          <span>Nested BraTS Mathematical Composition</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          In brain tumour analysis, biological compartments are inherently nested rather than completely disjoint. The BraTS benchmark defines evaluation targets through set unions:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-lg bg-sky-50/70 border border-sky-200 rounded-xl">
            <span className="text-sky-600 font-bold block mb-1">Whole Tumour (WT)</span>
            <div className="text-lg font-bold text-slate-900 mb-1">{wtMl.toFixed(2)} mL</div>
            <span className="text-[11px] text-slate-500 block">
              Formula: NCR (1) ∪ ED (2) ∪ ET (4)
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              {labelCounts.wtCount.toLocaleString()} voxels
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-violet-50/70 border border-violet-200 rounded-xl">
            <span className="text-violet-400 font-bold block mb-1">Tumour Core (TC)</span>
            <div className="text-lg font-bold text-slate-900 mb-1">{tcMl.toFixed(2)} mL</div>
            <span className="text-[11px] text-slate-500 block">
              Formula: NCR (1) ∪ ET (4)
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              {labelCounts.tcCount.toLocaleString()} voxels
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200 rounded-xl">
            <span className="text-amber-400 font-bold block mb-1">Enhancing Tumour (ET)</span>
            <div className="text-lg font-bold text-slate-900 mb-1">{etMl.toFixed(2)} mL</div>
            <span className="text-[11px] text-slate-500 block">
              Formula: Label 4 (ET)
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              {labelCounts.etCount.toLocaleString()} voxels
            </span>
          </div>
        </div>
      </div>

      {/* Constituent Biological Labels Breakdown */}
      <div>
        <h3 className="font-semibold text-slate-800 text-xs font-mono uppercase mb-3">
          Constituent Biological Compartments (Ground Voxel Labels)
        </h3>

        <div className="space-y-3">
          {/* Label 2: ED */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-emerald-500 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 text-xs">Peritumoral Vasogenic Edema (ED)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-500 border border-slate-700">
                    Label 2
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Extracellular fluid accumulation along white matter tracts. Hyperintense on T2 and FLAIR.
                </p>
              </div>
            </div>
            <div className="text-right font-mono text-xs">
              <span className="text-slate-900 font-bold text-base">{edMl.toFixed(2)} mL</span>
              <span className="text-[10px] text-slate-500 block">{labelCounts.edCount.toLocaleString()} voxels</span>
            </div>
          </div>

          {/* Label 1: NCR */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-pink-500 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 text-xs">Necrotic & Non-Enhancing Core (NCR)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-500 border border-slate-700">
                    Label 1
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Avascular necrotic tumour center and non-enhancing infiltrative tumour core. Hypointense on T1.
                </p>
              </div>
            </div>
            <div className="text-right font-mono text-xs">
              <span className="text-slate-900 font-bold text-base">{ncrMl.toFixed(2)} mL</span>
              <span className="text-[10px] text-slate-500 block">{labelCounts.ncrCount.toLocaleString()} voxels</span>
            </div>
          </div>

          {/* Label 4: ET */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-amber-500 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 text-xs">Enhancing Tumour (ET)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-500 border border-slate-700">
                    Label 4
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Vascularized active tumor with disrupted blood-brain barrier. Enhances brightly on T1Gd.
                </p>
              </div>
            </div>
            <div className="text-right font-mono text-xs">
              <span className="text-slate-900 font-bold text-base">{etMl.toFixed(2)} mL</span>
              <span className="text-[10px] text-slate-500 block">{labelCounts.etCount.toLocaleString()} voxels</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
