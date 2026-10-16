import React from 'react';
import {
  RotateCcw,
  HelpCircle,
  UploadCloud,
  Server,
  Database,
  Crosshair,
  Layers,
  Sparkles,
  Home,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { MriSequenceType, VoxelCoordinate, WorldCoordinate } from '../../types';

interface TopToolbarProps {
  studyId?: string;
  isDemoMode: boolean;
  backendStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  backendUrl: string;
  onCheckBackend: () => void;
  onResetView: () => void;
  onOpenUpload: () => void;
  onOpenHelp: () => void;
  onLoadDemo: () => void;
  onGoHome?: () => void;
  activeSequence: MriSequenceType;
  onSelectSequence: (seq: MriSequenceType) => void;
  crosshair: VoxelCoordinate;
  worldCoordinate: WorldCoordinate;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  studyId = 'BRATS_2023_DEMO_042',
  isDemoMode,
  backendStatus,
  backendUrl,
  onCheckBackend,
  onResetView,
  onOpenUpload,
  onOpenHelp,
  onLoadDemo,
  onGoHome,
  activeSequence,
  onSelectSequence,
  crosshair,
  worldCoordinate,
}) => {
  const sequences: { id: MriSequenceType; label: string; desc: string }[] = [
    { id: 'T1', label: 'T1', desc: 'Anatomical reference' },
    { id: 'T1Gd', label: 'T1-Gd', desc: 'Gadolinium contrast (ET)' },
    { id: 'T2', label: 'T2', desc: 'Fluid / edema sensitive' },
    { id: 'FLAIR', label: 'FLAIR', desc: 'CSF suppressed (ED)' },
  ];

  return (
    <header className="h-14 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 flex items-center justify-between text-sm select-none shadow-xs text-slate-800">
      {/* Left section: Study info and status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs font-mono font-medium">CASE:</span>
          <span className="font-mono text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
            {studyId}
          </span>
        </div>

        {/* Data mode badge */}
        {isDemoMode ? (
          <Badge variant="amber" size="sm" className="hidden sm:inline-flex">
            <Database className="w-3 h-3 text-amber-500" />
            DEMO PREVIEW DATA
          </Badge>
        ) : (
          <Badge variant="cyan" size="sm" className="hidden sm:inline-flex">
            <Database className="w-3 h-3 text-sky-600" />
            RESEARCH DATA
          </Badge>
        )}

        {/* Backend health indicator */}
        <div
          onClick={onCheckBackend}
          title={`Backend status (${backendUrl}). Click to re-check connection.`}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono cursor-pointer hover:border-slate-300 transition"
        >
          <Server
            className={`w-3.5 h-3.5 ${
              backendStatus === 'connected'
                ? 'text-emerald-500'
                : backendStatus === 'connecting'
                ? 'text-amber-500 animate-pulse'
                : 'text-rose-500'
            }`}
          />
          <span
            className={
              backendStatus === 'connected'
                ? 'text-emerald-700 font-medium'
                : backendStatus === 'connecting'
                ? 'text-amber-700'
                : 'text-slate-500'
            }
          >
            {backendStatus === 'connected'
              ? 'AI Engine Connected'
              : backendStatus === 'connecting'
              ? 'Connecting...'
              : 'Backend Disconnected (Preview Mode)'}
          </span>
        </div>
      </div>

      {/* Middle section: Sequence selector */}
      <div className="hidden lg:flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/90 shadow-2xs">
        <span className="text-[10px] uppercase font-mono text-slate-500 px-2 flex items-center gap-1">
          <Layers className="w-3 h-3 text-sky-600" />
          Sequence:
        </span>
        {sequences.map(seq => (
          <button
            key={seq.id}
            onClick={() => onSelectSequence(seq.id)}
            title={seq.desc}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition ${
              activeSequence === seq.id
                ? 'bg-sky-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            {seq.label}
          </button>
        ))}
      </div>

      {/* Right section: Coordinates & Actions */}
      <div className="flex items-center gap-2">
        {/* Real-time canonical coordinates display */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono">
          <Crosshair className="w-3.5 h-3.5 text-sky-600" />
          <span className="text-slate-500">
            Voxel: <strong className="text-slate-900">({crosshair.i}, {crosshair.j}, {crosshair.k})</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">
            World: <strong className="text-sky-700 font-semibold">({worldCoordinate.x.toFixed(1)}, {worldCoordinate.y.toFixed(1)}, {worldCoordinate.z.toFixed(1)}) mm</strong>
          </span>
        </div>

        {/* Demo Case Loader */}
        <button
          onClick={onLoadDemo}
          title="Reload synthetic research phantom preview"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">Load Demo Case</span>
        </button>

        {/* Upload Button */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-xs text-xs font-semibold transition"
        >
          <UploadCloud className="w-3.5 h-3.5 text-white" />
          <span className="hidden sm:inline">Upload NIfTI (4 seq)</span>
        </button>

        {/* Reset View Button */}
        <button
          onClick={onResetView}
          title="Reset 3D camera and slice center"
          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-2xs"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Home / Landing Page Button */}
        {onGoHome && (
          <button
            onClick={onGoHome}
            title="Return to Product Overview & Landing Page"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-sky-600 hover:bg-slate-50 text-xs font-medium transition shadow-2xs"
          >
            <Home className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden md:inline">Overview</span>
          </button>
        )}

        {/* Help Button */}
        <button
          onClick={onOpenHelp}
          title="Workstation User Guide & Research Specifications"
          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-sky-600 hover:bg-slate-50 transition shadow-2xs"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
