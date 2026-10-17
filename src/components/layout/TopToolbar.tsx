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
  LogOut,
  User,
  Stethoscope,
  HeartPulse,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { MriSequenceType, VoxelCoordinate, WorldCoordinate } from '../../types';
import { useAuth } from '../../context/AuthContext';

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
  onOpenDemoSelector?: () => void;
  activeSlotId?: string;
  patientName?: string;
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
  onOpenDemoSelector,
  activeSlotId,
  patientName,
  onGoHome,
  activeSequence,
  onSelectSequence,
  crosshair,
  worldCoordinate,
}) => {
  const { user, logout, openAuthModal } = useAuth();

  const sequences: { id: MriSequenceType; label: string; desc: string }[] = [
    { id: 'T1', label: 'T1', desc: 'Standard brain structure scan' },
    { id: 'T1Gd', label: 'T1-Gd', desc: 'Contrast dye scan (highlights active tumor)' },
    { id: 'T2', label: 'T2', desc: 'Tissue and fluid sensitive scan' },
    { id: 'FLAIR', label: 'FLAIR', desc: 'Dark fluid scan (highlights swelling)' },
  ];

  return (
    <header className="h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-4 flex items-center justify-between text-sm select-none shadow-xs text-slate-900 gap-2 flex-nowrap overflow-hidden min-w-0">
      {/* Left section: Study info and status */}
      <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
        {onGoHome && (
          <button
            onClick={onGoHome}
            title="Return to Homepage"
            className="flex items-center gap-2 hover:opacity-85 transition cursor-pointer group pr-2 border-r border-slate-200 flex-shrink-0"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 bg-white p-0.5 shadow-2xs group-hover:scale-105 transition-transform flex items-center justify-center">
              <img
                src="/medical_ai_logo.jpeg"
                alt="Medical AI Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-xs tracking-tight text-slate-900 hidden sm:inline group-hover:text-sky-600 transition-colors whitespace-nowrap">
              NeuroScope 3D
            </span>
          </button>
        )}

        <div
          onClick={isDemoMode && onOpenDemoSelector ? onOpenDemoSelector : undefined}
          className={`flex items-center gap-1.5 flex-shrink-0 ${isDemoMode && onOpenDemoSelector ? 'cursor-pointer group' : ''}`}
          title={isDemoMode ? "Click to open Multi-Patient Demo Selector" : studyId}
        >
          <span className="text-slate-700 text-xs font-mono font-bold">CASE:</span>
          <span
            className="font-mono text-xs font-bold text-sky-900 bg-sky-100/90 group-hover:bg-sky-200/90 px-2 py-0.5 rounded-md border border-sky-300 max-w-[130px] sm:max-w-[180px] truncate whitespace-nowrap transition"
          >
            {activeSlotId ? `Scan ${activeSlotId} • ${patientName ? patientName.split(' ')[0] : studyId}` : studyId}
          </span>
        </div>

        {/* Data mode badge */}
        {isDemoMode ? (
          <Badge variant="amber" size="sm" className="hidden lg:inline-flex flex-shrink-0 whitespace-nowrap">
            <Database className="w-3 h-3 text-amber-600" />
            MULTI-PATIENT DEMO
          </Badge>
        ) : (
          <Badge variant="cyan" size="sm" className="hidden lg:inline-flex flex-shrink-0 whitespace-nowrap">
            <Database className="w-3 h-3 text-sky-600" />
            RESEARCH SCAN
          </Badge>
        )}

        {/* Backend health indicator */}
        <div
          onClick={onCheckBackend}
          title={`AI Server Status (${backendUrl}). Click to re-check connection.`}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-300 text-[11px] font-mono cursor-pointer hover:border-slate-400 transition flex-shrink-0 whitespace-nowrap"
        >
          <Server
            className={`w-3.5 h-3.5 flex-shrink-0 ${
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
      <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-300 shadow-2xs flex-shrink-0 whitespace-nowrap">
        <span className="text-[11px] uppercase text-slate-700 font-bold px-2 flex items-center gap-1 tracking-wider">
          <Layers className="w-3.5 h-3.5 text-sky-600" />
          MRI View:
        </span>
        {sequences.map(seq => (
          <button
            key={seq.id}
            onClick={() => onSelectSequence(seq.id)}
            title={seq.desc}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
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
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Real-time canonical coordinates display (only on 2xl to never wrap or push items out) */}
        <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-300 text-xs font-mono whitespace-nowrap flex-shrink-0">
          <Crosshair className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
          <span className="text-slate-600">
            Voxel: <strong className="text-slate-950 font-bold">({crosshair.i}, {crosshair.j}, {crosshair.k})</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">
            Pos: <strong className="text-sky-800 font-bold">({worldCoordinate.x.toFixed(1)}, {worldCoordinate.y.toFixed(1)}, {worldCoordinate.z.toFixed(1)}) mm</strong>
          </span>
        </div>

        {/* Multi-Patient Demo Selector Button */}
        <button
          onClick={onOpenDemoSelector || onLoadDemo}
          title="Open Multi-Patient MRI Demonstration System (Select Aarav Sharma or Priya Patel, 6 examinations, volume progression/regression)"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition whitespace-nowrap flex-shrink-0 cursor-pointer shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
          <span className="hidden xl:inline">Demo System ({activeSlotId || 'A1'})</span>
          <span className="xl:hidden">Demos ({activeSlotId || 'A1'})</span>
        </button>

        {/* Upload Button */}
        <button
          onClick={onOpenUpload}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-xs text-xs font-semibold transition whitespace-nowrap flex-shrink-0 cursor-pointer"
        >
          <UploadCloud className="w-3.5 h-3.5 text-white flex-shrink-0" />
          <span className="hidden md:inline">Upload MRI</span>
        </button>

        {/* Reset View Button */}
        <button
          onClick={onResetView}
          title="Reset 3D view and center crosshairs"
          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-2xs flex-shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Home / Landing Page Button */}
        {onGoHome && (
          <button
            onClick={onGoHome}
            title="Return to Product Overview & Landing Page"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-sky-600 hover:bg-slate-50 text-xs font-medium transition shadow-2xs whitespace-nowrap flex-shrink-0 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
            <span className="hidden xl:inline">Overview</span>
          </button>
        )}

        {/* Help Button */}
        <button
          onClick={onOpenHelp}
          title="Workstation User Guide & Research Specifications"
          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-sky-600 hover:bg-slate-50 transition shadow-2xs flex-shrink-0 cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Profile & Logout */}
        {user ? (
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 flex-shrink-0">
            <div className="hidden lg:flex flex-col text-right whitespace-nowrap leading-none max-w-[120px]">
              <span className="text-[11px] font-bold text-slate-800 truncate" title={user.displayName || user.name}>
                {user.displayName || user.name}
              </span>
              <span className="text-[9px] font-mono font-semibold text-sky-700 capitalize mt-0.5">
                {user.role === 'doctor' ? 'Clinician' : 'Patient'}
              </span>
            </div>
            <button
              onClick={logout}
              title={`Sign out (${user.displayName || user.name})`}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200 transition flex-shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => openAuthModal('doctor')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold transition ml-1 flex-shrink-0 whitespace-nowrap cursor-pointer"
          >
            <User className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
