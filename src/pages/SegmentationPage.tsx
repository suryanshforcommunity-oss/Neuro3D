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
            <span>Tumor Layers & Regions Explained</span>
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Understanding Whole Tumor, Tumor Core, and Surrounding Brain Swelling
          </p>
        </div>

        {isDemoMode && (
          <div className="px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-700 font-mono text-xs flex items-center gap-1.5 font-bold">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            DEMO PREVIEW TUMOR
          </div>
        )}
      </div>

      {/* Hierarchy Visual Explainer */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <h3 className="font-semibold text-slate-800 text-xs font-mono uppercase flex items-center gap-2 text-sky-600">
          <Layers className="w-4 h-4" />
          <span>How Tumor Layers Fit Together</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Brain tumors have multiple nested layers rather than a single solid lump. Doctors divide them into three standard regions to plan treatment and surgery:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-sky-50/80 border border-sky-200">
            <span className="text-sky-800 font-bold block mb-1">Whole Tumor (WT)</span>
            <div className="text-2xl font-black font-mono text-slate-950 mb-1">{wtMl.toFixed(2)} mL</div>
            <span className="text-xs text-slate-700 font-medium block">
              The Entire Affected Area (All Layers)
            </span>
            <span className="text-[11px] text-slate-500 font-mono block mt-1">
              Active Core + Dead Cells + Swelling ({labelCounts.wtCount.toLocaleString()} voxels)
            </span>
          </div>

          <div className="p-4 rounded-xl bg-violet-50/80 border border-violet-200">
            <span className="text-violet-800 font-bold block mb-1">Tumor Core (TC)</span>
            <div className="text-2xl font-black font-mono text-slate-950 mb-1">{tcMl.toFixed(2)} mL</div>
            <span className="text-xs text-slate-700 font-medium block">
              The Tumor Body (No Swelling)
            </span>
            <span className="text-[11px] text-slate-500 font-mono block mt-1">
              Active Tumor + Dead Core ({labelCounts.tcCount.toLocaleString()} voxels)
            </span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200">
            <span className="text-amber-800 font-bold block mb-1">Active Tumor (ET)</span>
            <div className="text-2xl font-black font-mono text-slate-950 mb-1">{etMl.toFixed(2)} mL</div>
            <span className="text-xs text-slate-700 font-medium block">
              The Aggressive Growing Rim
            </span>
            <span className="text-[11px] text-slate-500 font-mono block mt-1">
              Absorbs contrast dye ({labelCounts.etCount.toLocaleString()} voxels)
            </span>
          </div>
        </div>
      </div>

      {/* Constituent Biological Labels Breakdown */}
      <div>
        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
          The 3 Individual Parts of the Tumor
        </h3>

        <div className="space-y-3">
          {/* Label 2: ED */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-emerald-500 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-950 text-xs">Brain Swelling & Fluid (Edema - Green)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Label 2 (ED)
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Fluid buildup in healthy brain tissue around the tumor. Appears bright on T2 and FLAIR MRI scans.
                </p>
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-950 font-black font-mono text-base">{edMl.toFixed(2)} mL</span>
              <span className="text-[11px] text-slate-500 font-mono block">{labelCounts.edCount.toLocaleString()} voxels</span>
            </div>
          </div>

          {/* Label 1: NCR */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-pink-500 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-950 text-xs">Inner Dead Tumor Tissue (Necrotic Core - Pink)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-pink-50 text-pink-800 border border-pink-200">
                    Label 1 (NCR)
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  The central area of the tumor where cells have died off due to lack of blood and oxygen.
                </p>
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-950 font-black font-mono text-base">{ncrMl.toFixed(2)} mL</span>
              <span className="text-[11px] text-slate-500 font-mono block">{labelCounts.ncrCount.toLocaleString()} voxels</span>
            </div>
          </div>

          {/* Label 4: ET */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-amber-500 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-950 text-xs">Actively Growing Tumor (Enhancing Rim - Amber)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                    Label 4 (ET)
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  The most aggressive, actively dividing edge of the tumor. Absorbs gadolinium contrast dye and glows brightly on T1-Gd scans.
                </p>
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-950 font-black font-mono text-base">{etMl.toFixed(2)} mL</span>
              <span className="text-[11px] text-slate-500 font-mono block">{labelCounts.etCount.toLocaleString()} voxels</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
