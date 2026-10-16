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
    <header className="h-14 bg-[#0A0E18] border-b border-[#1E293B] px-4 flex items-center justify-between text-sm select-none">
      {/* Left section: Study info and status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs font-mono font-medium">CASE:</span>
          <span className="font-mono text-xs font-semibold text-cyan-300 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-500/20">
            {studyId}
          </span>
        </div>

        {/* Data mode badge */}
        {isDemoMode ? (
          <Badge variant="amber" size="sm" className="hidden sm:inline-flex">
            <Database className="w-3 h-3 text-amber-400" />
            DEMO PREVIEW DATA
          </Badge>
        ) : (
          <Badge variant="cyan" size="sm" className="hidden sm:inline-flex">
            <Database className="w-3 h-3 text-cyan-400" />
            RESEARCH DATA
          </Badge>
        )}

        {/* Backend health indicator - NEVER says "AI ready" unless confirmed connected */}
        <div
          onClick={onCheckBackend}
          title={`Backend status (${backendUrl}). Click to re-check connection.`}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-[11px] font-mono cursor-pointer hover:border-slate-700 transition"
        >
          <Server
            className={`w-3.5 h-3.5 ${
              backendStatus === 'connected'
                ? 'text-emerald-400'
                : backendStatus === 'connecting'
                ? 'text-amber-400 animate-pulse'
                : 'text-rose-400'
            }`}
          />
          <span
            className={
              backendStatus === 'connected'
                ? 'text-emerald-400 font-medium'
                : backendStatus === 'connecting'
                ? 'text-amber-300'
                : 'text-slate-400'
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
      <div className="hidden lg:flex items-center bg-[#101522] p-1 rounded-lg border border-[#1E293B]">
        <span className="text-[10px] uppercase font-mono text-slate-400 px-2 flex items-center gap-1">
          <Layers className="w-3 h-3 text-cyan-400" />
          Sequence:
        </span>
        {sequences.map(seq => (
          <button
            key={seq.id}
            onClick={() => onSelectSequence(seq.id)}
            title={seq.desc}
            className={`px-3 py-1 rounded text-xs font-mono font-medium transition ${
              activeSequence === seq.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {seq.label}
          </button>
        ))}
      </div>

      {/* Right section: Coordinates & Actions */}
      <div className="flex items-center gap-2">
        {/* Real-time canonical coordinates display */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded bg-[#101522] border border-[#1E293B] text-xs font-mono">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">
            Voxel: <strong className="text-slate-200">({crosshair.i}, {crosshair.j}, {crosshair.k})</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            World: <strong className="text-cyan-300">({worldCoordinate.x.toFixed(1)}, {worldCoordinate.y.toFixed(1)}, {worldCoordinate.z.toFixed(1)}) mm</strong>
          </span>
        </div>

        {/* Demo Case Loader */}
        <button
          onClick={onLoadDemo}
          title="Reload synthetic research phantom preview"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-medium transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span className="hidden sm:inline">Load Demo Case</span>
        </button>

        {/* Upload Button */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition"
        >
          <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Upload NIfTI (4 seq)</span>
        </button>

        {/* Reset View Button */}
        <button
          onClick={onResetView}
          title="Reset 3D camera and slice center"
          className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Home / Landing Page Button */}
        {onGoHome && (
          <button
            onClick={onGoHome}
            title="Return to Product Overview & Landing Page"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition"
          >
            <Home className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Overview</span>
          </button>
        )}

        {/* Help Button */}
        <button
          onClick={onOpenHelp}
          title="Workstation User Guide & Research Specifications"
          className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
