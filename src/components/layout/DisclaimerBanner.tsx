import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-[#0C101B] border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-between text-xs text-slate-300">
      <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-semibold tracking-wider uppercase flex-shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          RESEARCH ONLY
        </span>
        <span className="text-slate-300 text-[11px] tracking-wide font-normal truncate">
          <strong className="text-slate-200">Mandatory Research Notice:</strong> Research and teaching prototype only. Not for clinical diagnosis or treatment decisions. Model outputs are experimental and require independent expert review.
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-shrink-0 font-mono">
        <span className="hidden md:inline-flex items-center gap-1 text-slate-400">
          <ShieldCheck className="w-3 h-3 text-cyan-400" />
          De-identified Public Research Data
        </span>
        <span className="hidden lg:inline text-slate-600">|</span>
        <span className="hidden lg:inline text-slate-400">
          Auto-deletion policy: 24h
        </span>
      </div>
    </div>
  );
};
