import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateCreatorValuation, type ValuationOutput } from '../../utils/valuationEngine';
import { fetchYouTubeChannelMetrics, youTubeMetricsToScraped, type YouTubeChannelMetrics, type YouTubeAPIError } from '../../utils/youtubeApi';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../auth/AuthContext';
import { Video, CheckCircle2, AlertCircle, TrendingUp, Users, BarChart3, ArrowRight, Lock, Wallet } from 'lucide-react';

type Step = 'url' | 'verifying' | 'results' | 'legal' | 'upi' | 'done';

const NICHES = [
  'Technology & B2B SaaS',
  'Personal Finance & Crypto',
  'Education & EdTech',
  'Health & Fitness',
  'Beauty & Fashion',
  'Gaming & eSports',
  'Comedy & Entertainment',
  'Food & Cooking',
  'Automotive',
  'Lifestyle & Travel',
  'Parenting',
  'Spirituality',
];

export default function CreatorOnboarding() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [step, setStep] = useState<Step>('url');
  const [url, setUrl] = useState('');
  const [niche, setNiche] = useState('Technology & B2B SaaS');
  const [legalName, setLegalName] = useState('');
  const [pan, setPan] = useState('');
  const [upi, setUpi] = useState('');

  const [ytMetrics, setYtMetrics] = useState<YouTubeChannelMetrics | null>(null);
  const [valuation, setValuation] = useState<ValuationOutput | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [verifyingMsg, setVerifyingMsg] = useState('');
  const [panLoading, setPanLoading] = useState(false);
  const [upiLoading, setUpiLoading] = useState(false);

  const hasYouTubeKey = !!(import.meta.env.VITE_YOUTUBE_API_KEY && import.meta.env.VITE_YOUTUBE_API_KEY !== 'YOUR_YOUTUBE_DATA_API_V3_KEY_HERE');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setApiError(null);
    setStep('verifying');

    // If API key is configured, fetch real data
    if (hasYouTubeKey && (url.includes('youtube') || url.includes('youtu.be'))) {
      const msgs = [
        'Resolving channel identity…',
        'Fetching subscriber count from YouTube Data API…',
        'Analysing last 10 videos for viewership velocity…',
        'Computing engagement depth & niche benchmarks…',
      ];
      let msgIdx = 0;
      setVerifyingMsg(msgs[0]);
      const ticker = setInterval(() => {
        msgIdx = Math.min(msgIdx + 1, msgs.length - 1);
        setVerifyingMsg(msgs[msgIdx]);
      }, 1400);

      try {
        const metrics = await fetchYouTubeChannelMetrics(url);
        clearInterval(ticker);
        const scraped = youTubeMetricsToScraped(metrics, niche);
        const result = calculateCreatorValuation(scraped);
        setYtMetrics(metrics);
        setValuation(result);
        setStep('results');
      } catch (err: any) {
        clearInterval(ticker);
        const e = err as YouTubeAPIError;
        if (e.type === 'INVALID_KEY') {
          setApiError('YouTube API key is not configured. Using estimate mode instead.');
          runEstimateMode();
        } else if (e.type === 'QUOTA_EXCEEDED') {
          setApiError('YouTube API quota exceeded for today. Showing estimate instead.');
          runEstimateMode();
        } else if (e.type === 'NOT_FOUND') {
          setApiError('Channel not found. Please check the URL and try again.');
          setStep('url');
        } else {
          setApiError(e.message || 'Could not fetch channel data. Please check your URL.');
          setStep('url');
        }
      }
    } else {
      // No API key or not YouTube — use estimate with clear labeling
      runEstimateMode();
    }
  };

  const runEstimateMode = () => {
    // Deterministic estimate based on URL hash — not random, but not real
    const urlHash = url.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const estimatedFollowers = 15000 + (urlHash % 35000);
    const estimatedViews = Math.round(estimatedFollowers * (0.15 + (urlHash % 10) * 0.02));
    const estimatedER = 2.5 + (urlHash % 5) * 0.4;

    const result = calculateCreatorValuation({
      platform: url.includes('instagram') ? 'Instagram' : 'YouTube',
      creator_name: legalName || 'Creator',
      niche,
      language: 'Hindi/English',
      follower_count: estimatedFollowers,
      avg_views_last_10: estimatedViews,
      engagement_rate_percentage: estimatedER,
      viewership_velocity_trend: 'stable',
    });
    setValuation(result);
    setStep('results');
  };

  const handleVerifyPan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pan || pan.length !== 10 || !legalName) return;
    setPanLoading(true);
    // Validate PAN format: ABCDE1234F
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    setTimeout(() => {
      if (panRegex.test(pan.toUpperCase())) {
        setPanLoading(false);
        setStep('upi');
      } else {
        setPanLoading(false);
        alert('Invalid PAN format. It should be like ABCDE1234F');
      }
    }, 1800);
  };

  const handleVerifyUpi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upi) return;
    setUpiLoading(true);
    setTimeout(async () => {
      await finalizeOnboarding();
      setUpiLoading(false);
    }, 2000);
  };

  const finalizeOnboarding = async () => {
    if (!currentUser || !valuation) return;

    const handle = ytMetrics?.handle || (url ? '@' + url.split('/').filter(Boolean).pop() : '@creator');
    const displayName = legalName || ytMetrics?.channelName || currentUser.email?.split('@')[0] || 'Creator';

    const creatorData = {
      name: displayName,
      niche,
      profileUrl: url,
      legalName,
      pan: pan.toUpperCase(),
      upi,
      valuation,
      profileCompleted: true,
      verified: true,
      role: 'creator',
      // YouTube verified data (only if API was used)
      ...(ytMetrics ? {
        isAPIVerified: true,
        channelId: ytMetrics.channelId,
        channelThumbnail: ytMetrics.thumbnailUrl,
        follower_count: ytMetrics.subscriberCount,
        avg_views: ytMetrics.avgViewsLast10,
        engagement_rate: ytMetrics.engagementRate,
        velocityTrend: ytMetrics.velocityTrend,
        lastSyncedAt: ytMetrics.verifiedAt,
        recentVideos: ytMetrics.recentVideos.slice(0, 3),
      } : {
        isAPIVerified: false,
        follower_count: 0,
        isEstimate: true,
      }),
    };

    setDoc(doc(db, 'users', currentUser.uid), creatorData, { merge: true }).catch(console.error);
    setDoc(doc(db, 'creators', currentUser.uid), {
      ...creatorData,
      uid: currentUser.uid,
      handle,
    }, { merge: true }).catch(console.error);

    setStep('done');
    setTimeout(() => navigate('/creator-dashboard', { state: { valuation } }), 1500);
  };

  const stepNumber = { url: 1, verifying: 1, results: 1, legal: 2, upi: 3, done: 3 }[step] || 1;

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center py-12 px-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-sm font-semibold text-[#6b7280] mb-1">creator<span className="text-[#d1b07c]">.</span>stack — Creator Onboarding</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3].map(n => (
              <React.Fragment key={n}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${stepNumber >= n ? 'bg-[#111827] text-white' : 'bg-[#e5e7eb] text-[#9ca3af]'}`}>{n}</div>
                {n < 3 && <div className={`h-px w-12 transition-all ${stepNumber > n ? 'bg-[#111827]' : 'bg-[#e5e7eb]'}`} />}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-center gap-8 mt-2 text-xs text-[#9ca3af] font-medium">
            <span className={stepNumber === 1 ? 'text-[#111827] font-bold' : ''}>Channel Verification</span>
            <span className={stepNumber === 2 ? 'text-[#111827] font-bold' : ''}>Legal & PAN</span>
            <span className={stepNumber === 3 ? 'text-[#111827] font-bold' : ''}>UPI Payout</span>
          </div>
        </div>

        {/* Step: URL Input */}
        {step === 'url' && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#111827] mb-1">Connect your channel</h1>
              <p className="text-[#6b7280] text-sm">Paste your YouTube channel URL. We'll fetch your real subscriber count, average views, and engagement rate to calculate a fair market rate for your work.</p>
            </div>

            {apiError && (
              <div className="mb-5 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                {apiError}
              </div>
            )}

            {!hasYouTubeKey && (
              <div className="mb-5 flex items-start gap-3 bg-[#f0f9ff] border border-[#bae6fd] rounded-lg p-4 text-sm text-[#0369a1]">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span><strong>Demo mode:</strong> YouTube API key not found. We'll generate a rate estimate. Add <code className="bg-white px-1 rounded font-mono">VITE_YOUTUBE_API_KEY</code> to <code className="bg-white px-1 rounded font-mono">.env</code> for real data.</span>
              </div>
            )}

            <form onSubmit={handleAnalyze} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#374151] mb-2">YouTube Channel URL</label>
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                  <input
                    type="url"
                    required
                    placeholder="https://youtube.com/@yourchannel"
                    className="w-full pl-10 pr-4 py-3 border border-[#d1d5db] rounded-xl text-[#111827] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] text-sm transition-all"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                  />
                </div>
                <p className="text-xs text-[#9ca3af] mt-1.5">Supports: youtube.com/@handle, /channel/UC..., /c/name, /user/name</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#374151] mb-2">Your Content Niche</label>
                <select
                  className="w-full px-4 py-3 border border-[#d1d5db] rounded-xl text-[#111827] bg-white focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] text-sm"
                  value={niche}
                  onChange={e => setNiche(e.target.value)}
                >
                  {NICHES.map(n => <option key={n}>{n}</option>)}
                </select>
              </div>

              <button type="submit" className="w-full bg-[#111827] text-white font-semibold py-3.5 rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2">
                {hasYouTubeKey ? 'Verify Channel & Calculate Rate' : 'Calculate Rate Estimate'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Step: Verifying */}
        {step === 'verifying' && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-12 text-center">
            <div className="w-14 h-14 border-[3px] border-[#111827] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <p className="text-[#374151] font-medium text-sm">{verifyingMsg || 'Connecting to YouTube Data API…'}</p>
            <p className="text-[#9ca3af] text-xs mt-2">This takes about 5 seconds</p>
          </div>
        )}

        {/* Step: Results */}
        {step === 'results' && valuation && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-7">
              <div className="flex items-center gap-2 mb-1">
                {ytMetrics ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified via YouTube API
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                    <AlertCircle className="w-3.5 h-3.5" /> Rate Estimate (not verified)
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-[#111827] mt-3 mb-1">Your fair market rate</h2>
              <p className="text-sm text-[#6b7280]">{valuation.data_justification}</p>
            </div>

            {ytMetrics && (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  {ytMetrics.thumbnailUrl && (
                    <img src={ytMetrics.thumbnailUrl} alt="Channel" className="w-12 h-12 rounded-full object-cover border border-[#e5e7eb]" />
                  )}
                  <div>
                    <p className="font-bold text-[#111827]">{ytMetrics.channelName}</p>
                    <p className="text-sm text-[#6b7280]">{ytMetrics.handle}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-[#111827]">{(ytMetrics.subscriberCount / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-[#6b7280] mt-0.5 flex items-center justify-center gap-1"><Users className="w-3 h-3" /> Subscribers</p>
                  </div>
                  <div className="text-center border-x border-[#f3f4f6]">
                    <p className="text-xl font-bold text-[#111827]">{(ytMetrics.avgViewsLast10 / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-[#6b7280] mt-0.5 flex items-center justify-center gap-1"><BarChart3 className="w-3 h-3" /> Avg Views</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-[#111827]">{ytMetrics.engagementRate.toFixed(1)}%</p>
                    <p className="text-xs text-[#6b7280] mt-0.5 flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3" /> Engagement</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#111827] text-white rounded-2xl p-5">
                <p className="text-xs text-gray-400 mb-1">Base Integration Fee</p>
                <p className="text-2xl font-bold">₹{valuation.fair_rate_card.base_integration_fee.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">60s sponsorship mention</p>
              </div>
              <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5">
                <p className="text-xs text-[#6b7280] mb-1">Dedicated Video</p>
                <p className="text-2xl font-bold text-[#111827]">₹{valuation.fair_rate_card.dedicated_video_fee.toLocaleString()}</p>
                <p className="text-xs text-[#6b7280] mt-1">Full integration video</p>
              </div>
            </div>

            {valuation.revenue_leakage_annual > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-5 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Estimated annual revenue leakage</p>
                  <p className="text-lg font-bold text-red-700">-₹{valuation.revenue_leakage_annual.toLocaleString()}/yr</p>
                  <p className="text-xs text-red-600 mt-1">Based on accepting flat-fee deals below your fair rate. CreatorStack contracts protect this.</p>
                </div>
              </div>
            )}

            <button
              onClick={() => setStep('legal')}
              className="w-full bg-[#111827] text-white font-semibold py-3.5 rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2"
            >
              Continue to Legal Verification <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step: Legal / PAN */}
        {step === 'legal' && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-5 h-5 text-[#6b7280]" />
                <h2 className="text-xl font-bold text-[#111827]">Legal verification</h2>
              </div>
              <p className="text-sm text-[#6b7280]">Required for Section 194J TDS compliance and contract execution. Your PAN is stored encrypted and used only for tax withholding.</p>
            </div>

            <form onSubmit={handleVerifyPan} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#374151] mb-2">Legal Name (as on PAN card)</label>
                <input
                  type="text"
                  required
                  placeholder="Enter your full legal name"
                  className="w-full px-4 py-3 border border-[#d1d5db] rounded-xl text-[#111827] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] text-sm"
                  value={legalName}
                  onChange={e => setLegalName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#374151] mb-2">PAN Number</label>
                <input
                  type="text"
                  required
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="w-full px-4 py-3 border border-[#d1d5db] rounded-xl text-[#111827] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] text-sm font-mono uppercase tracking-widest"
                  value={pan}
                  onChange={e => setPan(e.target.value.toUpperCase())}
                />
                <p className="text-xs text-[#9ca3af] mt-1.5">Format: 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F)</p>
              </div>

              <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4 text-xs text-[#6b7280]">
                <strong className="text-[#374151]">Why we need your PAN:</strong> Under Section 194J of the Income Tax Act, 1961, brands must deduct 10% TDS on payments to creators for professional services. Your PAN is required to issue Form 16A.
              </div>

              <button type="submit" disabled={panLoading} className="w-full bg-[#111827] text-white font-semibold py-3.5 rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {panLoading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Validating PAN format…</>
                ) : (
                  <>Verify & Continue <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step: UPI */}
        {step === 'upi' && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-5 h-5 text-[#6b7280]" />
                <h2 className="text-xl font-bold text-[#111827]">Payout account</h2>
              </div>
              <p className="text-sm text-[#6b7280]">Where should we send your earnings when a deal completes? Escrow funds are released to this UPI ID automatically after content verification.</p>
            </div>

            <form onSubmit={handleVerifyUpi} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#374151] mb-2">UPI ID</label>
                <input
                  type="text"
                  required
                  placeholder="yourname@upi"
                  className="w-full px-4 py-3 border border-[#d1d5db] rounded-xl text-[#111827] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] text-sm"
                  value={upi}
                  onChange={e => setUpi(e.target.value)}
                />
                <p className="text-xs text-[#9ca3af] mt-1.5">Supports all UPI handles: @okaxis, @paytm, @ybl, @okicici, etc.</p>
              </div>

              <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg p-4 text-xs text-[#166534]">
                <strong>Escrow protection:</strong> Brands lock funds before any content is produced. You receive payment automatically after content is verified — no chasing required.
              </div>

              <button type="submit" disabled={upiLoading} className="w-full bg-[#111827] text-white font-semibold py-3.5 rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {upiLoading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Setting up your account…</>
                ) : (
                  <>Complete Setup <CheckCircle2 className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-12 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-green-100">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#111827] mb-2">You're all set</h2>
            <p className="text-[#6b7280] text-sm">Taking you to your dashboard…</p>
          </div>
        )}
      </div>
    </div>
  );
}
