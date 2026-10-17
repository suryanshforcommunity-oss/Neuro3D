import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  Play,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Activity,
  Cpu,
  Clock,
  ShieldAlert,
  Server,
  User,
} from 'lucide-react';
import {
  DEMO_PATIENTS,
  DemoExaminationSlot,
  DemoPatientRecord,
} from '../../data/demoData';

interface MultiPatientDemoSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSlotId?: string | null;
  onSelectSlot: (slot: DemoExaminationSlot, executeLiveInference: boolean) => Promise<void>;
  backendConnected?: boolean;
  backendUrl?: string;
}

export const MultiPatientDemoSelectorModal: React.FC<MultiPatientDemoSelectorModalProps> = ({
  isOpen,
  onClose,
  activeSlotId = 'A1',
  onSelectSlot,
  backendConnected = false,
  backendUrl = 'http://127.0.0.1:8000',
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<'pat_001' | 'pat_002'>('pat_001');
  const [isExecutingSlot, setIsExecutingSlot] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPatient = DEMO_PATIENTS.find(p => p.id === selectedPatientId) || DEMO_PATIENTS[0];

  const handleExecute = async (slot: DemoExaminationSlot, live: boolean) => {
    setIsExecutingSlot(slot.slotId);
    try {
      await onSelectSlot(slot, live);
      onClose();
    } finally {
      setIsExecutingSlot(null);
    }
  };

  // Trend computations
  const exams = currentPatient.examinations;
  const prevExam = exams[exams.length - 2];
  const latestExam = exams[exams.length - 1];
  const absDiff = latestExam.volumes.wtVolumeMl - prevExam.volumes.wtVolumeMl;
  const pctDiff = ((absDiff / prevExam.volumes.wtVolumeMl) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                  Multi-Patient MRI Demo System
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold border border-sky-200">
                  6 Selectable Examinations
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Select patient and dated scan to simulate 3D tumor progression & evaluate model execution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Selection Tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-200 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEMO_PATIENTS.map(patient => {
              const isSelected = patient.id === selectedPatientId;
              const isIncreasing = patient.expectedTrend === 'increasing';
              return (
                <button
                  key={patient.id}
                  onClick={() => setSelectedPatientId(patient.id as 'pat_001' | 'pat_002')}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50/80 border-sky-400 shadow-xs ring-2 ring-sky-300/40'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isSelected ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-sm text-slate-900 block leading-tight">
                          {patient.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{patient.patientId}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isIncreasing
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {isIncreasing ? <TrendingUp className="w-3 h-3 text-amber-600" /> : <TrendingDown className="w-3 h-3 text-emerald-600" />}
                      <span>{isIncreasing ? 'Volume Progression' : 'Volume Regression'}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium line-clamp-1 mt-1">
                    {patient.trendDescription}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Patient 3-Exam Timeline */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                {currentPatient.name}'s Chronological Examinations (Select to Load or Infer)
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">3 Complete 4-Sequence MRI Scans</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {currentPatient.examinations.map((slot, index) => {
                const isActive = slot.slotId === activeSlotId;
                const isWorking = isExecutingSlot === slot.slotId;

                return (
                  <div
                    key={slot.slotId}
                    className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                      isActive
                        ? 'bg-sky-50/50 border-sky-400 shadow-sm ring-1 ring-sky-300'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div>
                      {/* Badge header */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold font-mono bg-slate-100 text-slate-800 border border-slate-200">
                          Scan {slot.slotId}
                        </span>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-200">
                            <CheckCircle2 className="w-3 h-3" />
                            ACTIVE
                          </span>
                        )}
                      </div>

                      {/* Date & Facility */}
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                          <Calendar className="w-3.5 h-3.5 text-sky-600" />
                          <span>{slot.displayDate}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">{slot.facility}</p>
                      </div>

                      {/* Sequences */}
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 mb-3 text-[10px] space-y-1 font-mono">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="font-bold">Sequences:</span>
                          <span className="text-emerald-700 font-bold">4/4 Complete</span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-slate-500">
                          <span className="px-1.5 py-0.5 bg-white rounded border border-slate-200">T1</span>
                          <span className="px-1.5 py-0.5 bg-white rounded border border-slate-200">T1-Gd</span>
                          <span className="px-1.5 py-0.5 bg-white rounded border border-slate-200">T2</span>
                          <span className="px-1.5 py-0.5 bg-white rounded border border-slate-200">FLAIR</span>
                        </div>
                      </div>

                      {/* Physical Volume Metrics */}
                      <div className="p-2.5 rounded-xl bg-slate-900 text-white mb-4 space-y-1">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Whole Tumor:</span>
                          <span className="text-base font-black font-mono text-cyan-300">
                            {slot.volumes.wtVolumeMl.toFixed(2)} mL
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[9px] text-slate-300 font-mono pt-1 border-t border-slate-800">
                          <div>Core (TC): {slot.volumes.tcVolumeMl.toFixed(2)} mL</div>
                          <div>Active (ET): {slot.volumes.etVolumeMl.toFixed(2)} mL</div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <button
                        disabled={isWorking}
                        onClick={() => handleExecute(slot, false)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>{isWorking ? 'Loading...' : 'Load & Visualize in 3D'}</span>
                      </button>

                      {backendConnected && (
                        <button
                          disabled={isWorking}
                          onClick={() => handleExecute(slot, true)}
                          title="Execute genuine MONAI SegResNet live inference on backend GPU/CPU"
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                        >
                          <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Run Live AI Inference</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Longitudinal Trend Chart & Comparative Analytics */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-600" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 font-mono">
                  Longitudinal Tumor Volume Trajectory ({currentPatient.name})
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Difference (Latest vs Prev):</span>
                <span className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold border ${
                  absDiff > 0
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  {absDiff > 0 ? `+${absDiff.toFixed(2)}` : absDiff.toFixed(2)} mL ({pctDiff > 0 ? `+${pctDiff.toFixed(1)}` : pctDiff.toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Visual Bar Comparison */}
            <div className="space-y-3">
              {currentPatient.examinations.map((e, idx) => {
                const maxVol = Math.max(...currentPatient.examinations.map(x => x.volumes.wtVolumeMl));
                const pctWidth = Math.max(10, Math.round((e.volumes.wtVolumeMl / maxVol) * 100));
                const isSelected = e.slotId === activeSlotId;

                return (
                  <div key={e.slotId} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="font-bold text-slate-700">
                        {e.displayDate} ({e.slotId})
                        {isSelected && <span className="ml-2 text-sky-600 font-bold">• Active</span>}
                      </span>
                      <span className="font-bold text-slate-900">{e.volumes.wtVolumeMl.toFixed(2)} mL</span>
                    </div>
                    <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          currentPatient.expectedTrend === 'increasing'
                            ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                            : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                        }`}
                        style={{ width: `${pctWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Clinical & Scientific Disclaimer */}
            <div className="p-3 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2 leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Neutral Volumetric Notice:</strong> Automated differences reflect computerized voxel integration.
                A measured volume increase or decrease in this demonstration prototype must not be equated with clinical tumor progression or therapy cure without comprehensive physician review.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>BraTS Standard Nested Labels: NCR=1, ED=2, ET=4</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
