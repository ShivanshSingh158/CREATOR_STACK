import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Video, Camera, TrendingUp, Users, BarChart3, Clock, ExternalLink, MessageSquare, Play, Calendar, Calculator } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
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
      getDocs(query(collection(db, 'campaigns'), where('brandId', '==', currentUser.uid))).then(snap => {
        const camps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setBrandCampaigns(camps);
        if (camps.length > 0) setSelectedCampaignId(camps[0].id);
      });
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
        where('creatorId', '==', creator.id)
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
        where('creatorId', '==', creator.id)
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
        <button onClick={() => navigate('/matchmaking')} className="text-sm text-[#2563eb] font-semibold hover:underline">← Back to Matchmaking</button>
      </div>
    );
  }

  const isAPIVerified = !!creator.isAPIVerified;
  const subscribers = creator.follower_count || creator.subscriberCount || 0;
  const avgViews = creator.avg_views || creator.avgViewsLast10 || 0;
  const engagementRate = creator.engagement_rate || creator.engagementRate || 0;
  const velocityTrend = creator.velocityTrend || creator.viewership_velocity_trend || 'stable';
  const recentVideos: any[] = creator.recentVideos || [];
  const valuation = creator.valuation;
  const portfolio: any[] = creator.portfolio || [];
  const lastSyncedAt = creator.lastSyncedAt;

  const trendColor = velocityTrend === 'accelerating' ? 'text-green-600' : velocityTrend === 'declining' ? 'text-red-500' : 'text-[#6b7280]';
  const trendLabel = velocityTrend === 'accelerating' ? '↑ Growing' : velocityTrend === 'declining' ? '↓ Declining' : '→ Stable';

  return (
    <div className="min-h-screen bg-[#f9fafb] pb-16" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Sticky Nav */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#e5e7eb] px-6 py-3.5 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-[#6b7280] hover:text-[#111827] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 text-sm font-semibold text-white bg-[#111827] px-5 py-2.5 rounded-xl hover:bg-black transition-colors"
        >
          <MessageSquare className="w-4 h-4" /> Express Interest
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">

        {/* Hero Profile Card */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm overflow-hidden mb-5">
          <div className="h-32 bg-slate-900 border-b border-[#e5e7eb] relative overflow-hidden">
            {creator.youtubeData?.bannerUrl ? (
              <img src={creator.youtubeData.bannerUrl} alt="Channel Banner" className="w-full h-full object-cover opacity-90" referrerPolicy="no-referrer" />
            ) : (
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
            )}
          </div>
          <div className="px-7 pb-8 relative -mt-10">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-2xl border-2 border-white shadow-sm overflow-hidden shrink-0 bg-[#f3f4f6] flex items-center justify-center text-2xl font-bold text-[#374151]">
                {creator.youtubeData?.thumbnailUrl || creator.channelThumbnail ? (
                  <img src={creator.youtubeData?.thumbnailUrl || creator.channelThumbnail} alt={creator.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  creator.name?.charAt(0)?.toUpperCase() || '?'
                )}
              </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-bold text-[#111827]">{creator.youtubeData?.channelName || creator.name || 'Creator'}</h1>
                {isAPIVerified && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> YouTube Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-[#6b7280] mb-3">{creator.handle || `@${(creator.youtubeData?.channelName || creator.name)?.toLowerCase().replace(/\s+/g, '') || 'creator'}`}</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-semibold text-[#374151] bg-[#f3f4f6] px-2.5 py-1 rounded-full">{creator.niche}</span>
                <span className="text-xs font-semibold text-[#374151] bg-[#f3f4f6] px-2.5 py-1 rounded-full flex items-center gap-1">
                  {creator.platform === 'Instagram' ? <Camera className="w-3 h-3 text-pink-500" /> : <Video className="w-3 h-3 text-red-500" />}
                  {creator.platform || 'YouTube'}
                </span>
                {creator.language && (
                  <span className="text-xs font-semibold text-[#374151] bg-[#f3f4f6] px-2.5 py-1 rounded-full">{creator.language}</span>
                )}
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${velocityTrend === 'accelerating' ? 'bg-green-50 text-green-700' : velocityTrend === 'declining' ? 'bg-red-50 text-red-600' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>
                  <TrendingUp className="w-3 h-3 inline mr-1" />{trendLabel}
                </span>
              </div>
            </div>
          </div>

            {creator.bio && (
              <p className="text-sm text-[#6b7280] mt-5 leading-relaxed border-t border-[#f3f4f6] pt-5">{creator.bio}</p>
            )}
          </div>
        </div>

        {/* Metrics Row */}
        {creator.youtubeData ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <div className="col-span-2 md:col-span-4 flex items-center justify-between mb-1 mt-2">
               <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2"><BarChart3 className="w-4 h-4 text-indigo-600" /> Channel Analytics</h2>
               <button 
                 onClick={() => setShowCalcModal(true)}
                 className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-md hover:bg-indigo-100 transition-colors flex items-center gap-1"
               >
                 <Calculator className="w-3 h-3" /> How we calculate
               </button>
            </div>
            <div className="col-span-2 md:col-span-4 bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {creator.youtubeData?.thumbnailUrl ? (
                  <img src={creator.youtubeData.thumbnailUrl} alt="Channel Logo" className="w-12 h-12 rounded-full object-cover border border-[#e5e7eb]" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
                    <Users className="w-6 h-6 text-red-600" />
                  </div>
                )}
                <div className="text-left">
                  <p className="text-2xl font-bold text-[#111827]">
                    {subscribers >= 1000000 ? `${(subscribers / 1000000).toFixed(1)}M` : subscribers >= 1000 ? `${(subscribers / 1000).toFixed(1)}K` : subscribers}
                  </p>
                  <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">{isAPIVerified ? 'Verified Subscribers' : 'Subscribers'}</p>
                </div>
              </div>
            </div>

            {/* Long Form */}
            <div className="col-span-2 bg-indigo-50/50 rounded-2xl border border-indigo-100 shadow-sm p-4">
              <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2 flex items-center gap-1"><Video className="w-3.5 h-3.5" /> Long Form Videos</p>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xl font-bold text-[#111827]">{creator.youtubeData.longFormAvgViews ? (creator.youtubeData.longFormAvgViews >= 1000000 ? `${(creator.youtubeData.longFormAvgViews / 1000000).toFixed(1)}M` : creator.youtubeData.longFormAvgViews >= 1000 ? `${(creator.youtubeData.longFormAvgViews / 1000).toFixed(1)}K` : creator.youtubeData.longFormAvgViews) : '—'}</p>
                  <p className="text-[10px] font-bold text-[#6b7280]">AVG VIEWS</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-[#111827]">{creator.youtubeData.longFormEngagement ? `${creator.youtubeData.longFormEngagement.toFixed(1)}%` : '—'}</p>
                  <p className="text-[10px] font-bold text-[#6b7280]">ENGAGEMENT</p>
                </div>
              </div>
            </div>

            {/* Shorts */}
            <div className="col-span-2 bg-rose-50/50 rounded-2xl border border-rose-100 shadow-sm p-4">
              <p className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> YouTube Shorts</p>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xl font-bold text-[#111827]">{creator.youtubeData.shortsAvgViews ? (creator.youtubeData.shortsAvgViews >= 1000000 ? `${(creator.youtubeData.shortsAvgViews / 1000000).toFixed(1)}M` : creator.youtubeData.shortsAvgViews >= 1000 ? `${(creator.youtubeData.shortsAvgViews / 1000).toFixed(1)}K` : creator.youtubeData.shortsAvgViews) : '—'}</p>
                  <p className="text-[10px] font-bold text-[#6b7280]">AVG VIEWS</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-[#111827]">{creator.youtubeData.shortsEngagement ? `${creator.youtubeData.shortsEngagement.toFixed(1)}%` : '—'}</p>
                  <p className="text-[10px] font-bold text-[#6b7280]">ENGAGEMENT</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-5 text-center">
              <p className="text-2xl font-bold text-[#111827]">
                {subscribers >= 1000000 ? `${(subscribers / 1000000).toFixed(1)}M` : subscribers >= 1000 ? `${(subscribers / 1000).toFixed(1)}K` : subscribers}
              </p>
              <p className="text-xs text-[#6b7280] mt-1 flex items-center justify-center gap-1"><Users className="w-3 h-3" /> {isAPIVerified ? 'Verified Subscribers' : 'Subscribers'}</p>
            </div>
            <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-5 text-center">
              <p className="text-2xl font-bold text-[#111827]">
                {avgViews >= 1000000 ? `${(avgViews / 1000000).toFixed(1)}M` : avgViews >= 1000 ? `${(avgViews / 1000).toFixed(1)}K` : avgViews || '—'}
              </p>
              <p className="text-xs text-[#6b7280] mt-1 flex items-center justify-center gap-1"><BarChart3 className="w-3 h-3" /> Avg Views</p>
            </div>
            <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-5 text-center">
              <p className="text-2xl font-bold text-[#111827]">{engagementRate ? `${typeof engagementRate === 'number' ? engagementRate.toFixed(1) : engagementRate}%` : '—'}</p>
              <p className="text-xs text-[#6b7280] mt-1 flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3" /> Engagement</p>
            </div>
          </div>
        )}

        {/* Data freshness notice */}
        {isAPIVerified && lastSyncedAt && (
          <div className="flex items-center gap-2 text-xs text-[#9ca3af] mb-5">
            <Clock className="w-3.5 h-3.5" />
            Metrics verified via YouTube Data API — Last synced {new Date(lastSyncedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        )}
        {!isAPIVerified && (
          <div className="mb-5 text-xs text-amber-600 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            This creator's metrics are self-reported or estimated. YouTube API verification pending.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          {/* Rate Card */}
          {valuation && (
            <div className="md:col-span-1 bg-[#111827] rounded-2xl p-6 text-white">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Fair Rate Card</p>
              <div className="space-y-4">
                {valuation.fair_rate_card.base_integration_fee !== null && (
                  <>
                    <div>
                      <p className="text-xs text-gray-400">Integration (60s)</p>
                      <p className="text-xl font-bold">{formatRupee(valuation.fair_rate_card.base_integration_fee)}</p>
                    </div>
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-xs text-gray-400">Dedicated Video</p>
                      <p className="text-xl font-bold">{formatRupee(valuation.fair_rate_card.dedicated_video_fee)}</p>
                    </div>
                  </>
                )}
                {valuation.fair_rate_card.shorts_fee !== null && (
                  <div className={valuation.fair_rate_card.base_integration_fee !== null ? "border-t border-white/10 pt-4" : ""}>
                    <p className="text-xs text-emerald-400">YouTube Shorts</p>
                    <p className="text-xl font-bold">{formatRupee(valuation.fair_rate_card.shorts_fee)}</p>
                  </div>
                )}
                {valuation.fair_rate_card.max_market_rate !== null && (
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-xs text-gray-400">Max Market Rate</p>
                    <p className="text-lg font-semibold text-[#d1b07c]">{formatRupee(valuation.fair_rate_card.max_market_rate)}</p>
                  </div>
                )}
              </div>
              {isAPIVerified && (
                <p className="text-xs text-green-400 mt-4 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Based on real API data
                </p>
              )}
            </div>
          )}

          {/* Justification */}
          {valuation?.data_justification && (
            <div className={`${valuation ? 'md:col-span-2' : 'md:col-span-3'} bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 flex flex-col justify-between`}>
              <div>
                <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-3">Why This Rate</p>
                <p className="text-sm text-[#374151] leading-relaxed">{valuation.data_justification}</p>
              </div>
              {valuation.revenue_leakage_annual > 0 && (
                <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-700">Estimated annual underpricing if not paying fair rate</p>
                  <p className="text-base font-bold text-red-600 mt-0.5">-{formatRupee(valuation.revenue_leakage_annual)}/yr</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent YouTube Videos */}
        {recentVideos.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 mb-5">
            <h2 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2">
              <Video className="w-4 h-4 text-red-500" /> Recent Content
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recentVideos.slice(0, 3).map((video: any, idx: number) => (
                <a
                  key={idx}
                  href={`https://youtube.com/watch?v=${video.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-xl overflow-hidden border border-[#e5e7eb] hover:border-[#d1b07c] transition-all"
                >
                  <div className="relative aspect-video bg-[#f3f4f6]">
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Play className="w-8 h-8 text-[#9ca3af]" /></div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                      <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-[#111827] line-clamp-2 leading-snug mb-2">{video.title}</p>
                    <div className="flex items-center justify-between text-xs text-[#9ca3af]">
                      <span>{video.viewCount >= 1000 ? `${(video.viewCount / 1000).toFixed(0)}K` : video.viewCount} views</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(video.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio */}
        {portfolio.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 mb-5">
            <h2 className="text-sm font-semibold text-[#374151] mb-4">Past Brand Work</h2>
            <div className="space-y-3">
              {portfolio.map((item: any, idx: number) => (
                <div key={idx} className="flex items-start justify-between gap-3 bg-[#f9fafb] rounded-xl p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#111827]">{item.title}</p>
                    <p className="text-xs text-[#6b7280] mt-0.5">{item.brandName}</p>
                    {item.description && <p className="text-xs text-[#9ca3af] mt-1">{item.description}</p>}
                  </div>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[#2563eb] hover:text-[#1d4ed8]">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Express Interest Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-7 py-5 border-b border-[#e5e7eb] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#111827]">Connect with {creator.youtubeData?.channelName || creator.name}</h2>
                <p className="text-xs text-[#6b7280] mt-0.5">Send a message and express interest for a campaign</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#9ca3af] hover:text-[#374151] text-xl leading-none">✕</button>
            </div>

            {sent ? (
              <div className="py-12 text-center px-7">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-base font-semibold text-[#111827]">Message sent!</p>
                <p className="text-sm text-[#6b7280] mt-1">Redirecting to messages…</p>
              </div>
            ) : (
              <div className="p-7 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wider mb-2">Select Campaign</label>
                  {brandCampaigns.length === 0 ? (
                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-4 text-sm text-[#6b7280] text-center">
                      No active campaigns.{' '}
                      <a href="/create-campaign" className="text-[#2563eb] font-semibold hover:underline">Create one first</a>
                    </div>
                  ) : (
                    <select
                      className="w-full px-4 py-3 border border-[#d1d5db] rounded-xl text-sm text-[#111827] bg-white focus:outline-none focus:border-[#2563eb]"
                      value={selectedCampaignId}
                      onChange={e => setSelectedCampaignId(e.target.value)}
                    >
                      {brandCampaigns.map(camp => (
                        <option key={camp.id} value={camp.id}>{camp.title}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wider mb-2">Your Message</label>
                  <textarea
                    className="w-full px-4 py-3 border border-[#d1d5db] rounded-xl text-sm text-[#111827] focus:outline-none focus:border-[#2563eb] resize-none"
                    rows={4}
                    placeholder={`Hi ${creator.youtubeData?.channelName || creator.name?.split(' ')[0] || 'there'}! We love your content and think you'd be a great fit for our campaign…`}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowModal(false)} disabled={sending} className="flex-1 py-3 text-sm font-semibold text-[#6b7280] bg-[#f3f4f6] rounded-xl hover:bg-[#e5e7eb] transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleExpressInterest}
                    disabled={sending || !selectedCampaignId || !message.trim()}
                    className="flex-1 py-3 text-sm font-semibold text-white bg-[#111827] rounded-xl hover:bg-black transition-colors disabled:opacity-50"
                  >
                    {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'Send Message'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <CalculationModal isOpen={showCalcModal} onClose={() => setShowCalcModal(false)} breakdown={creator?.valuation?.breakdown} />
    </div>
  );
}
