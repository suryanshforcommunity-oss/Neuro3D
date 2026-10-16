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
          <span>Settings & AI Connection</span>
        </h2>
        <p className="text-xs text-slate-500 font-mono mt-0.5">
          Configure AI server address, scan viewing orientation, and data privacy options
        </p>
      </div>

      {/* Backend API Configuration */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs font-semibold text-sky-600">
            <Server className="w-4 h-4" />
            <span>AI Brain Analysis Server (FastAPI Endpoint)</span>
          </div>
          <span
            className={`text-xs font-mono px-2.5 py-0.5 rounded-md font-bold border ${
              backendStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            {backendStatus === 'connected' ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Enter the URL for your AI server (for example: http://localhost:8000). When offline, all 3D brain visuals, 2D MRI slices, and volume calculations work 100% locally right inside your web browser without needing a server.
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
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs font-sans transition shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${backendStatus === 'connecting' ? 'animate-spin' : ''}`} />
              <span>Test AI Server Connection</span>
            </button>
          </div>
        </form>

        {backendStatus === 'connected' && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 font-medium shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>AI Server is online and connected at {backendUrl}. Ready for multi-sequence MRI analysis.</span>
          </div>
        )}

        {backendError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2.5 font-medium shadow-2xs">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Could not reach the server: {backendError}. Please check that the server is running and the URL is correct.</span>
          </div>
        )}
      </div>

      {/* Viewing Conventions */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4 text-xs text-slate-600">
        <h3 className="font-semibold text-slate-800 text-xs font-mono uppercase text-sky-600 flex items-center gap-2">
          <Sliders className="w-4 h-4" />
          <span>MRI Scan Viewing Direction (How Scans Are Displayed)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-300 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 font-mono">Standard Hospital View (Radiological - Default)</span>
              <CheckCircle2 className="w-4 h-4 text-sky-600" />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              The patient's left side is on the right side of your screen (as if you are looking at the patient from their feet). This is how doctors view scans worldwide.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 opacity-60">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 font-mono">Mirror View (Neurological)</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              The patient's left side is on the left side of your screen. Often used in neuroscience research laboratories.
            </p>
          </div>
        </div>
      </div>

      {/* Security & Data Retention */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3 text-xs text-slate-600">
        <h3 className="font-semibold text-slate-800 text-xs font-mono uppercase text-sky-600 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span>Data Privacy & Automatic Cleanup</span>
        </h3>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          • <strong>Zero External Sharing:</strong> NeuroScope 3D never sends your MRI scans to external clouds, commercial AI tools, or third-party servers.
        </p>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          • <strong>Automatic File Cleanup:</strong> Any temporary scan files processed on your local backend server are automatically deleted within 24 hours.
        </p>
      </div>
    </div>
  );
};
