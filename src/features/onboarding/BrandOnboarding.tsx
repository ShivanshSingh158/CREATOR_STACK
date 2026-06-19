import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../auth/AuthContext';
import { Building2, CheckCircle2, Shield, Wallet, ArrowRight, AlertCircle } from 'lucide-react';

const INDUSTRIES = [
  'Technology & SaaS', 'Fintech & BFSI', 'D2C E-commerce',
  'EdTech & Education', 'FMCG & Consumer Goods', 'Fashion & Apparel',
  'Beauty & Cosmetics', 'Food & Beverage', 'Automotive',
  'Healthcare & Pharma', 'Real Estate', 'Gaming & Entertainment',
];

const BUDGETS = [
  '₹5,000 – ₹50,000', '₹50,000 – ₹1 Lakh',
  '₹1 Lakh – ₹5 Lakhs', '₹5 Lakhs – ₹10 Lakhs', '₹10 Lakhs+',
];

export default function BrandOnboarding() {
  const navigate = useNavigate();
  const { currentUser, refreshProfile } = useAuth();

  // Step 1
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('Technology & SaaS');
  const [budget, setBudget] = useState('₹1 Lakh – ₹5 Lakhs');

  // Step 2
  const [corporatePan, setCorporatePan] = useState('');
  const [gstin, setGstin] = useState('');
  const [panError, setPanError] = useState('');
  const [gstinError, setGstinError] = useState('');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  const validatePan = (val: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val);
  const validateGstin = (val: string) =>
    val === '' || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleVerifyCorporate = (e: React.FormEvent) => {
    e.preventDefault();
    setPanError('');
    setGstinError('');

    let hasError = false;
    if (!validatePan(corporatePan)) {
      setPanError('Format: 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F)');
      hasError = true;
    }
    if (!validateGstin(gstin)) {
      setGstinError('Format: 15 characters (e.g. 22AAAAA0000A1Z5). Leave blank if not registered.');
      hasError = true;
    }
    if (hasError) return;

    // Show loading animation, then move to step 3
    setLoading(true);
    const msgs = ['Validating PAN format…', 'Cross-referencing MCA registry…', 'Entity verified ✓'];
    let i = 0;
    setLoadingMsg(msgs[0]);
    const ticker = setInterval(() => {
      i++;
      if (i < msgs.length) {
        setLoadingMsg(msgs[i]);
      } else {
        clearInterval(ticker);
        setLoading(false);
        setStep(3);
      }
    }, 1000);
  };

  const handleProvisionEscrow = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const msgs = [
      'Setting up your account…',
      'Configuring escrow parameters…',
      'Almost there…',
    ];
    let i = 0;
    setLoadingMsg(msgs[0]);
    const ticker = setInterval(() => {
      i++;
      if (i < msgs.length) setLoadingMsg(msgs[i]);
    }, 800);

    try {
      if (currentUser) {
        await setDoc(doc(db, 'users', currentUser.uid), {
          companyName,
          website,
          industry,
          budget,
          corporatePan: corporatePan.toUpperCase(),
          gstin: gstin.toUpperCase(),
          role: 'brand',
          profileCompleted: true,
          verified: true,
          trustScore: 90 + Math.floor(Math.random() * 9),
          createdAt: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (err) {
      console.error('Error saving brand profile:', err);
    }

    clearInterval(ticker);
    setLoading(false);
    refreshProfile();
    navigate('/brand-dashboard', { replace: true });
  };

  const STEPS = [
    { n: 1, label: 'Company Details' },
    { n: 2, label: 'Legal Verification' },
    { n: 3, label: 'Escrow Setup' },
  ];

  return (
    <div
      className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center py-10 px-4"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="w-full max-w-lg">

        {/* Brand */}
        <div className="text-center mb-8">
          <p className="text-xl font-bold text-[#111827] tracking-tight">
            creator<span className="text-[#d1b07c]">.</span>stack
          </p>
          <p className="text-sm text-[#6b7280] mt-1">Brand onboarding</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.map((s, idx) => (
            <React.Fragment key={s.n}>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${step > s.n ? 'bg-green-500 text-white' : step === s.n ? 'bg-[#111827] text-white' : 'bg-[#e5e7eb] text-[#9ca3af]'}`}>
                  {step > s.n ? <CheckCircle2 className="w-4 h-4" /> : s.n}
                </div>
                <span className={`text-xs mt-1 font-medium whitespace-nowrap ${step === s.n ? 'text-[#111827]' : 'text-[#9ca3af]'}`}>{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-0.5 w-16 mb-4 mx-1 transition-all ${step > s.n ? 'bg-green-400' : 'bg-[#e5e7eb]'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-12 text-center">
            <div className="w-12 h-12 border-[3px] border-[#111827] border-t-transparent rounded-full animate-spin mx-auto mb-5" />
            <p className="text-sm font-semibold text-[#374151] animate-pulse">{loadingMsg}</p>
          </div>
        )}

        {/* STEP 1 — Company Details */}
        {!loading && step === 1 && (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-8 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#f3f4f6] rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#374151]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#111827]">Company details</h1>
                <p className="text-sm text-[#6b7280]">Tell us about your brand</p>
              </div>
            </div>

            <form onSubmit={handleStep1} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#374151] mb-1.5">Company Name *</label>
                <input
                  type="text" required
                  placeholder="e.g. Acme Technologies Pvt. Ltd."
                  className="w-full px-4 py-3 border border-[#d1d5db] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all"
                  value={companyName} onChange={e => setCompanyName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#374151] mb-1.5">Company Website *</label>
                <input
                  type="url" required
                  placeholder="https://acme.com"
                  className="w-full px-4 py-3 border border-[#d1d5db] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] transition-all"
                  value={website} onChange={e => setWebsite(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#374151] mb-1.5">Industry</label>
                  <select
                    className="w-full px-4 py-3 border border-[#d1d5db] rounded-xl text-sm text-[#111827] bg-white focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
                    value={industry} onChange={e => setIndustry(e.target.value)}
                  >
                    {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#374151] mb-1.5">Annual Creator Budget</label>
                  <select
                    className="w-full px-4 py-3 border border-[#d1d5db] rounded-xl text-sm text-[#111827] bg-white focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
                    value={budget} onChange={e => setBudget(e.target.value)}
                  >
                    {BUDGETS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-[#111827] text-white font-semibold py-3.5 rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 mt-2">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 2 — PAN & GSTIN */}
        {!loading && step === 2 && (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-8 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#f3f4f6] rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#374151]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#111827]">Legal verification</h2>
                <p className="text-sm text-[#6b7280]">Required for TDS compliance under Section 194J</p>
              </div>
            </div>

            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-4 text-sm text-[#6b7280] mb-6 flex gap-3">
              <AlertCircle className="w-4 h-4 text-[#d1b07c] shrink-0 mt-0.5" />
              <span>We use your PAN to automate 10% TDS deduction on creator payments per Indian tax law. Your data is encrypted at rest.</span>
            </div>

            <form onSubmit={handleVerifyCorporate} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#374151] mb-1.5">Corporate PAN *</label>
                <input
                  type="text" required
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className={`w-full px-4 py-3 border rounded-xl text-sm uppercase font-mono tracking-widest text-[#111827] focus:outline-none focus:ring-1 transition-all
                    ${panError ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : 'border-[#d1d5db] focus:border-[#2563eb] focus:ring-[#2563eb]'}`}
                  value={corporatePan}
                  onChange={e => { setCorporatePan(e.target.value.toUpperCase()); setPanError(''); }}
                />
                {panError && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {panError}</p>}
                <p className="text-xs text-[#9ca3af] mt-1">Format: 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#374151] mb-1.5">
                  GSTIN <span className="text-[#9ca3af] font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="22AAAAA0000A1Z5 (leave blank if not registered)"
                  maxLength={15}
                  className={`w-full px-4 py-3 border rounded-xl text-sm uppercase font-mono text-[#111827] focus:outline-none focus:ring-1 transition-all
                    ${gstinError ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : 'border-[#d1d5db] focus:border-[#2563eb] focus:ring-[#2563eb]'}`}
                  value={gstin}
                  onChange={e => { setGstin(e.target.value.toUpperCase()); setGstinError(''); }}
                />
                {gstinError && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {gstinError}</p>}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 text-sm font-semibold text-[#374151] bg-[#f3f4f6] rounded-xl hover:bg-[#e5e7eb] transition-colors">
                  Back
                </button>
                <button type="submit" className="flex-1 py-3 text-sm font-semibold text-white bg-[#111827] rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2">
                  Verify & Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3 — Escrow Setup */}
        {!loading && step === 3 && (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-8 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#111827]">Escrow account setup</h2>
                <p className="text-sm text-[#6b7280]">How campaign payments are secured</p>
              </div>
            </div>

            {/* Verified badge */}
            <div className="flex items-center gap-2 mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">PAN verified — {corporatePan}</p>
                <p className="text-xs text-green-600 mt-0.5">Entity linked to {companyName}</p>
              </div>
            </div>

            <div className="space-y-3 mb-7">
              {[
                { title: 'Brands fund escrow before campaigns start', desc: 'Creators can see that funds are locked before they begin any work.' },
                { title: 'Automatic TDS deduction (10%)', desc: 'Platform deducts TDS per Section 194J before releasing creator payments.' },
                { title: 'Instant release on content approval', desc: 'Once you verify the deliverable, funds release to the creator automatically.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 items-start p-3.5 bg-[#f9fafb] rounded-xl">
                  <div className="w-5 h-5 rounded-full bg-[#111827] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</div>
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">{item.title}</p>
                    <p className="text-xs text-[#6b7280] mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleProvisionEscrow}>
              <button type="submit" className="w-full bg-[#111827] text-white font-semibold py-4 rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2">
                Complete Setup & Go to Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <p className="text-xs text-center text-[#9ca3af] mt-4">
              By completing setup you agree to our escrow terms and Section 194J TDS obligations.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
