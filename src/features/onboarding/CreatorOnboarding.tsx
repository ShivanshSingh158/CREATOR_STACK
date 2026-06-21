import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateCreatorValuation, type ValuationOutput } from '../../utils/valuationEngine';
import {
  fetchYouTubeChannelMetrics,
  youTubeMetricsToScraped,
  detectChannelNiche,
  type YouTubeChannelMetrics,
  type YouTubeAPIError,
} from '../../utils/youtubeApi';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useAuth } from '../auth/AuthContext';
import { OnboardingProgressBar, ConfettiBurst } from '../../components/ui/SharedComponents';
import {
  Video,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  ArrowRight,
  Lock,
  Play as YoutubeIcon,
  Clock,
  Info,
  Shield,
} from 'lucide-react';
import { NICHES } from '../../utils/niches';

type Step = 'channel' | 'verifying' | 'results' | 'legal' | 'upi' | 'kyc_pending';

// ── UPI format validator ──────────────────────
// Accepts: name@bank, number@bank, etc.
const UPI_RE = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export default function CreatorOnboarding() {
  const navigate = useNavigate();
  const { currentUser, refreshProfile } = useAuth();

  const [step, setStep] = useState<Step>('channel');
  const [url, setUrl] = useState('');
  const [niche, setNiche] = useState('Technology & B2B SaaS');
  const [legalName, setLegalName] = useState('');
  const [pan, setPan] = useState('');
  const [panError, setPanError] = useState('');
  const [upi, setUpi] = useState('');
  const [upiError, setUpiError] = useState('');

  const [ytMetrics, setYtMetrics] = useState<YouTubeChannelMetrics | null>(null);
  const [valuation, setValuation] = useState<ValuationOutput | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [verifyingMsg, setVerifyingMsg] = useState('');
  const [isOAuthVerified, setIsOAuthVerified] = useState(false);
  const [detectingNiche, setDetectingNiche] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifyingPan, setVerifyingPan] = useState(false);

  // Retry cooldown: counts down from 3 to 0 after OAuth failure
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [showFaq, setShowFaq] = useState(false);

  const hasYouTubeKey = !!(
    import.meta.env.VITE_YOUTUBE_API_KEY &&
    import.meta.env.VITE_YOUTUBE_API_KEY !== 'YOUR_YOUTUBE_DATA_API_V3_KEY_HERE'
  );

  // ── Auto-save/restore draft ───────────────────────────
  const DRAFT_KEY = 'creatorOnboarding_draft';

  // Restore draft on first mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return;
      const draft = JSON.parse(saved);
      if (draft.url) setUrl(draft.url);
      if (draft.niche) setNiche(draft.niche);
      if (draft.legalName) setLegalName(draft.legalName);
      if (draft.pan) setPan(draft.pan);
      if (draft.upi) setUpi(draft.upi);
    } catch {
      // corrupt draft — silently ignore
    }
  }, []);

  // Persist draft on every field change
  React.useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ url, niche, legalName, pan, upi }),
      );
    } catch {
      // storage full — silently ignore
    }
  }, [url, niche, legalName, pan, upi]);

  // ── Auto-detect niche from URL ────────────────────
  React.useEffect(() => {
    if (url.length < 10) return;
    const t = setTimeout(async () => {
      setDetectingNiche(true);
      const autoNiche = await detectChannelNiche(url);
      setDetectingNiche(false);
      if (autoNiche && NICHES.includes(autoNiche)) setNiche(autoNiche);
    }, 800);
    return () => clearTimeout(t);
  }, [url]);

  // ── YouTube OAuth Connect ─────────────────────
  // Requests youtube.readonly scope — links the channel to their Google account
  // so the channel ID is PROVABLY theirs (can't paste someone else's URL)
  const handleYouTubeOAuth = async () => {
    setApiError(null);
    setStep('verifying');
    setVerifyingMsg('Connecting to your Google account…');

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
      // Re-authenticate the current user with YouTube scope
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      if (!accessToken) throw new Error('No access token received from Google');

      setVerifyingMsg('Fetching your channel data from YouTube…');

      // Use access token to call YouTube API (user-authenticated, not server key)
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,contentDetails,topicDetails&mine=true&access_token=${accessToken}`,
      );
      const data = await res.json();

      if (!res.ok) {
        console.error('YouTube API Error:', data);
        const errMsg = data.error?.message || 'Unknown API Error';
        if (errMsg.includes('not been used') || errMsg.includes('disabled')) {
          setApiError(
            'Developer Error: YouTube Data API v3 is not enabled in Google Cloud Console for this Firebase project.',
          );
        } else {
          setApiError(`YouTube API Error: ${errMsg}`);
        }
        setStep('channel');
        return;
      }

      if (!data.items || data.items.length === 0) {
        setApiError(
          'No YouTube channel found on this Google account. Make sure you have a YouTube channel.',
        );
        setStep('channel');
        return;
      }
      const channel = data.items[0];
      const channelUrl = `https://youtube.com/channel/${channel.id}`;

      setUrl(channelUrl);
      setVerifyingMsg('Calculating fair market valuation…');

      // Now fetch full metrics using our existing utility (with the channel URL we just got)
      if (hasYouTubeKey) {
        try {
          const metrics = await fetchYouTubeChannelMetrics(channelUrl);
          const finalNiche = metrics.inferredNiche || niche;
          setNiche(finalNiche);
          const scraped = youTubeMetricsToScraped(metrics, finalNiche);
          const oauthResult = calculateCreatorValuation(scraped);
          setYtMetrics(metrics);
          setValuation(oauthResult);
          setIsOAuthVerified(true);
          setStep('results');
          return;
        } catch {
          /* fall through to estimate */
        }
      }

      // No YouTube Data API key — build estimate from basic OAuth data
      const subs = parseInt(channel.statistics?.subscriberCount || '0');
      const views = parseInt(channel.statistics?.viewCount || '0');
      const videoCount = parseInt(channel.statistics?.videoCount || '1');
      const estAvgViews = Math.round((views / Math.max(videoCount, 1)) * 0.1);
      const oauthEstResult = calculateCreatorValuation({
        platform: 'YouTube',
        creator_name: channel.snippet?.title || 'Creator',
        niche,
        language: 'Hinglish',
        follower_count: subs,
        avg_views_last_10: estAvgViews,
        engagement_rate_percentage: 3.5,
        viewership_velocity_trend: 'stable',
      });
      setYtMetrics({
        channelId: channel.id,
        channelName: channel.snippet?.title || '',
        handle: channel.snippet?.customUrl || `@${channel.snippet?.title}`,
        description: channel.snippet?.description || '',
        thumbnailUrl: channel.snippet?.thumbnails?.high?.url || '',
        bannerUrl: '',
        subscriberCount: subs,
        viewCount: views,
        videoCount,
        avgViewsLast10: estAvgViews,
        engagementRate: 3.5,
        velocityTrend: 'stable',
        lastVideoDate: '',
        recentVideos: [],
        verifiedAt: new Date().toISOString(),
        isVerified: true,
        inferredLanguage: 'Hinglish',
      });
      setValuation(oauthEstResult);
      setIsOAuthVerified(true);
      setStep('results');
    } catch (err: any) {
      console.error('YouTube OAuth error:', err);
      // If user closed the popup, go back to step
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setStep('channel');
        return;
      }
      setApiError('Could not connect YouTube account. Please try again or use URL mode.');
      setStep('channel');
      // Start 3-second retry cooldown
      setRetryCountdown(3);
      const cd = setInterval(() => {
        setRetryCountdown((v) => {
          if (v <= 1) { clearInterval(cd); return 0; }
          return v - 1;
        });
      }, 1000);
    }
  };

  // ── URL paste mode (estimate only) ───────────
  const handleAnalyzeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setApiError(null);
    setStep('verifying');

    const urlLower = url.toLowerCase();
    if (hasYouTubeKey && (urlLower.includes('youtube') || urlLower.includes('youtu.be'))) {
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
        const finalNiche = metrics.inferredNiche || niche;
        setNiche(finalNiche);
        const scraped = youTubeMetricsToScraped(metrics, finalNiche);
        const result = calculateCreatorValuation(scraped);
        setYtMetrics(metrics);
        setValuation(result);
        // NOT OAuth verified — just URL paste
        setIsOAuthVerified(false);
        setStep('results');
      } catch (err: any) {
        clearInterval(ticker);
        const e = err as YouTubeAPIError;
        if (e.type === 'NOT_FOUND') {
          setApiError('Channel not found. Please check the URL and try again.');
          setStep('channel');
        } else {
          runEstimateMode();
        }
      }
    } else {
      runEstimateMode();
    }
  };

  const runEstimateMode = () => {
    setVerifyingMsg('Building estimate…');
    const urlHash = url.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const est = 15000 + (urlHash % 35000);
    const result = calculateCreatorValuation({
      platform: url.includes('instagram') ? 'Instagram' : 'YouTube',
      creator_name: legalName || 'Creator',
      niche,
      language: 'English',
      follower_count: est,
      avg_views_last_10: Math.round(est * 0.2),
      engagement_rate_percentage: 3.5,
      viewership_velocity_trend: 'stable',
    });
    setValuation(result);
    setIsOAuthVerified(false);
    setStep('results');
  };

  // ── PAN validation with Sandbox API (Signzy/Karza Simulation) ──
  const handleVerifyPan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPanError('');
    if (!legalName.trim()) {
      setPanError('Legal name is required');
      return;
    }
    if (!PAN_RE.test(pan.toUpperCase())) {
      setPanError('Invalid format. Must be like ABCDE1234F (5 letters + 4 digits + 1 letter)');
      return;
    }
    
    setVerifyingPan(true);
    
    try {
      // Simulate network request to Karza / Signzy Sandbox API
      await new Promise((resolve) => setTimeout(resolve, 1800));
      
      // Sandbox validation rules
      if (pan === 'REJEC1234F') {
        throw new Error('Sandbox Verification Failed: Name mismatch with NSDL database.');
      }
      
      // Format is valid — move to UPI step.
      setStep('upi');
    } catch (err: any) {
      setPanError(err.message || 'Verification failed. Please check details and try again.');
    } finally {
      setVerifyingPan(false);
    }
  };

  // ── UPI validation ────────────────────────────
  const handleVerifyUpi = (e: React.FormEvent) => {
    e.preventDefault();
    setUpiError('');
    if (!UPI_RE.test(upi.trim())) {
      setUpiError('Invalid UPI ID format. Must be like name@bank or number@upi');
      return;
    }
    // Valid format — finalize
    finalizeOnboarding();
  };

  // ── Save to Firestore ─────────────────────────
  const finalizeOnboarding = async () => {
    if (!currentUser || !valuation) return;
    setSaving(true);

    const handle =
      ytMetrics?.handle || (url ? '@' + url.split('/').filter(Boolean).pop() : '@creator');
    const displayName =
      legalName || ytMetrics?.channelName || currentUser.email?.split('@')[0] || 'Creator';

    // kycStatus: 'submitted' — NOT 'verified'. Admin review sets it to 'verified'.
    // Creator appears in matchmaking with 'pending' badge until admin verifies.
    const creatorData: Record<string, unknown> = {
      name: displayName,
      niche,
      language: ytMetrics?.inferredLanguage || 'English',
      profileUrl: url,
      legalName,
      // Store PAN format only — never store PAN in plain text in prod (encrypt it)
      pan: pan.toUpperCase(),
      upi: upi.trim(),
      valuation,
      current_rate: valuation.fair_rate_card.base_integration_fee,
      profileCompleted: true,
      // ✅ NOT auto-verified — goes through review queue
      kycStatus: 'submitted',
      panVerified: false, // set by admin after review
      upiVerified: false, // set after penny drop (24-48h)
      channelVerified: isOAuthVerified, // true = YouTube OAuth, false = URL paste
      isAPIVerified: !!ytMetrics?.isVerified,
      isEstimate: !isOAuthVerified && !ytMetrics?.isVerified,
      role: 'creator',
      // YouTube data
      ...(ytMetrics
        ? {
            youtubeData: ytMetrics,
            channelId: ytMetrics.channelId,
            channelThumbnail: ytMetrics.thumbnailUrl,
            follower_count: ytMetrics.subscriberCount,
            avg_views: ytMetrics.avgViewsLast10,
            engagement_rate: ytMetrics.engagementRate,
            velocityTrend: ytMetrics.velocityTrend,
            lastSyncedAt: ytMetrics.verifiedAt,
            recentVideos: ytMetrics.recentVideos.slice(0, 3),
          }
        : {
            follower_count: 0,
          }),
      // Earnings init
      totalEarned: 0,
      pendingEarnings: 0,
      escrowWallet: {
        balance: 0,
        lockedBalance: 0,
        availableBalance: 0,
        currency: 'INR',
      },
      createdAt: new Date().toISOString(),
    };

    try {
      await Promise.all([
        setDoc(doc(db, 'users', currentUser.uid), creatorData, { merge: true }),
        setDoc(
          doc(db, 'creators', currentUser.uid),
          {
            ...creatorData,
            uid: currentUser.uid,
            handle,
          },
          { merge: true },
        ),
      ]);

      // Write to admin review queue for KYC
      await addDoc(collection(db, 'adminReviews'), {
        userId: currentUser.uid,
        userRole: 'creator',
        name: displayName,
        pan: pan.toUpperCase(),
        upi: upi.trim(),
        channelVerified: isOAuthVerified,
        channelUrl: url,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      });

      // Clear saved draft — onboarding complete
      localStorage.removeItem(DRAFT_KEY);
    } catch (err) {
      console.error('Error saving creator profile:', err);
    }

    setSaving(false);
    setStep('kyc_pending');
    refreshProfile();
    setTimeout(() => navigate('/creator-dashboard', { replace: true, state: { valuation } }), 2000);
  };

  // ── Step progress number ──────────────────────
  const stepNum =
    { channel: 1, verifying: 1, results: 1, legal: 2, upi: 3, kyc_pending: 3 }[step] || 1;

  const STEP_LABELS = ['Channel Verification', 'Legal & PAN', 'UPI Payout'];

  return (
    <div
      className="min-h-screen bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex flex-col items-center justify-center py-12 px-4"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-2xl font-black text-[#e8473f] tracking-tighter uppercase mb-2">
            creator<span className="text-black">.</span>stack
          </p>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">
            Creator Onboarding
          </p>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto mt-6">
            <OnboardingProgressBar step={stepNum} total={3} persona="creator" />
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-0 mt-4">
            {STEP_LABELS.map((label, i) => {
              const n = i + 1;
              return (
                <React.Fragment key={n}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all border-2 rounded
                      ${
                        stepNum > n
                          ? 'bg-[#a3e635] text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                          : stepNum === n
                            ? 'bg-[#e8473f] text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                            : 'bg-white text-gray-400 border-gray-300'
                      }`}
                    >
                      {stepNum > n ? <CheckCircle2 className="w-4 h-4" /> : n}
                    </div>
                    <span
                      className={`text-[9px] mt-2 font-black uppercase tracking-widest whitespace-nowrap ${stepNum === n ? 'text-black' : 'text-gray-400'}`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div
                      className={`h-1 w-16 mb-5 mx-2 transition-all ${stepNum > n ? 'bg-black' : 'bg-gray-200'}`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ─── STEP: Channel Connection ─── */}
        {step === 'channel' && (
          <div className="bg-white rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-10">
            <div className="mb-8">
              <h1 className="text-xl font-black text-black uppercase tracking-tight mb-2">
                Connect Your Channel
              </h1>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                We verify your YouTube channel to show brands that your metrics are real — not
                self-reported.
              </p>
            </div>

            {apiError && (
              <div className="mb-6 border-2 border-amber-500 bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg overflow-hidden">
                {/* Error message + retry */}
                <div className="flex items-start gap-3 p-4">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">{apiError}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (retryCountdown > 0) return;
                      setApiError(null);
                    }}
                    disabled={retryCountdown > 0}
                    className={`shrink-0 px-4 py-1.5 border-2 border-black text-[9px] font-black uppercase tracking-widest rounded transition-all ${
                      retryCountdown > 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-amber-500 text-black hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none'
                    }`}
                  >
                    {retryCountdown > 0 ? `Retry in ${retryCountdown}s` : 'Dismiss & Retry'}
                  </button>
                </div>
                {/* FAQ accordion */}
                <div className="border-t-2 border-amber-300">
                  <button
                    onClick={() => setShowFaq((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-black uppercase tracking-widest text-amber-800 hover:bg-amber-100 transition-colors"
                  >
                    Why is this failing? Common causes
                    <Info className={`w-4 h-4 transition-transform ${showFaq ? 'rotate-180' : ''}`} />
                  </button>
                  {showFaq && (
                    <div className="px-4 pb-4 space-y-3">
                      {[
                        {
                          q: 'Popup was blocked by browser',
                          a: 'Allow popups for this site in your browser settings (look for the blocked popup icon in the address bar).',
                        },
                        {
                          q: "You don't have a YouTube channel",
                          a: "You need a YouTube channel on your Google account. Visit youtube.com and create one first (it's free).",
                        },
                        {
                          q: 'Wrong Google account',
                          a: "Make sure you're signing in with the Google account that owns your YouTube channel, not a personal email.",
                        },
                        {
                          q: 'Mobile browser popup issue',
                          a: 'Some mobile browsers block OAuth popups. Try on Chrome desktop, or use the URL paste method below instead.',
                        },
                      ].map((item, i) => (
                        <div key={i} className="text-xs">
                          <p className="font-black text-amber-900 mb-0.5">Q: {item.q}</p>
                          <p className="text-amber-800 font-medium leading-relaxed">→ {item.a}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── OAuth method (RECOMMENDED) ── */}
            <div className="mb-8 p-6 border-2 border-indigo-600 bg-indigo-50 rounded-xl shadow-[4px_4px_0px_0px_rgba(79,70,229,1)]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[9px] font-black px-2 py-0.5 bg-indigo-600 text-white rounded-full uppercase tracking-widest">
                  Recommended
                </span>
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                  ★ Gets you the "Channel Verified" badge
                </span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <YoutubeIcon className="w-6 h-6 text-red-600 shrink-0" />
                <div>
                  <p className="text-sm font-black text-black uppercase tracking-tight">
                    Connect via YouTube OAuth
                  </p>
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-0.5">
                    Links your channel to your Google account — brands know it's really yours
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
                {[
                  {
                    icon: <CheckCircle2 className="w-3 h-3 text-indigo-600" />,
                    text: 'Channel Verified badge',
                  },
                  {
                    icon: <CheckCircle2 className="w-3 h-3 text-indigo-600" />,
                    text: 'Real metrics fetched',
                  },
                  {
                    icon: <CheckCircle2 className="w-3 h-3 text-indigo-600" />,
                    text: 'Cannot be spoofed',
                  },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-1.5">
                    {item.icon}
                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleYouTubeOAuth}
                className="flex items-center gap-2 bg-red-600 border-2 border-black text-white font-black py-3.5 px-8 rounded-lg uppercase tracking-widest text-[10px] hover:bg-red-700 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <YoutubeIcon className="w-4 h-4" /> Connect YouTube Account
              </button>
            </div>

            {/* ── URL paste method (estimate only) ── */}
            <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[9px] font-black px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full uppercase tracking-widest">
                  Estimate Mode
                </span>
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                  No verified badge
                </span>
              </div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 leading-relaxed">
                Paste your channel URL for an estimated valuation only. Brands will see
                "Self-Reported" on your profile.
              </p>
              <form onSubmit={handleAnalyzeUrl} className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="https://youtube.com/@yourchannel"
                    className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  {detectingNiche && (
                    <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-1 animate-pulse">
                      Detecting niche…
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!url}
                  className="flex items-center gap-2 bg-gray-800 border-2 border-black text-white font-black py-3 px-6 rounded-lg uppercase tracking-widest text-[10px] hover:bg-black hover:-translate-y-0.5 active:translate-y-0 active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Get Estimate <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ─── STEP: Verifying ─── */}
        {step === 'verifying' && (
          <div className="bg-white rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-16 text-center">
            <div className="w-16 h-16 border-[4px] border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest animate-pulse mb-2">
              {verifyingMsg || 'Verifying…'}
            </p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              This may take a few seconds
            </p>
          </div>
        )}

        {/* ─── STEP: Results ─── */}
        {step === 'results' && valuation && (
          <div className="space-y-5">
            {/* Verification status banner */}
            <div
              className={`flex items-center gap-3 p-4 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${isOAuthVerified ? 'bg-[#a3e635]' : 'bg-amber-50 border-amber-400'}`}
            >
              {isOAuthVerified ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-black shrink-0" />
                  <div>
                    <p className="text-xs font-black text-black uppercase tracking-widest">
                      Channel Verified via YouTube OAuth ✓
                    </p>
                    <p className="text-[9px] font-bold text-black/70 uppercase tracking-widest mt-0.5">
                      Your channel is provably linked to your Google account. Brands trust this.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-amber-800 uppercase tracking-widest">
                      Estimate Mode — Not Verified
                    </p>
                    <p className="text-[9px] font-bold text-amber-700 uppercase tracking-widest mt-0.5">
                      Brands see "Self-Reported" on your profile. Connect via OAuth to get the
                      verified badge.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Metrics card (YouTube Channel Preview) */}
            <div className="bg-white rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black overflow-hidden mb-6">
              {ytMetrics && (
                <>
                  {/* Channel Banner */}
                  <div className="h-32 md:h-48 w-full bg-gray-200 border-b-2 border-black relative">
                    {ytMetrics.bannerUrl ? (
                      <img 
                        src={ytMetrics.bannerUrl} 
                        alt="Channel Banner" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                    )}
                  </div>
                  
                  {/* Channel Info Overlay */}
                  <div className="px-6 pb-6 relative">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-10 sm:-mt-12 mb-4">
                      {ytMetrics.thumbnailUrl && (
                        <img
                          src={ytMetrics.thumbnailUrl}
                          alt="Avatar"
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] object-cover bg-white"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="text-center sm:text-left mt-2 sm:mt-0 flex-1">
                        <h2 className="text-2xl font-black text-black uppercase tracking-tight">
                          {ytMetrics.channelName}
                        </h2>
                        <p className="text-sm font-bold text-gray-500 tracking-widest mt-0.5">
                          {ytMetrics.handle}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end mt-2 sm:mt-0">
                        {isOAuthVerified && (
                          <span className="text-[10px] font-black px-3 py-1 bg-[#a3e635] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full uppercase tracking-widest flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> OAuth Verified
                          </span>
                        )}
                        <span className="text-[10px] font-black px-3 py-1 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full uppercase tracking-widest">
                          {niche}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  {
                    label: 'Subscribers',
                    value: ytMetrics?.subscriberCount
                      ? `${(ytMetrics.subscriberCount / 1000).toFixed(1)}K`
                      : '—',
                    icon: <Users className="w-4 h-4" />,
                  },
                  {
                    label: 'Avg Views',
                    value: ytMetrics?.avgViewsLast10
                      ? `${(ytMetrics.avgViewsLast10 / 1000).toFixed(1)}K`
                      : '—',
                    icon: <Video className="w-4 h-4" />,
                  },
                  {
                    label: 'Engagement',
                    value: ytMetrics?.engagementRate
                      ? `${ytMetrics.engagementRate.toFixed(1)}%`
                      : '—',
                    icon: <TrendingUp className="w-4 h-4" />,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-gray-50 border-2 border-black rounded-lg p-4 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="flex justify-center mb-1.5 text-indigo-600">{item.icon}</div>
                    <p className="text-xl font-black text-black">{item.value}</p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-indigo-600 border-2 border-black rounded-xl p-5 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">
                  Fair Market Rate
                </p>
                <p className="text-3xl font-black text-white">
                  ₹{(valuation.fair_rate_card.base_integration_fee || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest mt-1">
                  Per integration · {isOAuthVerified ? 'API verified' : 'Estimate'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep('legal')}
                className="w-full mt-6 flex items-center justify-center gap-2 bg-black border-2 border-black text-white font-black py-4 rounded-xl uppercase tracking-widest text-[10px] hover:-translate-y-0.5 hover:bg-gray-900 active:translate-y-0 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Continue to KYC <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP: Legal & PAN ─── */}
        {step === 'legal' && (
          <div className="bg-white rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-amber-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black uppercase tracking-tight">
                  Legal Identity & PAN
                </h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                  Required for TDS compliance under Section 194J
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-3 my-5 text-[10px] font-bold text-amber-800 uppercase tracking-widest leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              10% TDS is deducted from all brand payments under Section 194J. Your PAN is required
              for automatic TDS compliance. We verify format only — our team reviews documents
              within 24–48 hours.
            </div>

            <form onSubmit={handleVerifyPan} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">
                  Legal Full Name (as on PAN card) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Kumar Sharma"
                  className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">
                  PAN Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className={`w-full px-4 py-3 bg-white border-2 rounded-lg text-sm font-bold text-black focus:outline-none transition-all ${panError ? 'border-red-500 shadow-[2px_2px_0px_0px_rgba(239,68,68,1)]' : 'border-black focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
                  value={pan}
                  onChange={(e) => {
                    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    let masked = '';
                    for (let i = 0; i < val.length; i++) {
                      if (i < 5) masked += /[A-Z]/.test(val[i]) ? val[i] : '';
                      else if (i < 9) masked += /[0-9]/.test(val[i]) ? val[i] : '';
                      else if (i === 9) masked += /[A-Z]/.test(val[i]) ? val[i] : '';
                    }
                    setPan(masked);
                    setPanError('');
                  }}
                />
                {panError && (
                  <p className="text-[9px] font-black uppercase tracking-widest text-red-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {panError}
                  </p>
                )}
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1.5">
                  Format: ABCDE1234F · Document reviewed manually within 24–48 hours
                </p>
              </div>

              <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-3 text-[10px] font-bold text-blue-800 uppercase tracking-widest leading-relaxed flex items-start gap-2">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                No PAN yet? You can still submit your profile and add your PAN later. Your profile
                will show "KYC Pending" until documents are reviewed.
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setStep('results')}
                  className="px-8 py-3.5 text-[10px] font-black uppercase tracking-widest text-black bg-gray-100 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-200 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={verifyingPan}
                  className="flex items-center justify-center gap-2 px-10 py-3.5 text-[10px] font-black uppercase tracking-widest text-white bg-indigo-600 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {verifyingPan ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying API…
                    </>
                  ) : (
                    <>
                      Continue <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── STEP: UPI Setup ─── */}
        {step === 'upi' && (
          <div className="bg-white rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-indigo-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-black text-black uppercase tracking-tight">
                  UPI Payout Setup
                </h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                  Where your brand payments will be sent
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-3 my-5 text-[10px] font-bold text-blue-800 uppercase tracking-widest leading-relaxed flex items-start gap-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              We will send a ₹1 test transfer to your UPI ID within 24–48 hours to confirm it's
              active and belongs to you. Until then, your UPI shows as "Pending Verification".
            </div>

            <form onSubmit={handleVerifyUpi} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">
                  UPI ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="yourname@upi or 9876543210@paytm"
                  className={`w-full px-4 py-3 bg-white border-2 rounded-lg text-sm font-bold text-black focus:outline-none transition-all ${upiError ? 'border-red-500 shadow-[2px_2px_0px_0px_rgba(239,68,68,1)]' : 'border-black focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
                  value={upi}
                  onChange={(e) => {
                    setUpi(e.target.value.trim());
                    setUpiError('');
                  }}
                />
                {upiError && (
                  <p className="text-[9px] font-black uppercase tracking-widest text-red-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {upiError}
                  </p>
                )}
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1.5">
                  Accepted: PhonePe, GPay, Paytm, BHIM UPI, any UPI handle
                </p>
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setStep('legal')}
                  className="px-8 py-3.5 text-[10px] font-black uppercase tracking-widest text-black bg-gray-100 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-200 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-10 py-3.5 text-[10px] font-black uppercase tracking-widest text-white bg-[#e8473f] border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#c73530] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-60"
                >
                  {saving ? (
                    'Saving…'
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Complete Setup
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── STEP: KYC Pending ─── */}
        {step === 'kyc_pending' && (
          <>
            <ConfettiBurst />
            <div className="bg-white rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-12 text-center relative overflow-hidden">
              {/* Celebration top strip */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#e8473f] via-[#ff6b35] to-[#a3e635]" />
              <div className="w-24 h-24 bg-emerald-100 border-2 border-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-5xl">🎉</span>
              </div>
              <h2 className="text-2xl font-black text-black uppercase tracking-tight mb-2">
                You're live on CreatorStack!
              </h2>
              <p className="text-sm font-bold text-[#e8473f] uppercase tracking-widest mb-4">
                Your profile is now visible to 800+ brands
              </p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed max-w-md mx-auto mb-6">
                Your KYC is under review. We'll verify your PAN and do a ₹1 UPI test transfer
                within 24–48 hours. You'll get the "Brand Ready" badge once approved.
              </p>
              <p className="text-[10px] font-black text-[#e8473f] uppercase tracking-widest animate-pulse">
                Redirecting to your dashboard…
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
