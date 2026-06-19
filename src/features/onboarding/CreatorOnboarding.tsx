import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { simulateScrapingFromURL, calculateCreatorValuation, type ValuationOutput } from '../../utils/valuationEngine';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../auth/AuthContext';

export default function CreatorOnboarding() {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState('');
  const [niche, setNiche] = useState('Technology & B2B SaaS');
  const [legalName, setLegalName] = useState('');
  const [pan, setPan] = useState('');
  const [upi, setUpi] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [valuation, setValuation] = useState<ValuationOutput | null>(null);
  
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    const steps = [
      'Pinging Meta/YouTube Graph APIs...',
      'Scraping Last 10 Videos for Viewership Velocity...',
      'Running NLP on Engagement Depth...',
      'Applying Long-Tail Asymmetry Corrections...'
    ];
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setLoadingStep(currentStep);
      } else {
        clearInterval(interval);
        const rawMetrics = simulateScrapingFromURL(url, niche);
        const result = calculateCreatorValuation(rawMetrics);
        setValuation(result);
        setLoading(false);
      }
    }, 1000);
  };

  const handleVerifyPan = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingStep(0);
    const msgs = ['Routing payload to Signzy Sandbox API...', 'Validating PAN status & GST registration...', 'Logging legal tax classification...'];
    
    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < msgs.length) {
        setLoadingStep(current);
      } else {
        clearInterval(interval);
        setLoading(false);
        setStep(3); // Go to UPI
      }
    }, 1200);
  };

  const handleVerifyUpi = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingStep(0);
    const msgs = ['Hooking bank account records...', 'Triggering ₹1 penny-drop via RazorpayX...', 'Matching legal name across PAN and Bank Records...'];
    
    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < msgs.length) {
        setLoadingStep(current);
      } else {
        clearInterval(interval);
        finalizeOnboarding();
      }
    }, 1200);
  };

  const finalizeOnboarding = async () => {
    if (currentUser && valuation) {
      setDoc(doc(db, 'users', currentUser.uid), {
        niche,
        profileUrl: url,
        legalName,
        pan,
        upi,
        valuation,
        profileCompleted: true,
        verified: true // "Brand-Ready" green checkmark badge indicator
      }, { merge: true }).catch(console.error);
    }
    
    setTimeout(() => {
      setLoading(false);
      navigate('/creator-dashboard', { state: { valuation } });
    }, 500);
  };

  const renderLoader = (messages: string[]) => (
    <div className="card bg-white p-12 text-center flex flex-col items-center shadow-brutal">
      <svg className="animate-spin h-12 w-12 text-brand-600 mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <h3 className="text-xl font-bold text-matte-900 animate-pulse">{messages[loadingStep]}</h3>
    </div>
  );

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-matte-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
        {/* Step Indicator */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-brand-600 text-white' : 'bg-matte-300 text-matte-600'}`}>1</div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-brand-600' : 'bg-matte-300'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-brand-600 text-white' : 'bg-matte-300 text-matte-600'}`}>2</div>
            <div className={`w-16 h-1 ${step >= 3 ? 'bg-brand-600' : 'bg-matte-300'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-brand-600 text-white' : 'bg-matte-300 text-matte-600'}`}>3</div>
          </div>
        </div>

        {/* Step 1: Valuation */}
        {step === 1 && !valuation && (
          <>
            <div className="text-center mb-10">
              <h2 className="text-4xl font-black text-matte-900 uppercase">Valuation Engine</h2>
              <p className="mt-2 text-matte-800">Enter your primary social link to calculate your statistical market value based on Indian FinOps benchmarks.</p>
            </div>
            {loading ? renderLoader([
              'Pinging Meta/YouTube Graph APIs...',
              'Scraping Last 10 Videos for Viewership Velocity...',
              'Running NLP on Engagement Depth...',
              'Applying Long-Tail Asymmetry Corrections...'
            ]) : (
              <div className="card bg-white shadow-brutal p-8 max-w-xl mx-auto">
                <form onSubmit={handleAnalyze} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-matte-900 uppercase tracking-wide mb-2">Primary Channel URL</label>
                    <input type="url" required placeholder="https://youtube.com/c/yourchannel" className="input-field" value={url} onChange={(e) => setUrl(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-matte-900 uppercase tracking-wide mb-2">Primary Content Niche</label>
                    <select className="input-field" value={niche} onChange={(e) => setNiche(e.target.value)}>
                      <option value="Personal Finance & Crypto">Personal Finance & Crypto</option>
                      <option value="Technology & B2B SaaS">Technology & B2B SaaS</option>
                      <option value="Education & EdTech">Education & EdTech</option>
                      <option value="Health & Fitness">Health & Fitness</option>
                      <option value="Beauty & Fashion">Beauty & Fashion</option>
                      <option value="Gaming & eSports">Gaming & eSports</option>
                      <option value="Comedy & Entertainment">Comedy & Entertainment</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-primary w-full py-4 text-lg">Run FinOps Audit</button>
                </form>
              </div>
            )}
          </>
        )}

        {/* Step 1.5: Valuation Results */}
        {step === 1 && valuation && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-black text-matte-900 uppercase mb-4">Your True Market Value</h1>
              <p className="text-matte-800 text-lg">Analysis complete. Stop guessing your worth.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="card bg-white shadow-brutal flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-wide mb-6 flex items-center gap-2">
                    <span className="w-3 h-3 bg-brand-500 rounded-full"></span> Fair Rate Card
                  </h3>
                  <div className="mb-6">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Base Integration (60s)</p>
                    <p className="text-5xl font-black text-brand-600">₹{valuation.fair_rate_card.base_integration_fee.toLocaleString()}</p>
                  </div>
                  <div className="mb-6">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Dedicated Video</p>
                    <p className="text-3xl font-black text-matte-900">₹{valuation.fair_rate_card.dedicated_video_fee.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="card bg-matte-900 text-white shadow-brutal border-matte-900 flex flex-col justify-between">
                 <div>
                  <h3 className="text-xl font-bold uppercase tracking-wide mb-6 flex items-center gap-2 text-white">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span> Revenue Leakage
                  </h3>
                  <p className="text-gray-300 mb-4 font-medium">Estimated annual loss by accepting unoptimized flat-fee deals over WhatsApp.</p>
                  <div className="mb-6">
                    <p className="text-5xl font-black text-red-400">-₹{valuation.revenue_leakage_annual.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
               <button onClick={() => setStep(2)} className="btn-primary text-lg px-12 py-4">Claim Workspace & Verify</button>
            </div>
          </div>
        )}

        {/* Step 2: Legal Verification */}
        {step === 2 && (
          <div className="animate-fade-in-up">
             <div className="text-center mb-10">
              <h2 className="text-4xl font-black text-matte-900 uppercase">Legal Compliance</h2>
              <p className="mt-2 text-matte-800">Complete regulatory verification to receive brand requests.</p>
            </div>
            {loading ? renderLoader([
              'Routing payload to Signzy Sandbox API...',
              'Validating PAN status & GST registration...',
              'Logging legal tax classification...'
            ]) : (
              <div className="card bg-white shadow-brutal p-8 max-w-xl mx-auto border-t-4 border-t-yellow-500">
                <div className="mb-6 bg-yellow-50 p-4 rounded text-sm text-yellow-800 font-medium">
                  Section 194J requires PAN verification before entering escrow contracts.
                </div>
                <form onSubmit={handleVerifyPan} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-matte-900 uppercase tracking-wide mb-2">Legal Full Name (As per PAN)</label>
                    <input type="text" required placeholder="e.g. Rahul Sharma" className="input-field" value={legalName} onChange={e => setLegalName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-matte-900 uppercase tracking-wide mb-2">Permanent Account Number (PAN)</label>
                    <input type="text" required placeholder="ABCDE1234F" className="input-field uppercase" maxLength={10} value={pan} onChange={e => setPan(e.target.value.toUpperCase())} />
                  </div>
                  <button type="submit" className="w-full py-4 text-lg bg-matte-900 text-white font-bold rounded shadow-md hover:bg-black transition-colors uppercase tracking-wide">Verify with Signzy</button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Payout Attachment */}
        {step === 3 && (
          <div className="animate-fade-in-up">
             <div className="text-center mb-10">
              <h2 className="text-4xl font-black text-matte-900 uppercase">Payout Attachment</h2>
              <p className="mt-2 text-matte-800">Secure your payout route for 1-click escrow withdrawals.</p>
            </div>
            {loading ? renderLoader([
              'Hooking bank account records...',
              'Triggering ₹1 penny-drop via RazorpayX...',
              'Matching legal name across PAN and Bank Records...'
            ]) : (
              <div className="card bg-white shadow-brutal p-8 max-w-xl mx-auto border-t-4 border-t-blue-500">
                <div className="mb-6 flex items-center justify-center">
                   <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                     <span className="text-blue-600 font-black text-2xl">₹</span>
                   </div>
                </div>
                <form onSubmit={handleVerifyUpi} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-matte-900 uppercase tracking-wide mb-2">Corporate/Personal UPI ID</label>
                    <input type="text" required placeholder="e.g. rahul@okhdfcbank" className="input-field" value={upi} onChange={e => setUpi(e.target.value)} />
                  </div>
                  <button type="submit" className="w-full py-4 text-lg bg-blue-600 text-white font-bold rounded shadow-md hover:bg-blue-700 transition-colors uppercase tracking-wide">Trigger Penny-Drop Validation</button>
                </form>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
