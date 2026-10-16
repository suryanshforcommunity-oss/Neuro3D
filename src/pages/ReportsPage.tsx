import React from 'react';
import { ProvenanceReportView } from '../components/reports/ProvenanceReportView';
import { StudyProvenance, ModelReliabilityInfo } from '../types';

interface ReportsPageProps {
  provenance: StudyProvenance | null;
  reliabilityInfo: ModelReliabilityInfo;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ provenance, reliabilityInfo }) => {
  return (
    <div className="flex-1 overflow-y-auto">
      <ProvenanceReportView provenance={provenance} reliabilityInfo={reliabilityInfo} />
    </div>
  );
};
