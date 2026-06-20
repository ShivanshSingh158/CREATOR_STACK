import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Video,
  Camera,
  TrendingUp,
  Users,
  BarChart3,
  Clock,
  ExternalLink,
  MessageSquare,
  Play,
  Calendar,
  Calculator,
} from 'lucide-react';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../auth/AuthContext';
import { formatRupee } from '../../utils/formatters';
import { CalculationModal } from '../../components/ui/CalculationModal';

export default function CreatorProfileDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [creator, setCreator] = useState<any>(location.state?.creator || null);
  const [loading, setLoading] = useState(!creator);

  const { currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [brandCampaigns, setBrandCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false);

  useEffect(() => {
    if (!creator && id) {
      (async () => {
        try {
          // Try creators collection first, then users
          let data: any = null;
          const cSnap = await getDoc(doc(db, 'creators', id));
          if (cSnap.exists()) {
            data = { id: cSnap.id, ...cSnap.data() };
          } else {
            const uSnap = await getDoc(doc(db, 'users', id));
            if (uSnap.exists()) data = { id: uSnap.id, ...uSnap.data() };
          }
          setCreator(data);
        } catch (err) {
          console.error('Error fetching creator:', err);
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }
  }, [id, creator]);

  useEffect(() => {
    if (showModal && currentUser) {
      getDocs(query(collection(db, 'campaigns'), where('brandId', '==', currentUser.uid))).then(
        (snap) => {
          const camps = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setBrandCampaigns(camps);
          if (camps.length > 0) setSelectedCampaignId(camps[0].id);
        },
      );
    }
  }, [showModal, currentUser]);

  const handleExpressInterest = async () => {
    if (!selectedCampaignId || !message.trim() || !currentUser) return;
    setSending(true);
    try {
      // Check for existing application
      const existingQ = query(
        collection(db, 'applications'),
        where('campaignId', '==', selectedCampaignId),
        where('creatorId', '==', creator.id),
      );
      const existingSnap = await getDocs(existingQ);

      if (existingSnap.empty) {
        await addDoc(collection(db, 'applications'), {
          campaignId: selectedCampaignId,
          creatorId: creator.id,
          status: 'interested',
          type: 'outbound',
          appliedAt: serverTimestamp(),
        });
      }

      // Create or find existing chat
      const chatQ = query(
        collection(db, 'chats'),
        where('campaignId', '==', selectedCampaignId),
        where('creatorId', '==', creator.id),
      );
      const chatSnap = await getDocs(chatQ);

      let chatId: string;
      if (chatSnap.empty) {
        const chatRef = await addDoc(collection(db, 'chats'), {
          campaignId: selectedCampaignId,
          creatorId: creator.id,
          brandId: currentUser.uid,
          initiatedBy: 'brand',
          lastMessage: message,
          lastMessageAt: serverTimestamp(),
          lastMessageSenderId: currentUser.uid,
          status: 'active',
        });
        chatId = chatRef.id;
      } else {
        chatId = chatSnap.docs[0].id;
      }

      await addDoc(collection(db, 'messages'), {
        chatId,
        senderId: currentUser.uid,
        senderRole: 'brand',
        text: message,
        timestamp: serverTimestamp(),
      });

      setSent(true);
      setTimeout(() => {
        setShowModal(false);
        navigate('/messages');
      }, 1200);
    } catch (err) {
      console.error('Error sending interest:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <div className="w-9 h-9 border-[3px] border-[#111827] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-xl font-bold text-[#111827]">Creator profile not found</p>
        <button
          onClick={() => navigate('/matchmaking')}
          className="text-sm text-[#2563eb] font-semibold hover:underline"
        >
          ← Back to Matchmaking
        </button>
      </div>
    );
  }

  const isAPIVerified = !!creator.isAPIVerified;
  const subscribers = creator.follower_count || creator.subscriberCount || 0;
  const avgViews = creator.avg_views || creator.avgViewsLast10 || 0;
  const engagementRate = creator.engagement_rate || creator.engagementRate || 0;
  const velocityTrend = creator.velocityTrend || creator.viewership_velocity_trend || 'stable';
  const recentVideos: any[] = creator.recentVideos || [];

  // Normalize valuation data
  const rawValuation = creator.valuation;
  const fairRateCard =
    rawValuation?.fair_rate_card ||
    (rawValuation?.estimatedRate
      ? {
          base_integration_fee: rawValuation.estimatedRate,
          dedicated_video_fee: Math.round(rawValuation.estimatedRate * 2.5),
          shorts_fee: Math.round(rawValuation.estimatedRate * 0.4),
          max_market_rate: Math.round(rawValuation.estimatedRate * 1.5),
        }
      : null);

  const justification =
    rawValuation?.data_justification ||
    (rawValuation?.estimatedRate
      ? `BASED ON AN AVERAGE OF ${avgViews.toLocaleString()} VIEWS PER VIDEO, YOUR ${creator.niche || 'NICHE'} CHANNEL IS HIGHLY VALUED. THE CURRENT ESTIMATED MARKET CPM FOR YOUR TARGETED AUDIENCE IS ROUGHLY ₹${rawValuation.ratePer1k}. AS A TARGETED CREATOR, BRANDS ARE WILLING TO PAY A PREMIUM FOR YOUR NICHE AUDIENCE.`
      : null);

  const portfolio: any[] = creator.portfolio || [];
  const lastSyncedAt = creator.lastSyncedAt || creator.youtubeData?.verifiedAt;

  const trendColor =
    velocityTrend === 'accelerating'
      ? 'text-green-600'
      : velocityTrend === 'declining'
        ? 'text-red-500'
        : 'text-[#6b7280]';
  const trendLabel =
    velocityTrend === 'accelerating'
      ? '↑ Growing'
      : velocityTrend === 'declining'
        ? '↓ Declining'
        : '→ Stable';

  return (
    <div
      className="min-h-screen bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pb-16"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Sticky Nav */}
      <div className="sticky top-0 z-50 bg-white border-b-2 border-black px-6 py-4 flex items-center justify-between shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[10px] font-black text-black hover:text-indigo-600 uppercase tracking-widest transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> BACK
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white bg-indigo-600 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-5 py-2.5 rounded-lg hover:-translate-y-0.5 hover:bg-indigo-700 active:translate-y-0 active:shadow-none transition-all"
        >
          <MessageSquare className="w-4 h-4" /> EXPRESS INTEREST
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Profile Info & Recent Content */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Hero Profile Card */}
            <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="h-32 bg-slate-900 border-b-2 border-black relative overflow-hidden">
                {creator.youtubeData?.bannerUrl ? (
                  <img
                    src={creator.youtubeData.bannerUrl}
                    alt="Channel Banner"
                    className="w-full h-full object-cover opacity-90"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
                )}
              </div>
              <div className="px-6 pb-6 relative -mt-10 text-center">
                <div className="w-20 h-20 mx-auto rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-gray-100 flex items-center justify-center text-2xl font-black text-black mb-4">
                  {creator.youtubeData?.thumbnailUrl || creator.channelThumbnail ? (
                    <img
                      src={
                        creator.youtubeData?.thumbnailUrl ||
                        creator.channelThumbnail ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name || 'C')}&background=f3f4f6&color=000`
                      }
                      alt={creator.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name || 'C')}&background=f3f4f6&color=000`;
                      }}
                    />
                  ) : (
                    creator.name?.charAt(0)?.toUpperCase() || '?'
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 flex-wrap justify-center mb-1">
                    <h1 className="text-xl font-black text-black uppercase tracking-tight">
                      {creator.youtubeData?.channelName || creator.name || 'Creator'}
                    </h1>
                    {isAPIVerified && (
                      <span className="flex items-center gap-1 text-[9px] font-black text-black bg-[#a3e635] border-2 border-black px-1.5 py-0.5 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-widest">
                        <CheckCircle2 className="w-3 h-3" /> API Verified
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 mb-4 uppercase tracking-widest">
                    {creator.handle ||
                      `@${(creator.youtubeData?.channelName || creator.name)?.toLowerCase().replace(/\s+/g, '') || 'creator'}`}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {Array.isArray(creator.niche) ? (
                      creator.niche.map((n: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-[10px] font-black text-black bg-gray-100 border border-gray-200 px-2 py-1 rounded uppercase tracking-widest"
                        >
                          {n}
                        </span>
                      ))
                    ) : creator.niche ? (
                      <span className="text-[10px] font-black text-black bg-gray-100 border border-gray-200 px-2 py-1 rounded uppercase tracking-widest">
                        {creator.niche}
                      </span>
                    ) : null}
                    <span className="text-[10px] font-black text-black bg-gray-100 border border-gray-200 px-2 py-1 rounded flex items-center gap-1 uppercase tracking-widest">
                      {creator.platform === 'Instagram' ? (
                        <Camera className="w-3 h-3 text-pink-500" />
                      ) : (
                        <Video className="w-3 h-3 text-red-500" />
                      )}
                      {creator.platform || 'YouTube'}
                    </span>
                    {creator.language && (
                      <span className="text-[10px] font-black text-black bg-gray-100 border border-gray-200 px-2 py-1 rounded uppercase tracking-widest">
                        {creator.language}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-black px-2 py-1 rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-widest ${velocityTrend === 'accelerating' ? 'bg-[#a3e635] text-black' : velocityTrend === 'declining' ? 'bg-red-500 text-white' : 'bg-white text-black shadow-none border-gray-200'}`}
                    >
                      <TrendingUp className="w-3 h-3 inline mr-1" />
                      {trendLabel}
                    </span>
                  </div>
                </div>

                {creator.bio && (
                  <p className="text-[10px] font-bold text-gray-500 mt-5 leading-relaxed border-t-2 border-gray-100 pt-5 text-left uppercase tracking-widest">
                    {creator.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Recent YouTube Videos (Moved to left column) */}
            {recentVideos.length > 0 && (
              <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5">
                <h2 className="text-[10px] font-black text-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Video className="w-3.5 h-3.5" /> RECENT CONTENT
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {recentVideos.slice(0, 3).map((video: any, idx: number) => (
                    <a
                      key={idx}
                      href={`https://youtube.com/watch?v=${video.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex gap-3 border-2 border-gray-100 hover:border-black rounded-lg overflow-hidden transition-all"
                    >
                      <div className="relative w-24 shrink-0 bg-gray-100">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                          <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div className="p-2 py-3 flex-1 min-w-0">
                        <p className="text-[10px] font-black text-black line-clamp-2 leading-snug mb-2 uppercase tracking-wide">
                          {video.title}
                        </p>
                        <div className="flex items-center justify-between text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                          <span>
                            {video.viewCount >= 1000
                              ? `${(video.viewCount / 1000).toFixed(0)}K`
                              : video.viewCount}{' '}
                            views
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {new Date(video.publishedAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Metrics & Analytics */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Metrics Row */}
            {creator.youtubeData ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 md:col-span-4 flex items-center justify-between mb-1 mt-2">
                  <h2 className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> CHANNEL ANALYTICS
                  </h2>
                  <button
                    onClick={() => setShowCalcModal(true)}
                    className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-white border-2 border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-2 py-1 rounded hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all flex items-center gap-1"
                  >
                    <Calculator className="w-3 h-3" /> HOW WE CALCULATE
                  </button>
                </div>
                <div className="col-span-2 md:col-span-4 bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {creator.youtubeData?.thumbnailUrl ? (
                      <img
                        src={
                          creator.youtubeData?.thumbnailUrl ||
                          creator.channelThumbnail ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name || 'C')}&background=f3f4f6&color=000`
                        }
                        alt="Channel Logo"
                        className="w-14 h-14 rounded-full object-cover border-2 border-black"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name || 'C')}&background=f3f4f6&color=000`;
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center border-2 border-red-100">
                        <Users className="w-6 h-6 text-red-600" />
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-3xl font-black text-black">
                        {subscribers >= 1000000
                          ? `${(subscribers / 1000000).toFixed(1)}M`
                          : subscribers >= 1000
                            ? `${(subscribers / 1000).toFixed(1)}K`
                            : subscribers}
                      </p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                        {isAPIVerified ? 'VERIFIED SUBSCRIBERS' : 'SUBSCRIBERS'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Long Form */}
                <div className="col-span-2 bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5">
                  <p className="text-[10px] font-black text-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5" /> LONG FORM VIDEOS
                  </p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-black text-black">
                        {creator.youtubeData.longFormAvgViews
                          ? creator.youtubeData.longFormAvgViews >= 1000000
                            ? `${(creator.youtubeData.longFormAvgViews / 1000000).toFixed(1)}M`
                            : creator.youtubeData.longFormAvgViews >= 1000
                              ? `${(creator.youtubeData.longFormAvgViews / 1000).toFixed(1)}K`
                              : creator.youtubeData.longFormAvgViews
                          : '—'}
                      </p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                        AVG VIEWS
                      </p>
                    </div>
                    <div className="text-right border-l-2 border-gray-100 pl-4">
                      <p className="text-2xl font-black text-black">
                        {creator.youtubeData.longFormEngagement
                          ? `${creator.youtubeData.longFormEngagement.toFixed(1)}%`
                          : '—'}
                      </p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                        ENGAGEMENT
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shorts */}
                <div className="col-span-2 bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5">
                  <p className="text-[10px] font-black text-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> YOUTUBE SHORTS
                  </p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-black text-black">
                        {creator.youtubeData.shortsAvgViews
                          ? creator.youtubeData.shortsAvgViews >= 1000000
                            ? `${(creator.youtubeData.shortsAvgViews / 1000000).toFixed(1)}M`
                            : creator.youtubeData.shortsAvgViews >= 1000
                              ? `${(creator.youtubeData.shortsAvgViews / 1000).toFixed(1)}K`
                              : creator.youtubeData.shortsAvgViews
                          : '—'}
                      </p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                        AVG VIEWS
                      </p>
                    </div>
                    <div className="text-right border-l-2 border-gray-100 pl-4">
                      <p className="text-2xl font-black text-black">
                        {creator.youtubeData.shortsEngagement
                          ? `${creator.youtubeData.shortsEngagement.toFixed(1)}%`
                          : '—'}
                      </p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                        ENGAGEMENT
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 text-center">
                  <p className="text-2xl font-black text-black">
                    {subscribers >= 1000000
                      ? `${(subscribers / 1000000).toFixed(1)}M`
                      : subscribers >= 1000
                        ? `${(subscribers / 1000).toFixed(1)}K`
                        : subscribers}
                  </p>
                  <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest flex items-center justify-center gap-1">
                    <Users className="w-3 h-3" /> {isAPIVerified ? 'VERIFIED SUBS' : 'SUBS'}
                  </p>
                </div>
                <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 text-center">
                  <p className="text-2xl font-black text-black">
                    {avgViews >= 1000000
                      ? `${(avgViews / 1000000).toFixed(1)}M`
                      : avgViews >= 1000
                        ? `${(avgViews / 1000).toFixed(1)}K`
                        : avgViews || '—'}
                  </p>
                  <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest flex items-center justify-center gap-1">
                    <BarChart3 className="w-3 h-3" /> AVG VIEWS
                  </p>
                </div>
                <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 text-center">
                  <p className="text-2xl font-black text-black">
                    {engagementRate
                      ? `${typeof engagementRate === 'number' ? engagementRate.toFixed(1) : engagementRate}%`
                      : '—'}
                  </p>
                  <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest flex items-center justify-center gap-1">
                    <TrendingUp className="w-3 h-3" /> ENGAGEMENT
                  </p>
                </div>
              </div>
            )}

            {/* Data freshness notice */}
            {isAPIVerified && lastSyncedAt && (
              <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">
                <Clock className="w-3.5 h-3.5" />
                Metrics verified via API — Synced{' '}
                {new Date(lastSyncedAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            )}
            {!isAPIVerified && (
              <div className="text-[10px] text-black font-black uppercase tracking-widest flex items-center gap-2 bg-[#fbbf24] border-2 border-black rounded-xl px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mt-2">
                <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                Metrics are self-reported or estimated. API verification pending.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              {/* Rate Card */}
              {fairRateCard && (
                <div className="bg-[#111827] rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 text-white flex flex-col h-full">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                    FAIR RATE CARD
                  </p>
                  <div className="space-y-4">
                    {fairRateCard.base_integration_fee !== null && (
                      <>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            INTEGRATION (60s)
                          </p>
                          <p className="text-xl font-black">
                            {formatRupee(fairRateCard.base_integration_fee)}
                          </p>
                        </div>
                        <div className="border-t border-white/20 pt-4">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            DEDICATED VIDEO
                          </p>
                          <p className="text-xl font-black">
                            {formatRupee(fairRateCard.dedicated_video_fee)}
                          </p>
                        </div>
                      </>
                    )}
                    {fairRateCard.shorts_fee !== null && fairRateCard.shorts_fee > 0 && (
                      <div
                        className={
                          fairRateCard.base_integration_fee !== null
                            ? 'border-t border-white/20 pt-4'
                            : ''
                        }
                      >
                        <p className="text-[10px] font-bold text-[#a3e635] uppercase tracking-widest">
                          YOUTUBE SHORTS
                        </p>
                        <p className="text-xl font-black">{formatRupee(fairRateCard.shorts_fee)}</p>
                      </div>
                    )}
                    {fairRateCard.max_market_rate !== null && fairRateCard.max_market_rate > 0 && (
                      <div className="border-t border-white/20 pt-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          MAX MARKET RATE
                        </p>
                        <p className="text-lg font-black text-white opacity-90">
                          {formatRupee(fairRateCard.max_market_rate)}
                        </p>
                      </div>
                    )}
                  </div>
                  {isAPIVerified && (
                    <p className="text-[10px] font-black text-[#a3e635] uppercase tracking-widest mt-auto pt-6 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> BASED ON REAL API DATA
                    </p>
                  )}
                </div>
              )}

              {/* Justification */}
              {justification && (
                <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col justify-between h-full">
                  <div>
                    <p className="text-[10px] font-black text-black uppercase tracking-widest mb-3">
                      WHY THIS RATE
                    </p>
                    <p className="text-xs font-bold text-gray-500 leading-relaxed uppercase tracking-widest">
                      {justification}
                    </p>
                  </div>
                  {rawValuation?.revenue_leakage_annual > 0 && (
                    <div className="mt-6 bg-[#ef4444] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl p-4">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">
                        Est. annual underpricing
                      </p>
                      <p className="text-base font-black text-white mt-0.5">
                        -{formatRupee(rawValuation.revenue_leakage_annual)}/YR
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Portfolio */}
            {portfolio.length > 0 && (
              <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mt-2">
                <h2 className="text-[10px] font-black text-black uppercase tracking-widest mb-4">
                  PAST BRAND WORK
                </h2>
                <div className="space-y-4">
                  {portfolio.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-3 bg-white border-2 border-gray-100 hover:border-black transition-colors rounded-xl p-4"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-black text-black uppercase tracking-widest">
                          {item.title}
                        </p>
                        <p className="text-[10px] font-bold text-gray-500 mt-0.5 uppercase tracking-widest">
                          {item.brandName}
                        </p>
                        {item.description && (
                          <p className="text-[10px] text-gray-500 mt-2">{item.description}</p>
                        )}
                      </div>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-black hover:text-indigo-600 border-2 border-black bg-white rounded p-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Express Interest Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full overflow-hidden">
            <div className="px-7 py-5 border-b-4 border-black bg-[#fde047] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-black uppercase tracking-tight">
                  Connect with {creator.youtubeData?.channelName || creator.name}
                </h2>
                <p className="text-[10px] font-bold text-gray-800 mt-0.5 uppercase tracking-widest">
                  Send a message and express interest for a campaign
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-black hover:text-red-600 text-2xl font-black leading-none transition-colors"
              >
                ✕
              </button>
            </div>

            {sent ? (
              <div className="py-12 text-center px-7 bg-[#f9fafb]">
                <CheckCircle2 className="w-12 h-12 text-[#a3e635] mx-auto mb-3" />
                <p className="text-base font-black text-black uppercase tracking-tight">
                  Message sent!
                </p>
                <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">
                  Redirecting to messages…
                </p>
              </div>
            ) : (
              <div className="p-7 space-y-6 bg-white">
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">
                    Select Campaign
                  </label>
                  {brandCampaigns.length === 0 ? (
                    <div className="bg-gray-100 border-2 border-black rounded-lg p-4 text-[10px] font-bold text-black uppercase tracking-widest text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      No active campaigns.{' '}
                      <a
                        href="/create-campaign"
                        className="text-indigo-600 font-black hover:underline"
                      >
                        Create one first
                      </a>
                    </div>
                  ) : (
                    <select
                      className="w-full px-4 py-3 border-2 border-black rounded-lg text-sm font-bold text-black bg-white focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                      value={selectedCampaignId}
                      onChange={(e) => setSelectedCampaignId(e.target.value)}
                    >
                      {brandCampaigns.map((camp) => (
                        <option key={camp.id} value={camp.id}>
                          {camp.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">
                    Your Message
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border-2 border-black rounded-lg text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all resize-none"
                    rows={4}
                    placeholder={`Hi ${creator.youtubeData?.channelName || creator.name?.split(' ')[0] || 'there'}! We love your content and think you'd be a great fit for our campaign…`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={sending}
                    className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-black bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExpressInterest}
                    disabled={sending || !selectedCampaignId || !message.trim()}
                    className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-white bg-indigo-600 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : (
                      'Send Message'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <CalculationModal
        isOpen={showCalcModal}
        onClose={() => setShowCalcModal(false)}
        breakdown={creator?.valuation?.breakdown}
      />
    </div>
  );
}
