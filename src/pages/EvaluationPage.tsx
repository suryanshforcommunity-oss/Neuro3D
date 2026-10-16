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
            <span>Quantitative Evaluation & Accuracy Benchmark</span>
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Voxel-level overlap similarity coefficients against radiologist expert ground truth
          </p>
        </div>

        {hasExpert && (
          <div className="px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            GROUND TRUTH VERIFIED
          </div>
        )}
      </div>

      {!hasExpert ? (
        /* Empty State / No Expert Mask */
        <div className="p-8 rounded-2xl bg-white border border-slate-200 rounded-2xl shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-500">
            <Target className="w-6 h-6 text-slate-500" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="font-semibold text-slate-800 text-sm">
              Case-Specific Accuracy Cannot Be Calculated
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No ground truth expert mask is loaded for this case. In accordance with clinical evaluation integrity standards, NeuroScope 3D never invents or manufactures mock Dice scores or confidence metrics.
            </p>
          </div>
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-slate-900 font-medium text-xs transition shadow-md shadow-cyan-500/20"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Expert Ground Truth Mask</span>
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
                <span className="text-xs font-bold text-sky-600 uppercase">Whole Tumour (WT)</span>
                <span className="text-[10px] text-slate-500">NCR + ED + ET</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-slate-900">
                  {(metrics!.wtDice! * 100).toFixed(1)}%
                </span>
                <span className="text-xs font-mono text-slate-500">Dice Score</span>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 font-mono text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Sensitivity (Recall):</span>
                  <span className="text-slate-900 font-semibold">{(metrics!.wtSensitivity! * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Specificity:</span>
                  <span className="text-slate-900 font-semibold">{(metrics!.wtSpecificity! * 100).toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* TC Dice */}
            <div className="p-5 rounded-2xl bg-white border border-violet-200/90 shadow-xs space-y-3">
              <div className="flex justify-between items-center font-mono">
                <span className="text-xs font-bold text-violet-400 uppercase">Tumour Core (TC)</span>
                <span className="text-[10px] text-slate-500">NCR + ET</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-slate-900">
                  {(metrics!.tcDice! * 100).toFixed(1)}%
                </span>
                <span className="text-xs font-mono text-slate-500">Dice Score</span>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 font-mono text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Sensitivity (Recall):</span>
                  <span className="text-slate-900 font-semibold">{(metrics!.tcSensitivity! * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Specificity:</span>
                  <span className="text-slate-900 font-semibold">{(metrics!.tcSpecificity! * 100).toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* ET Dice */}
            <div className="p-5 rounded-2xl bg-white border border-amber-200/90 shadow-xs space-y-3">
              <div className="flex justify-between items-center font-mono">
                <span className="text-xs font-bold text-amber-400 uppercase">Enhancing Tumour (ET)</span>
                <span className="text-[10px] text-slate-500">Label 4</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-slate-900">
                  {(metrics!.etDice! * 100).toFixed(1)}%
                </span>
                <span className="text-xs font-mono text-slate-500">Dice Score</span>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 font-mono text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Sensitivity (Recall):</span>
                  <span className="text-slate-900 font-semibold">{(metrics!.etSensitivity! * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Specificity:</span>
                  <span className="text-slate-900 font-semibold">{(metrics!.etSpecificity! * 100).toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mathematical Formulations Box */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3 text-xs text-slate-300 font-mono">
            <h4 className="font-semibold text-slate-800 uppercase">Evaluation Formulas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-100">
                <span className="text-sky-600 block font-bold mb-1">Dice Similarity Coefficient (DSC):</span>
                <span>DSC = 2 × |Prediction ∩ Expert| / (|Prediction| + |Expert|)</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-100">
                <span className="text-violet-400 block font-bold mb-1">Sensitivity (True Positive Rate):</span>
                <span>Sensitivity = |Prediction ∩ Expert| / |Expert|</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
