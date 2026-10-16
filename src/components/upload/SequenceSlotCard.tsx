import React, { useRef } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  HardDrive,
  Hash,
} from 'lucide-react';
import { UploadedSequence, MriSequenceType } from '../../types';

interface SequenceSlotCardProps {
  slot: UploadedSequence;
  required?: boolean;
  onUploadFile: (type: MriSequenceType, file: File) => void;
  onRemove: (type: MriSequenceType) => void;
}

export const SequenceSlotCard: React.FC<SequenceSlotCardProps> = ({
  slot,
  required = true,
  onUploadFile,
  onRemove,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sequenceLabels: Record<MriSequenceType, { title: string; subtitle: string; tag: string }> = {
    T1: { title: 'T1 Native', subtitle: 'T1-weighted non-contrast anatomical MRI', tag: 'Required' },
    T1Gd: { title: 'T1-Gd (Contrast)', subtitle: 'T1 with gadolinium contrast enhancement', tag: 'Required' },
    T2: { title: 'T2-weighted', subtitle: 'Fluid-sensitive structural sequence', tag: 'Required' },
    FLAIR: { title: 'T2-FLAIR', subtitle: 'Fluid-attenuated inversion recovery sequence', tag: 'Required' },
    EXPERT_MASK: { title: 'Expert Ground Truth Mask', subtitle: 'Optional radiologist ground truth (.nii/.nii.gz)', tag: 'Optional' },
  };

  const info = sequenceLabels[slot.sequenceType];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadFile(slot.sequenceType, e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadFile(slot.sequenceType, e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
      className={`p-3.5 rounded-xl border transition select-none ${
        slot.isLoaded
          ? slot.isValid
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-rose-50/70 border-rose-200 text-rose-950'
          : 'bg-slate-50 border border-slate-200 hover:border-sky-300 shadow-2xs'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".nii,.gz"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 text-xs font-mono">{info.title}</span>
            <span
              className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase ${
                required
                  ? 'bg-sky-50 text-sky-700 border border-sky-200 font-semibold'
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}
            >
              {info.tag}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">{info.subtitle}</p>
        </div>

        {slot.isLoaded && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-800 transition"
              title="Replace file"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onRemove(slot.sequenceType)}
              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
              title="Remove sequence"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Upload area or File details */}
      {!slot.isLoaded ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="mt-2.5 p-3 rounded-lg border border-dashed border-slate-700/80 hover:border-cyan-500/50 hover:bg-cyan-950/10 transition cursor-pointer flex flex-col items-center justify-center text-center"
        >
          <UploadCloud className="w-5 h-5 text-slate-500 mb-1" />
          <span className="text-xs text-slate-700 font-medium">Click to browse or drag & drop</span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5">Supports .nii, .nii.gz (up to 1 GB)</span>
        </div>
      ) : (
        <div className="mt-2.5 space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between p-2 rounded bg-slate-950/80 border border-slate-100">
            <div className="flex items-center gap-2 overflow-hidden truncate">
              <FileText className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
              <span className="text-slate-800 truncate text-[11px] font-medium">{slot.filename}</span>
            </div>
            <span className="text-[10px] text-slate-500 flex-shrink-0">
              {(slot.fileSize / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>

          {slot.isValid && slot.header && (
            <div className="p-2 rounded bg-slate-900/50 border border-slate-100 text-[10px] text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Dimensions:</span>
                <span className="text-slate-800">
                  {slot.header.dimensions.dimX} × {slot.header.dimensions.dimY} × {slot.header.dimensions.dimZ}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Voxel Spacing:</span>
                <span className="text-slate-800">
                  {slot.header.spacing.x.toFixed(2)} × {slot.header.spacing.y.toFixed(2)} × {slot.header.spacing.z.toFixed(2)} mm
                </span>
              </div>
              {slot.sha256 && (
                <div className="flex items-center justify-between text-[9px] text-slate-500 truncate">
                  <span className="flex items-center gap-1">
                    <Hash className="w-2.5 h-2.5 text-sky-600" />
                    SHA-256:
                  </span>
                  <span className="font-mono text-cyan-300 truncate max-w-[140px]">{slot.sha256.substring(0, 16)}...</span>
                </div>
              )}
            </div>
          )}

          {!slot.isValid && slot.validationError && (
            <div className="p-2 rounded bg-rose-950/40 border border-rose-500/40 text-rose-300 text-[11px] flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{slot.validationError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
