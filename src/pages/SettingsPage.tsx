import React, { useState } from 'react';
import {
  Settings,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Shield,
  Eye,
  Sliders,
} from 'lucide-react';

interface SettingsPageProps {
  backendUrl: string;
  onUpdateBackendUrl: (url: string) => void;
  backendStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  backendError: string | null;
  onCheckBackend: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  backendUrl,
  onUpdateBackendUrl,
  backendStatus,
  backendError,
  onCheckBackend,
}) => {
  const [tempUrl, setTempUrl] = useState(backendUrl);

  const handleSaveAndTest = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBackendUrl(tempUrl);
    setTimeout(onCheckBackend, 100);
  };

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto space-y-6 overflow-y-auto select-none">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-sky-600" />
          <span>Workstation & Backend Configuration</span>
        </h2>
        <p className="text-xs text-slate-500 font-mono mt-0.5">
          API integration endpoint, coordinate display conventions, and hardware rendering settings
        </p>
      </div>

      {/* Backend API Configuration */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs font-semibold text-sky-600">
            <Server className="w-4 h-4" />
            <span>FastAPI + MONAI Inference Service Endpoint</span>
          </div>
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded font-semibold ${
              backendStatus === 'connected'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            {backendStatus === 'connected' ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Specify the URL for your local or remote MONAI SegResNet segmentation backend. In Stage 1 frontend preview mode, all core 3D visualization, slice crosshairs, and volume metrics run 100% locally in-browser without requiring a server.
        </p>

        <form onSubmit={handleSaveAndTest} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={tempUrl}
              onChange={e => setTempUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className="flex-1 bg-white border border-slate-300 shadow-2xs rounded-xl px-4 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-slate-900 font-medium text-xs font-mono transition shadow-md shadow-cyan-500/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${backendStatus === 'connecting' ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </button>
          </div>
        </form>

        {backendError && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>Connection check failed: {backendError}. Ensure backend is running with CORS enabled.</span>
          </div>
        )}
      </div>

      {/* Viewing Conventions */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4 text-xs text-slate-600">
        <h3 className="font-semibold text-slate-800 text-xs font-mono uppercase text-sky-600 flex items-center gap-2">
          <Sliders className="w-4 h-4" />
          <span>Coordinate Orientation Convention</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-300 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 font-mono">Radiological Convention (Active)</span>
              <CheckCircle2 className="w-4 h-4 text-sky-600" />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Patient Left is displayed on screen Right. Standard convention for diagnostic clinical radiology worldwide.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 opacity-60">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 font-mono">Neurological Convention</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Patient Left is displayed on screen Left. Frequently used in neuroscience neuroimaging research.
            </p>
          </div>
        </div>
      </div>

      {/* Security & Data Retention */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3 text-xs text-slate-600">
        <h3 className="font-semibold text-slate-800 text-xs font-mono uppercase text-sky-600 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span>Privacy & Data Lifecycle</span>
        </h3>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          • <strong>Zero Third-Party Leaks:</strong> NeuroScope 3D never transmits NIfTI scan arrays to external LLMs or third-party commercial APIs.
        </p>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          • <strong>24-Hour Backend Auto-Deletion:</strong> When connected to the production backend, uploaded files and intermediary tensors are purged automatically within 24 hours.
        </p>
      </div>
    </div>
  );
};
