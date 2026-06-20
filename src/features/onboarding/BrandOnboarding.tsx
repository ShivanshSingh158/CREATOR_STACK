import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../auth/AuthContext';
import {
  Building2,
  CheckCircle2,
  Shield,
  Wallet,
  ArrowRight,
  AlertCircle,
  User,
  Landmark,
  Star,
  Clock,
  Info,
  BadgeCheck,
} from 'lucide-react';

const INDUSTRIES = [
  'AgriTech',
  'Architecture & Interior Design',
  'Art & Design',
  'Automotive',
  'B2B Services',
  'Baby & Kids',
  'Beauty & Cosmetics',
  'Books & Literature',
  'Cannabis & CBD',
  'Consumer Electronics',
  'Crafts & DIY',
  'Cybersecurity',
  'D2C E-commerce',
  'Dating & Relationships',
  'EdTech & Education',
  'Event Management',
  'FMCG & Consumer Goods',
  'Fashion & Apparel',
  'Fintech & BFSI',
  'Fitness & Wellness',
  'Food & Beverage',
  'Gaming & Entertainment',
  'Healthcare & Pharma',
  'Home & Lifestyle',
  'Human Resources & Recruitment',
  'Legal Services',
  'Logistics & Supply Chain',
  'Luxury Goods',
  'Manufacturing',
  'Media & Publishing',
  'Music & Audio',
  'Non-Profit & NGO',
  'Personal Care',
  'Pets & Animal Care',
  'Photography & Videography',
  'Real Estate',
  'Renewable Energy',
  'Retail & Wholesale',
  'SpaceTech',
  'Sports & Outdoors',
  'Technology & SaaS',
  'Telecommunications',
  'Travel & Hospitality',
  'Web3 & Crypto',
];

const BUDGETS = [
  '₹5,000 – ₹50,000',
  '₹50,000 – ₹1 Lakh',
  '₹1 Lakh – ₹5 Lakhs',
  '₹5 Lakhs – ₹10 Lakhs',
  '₹10 Lakhs+',
];

// ── Tier definitions ────────────────────────
const TIERS = [
  {
    id: 'individual',
    label: 'Solo / Individual',
    icon: <User className="w-5 h-5" />,
    color: 'bg-blue-50 border-blue-500',
    badge: '🔵 Individual Verified',
    minDeposit: 5000,
    description: 'Personal brand, Shopify store, or solo promoter. No GST required.',
    features: [
      'Personal PAN (format validated)',
      'Bank account verification',
      '₹5,000 minimum escrow hold',
    ],
    requires: ['Personal PAN'],
  },
  {
    id: 'business',
    label: 'Registered Business',
    icon: <Landmark className="w-5 h-5" />,
    color: 'bg-emerald-50 border-emerald-500',
    badge: '🟢 Business Verified',
    minDeposit: 25000,
    description: 'GST-registered business, LLP, partnership firm, or private limited company.',
    features: [
      'Corporate PAN (format validated)',
      'GSTIN format check',
      '₹25,000 minimum escrow hold',
    ],
    requires: ['Corporate PAN', 'GSTIN'],
  },
  {
    id: 'enterprise',
    label: 'Enterprise / Public Company',
    icon: <Star className="w-5 h-5" />,
    color: 'bg-amber-50 border-amber-500',
    badge: '⭐ Enterprise Verified',
    minDeposit: 100000,
    description: 'Funded startup, public company, or established brand with MCA listing.',
    features: [
      'CIN + Corporate PAN (format validated)',
      'GSTIN format check',
      'LinkedIn company page',
      '₹1,00,000 minimum escrow hold',
    ],
    requires: ['CIN', 'Corporate PAN', 'GSTIN'],
  },
];

// ── PAN regex ────────────────────────────────
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const CIN_RE = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;

