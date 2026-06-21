import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useShortlist } from '../../hooks/useShortlist';
import { useAuth } from '../auth/AuthContext';
import {
  ArrowLeft,
  Users,
  TrendingUp,
  Video,
  CheckCircle2,
  BarChart2,
  IndianRupee,
  Zap,
  Trophy,
} from 'lucide-react';

function fmt(n: number): string {
  if (!n) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtRupee(n: number): string {
  if (!n) return '—';
  return `₹${n.toLocaleString('en-IN')}`;
}

function estimateCPM(niche: string): number {
  const n = niche.toLowerCase();
  if (n.includes('finance') || n.includes('crypto')) return 280;
  if (n.includes('tech') || n.includes('b2b')) return 220;
  if (n.includes('edtech') || n.includes('education')) return 200;
  if (n.includes('health') || n.includes('fitness')) return 180;
  if (n.includes('beauty') || n.includes('fashion')) return 160;
  if (n.includes('gaming')) return 130;
  if (n.includes('food') || n.includes('travel')) return 120;
  return 130;
}

export default function CreatorCompare() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { shortlisted } = useShortlist(currentUser?.uid);

  const [allCreators, setAllCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(collection(db, 'creators'));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAllCreators(data);
        // Auto-select up to 3 from shortlist
        if (shortlisted.length > 0) {
          setSelectedIds(shortlisted.slice(0, 4));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [shortlisted]);

  const selectedCreators = allCreators.filter((c) => selectedIds.includes(c.id));
  const shortlistedCreators = allCreators.filter((c) => shortlisted.includes(c.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev,
    );
  };

  // Compute averages for delta display
  const avgER =
    selectedCreators.length > 0
      ? selectedCreators.reduce((sum, c) => sum + (parseFloat(c.engagement_rate || c.engagementRate) || 0), 0) /
        selectedCreators.length
      : 0;
  const avgFollowers =
    selectedCreators.length > 0
      ? selectedCreators.reduce((sum, c) => sum + (c.follower_count || 0), 0) / selectedCreators.length
      : 0;
  const avgViews =
    selectedCreators.length > 0
      ? selectedCreators.reduce((sum, c) => sum + (c.avg_views || c.avgViewsLast10 || 0), 0) /
        selectedCreators.length
      : 0;

  const metrics = [
    { key: 'Subscribers', icon: Users, getValue: (c: any) => c.follower_count || 0, format: fmt, avgVal: avgFollowers, higherIsBetter: true },
    { key: 'Avg Views', icon: Video, getValue: (c: any) => c.avg_views || c.avgViewsLast10 || 0, format: fmt, avgVal: avgViews, higherIsBetter: true },
    { key: 'Eng. Rate', icon: TrendingUp, getValue: (c: any) => parseFloat(c.engagement_rate || c.engagementRate) || 0, format: (v: number) => v ? `${v.toFixed(1)}%` : '—', avgVal: avgER, higherIsBetter: true },
    { key: 'Est. CPM', icon: IndianRupee, getValue: (c: any) => { const avg = c.avg_views || c.avgViewsLast10 || 0; const cpm = estimateCPM(c.niche || ''); return avg > 0 ? Math.round((avg / 1000) * cpm / avg * 1000) : 0; }, format: (v: number) => v ? `₹${v}` : '—', avgVal: 0, higherIsBetter: false },
    { key: 'Deal Rate', icon: BarChart2, getValue: (c: any) => c.valuation?.fair_rate_card?.base_integration_fee || 0, format: fmtRupee, avgVal: 0, higherIsBetter: false },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0f3460] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pb-16"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Header */}
      <div className="bg-white border-b-2 border-black px-6 lg:px-10 py-5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/matchmaking')}
            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Matchmaking
          </button>
          <div className="h-5 w-0.5 bg-black" />
          <div>
            <h1 className="text-xl font-black text-black uppercase tracking-tight flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" /> Creator Comparison
            </h1>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Compare up to 4 creators side-by-side
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Shortlist Selector */}
        {shortlistedCreators.length > 0 && (
          <div className="bg-white border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">
              Select from Your Shortlist (max 4)
            </h2>
            <div className="flex flex-wrap gap-2">
              {shortlistedCreators.map((c) => {
                const selected = selectedIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleSelect(c.id)}
                    className={`flex items-center gap-2 px-3 py-2 border-2 border-black rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 ${
                      selected ? 'bg-[#0f3460] text-white' : 'bg-white text-black'
                    }`}
                  >
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || 'C')}&background=e0e7ff&color=312e81`}
                      alt={c.name}
                      className="w-5 h-5 rounded-full border border-black"
                    />
                    {c.name}
                    {selected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedCreators.length < 2 ? (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-16 text-center">
            <BarChart2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
              Select at least 2 creators to compare
            </p>
            <p className="text-[10px] font-bold text-gray-400 mt-2">
              Shortlist creators from the matchmaking page first
            </p>
          </div>
        ) : (
          <>
            {/* Creator headers */}
            <div className="bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="grid border-b-2 border-black" style={{ gridTemplateColumns: `200px repeat(${selectedCreators.length}, 1fr)` }}>
                <div className="p-5 border-r-2 border-black bg-gray-50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Metric</p>
                </div>
                {selectedCreators.map((c) => {
                  const isVerified = c.channelVerified || c.isAPIVerified || c.is_verified;
                  return (
                    <div key={c.id} className="p-5 border-r-2 border-black last:border-r-0 text-center">
                      <img
                        src={
                          c.youtubeData?.thumbnailUrl ||
                          c.channelThumbnail ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || 'C')}&background=ffffff&color=000`
                        }
                        alt={c.name}
                        className="w-12 h-12 rounded-full border-2 border-black mx-auto mb-2 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <p className="text-sm font-black text-black truncate">{c.name}</p>
                      <p className="text-[9px] font-bold text-gray-500 mt-0.5">{c.handle || `@${c.name?.toLowerCase().replace(/\s+/g, '')}`}</p>
                      <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
                        {isVerified && (
                          <span className="text-[9px] text-[#4d7c0f] bg-[#ecfccb] border border-[#bef264] px-1.5 py-0.5 rounded font-black uppercase tracking-widest flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                          </span>
                        )}
                        {c.niche && (
                          <span className="inline-block text-[9px] font-black text-black bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded uppercase tracking-widest">
                            {Array.isArray(c.niche) ? c.niche[0] : c.niche}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/creator/${c.id}`)}
                        className="mt-3 text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-900 transition-colors"
                      >
                        View Profile →
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Metrics rows */}
              {metrics.map((metric, mIdx) => {
                const values = selectedCreators.map((c) => metric.getValue(c));
                const maxVal = Math.max(...values);
                const minVal = Math.min(...values.filter((v) => v > 0));

                return (
                  <div
                    key={metric.key}
                    className={`grid border-b-2 border-gray-100 last:border-b-0 ${mIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    style={{ gridTemplateColumns: `200px repeat(${selectedCreators.length}, 1fr)` }}
                  >
                    <div className="p-4 border-r-2 border-black flex items-center gap-2">
                      <metric.icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                        {metric.key}
                      </span>
                    </div>
                    {selectedCreators.map((c, cIdx) => {
                      const val = values[cIdx];
                      const isBest = metric.higherIsBetter ? val === maxVal && maxVal > 0 : val === minVal && minVal > 0;
                      const delta = metric.avgVal > 0 && val > 0 ? ((val - metric.avgVal) / metric.avgVal) * 100 : null;

                      return (
                        <div
                          key={c.id}
                          className={`p-4 border-r-2 border-gray-100 last:border-r-0 text-center ${isBest ? 'bg-[#f0fdf4]' : ''}`}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            {isBest && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
                            <p className={`text-base font-black ${isBest ? 'text-emerald-700' : 'text-black'}`}>
                              {metric.format(val)}
                            </p>
                          </div>
                          {delta !== null && (
                            <p className={`text-[9px] font-bold mt-1 ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                              {delta > 0 ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`} vs avg
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* Language & Verified row */}
              <div className="grid border-t-2 border-black bg-gray-50" style={{ gridTemplateColumns: `200px repeat(${selectedCreators.length}, 1fr)` }}>
                <div className="p-4 border-r-2 border-black flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Language</span>
                </div>
                {selectedCreators.map((c) => (
                  <div key={c.id} className="p-4 border-r-2 border-gray-100 last:border-r-0 text-center">
                    <p className="text-sm font-black text-black">{c.language || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action row */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedCreators.length}, 1fr)` }}>
              {selectedCreators.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/creator/${c.id}`)}
                  className="bg-[#0f3460] hover:bg-[#1a4a82] text-white border-2 border-black font-black py-3.5 rounded-xl uppercase tracking-widest text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
                >
                  View {c.name?.split(' ')[0]}'s Profile
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
