export type UserRole = 'doctor' | 'patient';

export interface UserProfile {
  id: string;
  role: UserRole;
  name: string;
  displayName?: string;
  email: string;
  username?: string;
  patientId?: string;
  department?: string;
  licenseNumber?: string;
  treatingDoctor?: string;
  hospital?: string;
  dateOfBirth?: string;
  gender?: string;
}

export interface TumorLocation {
  lobe: string;
  subregion: string;
  hemisphere: string;
  coordinates: { x: number; y: number; z: number };
  anteriorPosterior: string;
  notes: string;
}

export interface PatientExamination {
  studyId: string;
  patientId: string;
  patientName: string;
  examinationDate: string;
  displayDate: string;
  facility: string;
  sequences: string[];
  magneticField: string;
  segmentationStatus: string;
  hasSegmentation: boolean;
  voxelSpacingMm: number[];
  volumes: {
    wtVolumeMl: number;
    tcVolumeMl: number;
    etVolumeMl: number;
    edVolumeMl?: number;
    ncrVolumeMl?: number;
  };
  tumorLocation: TumorLocation;
  reportAvailable: boolean;
  reportId?: string;
  clinicalSummary: string;
}

export interface LocationTimelineItem {
  examinationNumber: number;
  scanDate: string;
  fullDate?: string;
  location: string;
  subregion: string;
  hemisphere?: string;
  volumeMl: number;
  coordinates: string;
  notes: string;
}

export interface LongitudinalChartPoint {
  date: string;
  timestamp: string;
  wtVolumeMl: number;
  tcVolumeMl: number;
  etVolumeMl: number;
}

export interface LongitudinalTrend {
  hasComparison: boolean;
  previousScanDate?: string;
  latestScanDate?: string;
  previousVolumeMl?: number;
  latestVolumeMl?: number;
  absoluteDifferenceMl?: number;
  percentageChange?: number;
  trendLabel: string;
  trendTone: 'decrease' | 'increase' | 'stable';
  totalScans: number;
  timeline: LocationTimelineItem[];
  chartData: LongitudinalChartPoint[];
  message?: string;
  disclaimer?: string;
}

export interface PatientDashboardData {
  status: string;
  patient: {
    name: string;
    patientId: string;
    dateOfBirth?: string;
    treatingDoctor?: string;
    hospital?: string;
    mostRecentScanDate: string;
    totalExaminationsOnRecord: number;
  };
  reassuringNote: string;
  examinations: PatientExamination[];
  trend: LongitudinalTrend;
}
