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
  LogOut,
  UserCheck,
  Stethoscope,
  Network,
} from 'lucide-react';
import { NavigationPage } from '../../hooks/useNeuroScopeState';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activePage: NavigationPage;
  onSelectPage: (page: NavigationPage) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onSelectPage }) => {
  const { user, logout, openAuthModal } = useAuth();
  const navItems: { id: NavigationPage; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
    {
      id: 'landing',
      label: 'Home & Guide',
      icon: Home,
      description: 'Overview, feature tour, and volume calculator',
    },
    {
      id: 'workspace',
      label: '3D Brain & Slices',
      icon: Layers,
      description: 'Explore the 3D brain and slice-by-slice 2D MRI scans',
    },
    {
      id: 'segmentation',
      label: 'Tumor Layers',
      icon: Activity,
      description: 'Whole tumor, active core, and swelling outlined in color',
    },
    {
      id: 'evaluation',
      label: 'AI Accuracy Check',
      icon: BarChart3,
      description: 'See how closely the AI matches the doctor’s tumor outline',
    },
    {
      id: 'reports',
      label: 'Tumor Summary Report',
      icon: FileText,
      description: 'Exact volume measurements and printable case summary',
    },
    {
      id: 'pipeline',
      label: 'System Pipeline',
      icon: Network,
      description: 'Interactive visualization of MRI pipeline, architecture & API monitor',
    },
    {
      id: 'modelInfo',
      label: 'AI Safety & Info',
      icon: Info,
      description: 'How the AI works, accuracy checks, and safety guidelines',
    },
    {
      id: 'settings',
      label: 'Settings & Display',
      icon: Settings,
      description: 'Adjust brightness, contrast, and AI server connection',
    },
  ];


  return (
    <aside className="w-64 bg-white/90 backdrop-blur-md border-r border-slate-200/80 flex flex-col justify-between select-none flex-shrink-0 z-20 shadow-xs">
      {/* Brand header */}
      <div>
        <div
          onClick={() => onSelectPage('landing')}
          className="p-4 border-b border-slate-200/80 flex items-center gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors group"
          title="Return to Homepage"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white flex-shrink-0 group-hover:scale-105 transition-transform p-0.5 flex items-center justify-center">
            <img
              src="/medical_ai_logo.jpeg"
              alt="Medical AI Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
                NeuroScope
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-semibold border border-sky-200">
                3D v1.0
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium group-hover:text-slate-700">3D Brain MRI Explorer</p>
          </div>
        </div>

        {/* Tagline callout */}
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-700 italic font-medium leading-relaxed">
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left group ${
                  isActive
                    ? 'bg-sky-50 text-sky-800 font-bold border border-sky-300 shadow-xs'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-sky-600' : 'text-slate-500 group-hover:text-slate-800'
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

      {/* Active User Session */}
      <div className="px-3 py-2 border-t border-slate-200/80 bg-slate-50/60">
        {user ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0">
                {user.role === 'doctor' ? <Stethoscope className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-800 truncate leading-tight">{user.displayName || user.name}</p>
                <p className="text-[10px] text-slate-500 font-mono capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => openAuthModal('doctor')}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 text-xs font-semibold transition shadow-2xs"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Sign In / Change Role</span>
          </button>
        )}
      </div>

      {/* Footer / System status */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50 text-xs text-slate-700 space-y-2">
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-slate-600 font-bold uppercase tracking-wider">Environment</span>
          <span className="text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-mono">STAGE 2 VERIFIED</span>
        </div>
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-slate-600 font-bold uppercase tracking-wider">Convention</span>
          <span className="text-sky-800 font-bold font-mono">RADIOLOGICAL (L/R)</span>
        </div>
        <div className="pt-2 text-[10px] text-slate-600 font-medium border-t border-slate-200 leading-tight">
          BraTS Standard Nested Labels (NCR=1, ED=2, ET=4)
        </div>
      </div>
    </aside>
  );
};
