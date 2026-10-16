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
          <h3 className="font-semibold text-slate-800 text-sm font-semibold">AI Accuracy, Safety & How It Works</h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              reliabilityInfo.backendConnected ? 'bg-emerald-400' : 'bg-rose-400'
            }`}
          />
          <span className="text-[11px] font-mono text-slate-400">
            {reliabilityInfo.backendConnected ? 'AI Server Online' : 'Offline / Preview Mode'}
          </span>
        </div>
      </div>

      {/* Model Status Banner */}
      {!reliabilityInfo.backendConnected ? (
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs font-mono">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>AI SERVER STATUS</span>
          </div>
          <p className="font-medium text-slate-800">
            “The AI server is currently offline. Operating in preview mode.”
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            You are viewing the app in offline preview mode. Any tumor outlines displayed are sample illustrations for practice and learning.
          </p>
        </div>
      ) : !reliabilityInfo.inferenceAvailable ? (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-300 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs font-mono">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>AI MODEL WEIGHTS NOT LOADED</span>
          </div>
          <p className="font-medium text-amber-200">
            “{reliabilityInfo.statusMessage}”
          </p>
          <p className="text-[11px] text-amber-400/80 leading-relaxed">
            The server is reachable, but the trained AI neural network model file is not installed. To run real tumor predictions, install the model weights.
          </p>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>AI server connected and ready. All 4 MRI scans (T1, T1-Gd, T2, FLAIR) can be analyzed.</span>
        </div>
      )}

      {/* Model Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-[10px] text-slate-400 block mb-0.5">AI Model & Architecture</span>
          <span className="font-semibold text-slate-800">{reliabilityInfo.modelName}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{reliabilityInfo.architecture}</span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-[10px] text-slate-400 block mb-0.5">Model Version & License</span>
          <span className="font-semibold text-slate-800">{reliabilityInfo.modelVersion}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{reliabilityInfo.modelLicense}</span>
        </div>
      </div>

      {/* Preprocessing Pipeline */}
      <div>
        <h4 className="text-xs font-bold text-slate-950 mb-2 flex items-center gap-1.5 font-sans">
          <Cpu className="w-4 h-4 text-sky-600" />
          How Scans Are Prepared Before AI Analysis (Preprocessing Steps)
        </h4>
        <div className="space-y-1.5">
          {reliabilityInfo.preprocessingPipeline.map((step, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 text-xs text-slate-800 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs font-medium"
            >
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                {idx + 1}
              </span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Out-of-Distribution (OOD) & Uncertainty */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 shadow-2xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 font-bold block mb-1">
            Unusual Scan Warning (Out-of-Distribution)
          </span>
          <span className="font-sans text-amber-950 font-bold text-sm block">
            {reliabilityInfo.oodWarning ? reliabilityInfo.oodWarning : 'Scanner Check Inactive (Offline)'}
          </span>
          <p className="mt-1.5 text-xs text-slate-700 leading-relaxed font-medium">
            Checks if an MRI scan looks too different from typical scans (e.g. unusual scanner brands or imaging artifacts).
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-600 font-bold block mb-1">
            AI Confidence & Doubt Check (Uncertainty)
          </span>
          <span className="font-sans text-slate-900 font-bold text-sm block">Requires AI Server GPU</span>
          <p className="mt-1.5 text-xs text-slate-700 leading-relaxed font-medium">
            Measures how confident the AI is around tricky tumor borders. Requires deep neural network GPU passes.
          </p>
        </div>
      </div>

      {/* Case-specific Evaluation Metrics */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <h4 className="text-xs font-bold text-slate-950 mb-2 flex items-center gap-1.5 font-sans">
          <Activity className="w-4 h-4 text-violet-600" />
          How Accurately Did the AI Find the Tumor in This Scan?
        </h4>
        {hasExpert ? (
          <div className="space-y-3 mt-3 font-sans text-xs">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-200">
                <span className="text-[10px] font-mono font-bold text-sky-800 uppercase block mb-1">Whole Tumor Match (WT)</span>
                <span className="text-2xl font-black font-mono text-slate-950">{(metrics.wtDice! * 100).toFixed(1)}%</span>
                <span className="text-xs text-slate-700 font-mono font-medium block mt-1">Catch Rate: {(metrics.wtSensitivity! * 100).toFixed(1)}%</span>
              </div>
              <div className="p-3.5 rounded-xl bg-violet-50/80 border border-violet-200">
                <span className="text-[10px] font-mono font-bold text-violet-800 uppercase block mb-1">Tumor Core Match (TC)</span>
                <span className="text-2xl font-black font-mono text-slate-950">{(metrics.tcDice! * 100).toFixed(1)}%</span>
                <span className="text-xs text-slate-700 font-mono font-medium block mt-1">Catch Rate: {(metrics.tcSensitivity! * 100).toFixed(1)}%</span>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200">
                <span className="text-[10px] font-mono font-bold text-amber-800 uppercase block mb-1">Active Tumor Match (ET)</span>
                <span className="text-2xl font-black font-mono text-slate-950">{(metrics.etDice! * 100).toFixed(1)}%</span>
                <span className="text-xs text-slate-700 font-mono font-medium block mt-1">Catch Rate: {(metrics.etSensitivity! * 100).toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 font-medium italic mt-2">
              *Calculated by comparing the AI's tumor outline directly against the doctor's hand-drawn tumor map.
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">
            “To measure accuracy, upload the doctor's tumor map (Ground Truth).” Once loaded, the system will calculate exact match percentages (Dice score and catch rate).
          </p>
        )}
      </div>

      {/* Known Limitations */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <h4 className="text-xs font-bold text-slate-950 mb-2 flex items-center gap-1.5 font-sans">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          Important Safety Notes & Limitations
        </h4>
        <ul className="space-y-1.5 list-disc list-inside text-xs text-slate-800 font-medium">
          {reliabilityInfo.knownLimitations.map((lim, idx) => (
            <li key={idx} className="leading-relaxed">
              <span className="text-slate-800">{lim}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
