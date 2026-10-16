import {
  Activity,
  Layers,
  BarChart3,
  FileText,
  Info,
  Settings,
  Brain,
  Sliders,
  Home,
} from 'lucide-react';
import { NavigationPage } from '../../hooks/useNeuroScopeState';

interface SidebarProps {
  activePage: NavigationPage;
  onSelectPage: (page: NavigationPage) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onSelectPage }) => {
  const navItems: { id: NavigationPage; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
    {
      id: 'landing',
      label: 'Product Overview',
      icon: Home,
      description: 'SaaS product landing page & feature overview',
    },
    {
      id: 'workspace',
      label: 'MRI Workspace',
      icon: Layers,
      description: '3D brain surface & synchronized orthogonal slice viewer',
    },
    {
      id: 'segmentation',
      label: 'Segmentation',
      icon: Activity,
      description: 'Nested tumour compartments (WT, TC, ET) & mask overlays',
    },
    {
      id: 'evaluation',
      label: 'Evaluation',
      icon: BarChart3,
      description: 'Voxel-level Dice, sensitivity & expert ground truth comparison',
    },
    {
      id: 'reports',
      label: 'Reports & Provenance',
      icon: FileText,
      description: 'SHA-256 hashes, volume metrics, and printable research report',
    },
    {
      id: 'modelInfo',
      label: 'Model Reliability',
      icon: Info,
      description: 'MONAI SegResNet architecture, pipeline, and limitations',
    },
    {
      id: 'settings',
      label: 'Workstation Settings',
      icon: Settings,
      description: 'Backend API connection, window/level presets, and display options',
    },
  ];

  return (
    <aside className="w-64 bg-[#0A0D17] border-r border-[#1E293B] flex flex-col justify-between select-none flex-shrink-0 z-20">
      {/* Brand header */}
      <div>
        <div className="p-4 border-b border-[#1E293B]/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 via-cyan-500 to-violet-500 p-0.5 shadow-md shadow-cyan-500/20 flex-shrink-0">
            <div className="w-full h-full bg-[#090C15] rounded-[7px] flex items-center justify-center">
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">NeuroScope</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                3D
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">Stage 1 Frontend Workstation</p>
          </div>
        </div>

        {/* Tagline callout */}
        <div className="mx-3 mt-3 px-3 py-2 rounded-md bg-[#101524] border border-[#1E293B] text-[11px] text-slate-400 italic leading-relaxed">
          “See a brain tumour in 3D, measure it, and know how far to trust it.”
        </div>

        {/* Navigation list */}
        <nav className="p-2 space-y-1 mt-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left group ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'
                  }`}
                />
                <div className="flex-1 truncate">
                  <span className="block truncate">{item.label}</span>
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / System status */}
      <div className="p-3 border-t border-[#1E293B] bg-[#080B12]/80 text-[11px] text-slate-400 space-y-1.5 font-mono">
        <div className="flex justify-between items-center text-[10px]">
          <span>ENVIRONMENT</span>
          <span className="text-cyan-400 font-semibold">STAGE 1 CLIENT</span>
        </div>
        <div className="flex justify-between items-center text-[10px]">
          <span>CONVENTION</span>
          <span className="text-slate-300">RADIOLOGICAL (L/R)</span>
        </div>
        <div className="pt-1 text-[9px] text-slate-400 border-t border-slate-800 leading-tight">
          BraTS Standard Nested Label Definitions (NCR=1, ED=2, ET=4)
        </div>
      </div>
    </aside>
  );
};
