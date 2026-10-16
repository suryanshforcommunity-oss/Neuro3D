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
    { id: 'T1', label: 'T1', desc: 'Standard brain structure scan' },
    { id: 'T1Gd', label: 'T1-Gd', desc: 'Contrast dye scan (highlights active tumor)' },
    { id: 'T2', label: 'T2', desc: 'Tissue and fluid sensitive scan' },
    { id: 'FLAIR', label: 'FLAIR', desc: 'Dark fluid scan (highlights swelling)' },
  ];

  return (
    <header className="h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 flex items-center justify-between text-sm select-none shadow-xs text-slate-900 gap-2">
      {/* Left section: Study info and status */}
      <div className="flex items-center gap-2.5">
        {onGoHome && (
          <button
            onClick={onGoHome}
            title="Return to Homepage"
            className="flex items-center gap-2 hover:opacity-85 transition cursor-pointer group pr-2.5 border-r border-slate-200"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 bg-white p-0.5 shadow-2xs group-hover:scale-105 transition-transform flex items-center justify-center">
              <img
                src="/medical_ai_logo.jpeg"
                alt="Medical AI Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-xs tracking-tight text-slate-900 hidden sm:inline group-hover:text-sky-600 transition-colors">
              NeuroScope 3D
            </span>
          </button>
        )}

        <div className="flex items-center gap-1.5">
          <span className="text-slate-700 text-xs font-mono font-bold">CASE:</span>
          <span className="font-mono text-xs font-bold text-sky-900 bg-sky-100/90 px-2 py-0.5 rounded-md border border-sky-300">
            {studyId}
          </span>
        </div>

        {/* Data mode badge */}
        {isDemoMode ? (
          <Badge variant="amber" size="sm" className="hidden sm:inline-flex">
            <Database className="w-3 h-3 text-amber-600" />
            SAMPLE DEMO
          </Badge>
        ) : (
          <Badge variant="cyan" size="sm" className="hidden sm:inline-flex">
            <Database className="w-3 h-3 text-sky-600" />
            RESEARCH SCAN
          </Badge>
        )}

        {/* Backend health indicator */}
        <div
          onClick={onCheckBackend}
          title={`AI Server Status (${backendUrl}). Click to re-check connection.`}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-300 text-[11px] font-mono cursor-pointer hover:border-slate-400 transition"
        >
          <Server
            className={`w-3.5 h-3.5 ${
              backendStatus === 'connected'
                ? 'text-emerald-600'
                : backendStatus === 'connecting'
                ? 'text-amber-600 animate-pulse'
                : 'text-slate-500'
            }`}
          />
          <span
            className={
              backendStatus === 'connected'
                ? 'text-emerald-800 font-bold'
                : backendStatus === 'connecting'
                ? 'text-amber-800 font-bold'
                : 'text-slate-700 font-semibold'
            }
          >
            {backendStatus === 'connected'
              ? 'AI Server Connected'
              : backendStatus === 'connecting'
              ? 'Connecting...'
              : 'Offline Mode'}
          </span>
        </div>
      </div>

      {/* Middle section: Sequence selector */}
      <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-300 shadow-2xs">
        <span className="text-[11px] uppercase text-slate-700 font-bold px-2.5 flex items-center gap-1.5 tracking-wider">
          <Layers className="w-3.5 h-3.5 text-sky-600" />
          MRI View:
        </span>
        {sequences.map(seq => (
          <button
            key={seq.id}
            onClick={() => onSelectSequence(seq.id)}
            title={seq.desc}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              activeSequence === seq.id
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/80'
            }`}
          >
            {seq.label}
          </button>
        ))}
      </div>

      {/* Right section: Coordinates & Actions */}
      <div className="flex items-center gap-2">
        {/* Real-time canonical coordinates display */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 border border-slate-300 text-xs font-mono">
          <Crosshair className="w-3.5 h-3.5 text-sky-600" />
          <span className="text-slate-700">
            Pixel (Voxel): <strong className="text-slate-950 font-bold">({crosshair.i}, {crosshair.j}, {crosshair.k})</strong>
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-700">
            Position: <strong className="text-sky-800 font-bold">({worldCoordinate.x.toFixed(1)}, {worldCoordinate.y.toFixed(1)}, {worldCoordinate.z.toFixed(1)}) mm</strong>
          </span>
        </div>

        {/* Demo Case Loader */}
        <button
          onClick={onLoadDemo}
          title="Load sample 3D brain tumor demo case"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">Load Sample Demo</span>
        </button>

        {/* Upload Button */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-xs text-xs font-semibold transition"
        >
          <UploadCloud className="w-3.5 h-3.5 text-white" />
          <span className="hidden sm:inline">Upload MRI Scans</span>
        </button>

        {/* Reset View Button */}
        <button
          onClick={onResetView}
          title="Reset 3D view and center crosshairs"
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
