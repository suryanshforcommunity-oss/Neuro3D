import React, { useState } from 'react';
import {
  Brain,
  ShieldCheck,
  Activity,
  Layers,
  BarChart3,
  FileText,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Lock,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  Sliders,
  ExternalLink,
  Database,
  Crosshair,
  Server,
  Zap,
  Stethoscope,
  HeartPulse,
  LogIn,
  User,
} from 'lucide-react';
import Antigravity from '../components/animations/Antigravity';
import { ShowcaseBrain3D } from '../components/viewer/ShowcaseBrain3D';
import TechStackLoop from '../components/animations/TechStackLoop';

interface LandingPageProps {
  onLaunchWorkstation: () => void;
  onLoadDemoCase: () => void;
  onOpenUpload: () => void;
  onOpenDoctorLogin?: () => void;
  onOpenPatientLogin?: () => void;
  backendStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  activeModelName?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchWorkstation,
  onLoadDemoCase,
  onOpenUpload,
  onOpenDoctorLogin,
  onOpenPatientLogin,
  backendStatus,
  activeModelName = 'MONAI SegResNet (BraTS 2023)',
}) => {
  // Interactive preview state for the hero showcase card
  const [previewPlane, setPreviewPlane] = useState<'3d' | 'axial' | 'coronal' | 'sagittal'>('3d');
  const [viewMode3D, setViewMode3D] = useState<'video' | 'interactive'>('video');
  const [showWT, setShowWT] = useState<boolean>(true);
  const [showTC, setShowTC] = useState<boolean>(true);
  const [showET, setShowET] = useState<boolean>(true);

  // Interactive volume calculator state
  const [tumourDx, setTumourDx] = useState<number>(36);
  const [tumourDy, setTumourDy] = useState<number>(32);
  const [tumourDz, setTumourDz] = useState<number>(28);
  const [sliceSpacing, setSliceSpacing] = useState<number>(1.0);

  // FAQ accordion state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Calculated physical volume for the interactive widget
  // Ellipsoid approximation: (4/3) * pi * (dx/2) * (dy/2) * (dz/2) / 1000 in mL
  const calculatedVolumeMl = (
    (4 / 3) * Math.PI * (tumourDx / 2) * (tumourDy / 2) * (tumourDz / 2) * (sliceSpacing / 1.0) / 1000
  ).toFixed(2);

  const faqs = [
    {
      q: 'Can this website be used for medical diagnosis?',
      a: 'No. NeuroScope 3D is an educational and academic research demonstration prototype. It is designed to demonstrate 3D medical visualization and AI segmentation. It must never be used for real clinical diagnosis or medical treatment decisions without qualified doctor review.',
    },
    {
      q: 'Are my MRI scans sent to external clouds or third parties?',
      a: 'No. NeuroScope 3D is designed with privacy first. All MRI scan files are opened directly inside your browser. No patient images or scan data are ever uploaded to third-party commercial clouds or external AI services.',
    },
    {
      q: 'What types of MRI scans and file formats can I use?',
      a: "The system uses standard 3D NIfTI files (.nii or .nii.gz). For complete tumor analysis, four standard brain MRI scans are used: T1 (anatomy), T1-Gd (contrast dye), T2 (tissue/fluid), and FLAIR (swelling). You can also load an optional doctor's map to test AI accuracy.",
    },
    {
      q: 'Do I need an expensive graphics card (GPU) to use this?',
      a: 'No. The interactive 3D viewer, 2D slice crosshairs, and volume calculations run smoothly in any modern web browser on standard laptops and computers. If running AI inference on a server, both CPU and GPU modes are supported.',
    },
    {
      q: 'What does the 24-hour cleanup mean?',
      a: 'For privacy and data safety, any temporary session files processed on your local backend server are automatically and permanently deleted after 24 hours.',
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-50/60 text-slate-800 font-sans selection:bg-sky-500 selection:text-white">
      {/* 0. Full-Page Ambient Antigravity Particle Field: light medical theme, reacting to cursor throughout page */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <Antigravity
          colors={['#0284c7', '#06b6d4', '#4f46e5', '#38bdf8', '#0d9488']}
          count={1600}
          magnetRadius={8.5}
          ringRadius={6.5}
          particleSize={0.45}
          particleVariance={0.5}
          particleShape="capsule"
          colorMode="conic"
          fieldStrength={12}
          autoAnimate={true}
          interactive={true}
          clickBurst={true}
          lightMode={true}
          opacity={0.8}
          style={{ width: '100vw', height: '100vh', position: 'fixed', inset: 0 }}
        />
      </div>

      {/* 1. SaaS Top Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/70 shadow-2xs">
        <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
          {/* Logo & Brand */}
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 text-left group cursor-pointer flex-shrink-0"
            title="Return to top"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white flex-shrink-0 group-hover:scale-105 transition-transform p-0.5 flex items-center justify-center">
              <img
                src="/medical_ai_logo.jpeg"
                alt="Medical AI Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="whitespace-nowrap">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">NeuroScope</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200 font-mono">
                  3D v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium group-hover:text-slate-700">3D Brain MRI Analysis & Tumor Explorer</p>
            </div>
          </button>

          {/* Nav links - evenly distributed in center */}
          <div className="hidden lg:flex items-center justify-center gap-6 xl:gap-8 text-sm font-medium text-slate-600 flex-1 px-4 whitespace-nowrap">
            <a href="#features" className="hover:text-sky-600 transition whitespace-nowrap">Features</a>
            <a href="#showcase" className="hover:text-sky-600 transition whitespace-nowrap">Interactive Demo</a>
            <a href="#calculator" className="hover:text-sky-600 transition whitespace-nowrap">Volume Calculator</a>
            <a href="#workflow" className="hover:text-sky-600 transition whitespace-nowrap">How It Works</a>
            <a href="#faq" className="hover:text-sky-600 transition whitespace-nowrap">FAQ</a>
          </div>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-2 xl:gap-2.5 flex-shrink-0 whitespace-nowrap">
            <button
              onClick={onLoadDemoCase}
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition whitespace-nowrap"
            >
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>Load Sample</span>
            </button>

            {onOpenDoctorLogin && (
              <button
                onClick={onOpenDoctorLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition whitespace-nowrap"
                title="Sign in as Clinician / Doctor"
              >
                <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                <span>Clinician Login</span>
              </button>
            )}

            {onOpenPatientLogin && (
              <button
                onClick={onOpenPatientLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition whitespace-nowrap"
                title="Sign in to Patient Portal"
              >
                <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                <span>Patient Portal</span>
              </button>
            )}

            <button
              onClick={onLaunchWorkstation}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-md shadow-sky-500/20 transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
            >
              <span>3D Viewer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative z-10 pt-12 pb-20 overflow-hidden">
        {/* Subtle decorative background gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-sky-200/20 via-teal-100/15 to-indigo-200/20 blur-3xl -z-10 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-sky-200 shadow-xs text-xs font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sky-700 font-mono">AI Brain Tumor Detection</span>
              <span className="text-slate-300">•</span>
              <span>4-Sequence MRI Support</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              See a brain tumor in 3D,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-teal-600 to-indigo-600">
                measure its size in mL
              </span>
              , and understand the AI results.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
              An easy-to-use, research-grade platform that identifies brain tumors across standard MRI scans (T1, T1-Gd, T2, FLAIR). Explore interactive 3D brain visuals, 2D slice crosshairs, and millimeter-accurate tumor volume measurements.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={onLaunchWorkstation}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-lg shadow-sky-500/25 transition-all transform hover:-translate-y-0.5 text-sm sm:text-base"
              >
                <span>Open 3D Brain Viewer</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={onOpenUpload}
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs hover:border-slate-400 transition-all text-sm sm:text-base"
              >
                <FileText className="w-4 h-4 text-sky-600" />
                <span>Upload MRI Scans (NIfTI)</span>
              </button>
            </div>

            {/* Dual Role Direct Access Cards */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
              <div
                onClick={onOpenDoctorLogin || onLaunchWorkstation}
                className="cursor-pointer group p-4 rounded-2xl bg-white/90 border border-sky-100 shadow-sm hover:shadow-md hover:border-sky-300 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sky-800 font-bold text-sm">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <span>Clinician Workstation</span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-medium border border-sky-200">
                    Doctor Portal
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  Full 4-sequence MRI analysis, AI segmentation (NCR, ED, ET), Dice evaluation metrics, and clinical reports.
                </p>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 group-hover:text-sky-700">
                  <span>Sign in as Clinician</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div
                onClick={onOpenPatientLogin}
                className="cursor-pointer group p-4 rounded-2xl bg-white/90 border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <HeartPulse className="w-4 h-4" />
                    </div>
                    <span>Patient Health Portal</span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                    Patient & Family
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  Track tumor growth or shrinkage over time, view anatomical location timelines, and access simplified 3D reports.
                </p>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 group-hover:text-emerald-700">
                  <span>Sign in to Patient Portal</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* Trust & Spec Checklist */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div className="p-3 bg-white/70 backdrop-blur-xs rounded-xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2 text-sky-700 font-semibold text-xs mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Private & Secure</span>
                </div>
                <p className="text-[11px] text-slate-500">Scans stay on your device; opens directly in your browser.</p>
              </div>

              <div className="p-3 bg-white/70 backdrop-blur-xs rounded-xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2 text-sky-700 font-semibold text-xs mb-1">
                  <Activity className="w-4 h-4 text-sky-500" />
                  <span>Color-Coded Layers</span>
                </div>
                <p className="text-[11px] text-slate-500">Whole Tumor (WT), Tumor Core (TC), and Active Rim (ET).</p>
              </div>

              <div className="p-3 bg-white/70 backdrop-blur-xs rounded-xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2 text-sky-700 font-semibold text-xs mb-1">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  <span>Exact Size in mL</span>
                </div>
                <p className="text-[11px] text-slate-500">Converts 3D pixels (voxels) into accurate milliliters.</p>
              </div>

              <div className="p-3 bg-white/70 backdrop-blur-xs rounded-xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2 text-sky-700 font-semibold text-xs mb-1">
                  <Cpu className="w-4 h-4 text-amber-500" />
                  <span>Medical AI Network</span>
                </div>
                <p className="text-[11px] text-slate-500">Powered by MONAI SegResNet trained on brain MRI scans.</p>
              </div>
            </div>
          </div>

          {/* 3. Hero Visual Showcase Card (Interactive Light-Theme Workstation Preview) */}
          <div id="showcase" className="mt-14 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-sky-950/10 overflow-hidden">
              {/* Window Header */}
              <div className="bg-slate-100/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-400/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-400/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400/80" />
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-600 ml-2">
                    NeuroScope 3D Viewer — Sample Brain MRI (BraTS2023_00042)
                  </span>
                </div>

                {/* Plane selector tabs */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs font-medium">
                  {(['3d', 'axial', 'coronal', 'sagittal'] as const).map(plane => (
                    <button
                      key={plane}
                      onClick={() => setPreviewPlane(plane)}
                      className={`px-3 py-1 rounded capitalize transition ${
                        previewPlane === plane
                          ? 'bg-sky-600 text-white font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {plane === '3d'
                        ? '3D Brain'
                        : plane === 'axial'
                        ? 'Top View'
                        : plane === 'coronal'
                        ? 'Front View'
                        : 'Side View'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Showcase Body */}
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                {/* Visual Viewport Simulation: 3D Rotating Real Human Brain or 2D Orthogonal Slice */}
                <div className="md:col-span-2 p-4 bg-slate-950 relative min-h-[380px] flex items-center justify-center overflow-hidden">
                  {previewPlane === '3d' ? (
                    /* 3D Rotating Anatomical Human Brain - Video Loop / Interactive */
                    <div className="relative w-full h-[360px] flex items-center justify-center overflow-hidden rounded-xl bg-slate-950">
                      {viewMode3D === 'video' ? (
                        <video
                          src="/brain_rotation_loop.mp4"
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-contain max-h-[360px] select-none"
                        />
                      ) : (
                        <ShowcaseBrain3D
                          showWT={showWT}
                          showTC={showTC}
                          showET={showET}
                          className="w-full h-full"
                        />
                      )}

                      {/* 3D Mode Selector & Status Badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 text-xs font-sans text-slate-200 shadow-lg z-10">
                        <button
                          onClick={() => setViewMode3D('video')}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            viewMode3D === 'video'
                              ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title="View 3D rotating brain animation loop"
                        >
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                          <span>3D Video Loop</span>
                        </button>
                        <button
                          onClick={() => setViewMode3D('interactive')}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            viewMode3D === 'interactive'
                              ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-400/50 shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title="Switch to interactive Three.js 3D orbit controls"
                        >
                          <span>Interactive 3D</span>
                        </button>
                      </div>

                      {/* Small Identifiable Tumour Callout Card */}
                      <div className="absolute bottom-3 left-3 bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-cyan-500/50 shadow-xl pointer-events-none space-y-1 z-10">
                        <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                          <span>Identified Tumor: Upper Right Brain</span>
                        </div>
                        <div className="text-[11px] text-slate-300 font-mono">
                          Position: X: +14.0 mm, Y: +6.0 mm, Z: +8.0 mm
                        </div>
                      </div>

                      {/* Anatomical Axis Guides */}
                      <span className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-900/90 text-slate-200 border border-slate-700 tracking-wide z-10 pointer-events-none">
                        TOP (S)
                      </span>
                      <span className="absolute bottom-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-900/90 text-slate-200 border border-slate-700 tracking-wide z-10 pointer-events-none">
                        BOTTOM (I)
                      </span>
                    </div>
                  ) : (
                    /* Simulated 2D Orthogonal Slice View */
                    <div className="relative w-64 h-64 rounded-full border border-slate-700 flex items-center justify-center bg-slate-950/90 shadow-2xl">
                      {/* Simulated Brain Outline */}
                      <div className="absolute inset-4 rounded-full border border-dashed border-slate-600/60" />

                      {/* Tumour Overlays Toggleable */}
                      {showWT && (
                        <div className="absolute top-16 right-16 w-28 h-28 rounded-full bg-cyan-500/25 border-2 border-cyan-400 animate-pulse flex items-center justify-center transition-all">
                          {showTC && (
                            <div className="w-20 h-20 rounded-full bg-violet-500/35 border-2 border-violet-400 flex items-center justify-center">
                              {showET && (
                                <div className="w-10 h-10 rounded-full bg-amber-500/50 border-2 border-amber-400" />
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Crosshair indicator */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-full h-px bg-cyan-400/30" />
                        <div className="h-full w-px bg-cyan-400/30 absolute" />
                      </div>

                      <div className="absolute bottom-3 left-3 text-[11px] font-mono text-cyan-300 bg-slate-900/90 px-2 py-1 rounded border border-slate-700">
                        Crosshair: (X: +14.0 mm, Y: +6.0 mm, Z: +8.0 mm)
                      </div>
                    </div>
                  )}

                  {/* Orientation Badges for 2D Slice Mode */}
                  {previewPlane !== '3d' && (
                    <>
                      <span className="absolute top-3 left-1/2 -translate-x-1/2 text-xs font-semibold text-slate-400">
                        {previewPlane === 'axial' ? 'FRONT (A)' : 'TOP (S)'}
                      </span>
                      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-semibold text-slate-400">
                        {previewPlane === 'axial' ? 'BACK (P)' : 'BOTTOM (I)'}
                      </span>
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                        RIGHT (R)
                      </span>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                        LEFT (L)
                      </span>
                    </>
                  )}
                </div>

                {/* Right Measurement Panel in Showcase */}
                <div className="p-6 bg-slate-50 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      Tumor Size by Layer
                    </h3>

                    {/* Volume Cards */}
                    <div className="space-y-2.5">
                      {/* WT */}
                      <div
                        onClick={() => setShowWT(!showWT)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer ${
                          showWT
                            ? 'bg-cyan-50/90 border-cyan-300 text-cyan-950 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-400 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                            <span className="text-xs font-bold">Whole Tumor (WT)</span>
                          </div>
                          <span className="text-xs font-bold text-cyan-800 font-mono">29.75 mL</span>
                        </div>
                        <span className="text-[11px] text-slate-600 block mt-1 font-medium">
                          Entire area: Dead core + swelling + active rim
                        </span>
                      </div>

                      {/* TC */}
                      <div
                        onClick={() => setShowTC(!showTC)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer ${
                          showTC
                            ? 'bg-violet-50/90 border-violet-300 text-violet-950 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-400 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                            <span className="text-xs font-bold">Tumor Core (TC)</span>
                          </div>
                          <span className="text-xs font-bold text-violet-800 font-mono">29.41 mL</span>
                        </div>
                        <span className="text-[11px] text-slate-600 block mt-1 font-medium">
                          Tumor body: Dead cells + active rim
                        </span>
                      </div>

                      {/* ET */}
                      <div
                        onClick={() => setShowET(!showET)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer ${
                          showET
                            ? 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-400 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <span className="text-xs font-bold">Active Tumor Rim (ET)</span>
                          </div>
                          <span className="text-xs font-bold text-amber-800 font-mono">3.06 mL</span>
                        </div>
                        <span className="text-[11px] text-slate-600 block mt-1 font-medium">
                          Growing outer rim that absorbs contrast dye
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action */}
                  <button
                    onClick={onLaunchWorkstation}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition flex items-center justify-center gap-2"
                  >
                    <span>Open Full 3D Viewer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Technology Stack Logo Loop */}
          <div className="mt-16 max-w-6xl mx-auto">
            <TechStackLoop />
          </div>
        </div>
      </section>

      {/* 4. Core Features Bento Grid */}
      <section id="features" className="py-20 bg-white/60 backdrop-blur-xs border-y border-slate-200/70 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-sky-600 font-semibold">
              Platform Features
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Built for Clear, Trustworthy MRI Exploration
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Combining 3D brain graphics, synchronized 2D slice crosshairs, and transparent AI accuracy checks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/90 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-500/10 transition-all">
              <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-600 mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Synchronized 3-Way Slice Views</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Inspect Top (Axial), Front (Coronal), and Side (Sagittal) MRI slices simultaneously. Clicking anywhere instantly aligns the crosshair across all slice views and the 3D model.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-teal-300 hover:shadow-lg hover:shadow-teal-500/5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-600 mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Physical Milliliter (mL) Measurements</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Strict formula: Total 3D Pixels × (Width × Height × Depth in mm) ÷ 1,000. Reads exact pixel spacing directly from the MRI scan headers for real-world accuracy.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-4">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">3D Brain Model & Cutaway Tool</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Smooth 3D cortical mesh with Whole Tumor, Tumor Core, and Active Rim boundaries. Includes an anatomical cutaway slider so you can slice through the brain surface and see inside.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Automatic Scan Consistency Checks</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated validation checks every scan upon upload to ensure matching dimensions, pixel spacing, and orientation before running any AI analysis.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Medical-Grade AI Pipeline</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Powered by MONAI SegResNet deep learning neural networks trained specifically on multi-sequence brain MRI scans to separate active tumor from surrounding swelling.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-rose-300 hover:shadow-lg hover:shadow-rose-500/5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Data Privacy & Auto-Cleanup</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Zero patient data leaks. Uploaded studies and intermediate analysis files are automatically purged after 24 hours by the automated background cleaner.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Interactive Tumour Volume Calculator Widget */}
      <section id="calculator" className="py-20 bg-sky-50/40 backdrop-blur-xs relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-sky-100 shadow-xl p-8">
            <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
              <span className="text-xs font-mono font-semibold text-sky-600 uppercase tracking-widest">
                Interactive Calculator
              </span>
              <h2 className="text-2xl font-bold text-slate-900">
                How Tumor Size in Milliliters (mL) Is Calculated
              </h2>
              <p className="text-xs text-slate-600">
                Adjust the sliders below to see how physical dimensions and scan thickness convert into milliliters (mL).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Sliders */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Width / Left-to-Right (Dx)</span>
                    <span className="font-mono font-bold text-sky-600">{tumourDx} mm</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    value={tumourDx}
                    onChange={e => setTumourDx(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Length / Front-to-Back (Dy)</span>
                    <span className="font-mono font-bold text-sky-600">{tumourDy} mm</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    value={tumourDy}
                    onChange={e => setTumourDy(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Height / Top-to-Bottom (Dz)</span>
                    <span className="font-mono font-bold text-sky-600">{tumourDz} mm</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    value={tumourDz}
                    onChange={e => setTumourDz(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Slice Thickness (Scan Spacing)</span>
                    <span className="font-mono font-bold text-indigo-600">{sliceSpacing.toFixed(1)} mm</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={3.0}
                    step={0.1}
                    value={sliceSpacing}
                    onChange={e => setSliceSpacing(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Live Output Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-200 text-center space-y-4">
                <span className="text-xs font-mono uppercase font-semibold text-sky-800">
                  Calculated Tumor Volume
                </span>
                <div className="text-5xl font-black text-slate-900 font-mono tracking-tight">
                  {calculatedVolumeMl} <span className="text-2xl font-bold text-sky-600">mL</span>
                </div>
                <div className="text-xs text-slate-600 font-mono">
                  Equivalent to {(Number(calculatedVolumeMl) * 1000).toLocaleString()} mm³ (cubic millimeters)
                </div>

                <div className="pt-2 border-t border-sky-200/60 text-[11px] text-slate-500 leading-tight">
                  Formula: 3D Ellipsoid volume in cubic millimeters converted to milliliters (1 mL = 1,000 mm³).
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Step-by-Step Clinical Workflow */}
      <section id="workflow" className="py-20 bg-white/60 backdrop-blur-xs border-t border-slate-200/70 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-sky-600 font-semibold">
              How It Works
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              4 Simple Steps From Scan to Tumor Report
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/90 relative">
              <span className="text-3xl font-black text-sky-500/20 font-mono absolute top-4 right-4">01</span>
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white font-bold text-xs flex items-center justify-center mb-3">
                1
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-1">Upload 4 MRI Scans</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Drag and drop the 4 standard brain MRI scans (T1, T1-Gd, T2, and FLAIR) in .nii or .nii.gz format into the upload window.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 relative">
              <span className="text-3xl font-black text-sky-500/20 font-mono absolute top-4 right-4">02</span>
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center mb-3">
                2
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-1">Automatic Scan Check</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                The system automatically checks that all scans match in dimension, pixel spacing, and orientation.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 relative">
              <span className="text-3xl font-black text-sky-500/20 font-mono absolute top-4 right-4">03</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-3">
                3
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-1">AI Tumor Layer Mapping</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                The AI identifies the 3 key tumor layers: dead core (pink), swelling (green), and actively growing rim (amber).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 relative">
              <span className="text-3xl font-black text-sky-500/20 font-mono absolute top-4 right-4">04</span>
              <div className="w-8 h-8 rounded-lg bg-purple-600 text-white font-bold text-xs flex items-center justify-center mb-3">
                4
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-1">Explore in 3D & Export</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rotate the 3D brain, explore 2D slices, measure milliliters, and print or export a full case summary report.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ Section */}
      <section id="faq" className="py-20 bg-slate-50/50 backdrop-blur-xs border-t border-slate-200/70 relative z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-2">
            <span className="text-xs font-mono font-semibold text-sky-600 uppercase tracking-widest">
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/90 overflow-hidden shadow-xs transition"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full p-4 text-left font-semibold text-sm text-slate-900 flex items-center justify-between hover:text-sky-600 transition"
                >
                  <span>{faq.q}</span>
                  {expandedFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Bottom High-Impact CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-sky-600/95 via-teal-600/95 to-indigo-700/95 text-white relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Explore 3D Brain MRI Analysis Today
          </h2>
          <p className="text-sky-100 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Try our interactive demo case, explore slice-by-slice 2D views, and test physical tumor volume calculations.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onLaunchWorkstation}
              className="px-6 py-3.5 rounded-xl font-bold text-sky-900 bg-white hover:bg-sky-50 shadow-lg shadow-sky-950/20 transition-all transform hover:-translate-y-0.5 text-sm"
            >
              Open 3D Brain Viewer
            </button>
            <button
              onClick={onLoadDemoCase}
              className="px-5 py-3.5 rounded-xl font-semibold text-white bg-sky-800/60 hover:bg-sky-800/80 border border-white/20 transition-all text-sm"
            >
              Load Sample Brain Scan
            </button>
          </div>
        </div>
      </section>

      {/* 9. SaaS Footer */}
      <footer className="bg-slate-900/95 backdrop-blur-sm text-slate-400 text-xs py-12 border-t border-slate-800 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-3 text-left group transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-700 bg-white p-0.5 flex items-center justify-center group-hover:border-sky-400 transition-colors">
                <img
                  src="/medical_ai_logo.jpeg"
                  alt="Medical AI Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-bold text-white text-sm group-hover:text-sky-300 transition-colors">NeuroScope 3D</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                Academic Edition v1.0.0
              </span>
            </button>

            <div className="flex items-center gap-6 text-slate-400 text-xs font-medium">
              <button onClick={onLaunchWorkstation} className="hover:text-white transition">3D Viewer</button>
              <button onClick={onOpenUpload} className="hover:text-white transition">Upload Scans</button>
              <button onClick={onLoadDemoCase} className="hover:text-white transition">Sample Scan</button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-amber-400 font-semibold block mb-0.5">Academic Research & Educational Prototype:</strong>
            NeuroScope 3D is an educational demonstration project. It is NOT for clinical diagnosis or medical treatment decisions.
            All AI outputs are experimental demonstrations and must be independently reviewed by qualified medical professionals.
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500 text-[11px] font-mono">
            <span>© 2026 NeuroScope 3D Project. Apache-2.0 License.</span>
            <span>Educational AI Brain Tumor Segmentation Prototype</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
