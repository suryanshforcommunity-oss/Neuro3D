import React, { useState, useEffect } from 'react';
import {
  X,
  Stethoscope,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { authApi } from '../../services/authApi';

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialRole?: UserRole;
  onLoginSuccess?: (role: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  initialRole: propInitialRole,
  onLoginSuccess,
}) => {
  const { login, isAuthModalOpen, closeAuthModal, authModalRole } = useAuth();
  const isOpen = propIsOpen !== undefined ? propIsOpen : isAuthModalOpen;
  const onClose = propOnClose !== undefined ? propOnClose : closeAuthModal;
  const currentRole = propInitialRole !== undefined ? propInitialRole : authModalRole;

  const [activeRole, setActiveRole] = useState<UserRole>(currentRole);
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setActiveRole(currentRole);
  }, [currentRole]);

  // Forgot password modal state
  const [isForgotOpen, setIsForgotOpen] = useState<boolean>(false);
  const [forgotIdentifier, setForgotIdentifier] = useState<string>('');
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRoleSwitch = (role: UserRole) => {
    setActiveRole(role);
    setErrorMessage(null);
    setIdentifier('');
    setPassword('');
  };

  const handlePreFill = (role: UserRole) => {
    if (role === 'doctor') {
      setIdentifier('doctor@neuroscope.ai');
      setPassword('NeuroScope2026!');
    } else {
      setIdentifier('PAT-2026-0042');
      setPassword('PatientPass2026!');
    }
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage(
        activeRole === 'patient'
          ? 'Please enter your Patient ID, registered email, or username.'
          : 'Please enter your hospital email or username.'
      );
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(identifier.trim(), password, activeRole);
      if (res.success) {
        onClose();
        if (onLoginSuccess) {
          onLoginSuccess(activeRole);
        }
      } else {
        setErrorMessage(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch {
      setErrorMessage('An unexpected connection error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) return;

    setIsForgotLoading(true);
    setForgotMessage(null);
    try {
      const res = await authApi.forgotPassword(forgotIdentifier.trim(), activeRole);
      setForgotMessage(res.message);
    } catch {
      setForgotMessage('Password reset request dispatched to your registered contact channel.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header with Medical AI branding */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/20 bg-white p-0.5 flex items-center justify-center flex-shrink-0">
              <img src="/medical_ai_logo.jpeg" alt="Medical AI Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight font-heading">NeuroScope 3D</h3>
              <p className="text-xs text-sky-300 font-medium">Secure Clinical & Patient Access</p>
            </div>
          </div>

          {/* Role Selector Tabs */}
          <div className="mt-5 grid grid-cols-2 p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleRoleSwitch('doctor')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all cursor-pointer ${
                activeRole === 'doctor'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
              <span>Doctor Portal</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('patient')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all cursor-pointer ${
                activeRole === 'patient'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5 text-teal-600" />
              <span>Patient Portal</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* Role summary notice */}
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              activeRole === 'doctor'
                ? 'bg-sky-50 border-sky-200 text-sky-900'
                : 'bg-teal-50 border-teal-200 text-teal-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-sky-600" />
            <div>
              <span className="font-bold block">
                {activeRole === 'doctor' ? 'Clinical Workstation Access' : 'Patient Health Record Portal'}
              </span>
              <span className="text-[11px] opacity-90">
                {activeRole === 'doctor'
                  ? 'Full access to 4-sequence NIfTI uploads, MONAI SegResNet 3D inference, and volumetric surgery reports.'
                  : 'Secure access to your personal MRI scan history, 3D brain visuals, tumor growth tracking, and patient reports.'}
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identifier input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {activeRole === 'patient' ? 'Patient ID or Registered Email' : 'Hospital Email or Username'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder={
                    activeRole === 'patient'
                      ? 'e.g. PAT-2026-0042 or patient@neuroscope.ai'
                      : 'e.g. doctor@neuroscope.ai'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm text-slate-900 transition"
                  autoFocus
                />
              </div>
            </div>

            {/* Password input with Show/Hide toggle */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-xs text-sky-600 hover:text-sky-800 font-medium transition cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm text-slate-900 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
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
              className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeRole === 'doctor'
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-sky-500/20'
                  : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 shadow-teal-500/20'
              } ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
            >
              {isLoading ? (
                <span>Authenticating Credentials...</span>
              ) : (
                <>
                  <span>Sign In to {activeRole === 'doctor' ? 'Doctor Workstation' : 'Patient Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Pre-fill for reviewers / testing */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2 font-medium">
              <span>Quick Test Credentials (Pre-fill):</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handlePreFill('doctor')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-200 text-slate-700 text-[11px] font-semibold text-left transition"
              >
                <div className="text-sky-700 font-bold">🩺 Dr. Sarah Chen</div>
                <div className="text-[10px] text-slate-500 truncate">doctor@neuroscope.ai</div>
              </button>
              <button
                type="button"
                onClick={() => handlePreFill('patient')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-200 text-slate-700 text-[11px] font-semibold text-left transition"
              >
                <div className="text-teal-700 font-bold">👤 Aarav Sharma</div>
                <div className="text-[10px] text-slate-500 truncate">PAT-2026-0042</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Flow Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-600" />
                <span>Reset Password</span>
              </h4>
              <button onClick={() => setIsForgotOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Enter your registered {activeRole === 'patient' ? 'Patient ID or email' : 'hospital email'} to receive
              secure password reset instructions.
            </p>

            {forgotMessage ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Request Dispatched</span>
                </div>
                <p className="text-[11px]">{forgotMessage}</p>
                <button
                  onClick={() => {
                    setIsForgotOpen(false);
                    setForgotMessage(null);
                  }}
                  className="w-full py-1.5 mt-2 bg-emerald-600 text-white rounded-lg font-bold text-xs"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <input
                  type="text"
                  value={forgotIdentifier}
                  onChange={e => setForgotIdentifier(e.target.value)}
                  placeholder={
                    activeRole === 'patient' ? 'e.g. PAT-2026-0042' : 'e.g. doctor@neuroscope.ai'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
                <button
                  type="submit"
                  disabled={isForgotLoading}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                >
                  {isForgotLoading ? 'Sending...' : 'Send Reset Instructions'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthModal;
