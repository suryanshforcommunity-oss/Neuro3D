import React from 'react';
import {
  Printer,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Hash,
  Database,
  Calendar,
  Layers,
} from 'lucide-react';
import { StudyProvenance, ModelReliabilityInfo } from '../../types';

interface ProvenanceReportViewProps {
  provenance: StudyProvenance | null;
  reliabilityInfo: ModelReliabilityInfo;
}

export const ProvenanceReportView: React.FC<ProvenanceReportViewProps> = ({
  provenance,
  reliabilityInfo,
}) => {
  if (!provenance) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono text-sm">
        No study loaded. Please load a research case or demo phantom to view provenance.
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 select-text">
      {/* Top action toolbar (hidden during print) */}
      <div className="no-print flex items-center justify-between pb-4 border-b border-[#1E293B]">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Research Provenance & Volumetric Report</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Cryptographic SHA-256 lineage verification & BraTS quantitative measurement
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-md shadow-cyan-500/20 transition"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Formal Printable Document Card */}
      <div className="print-page bg-[#0E1322] border border-[#1E293B] rounded-2xl p-8 space-y-6 shadow-2xl text-slate-200">
        {/* Document Header */}
        <div className="border-b border-[#1E293B] pb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">NeuroScope 3D</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                PROVENANCE RECORD
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{provenance.institution}</p>
          </div>

          <div className="text-right text-xs font-mono space-y-1">
            <div>
              <span className="text-slate-400">STUDY ID: </span>
              <span className="font-bold text-white">{provenance.studyId}</span>
            </div>
            <div>
              <span className="text-slate-400">SUBJECT ID: </span>
              <span className="text-slate-300">{provenance.patientDeidentifiedId}</span>
            </div>
            <div>
              <span className="text-slate-400">TIMESTAMP: </span>
              <span className="text-slate-300">
                {new Date(provenance.createdTimestamp).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Mandatory Research Notice Box */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold font-mono text-[11px] uppercase tracking-wider text-amber-400">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>MANDATORY RESEARCH DISCLAIMER</span>
          </div>
          <p className="font-medium leading-relaxed">
            “Research and teaching prototype only. Not for clinical diagnosis or treatment decisions. Model outputs are experimental and require independent expert review.”
          </p>
          <p className="text-[11px] text-amber-300/80 italic">
            Suspected tumour region predicted by the model. This system does not claim diagnostic efficacy or replacement of radiologist evaluation.
          </p>
        </div>

        {/* Cryptographic Sequence Hash Verification Table */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-cyan-400 mb-2 flex items-center gap-1.5">
            <Hash className="w-4 h-4" />
            <span>Input MRI Sequences & SHA-256 Cryptographic Hashes</span>
          </h3>
          <div className="overflow-x-auto rounded-xl border border-[#1E293B]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#12182B] text-slate-400 text-[11px] border-b border-[#1E293B]">
                <tr>
                  <th className="p-2.5">Modality</th>
                  <th className="p-2.5">Filename</th>
                  <th className="p-2.5">Size</th>
                  <th className="p-2.5">Voxel Matrix</th>
                  <th className="p-2.5">Spacing</th>
                  <th className="p-2.5">SHA-256 Digest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B] bg-[#0A0E18]/60">
                {provenance.files.map(f => (
                  <tr key={f.sequence} className="hover:bg-slate-900/40">
                    <td className="p-2.5 font-bold text-cyan-300">{f.sequence}</td>
                    <td className="p-2.5 text-slate-200">{f.filename}</td>
                    <td className="p-2.5 text-slate-400">{(f.fileSize / (1024 * 1024)).toFixed(2)} MB</td>
                    <td className="p-2.5 text-slate-300">{f.dimensions}</td>
                    <td className="p-2.5 text-slate-300">{f.spacing}</td>
                    <td className="p-2.5 text-[10px] text-slate-400 truncate max-w-[180px]" title={f.sha256}>
                      {f.sha256}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Volumetric Results Breakdown */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-cyan-400 mb-2 flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            <span>Estimated Tumour Compartment Volumes (BraTS Protocol)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/30">
              <span className="text-[10px] font-mono text-cyan-400 font-semibold block mb-0.5">
                Whole Tumour (WT)
              </span>
              <div className="text-2xl font-bold font-mono text-white">
                {provenance.volumes.wtMl.toFixed(2)} <span className="text-xs text-slate-400">mL</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 block mt-1">
                WT = NCR (1) + ED (2) + ET (4)
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-violet-500/30">
              <span className="text-[10px] font-mono text-violet-400 font-semibold block mb-0.5">
                Tumour Core (TC)
              </span>
              <div className="text-2xl font-bold font-mono text-white">
                {provenance.volumes.tcMl.toFixed(2)} <span className="text-xs text-slate-400">mL</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 block mt-1">
                TC = NCR (1) + ET (4)
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/30">
              <span className="text-[10px] font-mono text-amber-400 font-semibold block mb-0.5">
                Enhancing Tumour (ET)
              </span>
              <div className="text-2xl font-bold font-mono text-white">
                {provenance.volumes.etMl.toFixed(2)} <span className="text-xs text-slate-400">mL</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 block mt-1">
                ET = Label 4 (ET)
              </span>
            </div>
          </div>
          <div className="mt-2 text-[10px] font-mono text-slate-400 text-right">
            Formula: {provenance.volumes.formula} (voxel spacing {provenance.volumes.spacing})
          </div>
        </div>

        {/* Model & Software Provenance */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-[#1E293B] text-xs font-mono space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-400 block text-[10px]">Model Architecture:</span>
              <span className="text-slate-200 font-semibold">{reliabilityInfo.modelName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Model Version:</span>
              <span className="text-slate-200 font-semibold">{reliabilityInfo.modelVersion}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Software Build:</span>
              <span className="text-slate-200 font-semibold">{provenance.softwareVersion}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Git Commit:</span>
              <span className="text-slate-200 font-semibold">{provenance.gitCommit}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
