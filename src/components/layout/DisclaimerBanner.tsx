import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-1.5 flex items-center justify-between text-xs text-amber-900 shadow-2xs">
      <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 font-mono text-[10px] font-bold tracking-wider uppercase flex-shrink-0">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          RESEARCH ONLY
        </span>
        <span className="text-amber-900/90 text-[11px] tracking-wide font-normal truncate">
          <strong className="text-amber-950 font-semibold">Mandatory Research Notice:</strong> Research and teaching prototype only. Not for clinical diagnosis or treatment decisions.
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-amber-800/80 flex-shrink-0 font-mono">
        <span className="hidden md:inline-flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          De-identified Public Research Data
        </span>
        <span className="hidden lg:inline text-amber-300">|</span>
        <span className="hidden lg:inline">
          Auto-deletion policy: 24h
        </span>
      </div>
    </div>
  );
};
