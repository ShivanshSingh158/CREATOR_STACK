import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../firebase';
import { AlertCircle, Mail, Lock, ArrowRight } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      // After login, AuthContext will read role from Firestore and redirect
      // Check if onboarding is complete
      const snap = await getDoc(doc(db, 'users', credential.user.uid));
      const data = snap.data();
      if (data?.profileCompleted) {
        navigate(`/${data.role}-dashboard`);
      } else {
        navigate(`/onboarding/${data?.role || 'creator'}`);
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Incorrect email or password. Please try again or sign up.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please wait a few minutes.');
      } else {
        setError(err.message);
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

      if (!snap.exists()) {
        // First-ever login with this Google account — no role yet
        // Sign them out and send to signup to pick a role
        await auth.signOut();
        navigate('/signup?source=google&hint=' + encodeURIComponent(result.user.email || ''));
        return;
      }

      const data = snap.data();
      if (!data?.role) {
        // Has a doc but no role — incomplete signup
        await auth.signOut();
        navigate('/signup');
        return;
      }

      if (data?.profileCompleted) {
        navigate(`/${data.role}-dashboard`);
      } else {
        navigate(`/onboarding/${data.role}`);
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('');
      } else {
        setError(err.message || 'Google sign-in failed. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center py-12 px-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-[#111827]">creator<span className="text-[#d1b07c]">.</span>stack</p>
          <h1 className="text-xl font-semibold text-[#374151] mt-2">Welcome back</h1>
          <p className="text-sm text-[#6b7280] mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-8">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-[#e5e7eb] rounded-xl bg-white text-sm font-semibold text-[#374151] hover:bg-[#f9fafb] transition-colors disabled:opacity-60 mb-6"
          >
            <GoogleIcon /> Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#e5e7eb]" />
            <span className="text-xs text-[#9ca3af] font-medium">or</span>
            <div className="flex-1 h-px bg-[#e5e7eb]" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#374151] mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  className="w-full pl-9 pr-4 py-3 border border-[#d1d5db] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-[#374151]">Password</label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  className="w-full pl-9 pr-4 py-3 border border-[#d1d5db] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all"
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#111827] text-white font-semibold py-3 rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#6b7280] mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-[#2563eb] hover:text-[#1d4ed8]">Create one</Link>
        </p>
      </div>
    </div>
  );
}
