import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Layers,
  TrendingDown,
  TrendingUp,
  Minus,
  FileText,
  Brain,
  Shield,
  Activity,
  Download,
  Printer,
  ChevronRight,
  Info,
  Clock,
  Compass,
  CheckCircle,
  HelpCircle,
  LogOut,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PatientDashboardData, PatientExamination } from '../types/auth';
import { authApi } from '../services/authApi';
import { ShowcaseBrain3D } from '../components/viewer/ShowcaseBrain3D';

interface PatientPortalPageProps {
  onGoHome: () => void;
}

export const PatientPortalPage: React.FC<PatientPortalPageProps> = ({ onGoHome }) => {
  const { user, token, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<PatientDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'tracking' | 'view3d' | 'report'>('overview');
  const [selectedExamIndex, setSelectedExamIndex] = useState<number>(2); // Default to latest scan (index 2)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await authApi.getPatientDashboard(token || '');
        setDashboardData(data);
        if (data.examinations.length > 0) {
          setSelectedExamIndex(data.examinations.length - 1);
        }
      } catch (err) {
        console.error('Failed to load patient dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [token]);

  if (isLoading || !dashboardData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-12">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Loading your secure patient health records...</p>
        </div>
      </div>
    );
  }

  const { patient, examinations, trend, reassuringNote } = dashboardData;
  const currentExam = examinations[selectedExamIndex] || examinations[examinations.length - 1];

  const handlePrintPatientReport = () => {
    window.print();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 text-slate-900 select-text">
      {/* Patient Portal Top Navigation Bar */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 bg-white p-0.5 flex items-center justify-center flex-shrink-0">
              <img src="/medical_ai_logo.jpeg" alt="Medical AI Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-950 font-heading">NeuroScope 3D</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  Patient Health Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Personal MRI & Volumetric Tracking</p>
            </div>
          </div>

          {/* Patient identification pill & action buttons */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-bold text-slate-800">{patient.name}</span>
              <span className="text-slate-400 font-mono">({patient.patientId})</span>
            </div>

            <button
              onClick={() => {
                logout();
                onGoHome();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition cursor-pointer"
              title="Sign out of your patient portal"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto border-t border-slate-100 py-1.5 text-xs font-semibold">
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: Activity },
            { id: 'history', label: 'My MRI History', icon: Calendar },
            { id: 'tracking', label: 'Tumor Volume Trend & Timeline', icon: TrendingDown },
            { id: 'view3d', label: 'Patient 3D Brain View', icon: Brain },
            { id: 'report', label: 'My Patient Medical Report', icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* TAB 1: OVERVIEW & WELCOME */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Welcome banner */}
            <div className="bg-gradient-to-r from-teal-900 via-sky-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10 max-w-2xl space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-widest text-teal-300 font-bold bg-white/10 px-3 py-1 rounded-full border border-white/15 inline-block">
                  Personalized Medical Records
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
                  Welcome, {patient.name}
                </h1>
                <p className="text-sm text-slate-200 leading-relaxed font-normal">
                  Your secure health records portal allows you to review your MRI examinations, track 3D tumor volume measurements over time, and download patient-friendly summaries.
                </p>

                <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-teal-200">
                  <div><strong>Patient ID:</strong> {patient.patientId}</div>
                  <div><strong>Treating Physician:</strong> {patient.treatingDoctor}</div>
                  <div><strong>Hospital:</strong> {patient.hospital}</div>
                </div>
              </div>
            </div>

            {/* Reassuring Clinical Notice */}
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 text-xs flex items-start gap-3 shadow-2xs">
              <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="font-bold text-sky-900 block">Understanding Your AI Imaging Results:</strong>
                <p className="leading-relaxed text-sky-900/90">{reassuringNote}</p>
              </div>
            </div>

            {/* Key Summary Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total MRI Scans</span>
                <div className="text-3xl font-extrabold text-slate-900 font-mono">{examinations.length} Scans</div>
                <span className="text-xs text-slate-500 font-medium block">Archived in verified repository</span>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Latest Examination</span>
                <div className="text-2xl font-extrabold text-slate-900 font-mono">{patient.mostRecentScanDate}</div>
                <span className="text-xs text-teal-700 font-semibold block">3.0T High-Resolution MRI</span>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Latest Measured Volume</span>
                <div className="text-3xl font-extrabold text-teal-700 font-mono">
                  {examinations[examinations.length - 1]?.volumes.wtVolumeMl} mL
                </div>
                <span className="text-xs text-slate-500 font-medium block">Whole tumor volume in milliliters</span>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Longitudinal Trend</span>
                <div className="flex items-center gap-2">
                  {trend.trendTone === 'decrease' ? (
                    <TrendingDown className="w-6 h-6 text-emerald-600" />
                  ) : trend.trendTone === 'increase' ? (
                    <TrendingUp className="w-6 h-6 text-amber-600" />
                  ) : (
                    <Minus className="w-6 h-6 text-slate-600" />
                  )}
                  <span className="text-2xl font-extrabold text-slate-900 font-mono">
                    {trend.percentageChange ? `${trend.percentageChange}%` : 'Stable'}
                  </span>
                </div>
                <span className="text-xs text-emerald-700 font-semibold block">{trend.trendLabel}</span>
              </div>
            </div>

            {/* Quick Actions to jump to details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <button
                onClick={() => setActiveTab('history')}
                className="p-5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-xs text-left transition group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-teal-600 transition-colors">
                  Review MRI Scan History
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Explore all 3 MRI scan records from November 2025 to March 2026.
                </p>
              </button>

              <button
                onClick={() => setActiveTab('tracking')}
                className="p-5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-xs text-left transition group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-sky-600 transition-colors">
                  Tumor Growth Tracking & Timeline
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  View volume progress charts and tumor location trajectory over time.
                </p>
              </button>

              <button
                onClick={() => setActiveTab('report')}
                className="p-5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-xs text-left transition group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-indigo-600 transition-colors">
                  Download Medical Report
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Save or print a clear, patient-friendly summary for your next consultation.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: MY MRI HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-heading">My MRI Examination History</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Chronological record of your brain MRI scans, measured tumor volumes, and associated reports.
              </p>
            </div>

            <div className="space-y-4">
              {examinations.map((exam, idx) => (
                <div
                  key={exam.studyId}
                  className={`p-6 bg-white rounded-2xl border transition shadow-xs ${
                    selectedExamIndex === idx ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-sm font-mono flex-shrink-0">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base">{exam.displayDate}</h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                            {exam.magneticField}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{exam.facility} • Case: {exam.studyId}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setSelectedExamIndex(idx);
                          setActiveTab('report');
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-xs border border-teal-200 transition cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Scan Report</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedExamIndex(idx);
                          setActiveTab('view3d');
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer"
                      >
                        <Brain className="w-3.5 h-3.5" />
                        <span>3D View</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px] mb-0.5">MRI Sequences Acquired:</span>
                      <div className="flex flex-wrap gap-1">
                        {exam.sequences.map(seq => (
                          <span key={seq} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono font-semibold text-[10px]">
                            {seq}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px] mb-0.5">Measured Whole Tumor:</span>
                      <span className="font-bold text-slate-900 text-sm font-mono">{exam.volumes.wtVolumeMl} mL</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px] mb-0.5">Tumor Anatomical Location:</span>
                      <span className="font-semibold text-slate-800">{exam.tumorLocation.lobe}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px] mb-0.5">AI Segmentation Status:</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                        <CheckCircle className="w-3 h-3" />
                        <span>{exam.segmentationStatus}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TUMOR GROWTH TRACKING & ANATOMICAL LOCATION TIMELINE */}
        {activeTab === 'tracking' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-heading">Tumor Volume Tracking & Growth Analysis</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Longitudinal comparison of measured physical volumes across dated MRI examinations from your personal record.
              </p>
            </div>

            {/* Comparison Metrics Header */}
            {trend.hasComparison && (
              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Latest Comparison</span>
                    <h3 className="font-bold text-slate-900 text-base">
                      {trend.previousScanDate} ➔ {trend.latestScanDate}
                    </h3>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
                    <TrendingDown className="w-4 h-4 text-emerald-600" />
                    <span>{trend.trendLabel}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 block font-medium">Previous Measured Volume</span>
                    <span className="text-xl font-extrabold text-slate-900 font-mono">{trend.previousVolumeMl} mL</span>
                    <span className="text-[10px] text-slate-400 block">{trend.previousScanDate}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 block font-medium">Latest Measured Volume</span>
                    <span className="text-xl font-extrabold text-teal-700 font-mono">{trend.latestVolumeMl} mL</span>
                    <span className="text-[10px] text-slate-400 block">{trend.latestScanDate}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 block font-medium">Absolute Difference</span>
                    <span className="text-xl font-extrabold text-slate-900 font-mono">
                      {trend.absoluteDifferenceMl && trend.absoluteDifferenceMl > 0 ? `+${trend.absoluteDifferenceMl}` : trend.absoluteDifferenceMl} mL
                    </span>
                    <span className="text-[10px] text-slate-400 block">latest − previous</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 block font-medium">Percentage Change</span>
                    <span className="text-xl font-extrabold text-emerald-700 font-mono">
                      {trend.percentageChange && trend.percentageChange > 0 ? `+${trend.percentageChange}` : trend.percentageChange}%
                    </span>
                    <span className="text-[10px] text-slate-400 block">Relative change</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic text-center pt-1">
                  * Note: Volumetric percentage changes reflect automated AI outlines on MRI scans and do not automatically indicate clinical cure or disease progression without doctor correlation.
                </p>
              </div>
            )}

            {/* Visual Volume Progression Line Chart */}
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Chronological Volume Progression (mL)</h3>
                  <p className="text-xs text-slate-500">Tracking Whole Tumor (WT), Tumor Core (TC), and Enhancing Tumor (ET)</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /><span>Whole Tumor (WT)</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-500" /><span>Tumor Core (TC)</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span>Enhancing Tumor (ET)</span></div>
                </div>
              </div>

              {/* Responsive SVG Chart */}
              <div className="w-full h-64 bg-slate-50/60 rounded-xl border border-slate-200 p-4 flex items-center justify-center">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200">
                  {/* Grid Lines */}
                  <line x1="50" y1="20" x2="550" y2="20" stroke="#e2e8f0" strokeDasharray="3" />
                  <line x1="50" y1="70" x2="550" y2="70" stroke="#e2e8f0" strokeDasharray="3" />
                  <line x1="50" y1="120" x2="550" y2="120" stroke="#e2e8f0" strokeDasharray="3" />
                  <line x1="50" y1="170" x2="550" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />

                  {/* Y-axis labels */}
                  <text x="35" y="24" fontSize="10" fill="#94a3b8" textAnchor="end">40 mL</text>
                  <text x="35" y="74" fontSize="10" fill="#94a3b8" textAnchor="end">30 mL</text>
                  <text x="35" y="124" fontSize="10" fill="#94a3b8" textAnchor="end">20 mL</text>
                  <text x="35" y="174" fontSize="10" fill="#94a3b8" textAnchor="end">0 mL</text>

                  {/* WT Line: 36.8 mL -> 32.1 mL -> 29.75 mL (mapped from y: 36 to 71) */}
                  <polyline
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="120,36 300,59 480,71"
                  />

                  {/* TC Line: 32.4 mL -> 29.8 mL -> 29.41 mL */}
                  <polyline
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="120,58 300,71 480,73"
                  />

                  {/* ET Line: 4.5 mL -> 3.8 mL -> 3.06 mL */}
                  <polyline
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="120,152 300,155 480,158"
                  />

                  {/* Data Points for WT */}
                  <circle cx="120" cy="36" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                  <text x="120" y="26" fontSize="11" fontWeight="bold" fill="#0369a1" textAnchor="middle">36.8 mL</text>
                  <text x="120" y="190" fontSize="10" fontWeight="bold" fill="#475569" textAnchor="middle">Nov 14, 2025</text>

                  <circle cx="300" cy="59" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                  <text x="300" y="50" fontSize="11" fontWeight="bold" fill="#0369a1" textAnchor="middle">32.1 mL</text>
                  <text x="300" y="190" fontSize="10" fontWeight="bold" fill="#475569" textAnchor="middle">Jan 22, 2026</text>

                  <circle cx="480" cy="71" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                  <text x="480" y="62" fontSize="11" fontWeight="bold" fill="#0369a1" textAnchor="middle">29.75 mL</text>
                  <text x="480" y="190" fontSize="10" fontWeight="bold" fill="#475569" textAnchor="middle">Mar 28, 2026</text>
                </svg>
              </div>
            </div>

            {/* TIMELINE OF EACH TUMOR LOCATION (Requested Feature) */}
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-base">Timeline of Tumor Anatomical Localization</h3>
              </div>
              <p className="text-xs text-slate-500">
                Tracking the 3D anatomical position, cerebral hemisphere, and coordinate margins documented for each dated MRI examination:
              </p>

              <div className="relative pl-6 border-l-2 border-teal-300 space-y-6 mt-4">
                {trend.timeline.map((item, idx) => (
                  <div key={idx} className="relative space-y-1.5">
                    {/* Timeline bullet */}
                    <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-4 border-teal-500 shadow-xs" />

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 font-mono">Examination #{item.examinationNumber}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {item.scanDate}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <strong className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-teal-600" />
                          <span>{item.location}</span>
                        </strong>
                        <span className="text-xs font-mono text-slate-600">Coordinates: {item.coordinates}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <strong>Subregion:</strong> {item.subregion}
                      </p>
                      <p className="text-xs text-slate-500 italic">
                        <strong>Clinical Assessment:</strong> {item.notes}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PATIENT-FRIENDLY 3D BRAIN VIEW */}
        {activeTab === 'view3d' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-heading">Patient-Friendly 3D Brain Viewer</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Simplified, non-technical 3D visualization showing your brain scan and highlighted AI tumor segmentation.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-teal-400" />
                  <span className="text-xs font-bold font-mono">Examination: {currentExam.displayDate} ({currentExam.studyId})</span>
                </div>
                <span className="text-xs text-slate-300 font-mono">Measured Volume: {currentExam.volumes.wtVolumeMl} mL</span>
              </div>

              {/* 3D Brain simulation viewport */}
              <div className="h-[420px] bg-slate-950 relative flex items-center justify-center">
                <ShowcaseBrain3D showWT={true} showTC={true} showET={true} className="w-full h-full" />

                {/* Floating helpful explanation for patients */}
                <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md bg-slate-900/90 backdrop-blur-md p-3.5 rounded-xl border border-teal-500/40 text-xs text-slate-200 space-y-1 shadow-lg pointer-events-none">
                  <div className="flex items-center gap-2 text-teal-300 font-bold">
                    <CheckCircle className="w-4 h-4 text-teal-400" />
                    <span>AI-Generated Tumor Region Outline</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    The highlighted colored region represents the computer system’s 3D estimation based on your MRI contrast scan. Use your mouse or finger to gently rotate and inspect the brain model from any angle.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PATIENT-FRIENDLY MEDICAL REPORT */}
        {activeTab === 'report' && (
          <div className="space-y-6">
            <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-heading">My Patient Medical Report</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Clear, understandable summary designed for you to review and discuss with your healthcare team.
                </p>
              </div>

              <button
                onClick={handlePrintPatientReport}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print or Save Report as PDF</span>
              </button>
            </div>

            {/* Printable Formal Document */}
            <div className="print-page bg-white rounded-2xl border border-slate-300 p-8 space-y-6 shadow-sm text-slate-900 font-sans print:border-none print:shadow-none print:p-0">
              {/* Header */}
              <div className="border-b-2 border-teal-600 pb-5 flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-white p-0.5 shadow-xs flex items-center justify-center flex-shrink-0">
                    <img src="/medical_ai_logo.jpeg" alt="Medical AI Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-slate-950 font-heading">NeuroScope 3D</h1>
                    <div className="text-xs text-teal-700 font-bold uppercase tracking-wider">Patient Health Summary & Imaging Report</div>
                    <div className="text-xs text-slate-500">{patient.hospital}</div>
                  </div>
                </div>

                <div className="text-right text-xs font-mono space-y-0.5">
                  <div><strong>PATIENT:</strong> {patient.name}</div>
                  <div><strong>PATIENT ID:</strong> {patient.patientId}</div>
                  <div><strong>EXAM DATE:</strong> {currentExam.displayDate}</div>
                  <div><strong>REPORT ID:</strong> {currentExam.reportId}</div>
                </div>
              </div>

              {/* Patient Friendly Findings */}
              <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200 space-y-2">
                <h3 className="font-bold text-xs text-teal-900 uppercase tracking-wider">Examination Summary</h3>
                <p className="text-xs text-teal-950 leading-relaxed font-sans">
                  On {currentExam.displayDate}, a multi-sequence brain MRI scan was conducted at {currentExam.facility}. The computer-assisted segmentation estimated a whole tumor volume of <strong>{currentExam.volumes.wtVolumeMl} mL</strong> located in the <strong>{currentExam.tumorLocation.lobe}</strong> ({currentExam.tumorLocation.subregion}).
                </p>
              </div>

              {/* What this means */}
              <div className="space-y-2 avoid-break">
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">What Does This Mean?</h3>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2 leading-relaxed">
                  <p>
                    <strong>What is a segmentation?</strong> It is the AI computer system’s outline of a specific region in your MRI scan, helping doctors measure size and depth with 3D precision.
                  </p>
                  <p>
                    <strong>How has the volume changed?</strong> Comparing your most recent scan to your previous examination on {trend.previousScanDate}, there is a <strong>{trend.trendLabel.toLowerCase()}</strong> of approximately {trend.percentageChange ? Math.abs(trend.percentageChange) : 0}%.
                  </p>
                </div>
              </div>

              {/* What happens next */}
              <div className="space-y-2 avoid-break">
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">What Happens Next?</h3>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5 leading-relaxed">
                  <p>1. Please bring a copy of this summary to your next appointment with <strong>{patient.treatingDoctor}</strong>.</p>
                  <p>2. Your physician will review these measurements in conjunction with your personal clinical symptoms.</p>
                  <p>3. Do not alter any medication or schedule without speaking directly with your care team.</p>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1 avoid-break">
                <strong>Important Notice for Patients & Families:</strong>
                <p>
                  NeuroScope 3D is an educational and clinical decision-support platform. These AI measurements are intended to assist healthcare professionals and are not a definitive medical diagnosis.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PatientPortalPage;
