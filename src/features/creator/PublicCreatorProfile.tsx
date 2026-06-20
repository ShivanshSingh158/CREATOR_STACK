import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  Users,
  TrendingUp,
  Play,
  CheckCircle2,
  Shield,
  ExternalLink,
  ArrowLeft,
  Star,
  Lock,
  Zap,
  BarChart2,
  Link2,
} from 'lucide-react';

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-black">{value}</p>
      {sub && (
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
          {sub}
        </p>
      )}
    </div>
  );
}

function fmt(n: number): string {
  if (!n) return '—';
  if (n >= 10_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 100_000) return `${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtRate(n: number): string {
  if (!n) return '—';
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function PublicCreatorProfile() {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const [creator, setCreator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [completedDeals, setCompletedDeals] = useState(0);

  useEffect(() => {
    if (!handle) return;
    const fetchCreator = async () => {
      try {
        // First try to look up by handle field in creators collection
        const q = query(collection(db, 'creators'), where('handle', '==', handle));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = { id: snap.docs[0].id, ...snap.docs[0].data() };
          setCreator(data);

          // Count completed deals
          const appsQ = query(
            collection(db, 'applications'),
            where('creatorId', '==', snap.docs[0].id),
            where('status', '==', 'contracted'),
          );
          const appsSnap = await getDocs(appsQ);
          setCompletedDeals(appsSnap.size);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCreator();
  }, [handle]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !creator) {
    return (
      <div
        className="min-h-screen bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center p-4"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl p-10 w-full max-w-md text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h1 className="text-xl font-black text-black uppercase tracking-tight mb-2">
            Creator not found
          </h1>
          <p className="text-sm font-medium text-gray-600 mb-6">
            The handle <span className="font-black text-indigo-600">@{handle}</span> doesn't exist
            on CreatorStack yet.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
          >
            Go to CreatorStack
          </button>
        </div>
      </div>
    );
  }

  const channelName = creator.youtubeData?.channelName || creator.name;
  const thumbnail = creator.youtubeData?.thumbnailUrl || creator.channelThumbnail;
  const followers = creator.follower_count || creator.youtubeData?.subscriberCount || 0;
  const avgViews = creator.avg_views || creator.avgViewsLast10 || 0;
  const engRate = creator.engagement_rate || 0;
  const niche = creator.niche || '';
  const language = creator.language || '';
  const bio = creator.bio || creator.youtubeData?.description || '';
  const isVerified = creator.channelVerified || creator.isAPIVerified;
  const fairRate = creator.valuation?.fair_rate_card?.base_integration_fee;
  const recentVideos = creator.recentVideos || creator.youtubeData?.recentVideos || [];
  const channelUrl =
    creator.profileUrl ||
    creator.channelUrl ||
    (creator.channelId ? `https://youtube.com/channel/${creator.channelId}` : null);

  return (
    <div
      className="min-h-screen bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pb-16"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Back bar */}
      <div className="bg-white border-b-2 border-black px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="h-5 w-0.5 bg-black" />
          <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
            Creator Profile
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Hero Card */}
        <div className="bg-white border-2 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="h-2 bg-indigo-600" />
          <div className="p-7 flex flex-col sm:flex-row items-start gap-6">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={channelName}
                className="w-24 h-24 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] object-cover shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-indigo-100 flex items-center justify-center shrink-0">
                <Play className="w-10 h-10 text-indigo-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl font-black text-black">{channelName}</h1>
                {isVerified && (
                  <span className="flex items-center gap-1 text-[10px] font-black bg-emerald-100 border-2 border-black text-emerald-800 px-2 py-0.5 rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <CheckCircle2 className="w-3 h-3" /> YouTube Verified
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-indigo-600 mb-3">@{creator.handle}</p>
              {bio && (
                <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">{bio}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {niche && (
                  <span className="text-[10px] font-black bg-indigo-50 border-2 border-black text-indigo-700 px-2.5 py-1 rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {niche}
                  </span>
                )}
                {language && (
                  <span className="text-[10px] font-black bg-slate-100 border-2 border-black text-slate-700 px-2.5 py-1 rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {language}
                  </span>
                )}
                {channelUrl && (
                  <a
                    href={channelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-black bg-red-50 border-2 border-black text-red-700 px-2.5 py-1 rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <Play className="w-3 h-3" /> YouTube <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Subscribers" value={fmt(followers)} />
          <StatCard label="Avg Views" value={fmt(avgViews)} sub="per video" />
          <StatCard label="Engagement" value={engRate ? `${engRate.toFixed(1)}%` : '—'} />
          <StatCard label="Deals Done" value={completedDeals > 0 ? String(completedDeals) : '—'} />
        </div>

        {/* Rate Card */}
        {fairRate ? (
          <div className="bg-indigo-600 border-2 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-7 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> Integration Rate
              </p>
              <p className="text-4xl font-black text-white">{fmtRate(fairRate)}</p>
              <p className="text-[10px] font-bold text-indigo-300 mt-1 uppercase tracking-widest">
                Per dedicated integration · calculated by AI
              </p>
            </div>
            <div className="bg-white/10 border-2 border-white/30 rounded-xl px-6 py-4 text-center">
              <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">
                Platform
              </p>
              <p className="text-sm font-black text-white">CreatorStack Escrow</p>
              <p className="text-[10px] font-bold text-indigo-300 mt-0.5 uppercase tracking-widest">
                Protected · TDS Compliant
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl p-7 text-center">
            <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-black text-slate-600 uppercase tracking-widest">
              Rate Card Locked
            </p>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Rate card is shared privately via CreatorStack Deal Room
            </p>
          </div>
        )}

        {/* Recent Videos */}
        {recentVideos.length > 0 && (
          <div className="bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="px-6 py-4 border-b-2 border-black bg-slate-50 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-black text-black uppercase tracking-wide">
                Recent Content
              </h2>
            </div>
            <div className="divide-y-2 divide-gray-100">
              {recentVideos.slice(0, 5).map((v: any, i: number) => (
                <div
                  key={i}
                  className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black truncate">
                      {v.title || 'Untitled Video'}
                    </p>
                    {v.publishedAt && (
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                        {new Date(v.publishedAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {v.viewCount && (
                      <p className="text-sm font-black text-black">
                        {fmt(Number(v.viewCount))} views
                      </p>
                    )}
                    {v.videoId && (
                      <a
                        href={`https://youtube.com/watch?v=${v.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 justify-end mt-0.5"
                      >
                        Watch <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-black border-2 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(79,70,229,1)] p-8 text-center">
          <Shield className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">
            Work with {channelName?.split(' ')[0]}
          </h2>
          <p className="text-sm font-medium text-gray-400 mb-6 max-w-md mx-auto">
            All deals on CreatorStack are escrow-protected. Your payment is locked before production
            begins — fully TDS-compliant.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/signup"
              className="px-8 py-3 bg-indigo-600 text-white text-sm font-black uppercase tracking-widest border-2 border-white rounded-xl shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)] transition-all"
            >
              Start a Campaign →
            </a>
            <a
              href="/login"
              className="px-8 py-3 bg-white text-black text-sm font-black uppercase tracking-widest border-2 border-white rounded-xl shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 transition-all"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
