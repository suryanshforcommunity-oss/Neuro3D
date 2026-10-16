import React from 'react';
import { X, BookOpen, Layers, ShieldCheck, Crosshair, AlertTriangle } from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden select-none">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-600" />
            <h2 className="font-semibold text-slate-800 text-sm font-semibold">
              NeuroScope 3D — How to Use This Website
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs text-slate-600">
          {/* Interaction shortcuts */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 rounded-xl">
            <h3 className="font-semibold text-slate-800 mb-2 font-mono flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-sky-600" />
              How to Navigate Scans & 3D Brain
            </h3>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded bg-white border border-slate-200 rounded-lg shadow-2xs">
                <span className="text-sky-600 block font-semibold">2D MRI Slice Views:</span>
                <span className="text-slate-500 block">• Left Click / Drag: Move crosshair</span>
                <span className="text-slate-500 block">• Scroll Wheel: Navigate slices</span>
                <span className="text-slate-500 block">• Shift + Scroll: Zoom in/out</span>
                <span className="text-slate-500 block">• Right Click + Drag: Move / pan</span>
              </div>
              <div className="p-2 rounded bg-white border border-slate-200 rounded-lg shadow-2xs">
                <span className="text-violet-600 block font-semibold">3D Brain Viewer:</span>
                <span className="text-slate-500 block">• Left Click + Drag: Rotate brain</span>
                <span className="text-slate-500 block">• Scroll Wheel: Zoom in/out</span>
                <span className="text-slate-500 block">• Right Click + Drag: Move / pan</span>
                <span className="text-slate-500 block">• Cutaway Button: Slices open brain</span>
              </div>
            </div>
          </div>

          {/* BraTS label nesting */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 rounded-xl">
            <h3 className="font-semibold text-slate-800 mb-2 font-mono flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-600" />
              Tumor Layers Explained (Whole Tumor, Core, Active Rim)
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
              Brain tumors have distinct layers that fit inside one another, like nesting Russian dolls:
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-950">
                <strong className="text-sky-900 font-bold">Whole Tumor (WT - Blue):</strong> The entire affected area. Combines the active growing tumor, inner dead cells, and surrounding brain swelling.
              </div>
              <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-200 text-violet-950">
                <strong className="text-violet-900 font-bold">Tumor Core (TC - Purple):</strong> The tumor body itself (active rim + dead core), excluding the outer brain swelling.
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                <strong className="text-amber-900 font-bold">Active Tumor (ET - Amber):</strong> The rapidly growing outer rim that absorbs contrast dye and glows brightly on scans.
              </div>
            </div>
          </div>

          {/* Regulatory boundary */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-xs mb-1 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>EDUCATIONAL RESEARCH NOTICE</span>
            </div>
            <p className="leading-relaxed font-medium text-slate-800">
              This website is built for university research and educational demonstration. It is not for clinical diagnosis or medical treatment. All AI tumor outlines are demonstration previews and require evaluation by qualified medical professionals.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-xs transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
