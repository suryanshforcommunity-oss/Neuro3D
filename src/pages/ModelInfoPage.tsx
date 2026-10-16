import React from 'react';
import { ModelReliabilityPanel } from '../components/reliability/ModelReliabilityPanel';
import { ModelReliabilityInfo, EvaluationMetrics } from '../types';

interface ModelInfoPageProps {
  reliabilityInfo: ModelReliabilityInfo;
  metrics?: EvaluationMetrics;
  onConnectBackend?: () => void;
}

export const ModelInfoPage: React.FC<ModelInfoPageProps> = ({
  reliabilityInfo,
  metrics,
  onConnectBackend,
}) => {
  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto space-y-6 overflow-y-auto select-none">
      <div className="border-b border-[#1E293B] pb-4">
        <h2 className="text-lg font-bold text-white">Model Architecture & Reliability Registry</h2>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          MONAI SegResNet deep learning inference engine specifications, uncertainty boundaries, and limitations
        </p>
      </div>

      <ModelReliabilityPanel
        reliabilityInfo={reliabilityInfo}
        metrics={metrics}
        onConnectBackend={onConnectBackend}
      />
    </div>
  );
};
