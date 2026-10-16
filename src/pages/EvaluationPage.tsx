import React from 'react';
import { BarChart3, AlertCircle, CheckCircle2, ShieldAlert, UploadCloud, Target } from 'lucide-react';
import { EvaluationMetrics, TumourLabelCounts, VoxelSpacing } from '../types';
import { buildRegionVolumeSummaries } from '../utils/volume';

interface EvaluationPageProps {
  metrics?: EvaluationMetrics;
  labelCounts: TumourLabelCounts;
  expertCounts?: TumourLabelCounts;
  spacing: VoxelSpacing;
  onOpenUpload: () => void;
  isDemoMode: boolean;
}

export const EvaluationPage: React.FC<EvaluationPageProps> = ({
  metrics,
  labelCounts,
  expertCounts,
  spacing,
  onOpenUpload,
  isDemoMode,
}) => {
  const hasExpert = Boolean(metrics && metrics.hasExpertMask);
  const volumeSummaries = buildRegionVolumeSummaries(labelCounts, spacing, expertCounts);

  return (
    <div className="flex-1 p-6 max-w-5xl mx-auto space-y-6 overflow-y-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600" />
            <span>How Well Did the AI Identify the Tumor? (Accuracy & Comparison)</span>
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Comparing the AI's predicted tumor outline against a doctor's hand-drawn tumor map (Ground Truth)
          </p>
        </div>

        {hasExpert && (
          <div className="px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 font-mono text-xs flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            DOCTOR'S MAP LOADED
          </div>
        )}
      </div>

      {!hasExpert ? (
        /* Empty State / No Expert Mask */
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-500">
            <Target className="w-6 h-6 text-slate-500" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="font-semibold text-slate-800 text-sm">
              Doctor's Tumor Map Needed for Accuracy Check
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              To measure how accurate the AI is, we need a doctor's hand-drawn tumor map (called "Ground Truth") to compare against. NeuroScope 3D never guesses or fabricates accuracy scores without real comparison data.
            </p>
          </div>
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition shadow-md shadow-cyan-500/20"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Doctor's Tumor Map (Ground Truth)</span>
          </button>
        </div>
      ) : (
        /* Overlap Metrics Display */
        <div className="space-y-6">
          {/* Overlap Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* WT Dice */}
            <div className="p-5 rounded-2xl bg-white border border-cyan-200/90 shadow-xs space-y-3">
              <div className="flex justify-between items-center font-mono">
                <span className="text-xs font-bold text-sky-600 uppercase">Whole Tumor (WT)</span>
                <span className="text-[10px] text-slate-500">All Layers Combined</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-slate-900">
                  {(metrics!.wtDice! * 100).toFixed(1)}%
                </span>
                <span className="text-xs font-mono text-slate-500">Dice Match Score</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                How closely the entire tumor area matches the doctor's outline (100% is a perfect match).
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Catch Rate (Sensitivity):</span>
                  <span className="text-slate-950 font-bold font-mono">{(metrics!.wtSensitivity! * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Healthy Tissue Safe (Specificity):</span>
                  <span className="text-slate-950 font-bold font-mono">{(metrics!.wtSpecificity! * 100).toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* TC Dice */}
            <div className="p-5 rounded-2xl bg-white border border-violet-200/90 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-violet-700 uppercase">Tumor Core (TC)</span>
                <span className="text-[10px] text-slate-500 font-medium">Tumor Body (No Swelling)</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-slate-950">
                  {(metrics!.tcDice! * 100).toFixed(1)}%
                </span>
                <span className="text-xs text-slate-600 font-medium">Dice Match Score</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                How closely the central tumor mass matches the doctor's outline without outer swelling.
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Catch Rate (Sensitivity):</span>
                  <span className="text-slate-950 font-bold font-mono">{(metrics!.tcSensitivity! * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Healthy Tissue Safe (Specificity):</span>
                  <span className="text-slate-950 font-bold font-mono">{(metrics!.tcSpecificity! * 100).toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* ET Dice */}
            <div className="p-5 rounded-2xl bg-white border border-amber-200/90 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-amber-700 uppercase">Active Tumor (ET)</span>
                <span className="text-[10px] text-slate-500 font-medium">Fast-Growing Rim</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-slate-950">
                  {(metrics!.etDice! * 100).toFixed(1)}%
                </span>
                <span className="text-xs text-slate-600 font-medium">Dice Match Score</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                How accurately the AI outlined the most active part that absorbs contrast dye.
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Catch Rate (Sensitivity):</span>
                  <span className="text-slate-950 font-bold font-mono">{(metrics!.etSensitivity! * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Healthy Tissue Safe (Specificity):</span>
                  <span className="text-slate-950 font-bold font-mono">{(metrics!.etSpecificity! * 100).toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mathematical Formulations Box */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">How These Accuracy Scores Are Calculated</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200/80 space-y-1">
                <span className="text-sky-800 block font-bold">Dice Match Score (Overlap):</span>
                <span className="text-slate-900 font-mono font-medium text-xs block">DSC = 2 × (AI ∩ Doctor) / (AI + Doctor)</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Measures the exact overlap between the AI's tumor map and the doctor's map. 100% means both maps are identical; 0% means they missed each other completely.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-violet-50/70 border border-violet-200/80 space-y-1">
                <span className="text-violet-800 block font-bold">Sensitivity (Catch Rate):</span>
                <span className="text-slate-900 font-mono font-medium text-xs block">Sensitivity = (AI ∩ Doctor) / Doctor</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Shows what percentage of the doctor's tumor the AI successfully caught. A high score means the AI did not overlook or miss tumor tissue.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
