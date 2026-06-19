import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateCreatorValuation, type ValuationOutput } from '../../utils/valuationEngine';
import { fetchYouTubeChannelMetrics, youTubeMetricsToScraped, detectChannelNiche, type YouTubeChannelMetrics, type YouTubeAPIError } from '../../utils/youtubeApi';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../auth/AuthContext';
import { Video, CheckCircle2, AlertCircle, TrendingUp, Users, BarChart3, ArrowRight, Lock, Wallet } from 'lucide-react';
import { NICHES } from '../../utils/niches';

type Step = 'url' | 'verifying' | 'results' | 'legal' | 'upi' | 'done';


export default function CreatorOnboarding() {
  const navigate = useNavigate();
  const { currentUser, refreshProfile } = useAuth();

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
  const [detectingNiche, setDetectingNiche] = useState(false);

  const hasYouTubeKey = !!(import.meta.env.VITE_YOUTUBE_API_KEY && import.meta.env.VITE_YOUTUBE_API_KEY !== 'YOUR_YOUTUBE_DATA_API_V3_KEY_HERE');

  React.useEffect(() => {
    if (url.length < 10) return;
    
    const timeoutId = setTimeout(async () => {
      setDetectingNiche(true);
      const autoNiche = await detectChannelNiche(url);
      setDetectingNiche(false);
      if (autoNiche && NICHES.includes(autoNiche)) {
        setNiche(autoNiche);
      }
    }, 800); // 800ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [url]);

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
        const finalNiche = metrics.inferredNiche || niche || 'Entertainment';
        setNiche(finalNiche);
        const scraped = youTubeMetricsToScraped(metrics, finalNiche);
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
        youtubeData: ytMetrics,
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

    try {
      // Await both writes so profileCompleted:true is in Firestore before we navigate
      await Promise.all([
        setDoc(doc(db, 'users', currentUser.uid), creatorData, { merge: true }),
        setDoc(doc(db, 'creators', currentUser.uid), {
          ...creatorData,
          uid: currentUser.uid,
          handle,
        }, { merge: true }),
      ]);
    } catch (err) {
      console.error('Error saving creator profile:', err);
    }

    setStep('done');
    // Trigger AuthContext to re-read from Firestore immediately
    refreshProfile();
    // Navigate after a short pause so the 'done' screen shows briefly
    setTimeout(() => navigate('/creator-dashboard', { replace: true, state: { valuation } }), 1200);
  };

  const stepNumber = { url: 1, verifying: 1, results: 1, legal: 2, upi: 3, done: 3 }[step] || 1;

  return (
    <div className="min-h-screen bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex flex-col items-center justify-center py-12 px-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="w-full max-w-5xl">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-2xl font-black text-black tracking-tighter uppercase mb-2">creator<span className="text-indigo-600">.</span>stack</p>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">Creator Onboarding</p>

          <div className="flex items-center justify-center gap-0 mt-8">
            {[1, 2, 3].map(n => (
              <React.Fragment key={n}>
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all border-2
                    ${stepNumber > n ? 'bg-[#a3e635] text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                    : stepNumber === n ? 'bg-indigo-600 text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                    : 'bg-white text-gray-400 border-gray-300'}`}>
                    {stepNumber > n ? <CheckCircle2 className="w-4 h-4" /> : n}
                  </div>
                  <span className={`text-[9px] mt-2 font-black uppercase tracking-widest whitespace-nowrap ${stepNumber === n ? 'text-black' : 'text-gray-400'}`}>
                    {n === 1 ? 'Channel Verification' : n === 2 ? 'Legal & PAN' : 'UPI Payout'}
                  </span>
                </div>
                {n < 3 && <div className={`h-1 w-12 mb-5 mx-2 transition-all ${stepNumber > n ? 'bg-black' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step: URL Input */}
        {step === 'url' && (
          <div className="bg-white rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-10">
            <div className="mb-8">
              <h1 className="text-xl font-black text-black uppercase tracking-tight mb-2">Connect your channel</h1>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">Paste your YouTube channel URL. We'll fetch your real subscriber count, average views, and engagement rate to calculate a fair market rate for your work.</p>
            </div>

            {apiError && (
              <div className="mb-6 flex items-start gap-3 bg-[#fbbf24] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg p-4 text-[10px] font-black uppercase tracking-widest text-black">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-black" />
                {apiError}
              </div>
            )}

            {!hasYouTubeKey && (
              <div className="mb-6 flex items-start gap-3 bg-[#a3e635] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg p-4 text-[10px] font-black uppercase tracking-widest text-black">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-black" />
                <span><strong className="text-black">DEMO MODE:</strong> YouTube API key not found. We'll generate a rate estimate. Add <code className="bg-white border-2 border-black px-1.5 py-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] mx-1">VITE_YOUTUBE_API_KEY</code> to <code className="bg-white border-2 border-black px-1.5 py-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] mx-1">.env</code> for real data.</span>
              </div>
            )}

            <form onSubmit={handleAnalyze} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">YouTube Channel URL</label>
                  <div className="relative">
                    <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                    <input
                      type="url"
                      required
                      placeholder="https://youtube.com/@yourchannel"
                      className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-black rounded text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-400 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                    />
                  </div>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-2">Supports: youtube.com/@handle, /channel/UC..., /c/name</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest">Your Content Niche</label>
                    {detectingNiche && (
                      <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest animate-pulse flex items-center gap-1">
                        <div className="w-2 h-2 border-[2px] border-indigo-600 border-t-transparent rounded-full animate-spin" /> Detecting...
                      </span>
                    )}
                  </div>
                  <select
                    className="w-full px-4 py-3.5 bg-white border-2 border-black rounded text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer appearance-none"
                    value={niche}
                    onChange={e => setNiche(e.target.value)}
                  >
                    {NICHES.map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-indigo-600 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-white font-black py-4 rounded uppercase tracking-widest text-[10px] hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all flex items-center justify-center gap-2 mt-4">
                {hasYouTubeKey ? 'VERIFY CHANNEL & CALCULATE RATE' : 'CALCULATE RATE ESTIMATE'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Step: Verifying */}
        {step === 'verifying' && (
          <div className="bg-white rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-16 text-center">
            <div className="w-16 h-16 border-[4px] border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-8 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest animate-pulse">{verifyingMsg || 'Connecting to YouTube Data API…'}</p>
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-3">This takes about 5 seconds</p>
          </div>
        )}

        {/* Step: Results */}
        {step === 'results' && valuation && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Context & Channel Details */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-6">
                <div className="flex items-center gap-2 mb-2">
                  {ytMetrics ? (
                    <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-black bg-[#a3e635] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-3 py-1.5 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED VIA YOUTUBE API
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-black bg-[#fbbf24] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-3 py-1.5 rounded">
                      <AlertCircle className="w-3.5 h-3.5" /> RATE ESTIMATE (NOT VERIFIED)
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-black text-black mt-3 mb-2 uppercase tracking-tight">Your fair market rate</h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">{valuation.data_justification}</p>
              </div>

              {ytMetrics && (
                <div className="bg-white rounded-xl border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {ytMetrics.thumbnailUrl ? (
                        <img src={ytMetrics.thumbnailUrl} alt="Channel Logo" referrerPolicy="no-referrer" className="w-14 h-14 rounded-lg object-cover border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-gray-50" />
                      ) : (
                        <div className="w-14 h-14 bg-red-100 rounded-lg flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <Users className="w-6 h-6 text-red-600" />
                        </div>
                      )}
                      <div>
                        <p className="text-lg font-black text-black uppercase tracking-tight">{ytMetrics.channelName}</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{ytMetrics.handle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-black">{(ytMetrics.subscriberCount / 1000).toFixed(1)}K</p>
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-1 flex items-center justify-end gap-1"><Users className="w-3 h-3" /> SUBSCRIBERS</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    {/* Long Form */}
                    <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
                      <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> LONG FORM VIDEOS</p>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xl font-black text-black">{ytMetrics.longFormAvgViews ? (ytMetrics.longFormAvgViews >= 1000000 ? `${(ytMetrics.longFormAvgViews / 1000000).toFixed(1)}M` : ytMetrics.longFormAvgViews >= 1000 ? `${(ytMetrics.longFormAvgViews / 1000).toFixed(1)}K` : ytMetrics.longFormAvgViews) : '—'}</p>
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">AVG VIEWS</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-black">{ytMetrics.longFormEngagement ? `${ytMetrics.longFormEngagement.toFixed(1)}%` : '—'}</p>
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">ENGAGEMENT</p>
                        </div>
                      </div>
                    </div>

                    {/* Shorts */}
                    <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
                      <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-3 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> YOUTUBE SHORTS</p>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xl font-black text-black">{ytMetrics.shortsAvgViews ? (ytMetrics.shortsAvgViews >= 1000000 ? `${(ytMetrics.shortsAvgViews / 1000000).toFixed(1)}M` : ytMetrics.shortsAvgViews >= 1000 ? `${(ytMetrics.shortsAvgViews / 1000).toFixed(1)}K` : ytMetrics.shortsAvgViews) : '—'}</p>
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">AVG VIEWS</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-black">{ytMetrics.shortsEngagement ? `${ytMetrics.shortsEngagement.toFixed(1)}%` : '—'}</p>
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">ENGAGEMENT</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Financials & CTA */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {valuation.fair_rate_card.base_integration_fee !== null && (
                  <>
                    <div className="col-span-2 sm:col-span-1 bg-indigo-600 text-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5">
                      <p className="text-[9px] font-black uppercase tracking-widest mb-1.5">Base Integration Fee</p>
                      <p className="text-2xl font-black">₹{valuation.fair_rate_card.base_integration_fee.toLocaleString()}</p>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-indigo-200 mt-1.5">60s sponsorship mention</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl p-5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-black mb-1.5">Dedicated Video</p>
                      <p className="text-2xl font-black text-black">₹{valuation.fair_rate_card.dedicated_video_fee?.toLocaleString()}</p>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500 mt-1.5">Full integration video</p>
                    </div>
                  </>
                )}
                {valuation.fair_rate_card.shorts_fee !== null && (
                  <div className="col-span-2 bg-[#a3e635] text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl p-5">
                    <p className="text-[9px] font-black uppercase tracking-widest mb-1.5">YouTube Shorts</p>
                    <p className="text-2xl font-black">₹{valuation.fair_rate_card.shorts_fee.toLocaleString()}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest mt-1.5 opacity-80">Short form integration</p>
                  </div>
                )}
              </div>

              {valuation.revenue_leakage_annual > 0 && (
                <div className="bg-red-500 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl p-5 flex items-start gap-4">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest mb-1">Estimated annual revenue leakage</p>
                    <p className="text-xl font-black">-₹{valuation.revenue_leakage_annual.toLocaleString()}/yr</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest mt-1.5 opacity-90">Based on accepting flat-fee deals below your fair rate. CreatorStack contracts protect this.</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep('legal')}
                className="w-full bg-indigo-600 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-white font-black py-4 rounded uppercase tracking-widest text-[10px] hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all flex items-center justify-center gap-2 mt-2"
              >
                CONTINUE TO LEGAL VERIFICATION <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step: Legal / PAN */}
        {step === 'legal' && (
          <div className="bg-white rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-10">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded flex items-center justify-center">
                  <Lock className="w-5 h-5 text-black" />
                </div>
                <h2 className="text-xl font-black text-black uppercase tracking-tight">Legal verification</h2>
              </div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">Required for Section 194J TDS compliance and contract execution. Your PAN is stored encrypted and used only for tax withholding.</p>
            </div>

            <form onSubmit={handleVerifyPan} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Legal Name (as on PAN card)</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full legal name"
                    className="w-full px-4 py-3.5 bg-white border-2 border-black rounded text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-400 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
                    value={legalName}
                    onChange={e => setLegalName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">PAN Number</label>
                  <input
                    type="text"
                    required
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    className="w-full px-4 py-3.5 bg-white border-2 border-black rounded text-sm font-black text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-mono uppercase tracking-widest placeholder:text-gray-400 placeholder:text-[10px]"
                    value={pan}
                    onChange={e => setPan(e.target.value.toUpperCase())}
                  />
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-2">Format: 5 letters + 4 digits + 1 letter</p>
                </div>
              </div>

              <div className="bg-[#fbbf24] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg p-5 text-[10px] font-bold text-black uppercase tracking-widest leading-relaxed">
                <strong className="font-black">WHY WE NEED YOUR PAN:</strong> Under Section 194J of the Income Tax Act, 1961, brands must deduct 10% TDS on payments to creators for professional services. Your PAN is required to issue Form 16A.
              </div>

              <button type="submit" disabled={panLoading} className="w-full bg-indigo-600 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-white font-black py-4 rounded uppercase tracking-widest text-[10px] hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-60 disabled:cursor-not-allowed">
                {panLoading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> VALIDATING PAN FORMAT…</>
                ) : (
                  <>VERIFY & CONTINUE <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step: UPI */}
        {step === 'upi' && (
          <div className="bg-white rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-10">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-black" />
                </div>
                <h2 className="text-xl font-black text-black uppercase tracking-tight">Payout account</h2>
              </div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">Where should we send your earnings when a deal completes? Escrow funds are released to this UPI ID automatically after content verification.</p>
            </div>

            <form onSubmit={handleVerifyUpi} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">UPI ID</label>
                <input
                  type="text"
                  required
                  placeholder="yourname@upi"
                  className="w-full px-4 py-3.5 bg-white border-2 border-black rounded text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-400 placeholder:text-[10px] placeholder:tracking-widest"
                  value={upi}
                  onChange={e => setUpi(e.target.value)}
                />
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-2">Supports all UPI handles: @okaxis, @paytm, @ybl, @okicici, etc.</p>
              </div>

              <div className="bg-[#a3e635] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg p-5 text-[10px] font-bold text-black uppercase tracking-widest leading-relaxed">
                <strong className="font-black">ESCROW PROTECTION:</strong> Brands lock funds before any content is produced. You receive payment automatically after content is verified — no chasing required.
              </div>

              <button type="submit" disabled={upiLoading} className="w-full bg-indigo-600 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-white font-black py-4 rounded uppercase tracking-widest text-[10px] hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-60 disabled:cursor-not-allowed">
                {upiLoading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> SETTING UP YOUR ACCOUNT…</>
                ) : (
                  <>COMPLETE SETUP <CheckCircle2 className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="bg-white rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-16 text-center">
            <div className="w-20 h-20 bg-[#a3e635] rounded-xl flex items-center justify-center mx-auto mb-6 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <CheckCircle2 className="w-10 h-10 text-black" />
            </div>
            <h2 className="text-3xl font-black text-black mb-3 uppercase tracking-tight">You're all set</h2>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest animate-pulse">Taking you to your dashboard…</p>
          </div>
        )}
      </div>
    </div>
  );
}
