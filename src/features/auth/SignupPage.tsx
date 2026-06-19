import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../firebase';
import { useAuth } from './AuthContext';
import { AlertCircle, ArrowRight, CheckCircle2, Mail, Lock, Briefcase, Video, Shield, Zap } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const FEATURES = [
  { icon: Shield, text: 'Role-locked accounts — your Gmail is permanently assigned to one side' },
  { icon: Zap, text: 'Verified metrics via YouTube API — no fake follower counts' },
  { icon: CheckCircle2, text: 'Escrow-protected payments — brands fund before work starts' },
];

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'creator' | 'brand' | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, userRole, profileCompleted } = useAuth();

  useEffect(() => {
    const hint = searchParams.get('hint');
    if (hint) setEmail(decodeURIComponent(hint));
  }, [searchParams]);

  // Redirect if already fully signed up
  useEffect(() => {
    if (currentUser && userRole && profileCompleted) navigate(`/${userRole}-dashboard`, { replace: true });
    else if (currentUser && userRole && !profileCompleted) navigate(`/onboarding/${userRole}`, { replace: true });
  }, [currentUser, userRole, profileCompleted, navigate]);

  const createUserDoc = async (uid: string, email: string, chosenRole: 'creator' | 'brand') => {
    await setDoc(doc(db, 'users', uid), {
      email,
      role: chosenRole,
      profileCompleted: false,
      createdAt: new Date().toISOString(),
    }, { merge: true });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!role) { setError('Please select whether you are a Creator or a Brand.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters long.'); return; }

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await createUserDoc(credential.user.uid, email, role);
      navigate(`/onboarding/${role}`, { replace: true });
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        // Check if same role or different role
        setError('An account with this email already exists. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 8 characters with letters and numbers.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    }
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    setError('');
    if (!role) { setError('Please select Creator or Brand first.'); return; }

    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const uid = result.user.uid;

      // Check if this Google account already has a Firestore profile
      const existing = await getDoc(doc(db, 'users', uid));

      if (existing.exists() && existing.data()?.role) {
        const existingRole = existing.data()!.role;
        if (existingRole !== role) {
          // Wrong role — block immediately
          await auth.signOut();
          setError(
            `This Google account is already registered as a ${existingRole === 'brand' ? 'Brand' : 'Creator'}. ` +
            `Please go to Sign In as a ${existingRole === 'brand' ? 'Brand' : 'Creator'}, or use a different Google account.`
          );
          setLoading(false);
          return;
        }
        // Same role — send to appropriate destination
        if (existing.data()?.profileCompleted) {
          navigate(`/${existingRole}-dashboard`, { replace: true });
        } else {
          navigate(`/onboarding/${existingRole}`, { replace: true });
        }
        return;
      }

      // Brand new account — create user doc
      await createUserDoc(uid, result.user.email || '', role);
      navigate(`/onboarding/${role}`, { replace: true });
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google sign-up failed. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Left panel — desktop only */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[40%] bg-[#111827] flex-col justify-between p-12 shrink-0">
        <div>
          <p className="text-2xl font-bold text-white tracking-tight">
            creator<span className="text-[#d1b07c]">.</span>stack
          </p>
          <p className="text-[#9ca3af] text-sm mt-1">India's verified creator marketplace</p>
        </div>

        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-white leading-snug">
            Connect real creators<br />with real brands.
          </h2>
          <div className="space-y-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4 text-[#d1b07c]" />
                </div>
                <p className="text-sm text-[#d1d5db] leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-[#4b5563]">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

      {/* Right panel — sign up form */}
      <div className="flex-1 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-12 xl:px-16">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <p className="text-2xl font-bold text-[#111827]">creator<span className="text-[#d1b07c]">.</span>stack</p>
          </div>

          <h1 className="text-2xl font-bold text-[#111827] mb-1">Create your account</h1>
          <p className="text-sm text-[#6b7280] mb-7">Choose your role — it cannot be changed later</p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole('creator')}
              className={`relative p-4 rounded-2xl border-2 text-left transition-all
                ${role === 'creator' ? 'border-[#111827] bg-[#111827] text-white shadow-lg' : 'border-[#e5e7eb] bg-white text-[#374151] hover:border-[#d1d5db] hover:shadow-sm'}`}
            >
              {role === 'creator' && <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-[#d1b07c]" />}
              <Video className={`w-6 h-6 mb-2.5 ${role === 'creator' ? 'text-red-400' : 'text-red-500'}`} />
              <p className="font-bold text-sm">Creator</p>
              <p className={`text-xs mt-0.5 ${role === 'creator' ? 'text-gray-400' : 'text-[#9ca3af]'}`}>YouTuber, Instagrammer, content creator</p>
            </button>
            <button
              type="button"
              onClick={() => setRole('brand')}
              className={`relative p-4 rounded-2xl border-2 text-left transition-all
                ${role === 'brand' ? 'border-[#111827] bg-[#111827] text-white shadow-lg' : 'border-[#e5e7eb] bg-white text-[#374151] hover:border-[#d1d5db] hover:shadow-sm'}`}
            >
              {role === 'brand' && <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-[#d1b07c]" />}
              <Briefcase className={`w-6 h-6 mb-2.5 ${role === 'brand' ? 'text-blue-300' : 'text-blue-500'}`} />
              <p className="font-bold text-sm">Brand</p>
              <p className={`text-xs mt-0.5 ${role === 'brand' ? 'text-gray-400' : 'text-[#9ca3af]'}`}>Company, startup, marketing team</p>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6">
            {error && (
              <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl p-3.5 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
              </div>
            )}

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-[#e5e7eb] rounded-xl bg-white text-sm font-semibold text-[#374151] hover:bg-[#f9fafb] transition-colors disabled:opacity-60 mb-5"
            >
              <GoogleIcon />
              {role ? `Sign up as ${role === 'creator' ? 'Creator' : 'Brand'} with Google` : 'Continue with Google'}
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-[#e5e7eb]" />
              <span className="text-xs text-[#9ca3af] font-medium">or with email</span>
              <div className="flex-1 h-px bg-[#e5e7eb]" />
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email" required
                    className="w-full pl-9 pr-4 py-2.5 border border-[#d1d5db] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all"
                    placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password" required minLength={8}
                    className="w-full pl-9 pr-4 py-2.5 border border-[#d1d5db] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all"
                    placeholder="Min. 8 characters"
                    value={password} onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password" required
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm text-[#111827] focus:outline-none focus:ring-1 transition-all
                      ${confirmPassword && confirmPassword !== password ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-[#d1d5db] focus:border-[#2563eb] focus:ring-[#2563eb]'}`}
                    placeholder="Repeat your password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !role}
                className="w-full bg-[#111827] text-white font-semibold py-3 rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <>{role ? `Create ${role === 'creator' ? 'Creator' : 'Brand'} Account` : 'Select a role above'} <ArrowRight className="w-4 h-4" /></>
                }
              </button>
            </form>
          </div>

          <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3.5 text-xs text-amber-700 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
            <span>Your role (Creator or Brand) is <strong>permanent</strong>. One Gmail = one role. Use a different account to access both sides.</span>
          </div>

          <p className="text-center text-sm text-[#6b7280] mt-5">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#2563eb] hover:text-[#1d4ed8]">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
