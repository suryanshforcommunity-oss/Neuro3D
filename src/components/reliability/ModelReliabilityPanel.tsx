import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Activity,
  Cpu,
  Layers,
  GitBranch,
} from 'lucide-react';
import { ModelReliabilityInfo, EvaluationMetrics } from '../../types';

interface ModelReliabilityPanelProps {
  reliabilityInfo: ModelReliabilityInfo;
  metrics?: EvaluationMetrics;
  onConnectBackend?: () => void;
}

export const ModelReliabilityPanel: React.FC<ModelReliabilityPanelProps> = ({
  reliabilityInfo,
  metrics,
  onConnectBackend,
}) => {
  const hasExpert = metrics && metrics.hasExpertMask;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 select-none space-y-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-sky-600" />
          <h3 className="font-semibold text-slate-800 text-sm font-semibold">Model Reliability & Uncertainty</h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              reliabilityInfo.backendConnected ? 'bg-emerald-400' : 'bg-rose-400'
            }`}
          />
          <span className="text-[11px] font-mono text-slate-400">
            {reliabilityInfo.backendConnected ? 'Inference Engine Online' : 'Backend Disconnected'}
          </span>
        </div>
      </div>

      {/* Model Status Banner */}
      {!reliabilityInfo.backendConnected ? (
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs font-mono">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>AI INFERENCE ENGINE STATUS</span>
          </div>
          <p className="font-medium text-slate-800">
            “Model inference is not connected. No AI prediction is available.”
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            The frontend is operating in local preview mode. Any synthetic segmentation displayed is illustrative demo data and must not be interpreted as an automated neural network prediction.
          </p>
        </div>
      ) : !reliabilityInfo.inferenceAvailable ? (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-300 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs font-mono">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>PRETRAINED WEIGHTS UNAVAILABLE (INFERENCE BLOCKED)</span>
          </div>
          <p className="font-medium text-amber-200">
            “{reliabilityInfo.statusMessage}”
          </p>
          <p className="text-[11px] text-amber-400/80 leading-relaxed">
            The backend server is reachable, but MONAI SegResNet weights are not installed. Real AI inference is currently unavailable. No simulated or fabricated predictions will be generated.
          </p>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Backend inference engine connected and authenticated. Ready for 4-sequence NIfTI processing.</span>
        </div>
      )}

      {/* Model Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-[10px] text-slate-400 block mb-0.5">Model Name & Architecture</span>
          <span className="font-semibold text-slate-800">{reliabilityInfo.modelName}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{reliabilityInfo.architecture}</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-[10px] text-slate-400 block mb-0.5">Version & License</span>
          <span className="font-semibold text-slate-800">{reliabilityInfo.modelVersion}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{reliabilityInfo.modelLicense}</span>
        </div>
      </div>

      {/* Preprocessing Pipeline */}
      <div>
        <h4 className="text-xs font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5 font-mono">
          <Cpu className="w-3.5 h-3.5 text-sky-600" />
          Standard Preprocessing Pipeline (MONAI Workflow)
        </h4>
        <div className="space-y-1">
          {reliabilityInfo.preprocessingPipeline.map((step, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-[11px] text-slate-300 bg-slate-900/40 px-2.5 py-1 rounded border border-slate-800/60 font-mono"
            >
              <span className="text-sky-600 font-semibold">{idx + 1}.</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Out-of-Distribution (OOD) & Uncertainty */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Out-of-Distribution (OOD) Warning
          </span>
          <span className="font-mono text-slate-300 font-medium">
            {reliabilityInfo.oodWarning ? reliabilityInfo.oodWarning : 'OOD Detector Inactive (Offline)'}
          </span>
          <p className="mt-1 text-[10px] text-slate-400 leading-tight">
            Requires backend ensemble variance test to flag out-of-distribution scanner geometries or artifacts.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Epistemic Uncertainty Estimation
          </span>
          <span className="font-mono text-slate-400 font-semibold">Not available</span>
          <p className="mt-1 text-[10px] text-slate-400 leading-tight">
            Uncertainty voxel heatmaps require Monte Carlo dropout passes on the backend GPU. Not manufactured client-side.
          </p>
        </div>
      </div>

      {/* Case-specific Evaluation Metrics */}
      <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
        <h4 className="text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1.5 font-mono">
          <Activity className="w-3.5 h-3.5 text-violet-400" />
          Case-Specific Accuracy & Overlap Evaluation
        </h4>
        {hasExpert ? (
          <div className="space-y-2 mt-2 font-mono text-xs">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-slate-950 border border-cyan-500/30">
                <span className="text-[10px] text-sky-600 block">WT Dice (DSC)</span>
                <span className="text-base font-bold text-white">{(metrics.wtDice! * 100).toFixed(1)}%</span>
                <span className="text-[9px] text-slate-400 block">Sensitivity: {(metrics.wtSensitivity! * 100).toFixed(1)}%</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-violet-500/30">
                <span className="text-[10px] text-violet-400 block">TC Dice (DSC)</span>
                <span className="text-base font-bold text-white">{(metrics.tcDice! * 100).toFixed(1)}%</span>
                <span className="text-[9px] text-slate-400 block">Sensitivity: {(metrics.tcSensitivity! * 100).toFixed(1)}%</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-amber-500/30">
                <span className="text-[10px] text-amber-400 block">ET Dice (DSC)</span>
                <span className="text-base font-bold text-white">{(metrics.etDice! * 100).toFixed(1)}%</span>
                <span className="text-[9px] text-slate-400 block">Sensitivity: {(metrics.etSensitivity! * 100).toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              *Evaluated against user-uploaded expert ground truth segmentation mask using real voxel overlap equations.
            </p>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            “Case-specific accuracy cannot be calculated without an expert ground truth mask.” Upload an expert mask slot to generate real Dice and sensitivity scores.
          </p>
        )}
      </div>

      {/* Known Limitations */}
      <div>
        <h4 className="text-xs font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Documented Methodological Limitations
        </h4>
        <ul className="space-y-1 list-disc list-inside text-[11px] text-slate-400">
          {reliabilityInfo.knownLimitations.map((lim, idx) => (
            <li key={idx} className="leading-relaxed">
              <span className="text-slate-300">{lim}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
