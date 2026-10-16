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
} from 'lucide-react';
import FloatingLines from '../components/animations/FloatingLines';

interface LandingPageProps {
  onLaunchWorkstation: () => void;
  onLoadDemoCase: () => void;
  onOpenUpload: () => void;
  backendStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  activeModelName?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchWorkstation,
  onLoadDemoCase,
  onOpenUpload,
  backendStatus,
  activeModelName = 'MONAI SegResNet (BraTS 2023)',
}) => {
  // Interactive preview state for the hero showcase card
  const [previewPlane, setPreviewPlane] = useState<'axial' | 'coronal' | 'sagittal'>('axial');
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
      q: 'Is NeuroScope 3D approved for clinical diagnosis?',
      a: 'No. NeuroScope 3D is strictly an investigational research and teaching workstation. It must never be used as a standalone diagnostic tool or for clinical treatment planning without independent board-certified radiologist review.',
    },
    {
      q: 'Are patient MRI scans uploaded to third-party cloud servers?',
      a: 'Never. NeuroScope 3D operates with a strict Zero-Trust Clinical Privacy guarantee. All NIfTI file parsing, header inspections, and coordinate conversions run inside your local browser sandbox and on-premises Python environment. No data ever leaves your device.',
    },
    {
      q: 'Which MRI modalities and file formats are required?',
      a: 'The platform strictly follows the official BraTS standard requiring four co-registered 3D volumes in NIfTI (.nii or .nii.gz) format: T1 native, T1 contrast-enhanced (T1-Gd), T2, and T2-FLAIR. An optional expert ground truth mask can also be provided for scoring.',
    },
    {
      q: 'Does NeuroScope 3D require an NVIDIA GPU?',
      a: 'While GPU acceleration via CUDA provides real-time sliding-window inference, NeuroScope 3D includes a fully verified CPU execution fallback mode. The software automatically detects available hardware and reports execution mode transparently.',
    },
    {
      q: 'How does the 24-hour study data retention cleanup work?',
      a: 'To guarantee strict patient privacy compliance, the server backend includes an automated data retention worker that physically purges all temporary study folders and tensors older than 24 hours (86,400 seconds) from disk.',
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-50/60 text-slate-800 font-sans selection:bg-sky-500 selection:text-white">
      {/* 0. Full-Page Ambient Floating Lines: light medical theme, reacting to cursor throughout page */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <FloatingLines
          linesGradient={['#0284c7', '#06b6d4', '#4f46e5', '#38bdf8', '#0d9488']}
          enabledWaves={['top', 'middle', 'bottom']}
          lineCount={[12, 16, 12]}
          lineDistance={[8, 10, 8]}
          topWavePosition={{ x: 10, y: 0.65, rotate: -0.25 }}
          middleWavePosition={{ x: 0, y: 0.05, rotate: 0.15 }}
          bottomWavePosition={{ x: -10, y: -0.7, rotate: -0.15 }}
          lineWidth={1.8}
          glow={1.2}
          brightness={1.3}
          animationSpeed={0.7}
          amplitude={1.0}
          interactive={true}
          bendRadius={7}
          bendStrength={-0.8}
          mouseDamping={0.06}
          parallax={true}
          parallaxStrength={0.25}
          clickSwirl={true}
          intro={true}
          lightMode={true}
          opacity={0.8}
          style={{ width: '100vw', height: '100vh', position: 'fixed', inset: 0 }}
        />
      </div>

      {/* 1. SaaS Top Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-slate-200/60 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-teal-500 to-indigo-600 p-0.5 shadow-md shadow-sky-500/20">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <Brain className="w-6 h-6 text-sky-600" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">NeuroScope</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200 font-mono">
                  3D v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">BraTS MRI Volumetric Workstation</p>
            </div>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-sky-600 transition">Features</a>
            <a href="#showcase" className="hover:text-sky-600 transition">Interactive Demo</a>
            <a href="#calculator" className="hover:text-sky-600 transition">Volume Calculator</a>
            <a href="#workflow" className="hover:text-sky-600 transition">Pipeline</a>
            <a href="#faq" className="hover:text-sky-600 transition">FAQ</a>
          </div>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={onLoadDemoCase}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
            >
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>Load Demo #042</span>
            </button>

            <button
              onClick={onLaunchWorkstation}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-md shadow-sky-500/20 transition-all transform hover:-translate-y-0.5"
            >
              <span>Launch Workstation</span>
              <ArrowRight className="w-4 h-4" />
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
              <span className="text-sky-700 font-mono">MONAI SegResNet</span>
              <span className="text-slate-300">•</span>
              <span>BraTS Protocol Standard</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              See a brain tumour in 3D,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-teal-600 to-indigo-600">
                measure it in mL
              </span>
              , and know how far to trust it.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
              A clinician-grade research workstation for automated 4-sequence brain MRI segmentation (T1, T1-Gd, T2, FLAIR). Features sub-millimeter anisotropic volumetrics, orthogonal slice tracking, and rigorous NiBabel spatial verification.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={onLaunchWorkstation}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-lg shadow-sky-500/25 transition-all transform hover:-translate-y-0.5 text-sm sm:text-base"
              >
                <span>Open 3D Workstation</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={onOpenUpload}
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs hover:border-slate-400 transition-all text-sm sm:text-base"
              >
                <FileText className="w-4 h-4 text-sky-600" />
                <span>Upload 4-Sequence NIfTI</span>
              </button>
            </div>

            {/* Trust & Spec Checklist */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div className="p-3 bg-white/70 backdrop-blur-xs rounded-xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2 text-sky-700 font-semibold text-xs mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>100% Client Privacy</span>
                </div>
                <p className="text-[11px] text-slate-500">Zero cloud scan leaks; runs in sandboxed environment.</p>
              </div>

              <div className="p-3 bg-white/70 backdrop-blur-xs rounded-xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2 text-sky-700 font-semibold text-xs mb-1">
                  <Activity className="w-4 h-4 text-sky-500" />
                  <span>BraTS Sub-Regions</span>
                </div>
                <p className="text-[11px] text-slate-500">WT (Whole), TC (Core), and ET (Enhancing) compartments.</p>
              </div>

              <div className="p-3 bg-white/70 backdrop-blur-xs rounded-xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2 text-sky-700 font-semibold text-xs mb-1">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  <span>Sub-mm Spacing</span>
                </div>
                <p className="text-[11px] text-slate-500">Strict physical formula compensating for anisotropic grids.</p>
              </div>

              <div className="p-3 bg-white/70 backdrop-blur-xs rounded-xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2 text-sky-700 font-semibold text-xs mb-1">
                  <Cpu className="w-4 h-4 text-amber-500" />
                  <span>Verified Pipeline</span>
                </div>
                <p className="text-[11px] text-slate-500">MONAI SegResNet sliding-window inference with seed locking.</p>
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
                    NeuroScope 3D Workstation — Case BraTS2023_00042
                  </span>
                </div>

                {/* Plane selector tabs */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs font-medium">
                  {(['axial', 'coronal', 'sagittal'] as const).map(plane => (
                    <button
                      key={plane}
                      onClick={() => setPreviewPlane(plane)}
                      className={`px-3 py-1 rounded capitalize transition ${
                        previewPlane === plane
                          ? 'bg-sky-600 text-white font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {plane}
                    </button>
                  ))}
                </div>
              </div>

              {/* Showcase Body */}
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                {/* Visual Viewport Simulation */}
                <div className="md:col-span-2 p-6 bg-slate-900 relative min-h-[360px] flex items-center justify-center overflow-hidden">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

                  {/* Simulated 2D Slice & Tumour Rendering */}
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
                      Crosshair: (X: +18.0 mm, Y: +6.0 mm, Z: +4.0 mm)
                    </div>
                  </div>

                  {/* Orientation Badges */}
                  <span className="absolute top-3 left-1/2 -translate-x-1/2 text-xs font-mono font-bold text-slate-400">
                    {previewPlane === 'axial' ? 'ANTERIOR (A)' : 'SUPERIOR (S)'}
                  </span>
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-mono font-bold text-slate-400">
                    {previewPlane === 'axial' ? 'POSTERIOR (P)' : 'INFERIOR (I)'}
                  </span>
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                    RIGHT (R)
                  </span>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                    LEFT (L)
                  </span>
                </div>

                {/* Right Measurement Panel in Showcase */}
                <div className="p-6 bg-slate-50 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 font-mono">
                      Compartment Volumetrics
                    </h3>

                    {/* Volume Cards */}
                    <div className="space-y-2.5">
                      {/* WT */}
                      <div
                        onClick={() => setShowWT(!showWT)}
                        className={`p-3 rounded-xl border transition cursor-pointer ${
                          showWT
                            ? 'bg-cyan-50/80 border-cyan-200 text-cyan-950'
                            : 'bg-white border-slate-200 text-slate-400 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                            <span className="text-xs font-semibold">Whole Tumour (WT)</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-cyan-700">29.75 mL</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                          NCR (1) + ED (2) + ET (4)
                        </span>
                      </div>

                      {/* TC */}
                      <div
                        onClick={() => setShowTC(!showTC)}
                        className={`p-3 rounded-xl border transition cursor-pointer ${
                          showTC
                            ? 'bg-violet-50/80 border-violet-200 text-violet-950'
                            : 'bg-white border-slate-200 text-slate-400 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                            <span className="text-xs font-semibold">Tumour Core (TC)</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-violet-700">29.41 mL</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                          NCR (1) + ET (4)
                        </span>
                      </div>

                      {/* ET */}
                      <div
                        onClick={() => setShowET(!showET)}
                        className={`p-3 rounded-xl border transition cursor-pointer ${
                          showET
                            ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                            : 'bg-white border-slate-200 text-slate-400 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <span className="text-xs font-semibold">Enhancing Tumour (ET)</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-amber-700">3.06 mL</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                          ET Active Rim (4)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action */}
                  <button
                    onClick={onLaunchWorkstation}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition flex items-center justify-center gap-2"
                  >
                    <span>Inspect Full 3D Volume</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Features Bento Grid */}
      <section id="features" className="py-20 bg-white/60 backdrop-blur-xs border-y border-slate-200/70 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-sky-600 font-semibold">
              Workstation Architecture
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Engineered for Medical Imaging Rigor
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Every formula, coordinate transformation, and label conversion follows verified international neuro-oncology standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/90 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-500/10 transition-all">
              <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-600 mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Tri-Planar Synchronized Views</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Simultaneous Axial, Coronal, and Sagittal orthogonal slice panels dynamically synchronized to a single canonical (i, j, k) voxel coordinate and physical (X, Y, Z) mm position via affine transforms.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-teal-300 hover:shadow-lg hover:shadow-teal-500/5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-600 mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Physical Volume Quantification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Strict formula: Count × (dx × dy × dz) / 1000 reading exact spacing from NIfTI headers. Verified on official BraTS test cubes without assuming isotropic 1.0 mm spacing.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-4">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">3D Surface & Cutaway Mesh</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hardware-accelerated Three.js cortical mesh with concentric WT, TC, and ET tumour boundaries. Features stereotactic cutaway clipping planes to visualize internal tumour core anatomy.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Server-Side NiBabel Validation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated multi-sequence audit catching 1GB size caps, non-finite NaNs/Infs, zero-variance constant signals, 2D degenerate slices, and cross-modality affine discrepancies &gt; 0.5 mm.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">MONAI SegResNet Pipeline</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Official MONAI 3D SegResNet pipeline with 4-channel input order `[T1Gd, T1, T2, FLAIR]`, non-zero foreground z-score normalization, and nearest-neighbour integer label mapping.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-rose-300 hover:shadow-lg hover:shadow-rose-500/5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">24h Auto-Purge Privacy</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Zero patient telemetry. Uploaded studies and intermediate tensors are automatically purged after 24 hours (86,400 seconds) by the backend data-retention cleaner.
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
                Interactive Medical Math
              </span>
              <h2 className="text-2xl font-bold text-slate-900">
                Physical Tumour Volume Calculator
              </h2>
              <p className="text-xs text-slate-600">
                Test the sub-millimeter volume calculation formula: Volume (mL) = Voxels × (dx × dy × dz) / 1000.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Sliders */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Axial Dimension (Dx)</span>
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
                    <span>Coronal Dimension (Dy)</span>
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
                    <span>Sagittal Dimension (Dz)</span>
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
                    <span>Voxel Z-Spacing (Slice Thickness)</span>
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
                  Calculated Physical Volume
                </span>
                <div className="text-5xl font-black text-slate-900 font-mono tracking-tight">
                  {calculatedVolumeMl} <span className="text-2xl font-bold text-sky-600">mL</span>
                </div>
                <div className="text-xs text-slate-600 font-mono">
                  Equivalent to {(Number(calculatedVolumeMl) * 1000).toLocaleString()} mm³
                </div>

                <div className="pt-2 border-t border-sky-200/60 text-[11px] text-slate-500 leading-tight">
                  Formula: V = (4/3)π · rx · ry · rz · Δz / 1000. Spacing read directly from NIfTI pixdim.
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
              End-to-End Pipeline
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              From Raw Scans to Clinical Provenance
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/90 relative">
              <span className="text-3xl font-black text-sky-500/20 font-mono absolute top-4 right-4">01</span>
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white font-bold text-xs flex items-center justify-center mb-3">
                1
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-1">Upload 4 Sequences</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Drag and drop T1, T1-Gd, T2, and FLAIR NIfTI files into the browser modal with instant header validation.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 relative">
              <span className="text-3xl font-black text-sky-500/20 font-mono absolute top-4 right-4">02</span>
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center mb-3">
                2
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-1">Spatial Pre-Validation</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                NiBabel verifies matching grid dimensions, voxel zooms, affine alignment, and finite non-zero values.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 relative">
              <span className="text-3xl font-black text-sky-500/20 font-mono absolute top-4 right-4">03</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-3">
                3
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-1">SegResNet Inference</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sliding-window inferer computes probability channels; converts to discrete BraTS labels (1: NCR, 2: ED, 4: ET).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 relative">
              <span className="text-3xl font-black text-sky-500/20 font-mono absolute top-4 right-4">04</span>
              <div className="w-8 h-8 rounded-lg bg-purple-600 text-white font-bold text-xs flex items-center justify-center mb-3">
                4
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-1">Export & Provenance</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Export native affine-preserving `.nii.gz` predictions and generate printable reports with SHA-256 lineage.
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
            Accelerate Your 3D Neuro-Imaging Research Today
          </h2>
          <p className="text-sky-100 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Experience the full workstation with pre-loaded demo cases, synchronized orthogonal slice views, and interactive 3D volumetric analysis.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onLaunchWorkstation}
              className="px-6 py-3.5 rounded-xl font-bold text-sky-900 bg-white hover:bg-sky-50 shadow-lg shadow-sky-950/20 transition-all transform hover:-translate-y-0.5 text-sm"
            >
              Open NeuroScope 3D Workstation
            </button>
            <button
              onClick={onLoadDemoCase}
              className="px-5 py-3.5 rounded-xl font-semibold text-white bg-sky-800/60 hover:bg-sky-800/80 border border-white/20 transition-all text-sm"
            >
              Load Demo Patient #042
            </button>
          </div>
        </div>
      </section>

      {/* 9. SaaS Footer */}
      <footer className="bg-slate-900/95 backdrop-blur-sm text-slate-400 text-xs py-12 border-t border-slate-800 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-sky-400" />
              <span className="font-bold text-white text-sm">NeuroScope 3D</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                Research Edition v1.0.0-rc2
              </span>
            </div>

            <div className="flex items-center gap-6 text-slate-400 text-xs font-medium">
              <button onClick={onLaunchWorkstation} className="hover:text-white transition">Workstation</button>
              <button onClick={onOpenUpload} className="hover:text-white transition">Upload Scans</button>
              <button onClick={onLoadDemoCase} className="hover:text-white transition">Demo Case</button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-amber-400 font-semibold block mb-0.5">Mandatory Clinical Research Disclaimer:</strong>
            NeuroScope 3D is an investigational research and teaching prototype. Not for clinical diagnosis or treatment decisions.
            Model outputs are experimental and require independent expert review. Any simulated volumes or overlays are strictly illustrative.
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500 text-[11px] font-mono">
            <span>© 2026 NeuroScope 3D Project. Apache-2.0 License.</span>
            <span>MONAI BraTS 2023 SegResNet Specification</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
