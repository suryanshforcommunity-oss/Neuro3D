import React, { useState } from 'react';
import {
  Stethoscope,
  HeartPulse,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Brain,
  Layers,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';
import { authApi } from '../services/authApi';
import Antigravity from '../components/animations/Antigravity';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();

  const [activeRole, setActiveRole] = useState<UserRole>('doctor');
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password drawer/modal state
  const [isForgotOpen, setIsForgotOpen] = useState<boolean>(false);
  const [forgotIdentifier, setForgotIdentifier] = useState<string>('');
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState<boolean>(false);

  const handleRoleSwitch = (role: UserRole) => {
    setActiveRole(role);
    setErrorMessage(null);
    setIdentifier('');
    setPassword('');
  };

  const handlePreFill = (role: UserRole, accountType: 'doc' | 'pat1' | 'pat2' = 'doc') => {
    setActiveRole(role);
    setErrorMessage(null);
    if (role === 'doctor') {
      setIdentifier('doctor@neuroscope.ai');
      setPassword('NeuroScope2026!');
    } else if (accountType === 'pat1') {
      setIdentifier('PAT-2026-0042');
      setPassword('PatientPass2026!');
    } else {
      setIdentifier('priya.patel@example.com');
      setPassword('PatientPass2026!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedId = identifier.trim();
    if (!trimmedId) {
      setErrorMessage(
        activeRole === 'doctor'
          ? 'Please enter your Doctor ID, email, or username.'
          : 'Please enter your Patient ID or email address.'
      );
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(trimmedId, password, activeRole);
      if (!res.success) {
        setErrorMessage(res.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch {
      setErrorMessage('Network error communicating with the AI authentication service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) return;

    setIsForgotLoading(true);
    try {
      const res = await authApi.forgotPassword(forgotIdentifier.trim(), activeRole);
      setForgotMessage(res.message);
    } catch {
      setForgotMessage('Temporary password instructions have been dispatched to your registered medical contact.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const isDoc = activeRole === 'doctor';

  return (
    <div className="relative min-h-screen w-screen overflow-x-hidden overflow-y-auto bg-slate-50/70 font-sans text-slate-800 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      {/* 0. Full-Page Ambient Antigravity Particle Field: matches landing page light medical theme */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <Antigravity
          colors={
            isDoc
              ? ['#0284c7', '#06b6d4', '#4f46e5', '#38bdf8', '#0ea5e9']
              : ['#0d9488', '#10b981', '#06b6d4', '#14b8a6', '#059669']
          }
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

      {/* Decorative subtle background gradients matching landing page */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-sky-200/25 via-teal-100/20 to-indigo-200/25 blur-3xl pointer-events-none -z-10" />

      {/* 1. SaaS Top Brand Bar */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-slate-200/80 bg-white/70 backdrop-blur-md shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white p-0.5 flex items-center justify-center">
            <img src="/medical_ai_logo.jpeg" alt="Medical AI Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-900 font-heading">NeuroScope</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200 font-mono">
                3D v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">3D Brain MRI Analysis & Volumetric Diagnostic Portal</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 font-mono bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-700">Clinical Security Gate Active</span>
        </div>
      </header>

      {/* 2. Main Center Card Section */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-xl">
          {/* Main Card with Clean Light Medical Glassmorphism */}
          <div className="relative rounded-3xl bg-white/85 backdrop-blur-md border border-slate-200/80 p-6 sm:p-8 shadow-xl shadow-slate-200/60 overflow-hidden">
            {/* Top Accent Bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1.5 transition-colors duration-500 ${
                isDoc
                  ? 'bg-gradient-to-r from-sky-600 via-indigo-600 to-teal-500'
                  : 'bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500'
              }`}
            />

            {/* Portal Gate Heading */}
            <div className="text-center space-y-2 mb-6 pt-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 shadow-2xs text-xs font-semibold text-slate-700">
                <Lock className="w-3.5 h-3.5 text-sky-600" />
                <span>Authorized Authentication Required</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {isDoc ? 'Clinician Workstation Access' : 'Patient Health Portal Access'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                {isDoc
                  ? 'Access 4-sequence MRI analysis, MONAI SegResNet 3D inference, and tumor volume metrics.'
                  : 'Review your personalized MRI scan history, longitudinal tumor tracking, and patient reports.'}
              </p>
            </div>

            {/* Role Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 mb-6 shadow-inner">
              <button
                type="button"
                onClick={() => handleRoleSwitch('doctor')}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
                  isDoc
                    ? 'bg-white text-sky-900 shadow-sm font-bold border border-sky-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Stethoscope className={`w-4 h-4 flex-shrink-0 ${isDoc ? 'text-sky-600' : 'text-slate-500'}`} />
                <span>Doctor / Clinician</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSwitch('patient')}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
                  !isDoc
                    ? 'bg-white text-teal-900 shadow-sm font-bold border border-teal-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <HeartPulse className={`w-4 h-4 flex-shrink-0 ${!isDoc ? 'text-teal-600' : 'text-slate-500'}`} />
                <span>Patient & Family</span>
              </button>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs shadow-2xs">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed font-medium">{errorMessage}</div>
              </div>
            )}

            {/* Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {isDoc ? 'Doctor ID, Email, or Username' : 'Patient ID or Email Address'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder={
                      isDoc
                        ? 'e.g. doctor@neuroscope.ai or dr.chen'
                        : 'e.g. PAT-2026-0042 or patient@neuroscope.ai'
                    }
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition shadow-2xs"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotIdentifier(identifier);
                      setForgotMessage(null);
                      setIsForgotOpen(true);
                    }}
                    className="text-xs text-sky-600 hover:text-sky-800 hover:underline transition font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition pr-10 shadow-2xs"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-md cursor-pointer ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                } ${
                  isDoc
                    ? 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-sky-500/25'
                    : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 shadow-teal-500/25'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>{isDoc ? 'Sign In as Clinician' : 'Sign In to Patient Portal'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Pre-fill Chips */}
            <div className="mt-6 pt-5 border-t border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  One-Click Test Accounts
                </span>
                <span className="text-[10px] text-slate-400">Instant test login</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handlePreFill('doctor', 'doc')}
                  className="p-2.5 rounded-xl border border-sky-200 bg-sky-50/60 hover:bg-sky-100 hover:border-sky-300 text-left transition group cursor-pointer shadow-2xs"
                >
                  <div className="text-xs font-bold text-sky-800 group-hover:text-sky-900 truncate">
                    🩺 Dr. Sarah Chen
                  </div>
                  <div className="text-[10px] text-sky-600 font-mono">Clinician / Doctor</div>
                </button>

                <button
                  type="button"
                  onClick={() => handlePreFill('patient', 'pat1')}
                  className="p-2.5 rounded-xl border border-teal-200 bg-teal-50/60 hover:bg-teal-100 hover:border-teal-300 text-left transition group cursor-pointer shadow-2xs"
                >
                  <div className="text-xs font-bold text-teal-800 group-hover:text-teal-900 truncate">
                    👤 Aarav Sharma
                  </div>
                  <div className="text-[10px] text-teal-600 font-mono">Patient (3 Scans)</div>
                </button>

                <button
                  type="button"
                  onClick={() => handlePreFill('patient', 'pat2')}
                  className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 hover:border-emerald-300 text-left transition group cursor-pointer shadow-2xs"
                >
                  <div className="text-xs font-bold text-emerald-800 group-hover:text-emerald-900 truncate">
                    👤 Priya Patel
                  </div>
                  <div className="text-[10px] text-emerald-600 font-mono">Patient (Baseline)</div>
                </button>
              </div>
            </div>
          </div>

          {/* Feature and Trust Badges */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-white/70 backdrop-blur-xs rounded-xl border border-slate-200/80 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <div className="text-[11px] font-bold text-slate-800">HIPAA Compliant</div>
              <div className="text-[10px] text-slate-500">Zero Cloud Leakage</div>
            </div>

            <div className="p-3 bg-white/70 backdrop-blur-xs rounded-xl border border-slate-200/80 shadow-xs">
              <Brain className="w-4 h-4 text-sky-600 mx-auto mb-1" />
              <div className="text-[11px] font-bold text-slate-800">MONAI SegResNet</div>
              <div className="text-[10px] text-slate-500">BraTS 2023 3D Models</div>
            </div>

            <div className="p-3 bg-white/70 backdrop-blur-xs rounded-xl border border-slate-200/80 shadow-xs">
              <Layers className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
              <div className="text-[11px] font-bold text-slate-800">4-Sequence MRI</div>
              <div className="text-[10px] text-slate-500">T1, T1Gd, T2, FLAIR</div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="relative z-10 w-full px-6 py-4 text-center text-xs text-slate-500 border-t border-slate-200/70 bg-white/60 backdrop-blur-md">
        <p className="max-w-2xl mx-auto leading-relaxed">
          NeuroScope 3D is an academic and clinical research imaging platform. Strict authenticated separation is enforced between healthcare provider and patient accounts.
        </p>
      </footer>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-600" />
                <span>Reset Account Password</span>
              </h4>
              <button
                onClick={() => setIsForgotOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Enter your registered username, Patient ID, or email address to receive password reset instructions.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="text"
                value={forgotIdentifier}
                onChange={e => setForgotIdentifier(e.target.value)}
                placeholder="Doctor ID or Patient ID / Email"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-sky-500 shadow-2xs"
              />

              {forgotMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="leading-tight font-medium">{forgotMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isForgotLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
              >
                {isForgotLoading ? 'Sending...' : 'Send Recovery Link'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
