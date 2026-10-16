import React, { useMemo } from 'react';
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Layers,
  ArrowRight,
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

  const requiredLoaded = sequences.filter(
    s => s.isLoaded && s.isValid && ['T1', 'T1Gd', 'T2', 'FLAIR'].includes(s.sequenceType)
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0B0F1A] border border-[#1E293B] rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden select-none">
        {/* Header */}
        <div className="p-4 border-b border-[#1E293B] flex items-center justify-between bg-[#0E1322]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <UploadCloud className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-100 text-sm">
                4-Sequence NIfTI Study Upload & Pre-Validation
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                BraTS Protocol: T1, T1-Contrast, T2, FLAIR + Optional Expert Mask
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security & Privacy Banner */}
        <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-2 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            <strong className="text-white">Client-Side Privacy Guarantee:</strong> All NIfTI headers and arrays are parsed directly in your local browser sandbox. No medical data is sent over the network until you explicitly trigger backend segmentation.
          </span>
        </div>

        {/* Main Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Consistency validation alert */}
          {!consistency.isConsistent && consistency.errors.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 space-y-1">
              <div className="flex items-center gap-2 font-semibold font-mono text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Sequence Dimension or Spatial Matrix Discrepancy</span>
              </div>
              {consistency.errors.map((err, idx) => (
                <p key={idx} className="leading-relaxed">
                  {err}
                </p>
              ))}
            </div>
          )}

          {/* Slots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

        {/* Footer */}
        <div className="p-4 border-t border-[#1E293B] bg-[#0E1322] flex items-center justify-between text-xs font-mono">
          <div className="text-slate-400">
            Loaded: <span className="text-cyan-300 font-semibold">{requiredLoaded}/4</span> required modalities
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirmLoad();
                onClose();
              }}
              disabled={requiredLoaded === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-medium shadow-md shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <span>Load into Workstation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
