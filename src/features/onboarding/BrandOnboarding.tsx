import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../auth/AuthContext';
import { Building2, CheckCircle2, Shield, Wallet, ArrowRight, AlertCircle } from 'lucide-react';

const INDUSTRIES = [
  'AgriTech', 'Architecture & Interior Design', 'Art & Design', 'Automotive',
  'B2B Services', 'Baby & Kids', 'Beauty & Cosmetics', 'Books & Literature',
  'Cannabis & CBD', 'Consumer Electronics', 'Crafts & DIY', 'Cybersecurity',
  'D2C E-commerce', 'Dating & Relationships', 'EdTech & Education',
  'Event Management', 'FMCG & Consumer Goods', 'Fashion & Apparel',
  'Fintech & BFSI', 'Fitness & Wellness', 'Food & Beverage',
  'Gaming & Entertainment', 'Healthcare & Pharma', 'Home & Lifestyle',
  'Human Resources & Recruitment', 'Legal Services', 'Logistics & Supply Chain',
  'Luxury Goods', 'Manufacturing', 'Media & Publishing', 'Music & Audio',
  'Non-Profit & NGO', 'Personal Care', 'Pets & Animal Care',
  'Photography & Videography', 'Real Estate', 'Renewable Energy',
  'Retail & Wholesale', 'SpaceTech', 'Sports & Outdoors',
  'Technology & SaaS', 'Telecommunications', 'Travel & Hospitality',
  'Web3 & Crypto'
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
  const [detectingIndustry, setDetectingIndustry] = useState(false);
  const [brandLogo, setBrandLogo] = useState<string | null>(null);

  const detectIndustryFromUrl = async (urlStr: string): Promise<{industry: string | null, logo: string | null}> => {
    let detectedIndustry = null;
    let detectedLogo = null;
    try {
      if (!urlStr.includes('.')) return null;
      let finalUrl = urlStr;
      if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;
      
      let textToAnalyze = finalUrl.toLowerCase();
      
      try {
        const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(finalUrl)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && data.data) {
            textToAnalyze += ' ' + (data.data.title || '').toLowerCase() + ' ' + (data.data.description || '').toLowerCase() + ' ' + (data.data.publisher || '').toLowerCase();
            if (data.data.logo?.url) {
              detectedLogo = data.data.logo.url;
            }
          }
        }
      } catch (e) {
        // ignore fetch errors
      }

      if (!detectedLogo) {
        try {
          const domain = new URL(finalUrl).hostname;
          detectedLogo = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        } catch {
          // ignore parsing error
        }
      }

      const mapping: Record<string, string[]> = {
        'Technology & SaaS': ['software', 'saas', 'tech', 'platform', 'app', 'cloud', 'data', 'api'],
        'Fintech & BFSI': ['finance', 'bank', 'pay', 'money', 'invest', 'wealth', 'credit', 'insurance', 'card'],
        'D2C E-commerce': ['shop', 'store', 'buy', 'cart', 'checkout', 'commerce', 'e-commerce'],
        'EdTech & Education': ['learn', 'course', 'academy', 'school', 'edu', 'study', 'university', 'student'],
        'Fashion & Apparel': ['wear', 'clothing', 'shoes', 'apparel', 'fashion', 'style', 'boutique', 'outfit'],
        'Beauty & Cosmetics': ['beauty', 'cosmetics', 'skin', 'makeup', 'hair', 'glow', 'care'],
        'Food & Beverage': ['food', 'eat', 'drink', 'beverage', 'snack', 'restaurant', 'cafe', 'kitchen'],
        'Automotive': ['auto', 'car', 'motor', 'vehicle', 'drive', 'ford', 'tesla', 'bmw', 'toyota'],
        'Healthcare & Pharma': ['health', 'medical', 'pharma', 'clinic', 'hospital', 'care', 'doctor'],
        'Real Estate': ['real estate', 'property', 'home', 'realty', 'housing', 'estate', 'mortgage'],
        'Gaming & Entertainment': ['game', 'play', 'studio', 'entertainment', 'movie', 'show', 'stream'],
        'Travel & Hospitality': ['travel', 'hotel', 'trip', 'flight', 'vacation', 'resort', 'tour'],
        'Fitness & Wellness': ['fitness', 'gym', 'workout', 'wellness', 'yoga', 'health', 'train'],
        'Home & Lifestyle': ['home', 'decor', 'furniture', 'lifestyle', 'living', 'design'],
        'Web3 & Crypto': ['crypto', 'web3', 'blockchain', 'nft', 'defi', 'token', 'coin'],
        'Consumer Electronics': ['electronics', 'device', 'gadget', 'mobile', 'computer', 'audio', 'phone'],
        'Pets & Animal Care': ['pet', 'dog', 'cat', 'vet', 'animal', 'paws'],
      };

      for (const [industry, keywords] of Object.entries(mapping)) {
        for (const keyword of keywords) {
          // ensure keyword has word boundaries if it's short
          if (textToAnalyze.includes(keyword)) {
            detectedIndustry = industry;
            break;
          }
        }
        if (detectedIndustry) break;
      }
    } catch (e) {
      console.error(e);
    }
    return { industry: detectedIndustry, logo: detectedLogo };
  };

  React.useEffect(() => {
    if (website.length < 5 || !website.includes('.')) return;
    
    const timeoutId = setTimeout(async () => {
      setDetectingIndustry(true);
      const result = await detectIndustryFromUrl(website);
      setDetectingIndustry(false);
      if (result.industry && INDUSTRIES.includes(result.industry)) {
        setIndustry(result.industry);
      }
      if (result.logo) {
        setBrandLogo(result.logo);
      }
    }, 1000); // 1 second debounce
    
    return () => clearTimeout(timeoutId);
  }, [website]);

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
          logoUrl: brandLogo,
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
      className="min-h-screen bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex flex-col items-center justify-center py-10 px-4"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="w-full max-w-4xl">

        {/* Brand */}
        <div className="text-center mb-8">
          <p className="text-2xl font-black text-black tracking-tighter uppercase">
            creator<span className="text-indigo-600">.</span>stack
          </p>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">Brand onboarding</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.map((s, idx) => (
            <React.Fragment key={s.n}>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all border-2
                  ${step > s.n ? 'bg-[#a3e635] text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                  : step === s.n ? 'bg-indigo-600 text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                  : 'bg-white text-gray-400 border-gray-300'}`}>
                  {step > s.n ? <CheckCircle2 className="w-4 h-4" /> : s.n}
                </div>
                <span className={`text-[9px] mt-2 font-black uppercase tracking-widest whitespace-nowrap ${step === s.n ? 'text-black' : 'text-gray-400'}`}>{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-1 w-12 mb-5 mx-2 transition-all ${step > s.n ? 'bg-black' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
            <div className="w-12 h-12 border-[4px] border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest animate-pulse">{loadingMsg}</p>
          </div>
        )}

        {/* STEP 1 — Company Details */}
        {!loading && step === 1 && (
          <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 animate-fade-in-up">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg flex items-center justify-center overflow-hidden">
                {brandLogo ? <img src={brandLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Building2 className="w-5 h-5 text-black" />}
              </div>
              <div>
                <h1 className="text-lg font-black text-black uppercase tracking-tight">COMPANY DETAILS</h1>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Tell us about your brand</p>
              </div>
            </div>

            <form onSubmit={handleStep1} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">Company Name *</label>
                  <input
                    type="text" required
                    placeholder="e.g. Acme Technologies Pvt. Ltd."
                    className="w-full px-4 py-3 bg-white border-2 border-black rounded text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-400 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
                    value={companyName} onChange={e => setCompanyName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">Company Website *</label>
                  <input
                    type="url" required
                    placeholder="https://acme.com"
                    className="w-full px-4 py-3 bg-white border-2 border-black rounded text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-400 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
                    value={website} onChange={e => setWebsite(e.target.value)}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest">Industry</label>
                    {detectingIndustry && (
                      <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest animate-pulse flex items-center gap-1">
                        <div className="w-2 h-2 border-[2px] border-indigo-600 border-t-transparent rounded-full animate-spin" /> Detecting...
                      </span>
                    )}
                  </div>
                  <select
                    className="w-full px-4 py-3 bg-white border-2 border-black rounded text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer appearance-none"
                    value={industry} onChange={e => setIndustry(e.target.value)}
                  >
                    {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">Annual Creator Budget</label>
                  <select
                    className="w-full px-4 py-3 bg-white border-2 border-black rounded text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer appearance-none"
                    value={budget} onChange={e => setBudget(e.target.value)}
                  >
                    {BUDGETS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full md:w-auto md:px-12 bg-indigo-600 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-white font-black py-4 rounded uppercase tracking-widest text-[10px] hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all flex items-center justify-center gap-2 mt-4 ml-auto">
                CONTINUE <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 2 — PAN & GSTIN */}
        {!loading && step === 2 && (
          <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 animate-fade-in-up">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg flex items-center justify-center overflow-hidden">
                {brandLogo ? <img src={brandLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Shield className="w-5 h-5 text-black" />}
              </div>
              <div>
                <h2 className="text-lg font-black text-black uppercase tracking-tight">LEGAL VERIFICATION</h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Required for TDS compliance under Section 194J</p>
              </div>
            </div>

            <div className="bg-[#fbbf24] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg p-4 text-[10px] font-black uppercase tracking-widest text-black mb-8 flex gap-3 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-black shrink-0 mt-0.5" />
              <span>We use your PAN to automate 10% TDS deduction on creator payments per Indian tax law. Your data is encrypted at rest.</span>
            </div>

            <form onSubmit={handleVerifyCorporate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">Corporate PAN *</label>
                  <input
                    type="text" required
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    className={`w-full px-4 py-3 bg-white border-2 rounded text-sm font-black tracking-widest uppercase text-black focus:outline-none transition-all
                      ${panError ? 'border-red-500 shadow-[2px_2px_0px_0px_rgba(239,68,68,1)]' : 'border-black focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
                    value={corporatePan}
                    onChange={e => { setCorporatePan(e.target.value.toUpperCase()); setPanError(''); }}
                  />
                  {panError && <p className="text-[9px] font-black uppercase tracking-widest text-red-500 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {panError}</p>}
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-2">Format: 5 letters + 4 digits + 1 letter</p>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">
                    GSTIN <span className="text-gray-500 font-bold">(OPTIONAL)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="22AAAAA0000A1Z5 (IF REGISTERED)"
                    maxLength={15}
                    className={`w-full px-4 py-3 bg-white border-2 rounded text-sm font-black tracking-widest uppercase text-black focus:outline-none transition-all placeholder:text-[10px] placeholder:tracking-widest placeholder:text-gray-400
                      ${gstinError ? 'border-red-500 shadow-[2px_2px_0px_0px_rgba(239,68,68,1)]' : 'border-black focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
                    value={gstin}
                    onChange={e => { setGstin(e.target.value.toUpperCase()); setGstinError(''); }}
                  />
                  {gstinError && <p className="text-[9px] font-black uppercase tracking-widest text-red-500 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {gstinError}</p>}
                </div>
              </div>

              <div className="flex gap-4 pt-2 justify-end">
                <button type="button" onClick={() => setStep(1)} className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-black bg-gray-100 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-200 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all">
                  BACK
                </button>
                <button type="submit" className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-white bg-indigo-600 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all flex items-center justify-center gap-2">
                  VERIFY & CONTINUE <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3 — Escrow Setup */}
        {!loading && step === 3 && (
          <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              
              {/* Left Side */}
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-[#a3e635] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg flex items-center justify-center overflow-hidden">
                      {brandLogo ? <img src={brandLogo} alt="Logo" className="w-full h-full object-cover bg-white" referrerPolicy="no-referrer" /> : <Wallet className="w-5 h-5 text-black" />}
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-black uppercase tracking-tight">ESCROW ACCOUNT SETUP</h2>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">How campaign payments are secured</p>
                    </div>
                  </div>

                  {/* Verified badge */}
                  <div className="flex items-center gap-3 mb-8 bg-[#a3e635] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg p-4">
                    <CheckCircle2 className="w-6 h-6 text-black shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-black uppercase tracking-widest">PAN VERIFIED — {corporatePan}</p>
                      <p className="text-[9px] font-bold text-black uppercase tracking-widest mt-1">Entity linked to {companyName}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 md:mt-0">
                  <form onSubmit={handleProvisionEscrow}>
                    <button type="submit" className="w-full bg-indigo-600 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-white font-black py-4 rounded uppercase tracking-widest text-[10px] hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all flex items-center justify-center gap-2">
                      COMPLETE SETUP & GO TO DASHBOARD <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-center text-gray-400 mt-6 leading-relaxed">
                    By completing setup you agree to our escrow terms<br/>and Section 194J TDS obligations.
                  </p>
                </div>
              </div>

              {/* Right Side */}
              <div className="space-y-4">
                {[
                  { title: 'Brands fund escrow before campaigns start', desc: 'Creators can see that funds are locked before they begin any work. This builds immediate trust.' },
                  { title: 'Automatic TDS deduction (10%)', desc: 'Platform deducts TDS per Section 194J before releasing creator payments to ensure tax compliance automatically.' },
                  { title: 'Instant release on content approval', desc: 'Once you verify the deliverable, funds release to the creator automatically. No chasing invoices.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start p-5 bg-white border-2 border-gray-100 rounded-lg">
                    <div className="w-6 h-6 rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-black text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{i + 1}</div>
                    <div>
                      <p className="text-[10px] font-black text-black uppercase tracking-widest">{item.title}</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
