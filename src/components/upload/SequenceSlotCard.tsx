import React, { useRef } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
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

  const sequenceMeta: Record<
    MriSequenceType,
    { title: string; subtitle: string; badgeLabel: string; badgeStyle: string }
  > = {
    T1: {
      title: 'T1 Scan (Brain Structure)',
      subtitle: 'Standard brain structure scan without contrast dye',
      badgeLabel: 'T1',
      badgeStyle: 'bg-slate-100 text-slate-800 border-slate-300',
    },
    T1Gd: {
      title: 'T1-Gd Scan (Contrast Dye)',
      subtitle: 'Scan with contrast dye highlighting the active, growing tumor rim',
      badgeLabel: 'T1-Gd',
      badgeStyle: 'bg-amber-50 text-amber-800 border-amber-300',
    },
    T2: {
      title: 'T2 Scan (Tissue & Fluid)',
      subtitle: 'Fluid-sensitive scan showing differences in brain tissue',
      badgeLabel: 'T2',
      badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    },
    FLAIR: {
      title: 'FLAIR Scan (Brain Swelling)',
      subtitle: 'Suppresses normal spinal fluid to clearly show brain swelling (edema)',
      badgeLabel: 'FLAIR',
      badgeStyle: 'bg-sky-50 text-sky-800 border-sky-300',
    },
    EXPERT_MASK: {
      title: "Doctor's Hand-Drawn Tumor Map",
      subtitle: "Optional expert tumor mask (.nii / .nii.gz) to check AI accuracy",
      badgeLabel: 'MASK',
      badgeStyle: 'bg-purple-50 text-purple-800 border-purple-300',
    },
  };

  const info = sequenceMeta[slot.sequenceType];

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
      className={`px-5 py-4 transition-colors select-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        slot.isLoaded
          ? slot.isValid
            ? 'bg-white hover:bg-slate-50/70'
            : 'bg-rose-50/40 hover:bg-rose-50/60'
          : 'bg-white hover:bg-slate-50/50'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".nii,.gz"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Left: Modality Identity & Badges */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-[240px] flex-shrink-0">
        <span
          className={`w-14 text-center px-2 py-1 rounded-md text-xs font-mono font-bold border ${info.badgeStyle}`}
        >
          {info.badgeLabel}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-xs tracking-tight">
              {info.title}
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                required
                  ? 'bg-sky-50 text-sky-800 border border-sky-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {required ? 'Required' : 'Optional'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-tight">
            {info.subtitle}
          </p>
        </div>
      </div>

      {/* Middle: Loaded File Specifications OR Error State OR Inline SaaS Dropzone */}
      <div className="flex-1 min-w-0">
        {slot.validationError ? (
          /* Explicit Invalid File State with Diagnostic Feedback */
          <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3 text-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span className="font-semibold text-rose-950 truncate" title={slot.filename}>
                  {slot.filename || 'Unsupported File'}
                </span>
                {slot.fileSize > 0 && (
                  <span className="text-[11px] text-rose-700 font-mono">
                    ({(slot.fileSize / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-100/90 border border-rose-300 px-2 py-0.5 rounded-md flex-shrink-0">
                Rejected
              </span>
            </div>

            <p className="text-[11px] text-rose-900 font-medium leading-relaxed bg-white/80 p-2 rounded-lg border border-rose-200/60">
              {slot.validationError}
            </p>

            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className="text-slate-500">Only standard 3D MRI scans (.nii or .nii.gz) supported</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-sky-700 hover:text-sky-900 font-bold hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Select Different File</span>
              </button>
            </div>
          </div>
        ) : !slot.isLoaded ? (
          /* Empty Ready Dropzone */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group border border-dashed border-slate-300 hover:border-sky-500 hover:bg-sky-50/40 bg-slate-50/60 rounded-xl px-4 py-2.5 cursor-pointer transition flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2.5 text-slate-600 group-hover:text-sky-900">
              <UploadCloud className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition" />
              <span className="font-medium">Click or drop 3D MRI scan (.nii or .nii.gz)</span>
            </div>
            <span className="text-[11px] font-mono text-slate-600">3D Volume (max 1 GB)</span>
          </div>
        ) : (
          /* Verified Loaded File Chip */
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="w-4 h-4 text-sky-600 flex-shrink-0" />
              <div className="truncate">
                <span className="text-slate-900 font-semibold text-xs truncate block max-w-[280px]" title={slot.filename}>
                  {slot.filename}
                </span>
                {slot.isValid && slot.header && (
                  <span className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                    <span>{slot.header.dimensions.dimX}×{slot.header.dimensions.dimY}×{slot.header.dimensions.dimZ} voxels (3D pixels)</span>
                    <span>•</span>
                    <span>{slot.header.spacing.x.toFixed(2)} mm pixel spacing</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono flex-shrink-0">
              <span className="text-slate-600 font-semibold text-xs">
                {(slot.fileSize / (1024 * 1024)).toFixed(2)} MB
              </span>
              <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px] font-sans font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified & Ready</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: Actions (Replace / Remove) */}
      {(slot.isLoaded || slot.validationError) && (
        <div className="flex items-center gap-1 sm:pl-2 flex-shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
            title="Choose a different MRI scan file"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onRemove(slot.sequenceType)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Remove scan from session"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
