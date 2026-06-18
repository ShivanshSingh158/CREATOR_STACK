import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { simulateScrapingFromURL, calculateCreatorValuation, type ValuationOutput } from '../utils/valuationEngine';

export default function CreatorOnboarding() {
  const [url, setUrl] = useState('');
  const [niche, setNiche] = useState('Technology');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [valuation, setValuation] = useState<ValuationOutput | null>(null);
  
  const navigate = useNavigate();

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    
    // Simulate complex scraping process steps
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
        
        // Run Algorithm
        const rawMetrics = simulateScrapingFromURL(url, niche);
        const result = calculateCreatorValuation(rawMetrics);
        
        setValuation(result);
        setLoading(false);
      }
    }, 1000);
  };

  const handleSaveAndContinue = () => {
    // In a real app, save valuation to Firestore user profile here
    navigate('/creator-dashboard', { state: { valuation } });
  };

  const loadingMessages = [
    'Pinging Meta/YouTube Graph APIs...',
    'Scraping Last 10 Videos for Viewership Velocity...',
    'Running NLP on Engagement Depth...',
    'Applying Long-Tail Asymmetry Corrections...'
  ];

  if (valuation) {
    return (
      <div className="min-h-[80vh] bg-matte-200 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-matte-900 uppercase mb-4">Your True Market Value</h1>
            <p className="text-matte-800 text-lg">Analysis complete. Stop guessing your worth.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Fair Rate Card */}
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

            {/* Revenue Leakage */}
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

          <div className="card bg-brand-50 border-brand-200 shadow-brutal-sm mb-12">
            <h3 className="text-lg font-bold uppercase mb-2">Algorithmic Justification</h3>
            <p className="text-brand-900 font-medium leading-relaxed">{valuation.data_justification}</p>
          </div>

          <div className="flex justify-center">
             <button onClick={handleSaveAndContinue} className="btn-primary text-lg px-12 py-4">
                Lock in Rates & Go to Dashboard
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-matte-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-matte-900 uppercase">Valuation Engine</h2>
          <p className="mt-2 text-matte-800">Enter your primary social link to calculate your statistical market value based on Indian FinOps benchmarks.</p>
        </div>

        {loading ? (
          <div className="card bg-white p-12 text-center flex flex-col items-center">
            <svg className="animate-spin h-12 w-12 text-brand-600 mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h3 className="text-xl font-bold text-matte-900 animate-pulse">{loadingMessages[loadingStep]}</h3>
          </div>
        ) : (
          <div className="card bg-white shadow-brutal p-8">
            <form onSubmit={handleAnalyze} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-matte-900 uppercase tracking-wide mb-2">Primary Channel URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://youtube.com/c/yourchannel"
                  className="input-field"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-matte-900 uppercase tracking-wide mb-2">Primary Content Niche</label>
                <select 
                  className="input-field"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                >
                  <option value="Personal Finance">Personal Finance & Crypto</option>
                  <option value="Tech">Technology & B2B SaaS</option>
                  <option value="Fashion">Beauty & Fashion</option>
                  <option value="Gaming">Gaming & eSports</option>
                  <option value="Comedy">Comedy & Entertainment</option>
                  <option value="Travel">Travel & Lifestyle</option>
                </select>
              </div>

              <button type="submit" className="btn-primary w-full py-4 text-lg">
                Run FinOps Audit
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