export default function BrandOnboarding() {
  const navigate = useNavigate();
  const { currentUser, refreshProfile } = useAuth();

  // Step 1 — Company Details
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('Technology & SaaS');
  const [budget, setBudget] = useState('₹1 Lakh – ₹5 Lakhs');
  const [detectingIndustry, setDetectingIndustry] = useState(false);
  const [brandLogo, setBrandLogo] = useState<string | null>(null);

  // Step 2 — Tier selection
  const [selectedTier, setSelectedTier] = useState<'individual' | 'business' | 'enterprise' | ''>(
    '',
  );

  // Step 3 — KYC Documents
  const [pan, setPan] = useState('');
  const [gstin, setGstin] = useState('');
  const [cin, setCin] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [panError, setPanError] = useState('');
  const [gstinError, setGstinError] = useState('');
  const [cinError, setCinError] = useState('');

  // Step 4 — Wallet setup
  const [depositAmount, setDepositAmount] = useState('');
  const [depositStage, setDepositStage] = useState<'idle' | 'processing' | 'done'>('idle');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  const tier = TIERS.find((t) => t.id === selectedTier);

  // ── Auto-detect industry from URL ────────────
  const detectIndustryFromUrl = async (urlStr: string) => {
    try {
      if (!urlStr.includes('.')) return;
      const finalUrl = urlStr.startsWith('http') ? urlStr : `https://${urlStr}`;
      let textToAnalyze = finalUrl.toLowerCase();
      try {
        const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(finalUrl)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && data.data) {
            textToAnalyze += ' ' + (data.data.title || '') + ' ' + (data.data.description || '');
            if (data.data.logo?.url) setBrandLogo(data.data.logo.url);
          }
        }
      } catch {
        /* ignore */
      }

      if (!brandLogo) {
        const domain = new URL(finalUrl).hostname;
        setBrandLogo(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
      }

      const mapping: Record<string, string[]> = {
        'Technology & SaaS': ['software', 'saas', 'tech', 'platform', 'app', 'cloud'],
        'Fintech & BFSI': ['finance', 'bank', 'pay', 'money', 'invest', 'wealth', 'credit'],
        'D2C E-commerce': ['shop', 'store', 'buy', 'cart', 'commerce'],
        'EdTech & Education': ['learn', 'course', 'academy', 'school', 'edu', 'study'],
        'Fashion & Apparel': ['wear', 'clothing', 'apparel', 'fashion', 'style'],
        'Beauty & Cosmetics': ['beauty', 'cosmetics', 'skin', 'makeup', 'hair'],
        'Food & Beverage': ['food', 'eat', 'drink', 'beverage', 'restaurant'],
        Automotive: ['auto', 'car', 'motor', 'vehicle', 'drive'],
        'Healthcare & Pharma': ['health', 'medical', 'pharma', 'clinic', 'doctor'],
        'Gaming & Entertainment': ['game', 'play', 'entertainment', 'movie', 'stream'],
      };
      for (const [ind, kws] of Object.entries(mapping)) {
        if (kws.some((kw) => textToAnalyze.includes(kw))) {
          setIndustry(ind);
          break;
        }
      }
    } catch {
      /* ignore */
    }
  };

  React.useEffect(() => {
    if (website.length < 5 || !website.includes('.')) return;
    const t = setTimeout(async () => {
      setDetectingIndustry(true);
      await detectIndustryFromUrl(website);
      setDetectingIndustry(false);
    }, 1000);
    return () => clearTimeout(t);
  }, [website]);

  // ── Step handlers ────────────────────────────
  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTier) return;
    setStep(3);
  };

  const handleStep3KYC = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;
    setPanError('');
    setGstinError('');
    setCinError('');

    if (!PAN_RE.test(pan)) {
      setPanError('Format: 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F)');
      hasError = true;
    }
    if (selectedTier !== 'individual' && gstin && !GSTIN_RE.test(gstin)) {
      setGstinError('Invalid GSTIN format (15 characters, e.g. 22AAAAA0000A1Z5)');
      hasError = true;
    }
    if (selectedTier === 'enterprise' && cin && !CIN_RE.test(cin)) {
      setCinError('Invalid CIN format (e.g. L17110MH1973PLC019786)');
      hasError = true;
    }
    if (hasError) return;

    setStep(4);
  };

  // Simulated deposit (slot in Razorpay here)
  const handleDeposit = () => {
    const num = parseInt(depositAmount.replace(/[^0-9]/g, '') || '0');
    if (!tier || num < tier.minDeposit) return;
    setDepositStage('processing');
    setTimeout(() => setDepositStage('done'), 2500);
  };

  const handleComplete = async () => {
    if (!currentUser) return;
    setLoading(true);
    setLoadingMsg('Creating your brand profile…');

    try {
      const depositNum = parseInt(depositAmount.replace(/[^0-9]/g, '') || '0');

      // The profile is NOT auto-verified — it goes to under_review
      // Admin reviews KYC and flips verificationStatus to 'verified'
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          companyName,
          website,
          industry,
          budget,
          corporatePan: pan.toUpperCase(),
          gstin: gstin.toUpperCase(),
          cin: cin.toUpperCase(),
          linkedInUrl,
          logoUrl: brandLogo,
          role: 'brand',
          profileCompleted: true,
          // ✅ No random trust score — starts at 0, built through real activity
          trustScore: 0,
          // ✅ Verification goes to under_review, NOT auto-approved
          verificationTier: selectedTier,
          verificationStatus: 'under_review',
          panVerified: false, // set to true by admin after review
          kycSubmittedAt: new Date().toISOString(),
          escrowWallet: {
            balance: depositNum,
            lockedBalance: 0,
            availableBalance: depositNum,
            currency: 'INR',
            lastDepositAt: depositNum > 0 ? new Date().toISOString() : null,
          },
          createdAt: new Date().toISOString(),
        },
        { merge: true },
      );

      // Write to admin review queue
      await addDoc(collection(db, 'adminReviews'), {
        userId: currentUser.uid,
        userRole: 'brand',
        companyName,
        pan: pan.toUpperCase(),
        gstin: gstin.toUpperCase(),
        cin: cin.toUpperCase(),
        verificationTier: selectedTier,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      });

      // Log wallet deposit transaction if any
      if (depositNum > 0) {
        await addDoc(collection(db, 'walletTransactions'), {
          userId: currentUser.uid,
          type: 'deposit',
          amount: depositNum,
          description: 'Initial escrow wallet deposit (onboarding)',
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error saving brand profile:', err);
    }

    setLoading(false);
    refreshProfile();
    navigate('/brand-dashboard', { replace: true });
  };

  const STEPS = [
    { n: 1, label: 'Company Details' },
    { n: 2, label: 'Verification Tier' },
    { n: 3, label: 'KYC Documents' },
    { n: 4, label: 'Escrow Wallet' },
  ];

  // ── UI Helpers ───────────────────────────────
  const inputCls = (err?: string) =>
    `w-full px-4 py-3 bg-white border-2 rounded text-sm font-bold text-black focus:outline-none transition-all placeholder:text-gray-400 placeholder:font-bold ${err ? 'border-red-500 shadow-[2px_2px_0px_0px_rgba(239,68,68,1)]' : 'border-black focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`;

  return (
    <div
      className="min-h-screen bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex flex-col items-center justify-center py-10 px-4"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="w-full max-w-4xl">
        {/* Brand */}
        <div className="text-center mb-8">
          <p className="text-2xl font-black text-black tracking-tighter uppercase">
            creator<span className="text-indigo-600">.</span>stack
          </p>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">
            Brand Onboarding
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.map((s, idx) => (
            <React.Fragment key={s.n}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all border-2 rounded
                  ${
                    step > s.n
                      ? 'bg-[#a3e635] text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : step === s.n
                        ? 'bg-indigo-600 text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white text-gray-400 border-gray-300'
                  }`}
                >
                  {step > s.n ? <CheckCircle2 className="w-4 h-4" /> : s.n}
                </div>
                <span
                  className={`text-[9px] mt-2 font-black uppercase tracking-widest whitespace-nowrap ${step === s.n ? 'text-black' : 'text-gray-400'}`}
                >
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`h-1 w-10 mb-5 mx-1.5 transition-all ${step > s.n ? 'bg-black' : 'bg-gray-200'}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
            <div className="w-12 h-12 border-[4px] border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest animate-pulse">
              {loadingMsg}
            </p>
          </div>
        )}

        {/* ─── STEP 1: Company Details ─── */}
        {!loading && step === 1 && (
          <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg flex items-center justify-center overflow-hidden">
                {brandLogo ? (
                  <img
                    src={brandLogo}
                    alt="Logo"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Building2 className="w-5 h-5 text-black" />
                )}
              </div>
              <div>
                <h1 className="text-lg font-black text-black uppercase tracking-tight">
                  Company Details
                </h1>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                  Tell us about your brand
                </p>
              </div>
            </div>

            <form onSubmit={handleStep1} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Technologies Pvt. Ltd."
                    className={inputCls()}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">
                    Company Website *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://acme.com"
                    className={inputCls()}
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                  {detectingIndustry && (
                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-1.5 animate-pulse">
                      Detecting industry…
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">
                    Industry
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-white border-2 border-black rounded text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer appearance-none"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  >
                    {INDUSTRIES.map((i) => (
                      <option key={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">
                    Annual Creator Budget
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-white border-2 border-black rounded text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer appearance-none"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  >
                    {BUDGETS.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="ml-auto flex items-center gap-2 bg-indigo-600 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-white font-black py-3.5 px-10 rounded uppercase tracking-widest text-[10px] hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ─── STEP 2: Verification Tier ─── */}
        {!loading && step === 2 && (
          <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-indigo-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg flex items-center justify-center">
                <BadgeCheck className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black uppercase tracking-tight">
                  Choose Verification Tier
                </h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                  Your tier determines your trust badge and minimum escrow commitment
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-3 mb-6 text-[10px] font-bold text-amber-800 uppercase tracking-widest leading-relaxed flex items-start gap-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Your KYC documents will be reviewed by our team within 24–48 hours. Your account will
              be active immediately, but your verification badge appears after review.
            </div>

            <form onSubmit={handleStep2} className="space-y-4">
              {TIERS.map((t) => (
                <label
                  key={t.id}
                  className={`flex items-start gap-5 p-5 rounded-xl border-2 cursor-pointer transition-all ${selectedTier === t.id ? 'border-indigo-600 bg-indigo-50 shadow-[4px_4px_0px_0px_rgba(79,70,229,1)]' : 'border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 hover:-translate-y-0.5'}`}
                >
                  <input
                    type="radio"
                    name="tier"
                    value={t.id}
                    checked={selectedTier === t.id}
                    onChange={() =>
                      setSelectedTier(t.id as 'individual' | 'business' | 'enterprise')
                    }
                    className="mt-1 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-black text-black uppercase tracking-tight">
                        {t.label}
                      </span>
                      <span className="text-[9px] font-black px-2 py-0.5 bg-black text-white rounded-full uppercase tracking-widest">
                        {t.badge}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                      {t.description}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {t.features.map((f) => (
                        <div key={f} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-indigo-600 shrink-0" />
                          <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                            {f}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">
                      Min. Deposit
                    </p>
                    <p className="text-sm font-black text-black">
                      ₹{t.minDeposit.toLocaleString('en-IN')}
                    </p>
                  </div>
                </label>
              ))}

              {!selectedTier && (
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                  Please select a verification tier to continue.
                </p>
              )}

              <div className="flex gap-4 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-8 py-3.5 text-[10px] font-black uppercase tracking-widest text-black bg-gray-100 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-200 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!selectedTier}
                  className="flex items-center gap-2 px-10 py-3.5 text-[10px] font-black uppercase tracking-widest text-white bg-indigo-600 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── STEP 3: KYC Documents ─── */}
        {!loading && step === 3 && tier && (
          <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black uppercase tracking-tight">
                  KYC Documents
                </h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                  {tier.label} tier — required fields for {tier.badge}
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3 mb-6 text-[10px] font-bold text-yellow-800 uppercase tracking-widest leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              We verify your PAN and documents for TDS compliance (Section 194J). Data is encrypted.
              Review by our compliance team takes 24–48 hours.{' '}
              <span className="font-black text-yellow-900">Documents are NOT auto-approved.</span>
            </div>

            <form onSubmit={handleStep3KYC} className="space-y-5">
              {/* PAN — always required */}
              <div>
                <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">
                  {selectedTier === 'individual' ? 'Personal PAN *' : 'Corporate PAN *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className={inputCls(panError)}
                  value={pan}
                  onChange={(e) => {
                    setPan(e.target.value.toUpperCase());
                    setPanError('');
                  }}
                />
                {panError && (
                  <p className="text-[9px] font-black uppercase tracking-widest text-red-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {panError}
                  </p>
                )}
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                  Format: ABCDE1234F (5 letters + 4 digits + 1 letter)
                </p>
              </div>

              {/* GSTIN — Business + Enterprise */}
              {(selectedTier === 'business' || selectedTier === 'enterprise') && (
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">
                    GSTIN {selectedTier === 'business' ? '*' : '(optional)'}
                  </label>
                  <input
                    type="text"
                    required={selectedTier === 'business'}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                    className={inputCls(gstinError)}
                    value={gstin}
                    onChange={(e) => {
                      setGstin(e.target.value.toUpperCase());
                      setGstinError('');
                    }}
                  />
                  {gstinError && (
                    <p className="text-[9px] font-black uppercase tracking-widest text-red-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {gstinError}
                    </p>
                  )}
                </div>
              )}

              {/* CIN — Enterprise only */}
              {selectedTier === 'enterprise' && (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">
                      Corporate Identification Number (CIN) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="L17110MH1973PLC019786"
                      maxLength={21}
                      className={inputCls(cinError)}
                      value={cin}
                      onChange={(e) => {
                        setCin(e.target.value.toUpperCase());
                        setCinError('');
                      }}
                    />
                    {cinError && (
                      <p className="text-[9px] font-black uppercase tracking-widest text-red-500 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {cinError}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">
                      LinkedIn Company Page URL *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="https://linkedin.com/company/acme"
                      className={inputCls()}
                      value={linkedInUrl}
                      onChange={(e) => setLinkedInUrl(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Under review notice */}
              <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-3 text-[10px] font-bold text-blue-800 uppercase tracking-widest leading-relaxed flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                After submission, your documents enter our review queue. You can start creating
                campaigns immediately, but your verification badge will appear within 24–48 hours.
              </div>

              <div className="flex gap-4 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-8 py-3.5 text-[10px] font-black uppercase tracking-widest text-black bg-gray-100 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-200 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-10 py-3.5 text-[10px] font-black uppercase tracking-widest text-white bg-indigo-600 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                >
                  Submit Documents <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── STEP 4: Escrow Wallet Setup ─── */}
        {!loading && step === 4 && tier && (
          <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-[#a3e635] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg flex items-center justify-center">
                {brandLogo ? (
                  <img
                    src={brandLogo}
                    alt="Logo"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Wallet className="w-5 h-5 text-black" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-black text-black uppercase tracking-tight">
                  Escrow Wallet Setup
                </h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                  Required: minimum ₹{tier.minDeposit.toLocaleString('en-IN')} for {tier.label} tier
                </p>
              </div>
            </div>

            {/* KYC submitted notice */}
            <div className="flex items-center gap-3 mb-6 bg-[#a3e635] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg p-4">
              <CheckCircle2 className="w-5 h-5 text-black shrink-0" />
              <div>
                <p className="text-[10px] font-black text-black uppercase tracking-widest">
                  KYC Submitted — Under Review
                </p>
                <p className="text-[9px] font-bold text-black/70 uppercase tracking-widest mt-0.5">
                  PAN: {pan} • Documents sent to compliance team
                </p>
              </div>
            </div>

            {depositStage === 'idle' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">
                    Deposit Amount (INR)
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[
                      tier.minDeposit,
                      tier.minDeposit * 2,
                      tier.minDeposit * 4,
                      tier.minDeposit * 10,
                    ].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setDepositAmount(String(p))}
                        className={`py-2 text-[9px] font-black uppercase tracking-widest border-2 border-black rounded-lg transition-all hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${depositAmount === String(p) ? 'bg-indigo-600 text-white' : 'bg-white text-black hover:bg-gray-50'}`}
                      >
                        ₹{p >= 100000 ? `${p / 100000}L` : p >= 1000 ? `${p / 1000}K` : p}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={tier.minDeposit}
                      placeholder={String(tier.minDeposit)}
                      className="w-full pl-9 pr-4 py-3.5 border-2 border-black rounded-lg text-lg font-black text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                  </div>
                  {depositAmount && parseInt(depositAmount) < tier.minDeposit && (
                    <p className="text-[10px] font-black text-red-500 mt-1.5 uppercase tracking-widest flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Minimum deposit is ₹
                      {tier.minDeposit.toLocaleString('en-IN')} for {tier.label} tier
                    </p>
                  )}
                </div>

                <div className="bg-indigo-50 border-2 border-indigo-400 rounded-lg p-4 text-[10px] font-bold text-indigo-800 uppercase tracking-widest leading-relaxed">
                  <Info className="w-3.5 h-3.5 inline mr-1.5 mb-0.5" />
                  These funds are held in escrow and can only be used for campaign payments. Unused
                  funds are fully refundable anytime. You must fund escrow before initiating any
                  deal room with a creator.
                </div>

                <div className="flex gap-4 justify-between items-center">
                  <button
                    type="button"
                    onClick={handleComplete}
                    className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-black transition-colors underline underline-offset-2"
                  >
                    Skip for now (deposit later)
                  </button>
                  <button
                    type="button"
                    disabled={!depositAmount || parseInt(depositAmount) < tier.minDeposit}
                    onClick={handleDeposit}
                    className="flex items-center gap-2 px-10 py-3.5 text-[10px] font-black uppercase tracking-widest text-white bg-indigo-600 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Deposit & Complete Setup <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {depositStage === 'processing' && (
              <div className="text-center py-10">
                <div className="w-14 h-14 border-[4px] border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest animate-pulse">
                  Processing Deposit…
                </p>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-2">
                  Securing funds in your escrow wallet
                </p>
              </div>
            )}

            {depositStage === 'done' && (
              <div className="space-y-5">
                <div className="bg-[#a3e635] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg p-5 flex items-center gap-4">
                  <CheckCircle2 className="w-8 h-8 text-black shrink-0" />
                  <div>
                    <p className="text-sm font-black text-black uppercase tracking-tight">
                      ₹{parseInt(depositAmount).toLocaleString('en-IN')} Deposited Successfully
                    </p>
                    <p className="text-[10px] font-bold text-black/70 uppercase tracking-widest mt-1">
                      Your escrow wallet is funded and ready
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: 'Total Balance',
                      value: `₹${parseInt(depositAmount).toLocaleString('en-IN')}`,
                    },
                    { label: 'Locked in Deals', value: '₹0' },
                    {
                      label: 'Available',
                      value: `₹${parseInt(depositAmount).toLocaleString('en-IN')}`,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-white border-2 border-black rounded-lg p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center"
                    >
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">
                        {item.label}
                      </p>
                      <p className="text-base font-black text-black">{item.value}</p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleComplete}
                  className="w-full flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest text-white bg-indigo-600 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
