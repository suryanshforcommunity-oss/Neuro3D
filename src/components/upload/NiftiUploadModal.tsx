import React, { useMemo } from 'react';
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { UploadedSequence, MriSequenceType } from '../../types';
import { SequenceSlotCard } from './SequenceSlotCard';
import { validateSequenceConsistency } from '../../utils/niftiValidation';

interface NiftiUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  sequences: UploadedSequence[];
  onUploadFile: (type: MriSequenceType, file: File) => void;
  onRemoveSequence: (type: MriSequenceType) => void;
  onConfirmLoad: () => void;
}

export const NiftiUploadModal: React.FC<NiftiUploadModalProps> = ({
  isOpen,
  onClose,
  sequences,
  onUploadFile,
  onRemoveSequence,
  onConfirmLoad,
}) => {
  if (!isOpen) return null;

  const consistency = useMemo(() => {
    return validateSequenceConsistency(sequences);
  }, [sequences]);

  const requiredSequences = ['T1', 'T1Gd', 'T2', 'FLAIR'];
  const requiredLoaded = sequences.filter(
    s => s.isLoaded && s.isValid && requiredSequences.includes(s.sequenceType)
  ).length;

  const isReady = requiredLoaded === 4 && consistency.isConsistent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-4xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden select-none">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center flex-shrink-0">
              <UploadCloud className="w-5 h-5 text-sky-700" />
            </div>
            <div>
              <h2 className="font-bold text-slate-950 text-base font-display">
                Upload 3D MRI Brain Scans
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Standard Brain MRI Set: T1, T1-Gd (Contrast), T2, and FLAIR Scans (.nii or .nii.gz)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security & Client-Side Privacy Guarantee */}
        <div className="px-6 py-2.5 bg-emerald-50/70 border-b border-emerald-100 flex items-center gap-2.5 text-xs text-emerald-950 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            <strong className="font-bold text-emerald-900">100% Private & Secure:</strong> MRI scans are read directly inside your browser. No medical scan data leaves your computer without your explicit permission.
          </span>
        </div>

        {/* Modal Main Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {/* Consistency validation alert */}
          {!consistency.isConsistent && consistency.errors.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Scan Dimension or Pixel Spacing Mismatch Detected</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-700 pl-1 font-medium">
                {consistency.errors.map((err, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Structured Linear Sequence Checklist (No Bubble Grids!) */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white shadow-xs">
            {sequences.map(slot => (
              <SequenceSlotCard
                key={slot.sequenceType}
                slot={slot}
                required={slot.sequenceType !== 'EXPERT_MASK'}
                onUploadFile={onUploadFile}
                onRemove={onRemoveSequence}
              />
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Progress Tracker */}
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">
              Scans Loaded:
            </span>
            <div className="flex items-center gap-1.5">
              {requiredSequences.map(type => {
                const isLoaded = sequences.find(s => s.sequenceType === type)?.isLoaded;
                return (
                  <span
                    key={type}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition ${
                      isLoaded
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-slate-200/80 text-slate-500 border-slate-300'
                    }`}
                  >
                    {type}
                  </span>
                );
              })}
            </div>
            <span className="text-slate-500 font-mono text-[11px] font-medium">
              ({requiredLoaded}/4 required)
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-200/70 border border-slate-200 bg-white transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirmLoad();
                onClose();
              }}
              disabled={requiredLoaded === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <span>Open Scans in 3D Viewer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
