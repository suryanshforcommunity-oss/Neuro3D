import React from 'react';
import { X, BookOpen, Layers, ShieldCheck, Crosshair, AlertTriangle } from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0B0F1A] border border-[#1E293B] rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden select-none">
        {/* Header */}
        <div className="p-4 border-b border-[#1E293B] flex items-center justify-between bg-[#0E1322]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="font-semibold text-slate-100 text-sm">
              NeuroScope 3D — Medical Workstation User Guide
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs text-slate-300">
          {/* Interaction shortcuts */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <h3 className="font-semibold text-slate-200 mb-2 font-mono flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              Synchronized 3D & Orthogonal Navigation Controls
            </h3>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-cyan-400 block font-semibold">Slice Views (Canvas):</span>
                <span className="text-slate-400 block">• Left Click / Drag: Update crosshair</span>
                <span className="text-slate-400 block">• Mouse Wheel: Navigate slices</span>
                <span className="text-slate-400 block">• Shift + Wheel: Zoom in/out</span>
                <span className="text-slate-400 block">• Right Click + Drag: Pan slice</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-violet-400 block font-semibold">3D Brain Viewer:</span>
                <span className="text-slate-400 block">• Left Drag: Orbit camera</span>
                <span className="text-slate-400 block">• Mouse Wheel: Zoom in/out</span>
                <span className="text-slate-400 block">• Right Drag: Pan camera</span>
                <span className="text-slate-400 block">• Cutaway button: Slices brain open</span>
              </div>
            </div>
          </div>

          {/* BraTS label nesting */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <h3 className="font-semibold text-slate-200 mb-2 font-mono flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              BraTS Standard Nested Tumour Definitions
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
              The brain tumour regions follow standard BraTS challenge specifications. They are hierarchical and overlapping, not mutually exclusive biological compartments:
            </p>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="p-2 rounded bg-cyan-950/20 border border-cyan-500/30 text-cyan-300">
                <strong>Whole Tumour (WT):</strong> Cyan. Includes Necrotic Core (NCR, label 1) + Edema (ED, label 2) + Enhancing Tumour (ET, label 4).
              </div>
              <div className="p-2 rounded bg-violet-950/20 border border-violet-500/30 text-violet-300">
                <strong>Tumour Core (TC):</strong> Violet. Includes Necrotic Core (NCR, label 1) + Enhancing Tumour (ET, label 4). Excludes edema.
              </div>
              <div className="p-2 rounded bg-amber-950/20 border border-amber-500/30 text-amber-300">
                <strong>Enhancing Tumour (ET):</strong> Amber. Active, contrast-enhanced hyperintense rim (label 4).
              </div>
            </div>
          </div>

          {/* Regulatory boundary */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
            <div className="flex items-center gap-2 font-bold font-mono text-[11px] mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>RESEARCH PROTOTYPE PROTOCOL</span>
            </div>
            <p className="leading-relaxed">
              This application is designed strictly for biomedical research and educational demonstration. It must never diagnose patients or make treatment decisions. All segmentation outputs are experimental previews requiring independent radiologist evaluation.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1E293B] bg-[#0E1322] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
