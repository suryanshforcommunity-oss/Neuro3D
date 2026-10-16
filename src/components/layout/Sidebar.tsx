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
    <aside className="w-64 bg-white/90 backdrop-blur-md border-r border-slate-200/80 flex flex-col justify-between select-none flex-shrink-0 z-20 shadow-xs">
      {/* Brand header */}
      <div>
        <div className="p-4 border-b border-slate-200/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-teal-500 to-indigo-600 p-0.5 shadow-md shadow-sky-500/20 flex-shrink-0">
            <div className="w-full h-full bg-white rounded-[9px] flex items-center justify-center">
              <Brain className="w-5 h-5 text-sky-600" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-slate-900">NeuroScope</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-semibold border border-sky-200">
                3D v1.0
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">BraTS MRI Workstation</p>
          </div>
        </div>

        {/* Tagline callout */}
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 italic leading-relaxed">
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left group ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 font-semibold border border-sky-200/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <div className="flex-1 truncate">
                  <span className="block truncate">{item.label}</span>
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / System status */}
      <div className="p-3.5 border-t border-slate-200/80 bg-slate-50/70 text-[11px] text-slate-500 space-y-1.5 font-mono">
        <div className="flex justify-between items-center text-[10px]">
          <span>ENVIRONMENT</span>
          <span className="text-sky-700 font-semibold">STAGE 2 VERIFIED</span>
        </div>
        <div className="flex justify-between items-center text-[10px]">
          <span>CONVENTION</span>
          <span className="text-slate-700 font-medium">RADIOLOGICAL (L/R)</span>
        </div>
        <div className="pt-1.5 text-[10px] text-slate-400 border-t border-slate-200 leading-tight">
          BraTS Standard Nested Labels (NCR=1, ED=2, ET=4)
        </div>
      </div>
    </aside>
  );
};
