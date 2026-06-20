import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../lib/firebase';
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
    <div className="min-h-[calc(100vh-64px)] bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center py-8 px-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      <div className="w-full max-w-5xl bg-white border-2 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col lg:flex-row relative">
        
        {/* Decorative tape */}
        <div className="hidden lg:block absolute -top-4 -right-4 bg-[#fde047] border-2 border-black text-sm font-black px-4 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-3 z-10">
          NEW
        </div>

        {/* LEFT SIDE: Branding & Role Selection */}
        <div className="w-full lg:w-5/12 bg-[#a7f3d0] p-8 lg:p-10 border-b-2 lg:border-b-0 lg:border-r-2 border-black flex flex-col">
          <div className="mb-8">
            <Link to="/" className="inline-block border-2 border-black px-3 py-1 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              <span className="text-xl font-black text-[#111827] tracking-tight">creator<span className="text-[#8b5cf6]">.</span>stack</span>
            </Link>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-black text-[#111827] uppercase tracking-tight leading-none mb-4">Create<br/>Account</h1>
          <p className="text-sm font-bold text-[#111827] mb-8">Choose your role. It cannot be changed later.</p>
          
          {/* Role selector */}
          <div className="flex flex-col gap-4 mt-auto">
            <button
              type="button"
              onClick={() => setRole('creator')}
              className={`relative p-5 border-2 border-black text-left transition-all
                ${role === 'creator' ? 'bg-[#111827] text-white shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] translate-y-1' : 'bg-white text-[#111827] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'}`}
            >
              {role === 'creator' && <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-[#a7f3d0]" />}
              <div className="flex items-center gap-3 mb-1">
                <Video className={`w-6 h-6 ${role === 'creator' ? 'text-red-400' : 'text-red-500'}`} />
                <p className="font-black text-lg uppercase">Creator</p>
              </div>
              <p className={`text-xs font-bold ${role === 'creator' ? 'text-gray-300' : 'text-gray-600'}`}>YouTuber, Instagrammer, etc.</p>
            </button>
            
            <button
              type="button"
              onClick={() => setRole('brand')}
              className={`relative p-5 border-2 border-black text-left transition-all
                ${role === 'brand' ? 'bg-[#111827] text-white shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] translate-y-1' : 'bg-white text-[#111827] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'}`}
            >
              {role === 'brand' && <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-[#a7f3d0]" />}
              <div className="flex items-center gap-3 mb-1">
                <Briefcase className={`w-6 h-6 ${role === 'brand' ? 'text-blue-300' : 'text-blue-500'}`} />
                <p className="font-black text-lg uppercase">Brand</p>
              </div>
              <p className={`text-xs font-bold ${role === 'brand' ? 'text-gray-300' : 'text-gray-600'}`}>Company, startup, marketing</p>
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: The Form */}
        <div className="w-full lg:w-7/12 p-8 lg:p-12 bg-white flex flex-col justify-center">
          
          {error && (
            <div className="mb-6 flex items-start gap-2.5 bg-red-50 border-2 border-red-500 p-4 text-sm font-bold text-red-700 shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-black bg-white text-sm font-black text-[#111827] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-60 mb-6"
          >
            <GoogleIcon />
            {role ? `SIGN UP AS ${role === 'creator' ? 'CREATOR' : 'BRAND'}` : 'CONTINUE WITH GOOGLE'}
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-0.5 bg-black" />
            <span className="text-xs text-black font-black uppercase tracking-wider">or email</span>
            <div className="flex-1 h-0.5 bg-black" />
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-sm font-black text-[#111827] uppercase tracking-wide mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-black absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email" required
                  className="w-full pl-10 pr-4 py-3 border-2 border-black bg-[#f9fafb] text-sm font-medium text-[#111827] focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-black text-[#111827] uppercase tracking-wide mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-black absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password" required minLength={8}
                    className="w-full pl-10 pr-4 py-3 border-2 border-black bg-[#f9fafb] text-sm font-medium text-[#111827] focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    placeholder="Min. 8 chars"
                    value={password} onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-[#111827] uppercase tracking-wide mb-1.5">Confirm</label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-black absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password" required
                    className={`w-full pl-10 pr-4 py-3 border-2 border-black text-sm font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all
                      ${confirmPassword && confirmPassword !== password ? 'bg-red-50 text-red-900 focus:bg-red-50' : 'bg-[#f9fafb] text-[#111827] focus:bg-white'}`}
                    placeholder="Repeat password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p className="text-xs font-bold text-red-500 mt-1">Passwords don't match</p>
            )}

            <button
              type="submit"
              disabled={loading || !role}
              className="w-full bg-[#8b5cf6] border-2 border-black text-black font-black uppercase tracking-wider py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                : <>{role ? `CREATE ACCOUNT` : 'SELECT A ROLE FIRST'} <ArrowRight className="w-5 h-5" /></>
              }
            </button>
          </form>
          
          <div className="mt-8 flex items-center justify-between">
            <div className="bg-[#fef3c7] border-2 border-black px-3 py-2 text-[10px] sm:text-xs font-bold text-black flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <AlertCircle className="w-4 h-4 text-[#d97706]" />
              <span>One Gmail = one role.</span>
            </div>

            <p className="text-sm font-bold text-[#6b7280]">
              <Link to="/login" className="text-[#8b5cf6] hover:underline underline-offset-2">Sign in instead</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
