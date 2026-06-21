import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../lib/firebase';
import { AlertCircle, Mail, Lock, ArrowRight, Eye, EyeOff, KeyRound } from 'lucide-react';

// ── Google Icon ───────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState<'password' | 'email' | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  const redirectAfterLogin = (data: Record<string, unknown>) => {
    if (data?.profileCompleted) {
      navigate(`/${data.role}-dashboard`, { replace: true });
    } else if (data?.role) {
      navigate(`/onboarding/${data.role}`, { replace: true });
    } else {
      navigate('/signup', { replace: true });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldError(null);
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, 'users', credential.user.uid));
      redirectAfterLogin(snap.data() as Record<string, unknown>);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential'
      ) {
        setFieldError('password');
        setError('Incorrect email or password.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a few minutes or reset your password.');
      } else {
        setError((err as Error).message);
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const snap = await getDoc(doc(db, 'users', result.user.uid));

      if (!snap.exists() || !snap.data()?.role) {
        await auth.signOut();
        navigate('/signup?hint=' + encodeURIComponent(result.user.email || ''), {
          replace: true,
        });
        return;
      }
      redirectAfterLogin(snap.data() as Record<string, unknown>);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code !== 'auth/popup-closed-by-user') {
        setError((err as Error).message || 'Google sign-in failed.');
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email address above, then click Forgot Password.');
      return;
    }
    setResetLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up.');
      } else {
        setError((err as Error).message || 'Could not send reset email.');
      }
    }
    setResetLoading(false);
  };

  return (
    <div
      className="min-h-[calc(100vh-64px)] bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center py-8 px-4"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="w-full max-w-5xl bg-white border-2 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col lg:flex-row relative">
        {/* Tape label */}
        <div className="hidden lg:block absolute -top-4 -right-4 bg-[#a7f3d0] border-2 border-black text-sm font-black px-4 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-3 z-10">
          LOGIN
        </div>

        {/* ── LEFT: Branding ─────────────────────────────────────────────────── */}
        <div className="w-full lg:w-5/12 bg-[#c4b5fd] p-8 lg:p-10 border-b-2 lg:border-b-0 lg:border-r-2 border-black flex flex-col justify-between">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 border-2 border-black px-3 py-1 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <img src="/logo.svg" alt="Logo" className="w-5 h-5 object-contain" />
              <span className="text-xl font-black text-[#111827] tracking-tight">
                creator<span className="text-[#8b5cf6]">.</span>stack
              </span>
            </Link>

            <h1 className="text-4xl lg:text-5xl font-black text-[#111827] uppercase tracking-tight leading-none mt-6 mb-4">
              Welcome
              <br />
              Back
            </h1>
            <p className="text-sm font-bold text-[#111827]">
              Sign in to your account to continue.
            </p>
          </div>

          {/* Trust signals */}
          <div className="hidden lg:flex flex-col gap-3 mt-8">
            {[
              '🔐 Escrow-protected payments',
              '✅ PAN/KYC verified marketplace',
              '📄 TDS-compliant contracts',
            ].map((trust) => (
              <div
                key={trust}
                className="flex items-center gap-2 text-xs font-bold text-[#111827] bg-white/50 border border-black/20 px-3 py-2 rounded-lg"
              >
                {trust}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Form ────────────────────────────────────────────────────── */}
        <div className="w-full lg:w-7/12 p-8 lg:p-12 bg-white flex flex-col justify-center">
          {/* Reset sent success */}
          {resetSent && (
            <div className="mb-5 flex items-start gap-2.5 bg-emerald-50 border-2 border-emerald-500 p-4 text-sm font-bold text-emerald-700 shadow-[4px_4px_0px_0px_rgba(16,185,129,1)] rounded-lg">
              ✅ Password reset link sent to <strong>{email}</strong>. Check your inbox.
            </div>
          )}

          {/* Error */}
          {error && !resetSent && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-50 border-2 border-red-500 p-4 text-sm font-bold text-red-700 shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-black bg-white text-sm font-black text-[#111827] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-60 mb-6"
          >
            <GoogleIcon /> CONTINUE WITH GOOGLE
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-0.5 bg-black" />
            <span className="text-xs text-black font-black uppercase tracking-wider">
              or email
            </span>
            <div className="flex-1 h-0.5 bg-black" />
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-black text-[#111827] uppercase tracking-wide mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-black absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  className={`w-full pl-10 pr-4 py-3 border-2 ${fieldError === 'email' ? 'border-red-500' : 'border-black'} bg-[#f9fafb] text-sm font-medium text-[#111827] focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-black text-[#111827] uppercase tracking-wide">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="flex items-center gap-1 text-xs font-bold text-[#8b5cf6] hover:underline underline-offset-2 disabled:opacity-50"
                >
                  <KeyRound className="w-3 h-3" />
                  {resetLoading ? 'Sending…' : 'Forgot Password?'}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-black absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={`w-full pl-10 pr-10 py-3 border-2 ${fieldError === 'password' ? 'border-red-500 bg-red-50' : 'border-black bg-[#f9fafb]'} text-sm font-medium text-[#111827] focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all`}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldError(null);
                  }}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldError === 'password' && (
                <p className="mt-1.5 text-xs font-bold text-red-500">
                  Incorrect email or password. Forgot it?{' '}
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="underline underline-offset-2"
                  >
                    Reset here
                  </button>
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8b5cf6] border-2 border-black text-black font-black uppercase tracking-wider py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  SIGN IN <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-between">
            <span className="text-sm font-bold text-[#6b7280]">Don't have an account?</span>
            <Link to="/signup" className="text-sm font-bold text-[#8b5cf6] hover:underline underline-offset-2">
              Create one →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
