import React, { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal, CheckCircle2, Video, TrendingUp, Users, ArrowLeft, Clock, Zap } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../auth/AuthContext';

const NICHES = [
  "Technology", "Personal Finance", "Finance", "Beauty & Skincare",
  "EdTech", "Fashion", "Gaming", "Food", "Fitness", "Lifestyle",
  "B2B Tech", "Comedy & Entertainment", "Automotive", "Parenting",
  "Spirituality", "Travel", "Health"
];

const LANGUAGES = [
  "Hinglish", "Hindi", "English", "Tamil", "Telugu",
  "Bengali", "Marathi", "Gujarati", "Punjabi", "Kannada", "Malayalam", "Odia"
];

/** Estimate CPM (cost per 1000 views) based on niche */
function estimateCPM(niche: string): number {
  const n = niche.toLowerCase();
  if (n.includes('finance') || n.includes('crypto')) return 280;
  if (n.includes('tech') || n.includes('b2b')) return 220;
  if (n.includes('edtech') || n.includes('education')) return 200;
  if (n.includes('health') || n.includes('fitness')) return 180;
  if (n.includes('beauty') || n.includes('fashion')) return 160;
  if (n.includes('automotive')) return 200;
  if (n.includes('gaming')) return 130;
  if (n.includes('food') || n.includes('travel')) return 120;
  if (n.includes('lifestyle') || n.includes('parenting')) return 110;
  if (n.includes('comedy') || n.includes('entertainment')) return 100;
  return 130;
}

/** Estimate cost per 1000 views for a brand placing an ad */
function estimateBrandCPM(creator: any): number {
  const avgViews = creator.avg_views || creator.avgViewsLast10 || 0;
  if (avgViews === 0) return 0;
  const cpm = estimateCPM(creator.niche || '');
  const integrationFee = (avgViews / 1000) * cpm;
  return Math.round((integrationFee / avgViews) * 1000);
}

export default function MatchmakingEngine() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  const [allCreators, setAllCreators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [minFollowers, setMinFollowers] = useState(5000);
  const [maxFollowers, setMaxFollowers] = useState(500000);
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const snap = await getDocs(collection(db, 'creators'));
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllCreators(data);
      } catch (err) {
        console.error('Error fetching creators:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCreators();
  }, []);

  useEffect(() => {
    if (location.state?.prefillNiche && !selectedNiches.includes(location.state.prefillNiche)) {
      setSelectedNiches([location.state.prefillNiche]);
    }
  }, [location.state]);

  const toggleNiche = (niche: string) =>
    setSelectedNiches(prev => prev.includes(niche) ? prev.filter(n => n !== niche) : [...prev, niche]);

  const toggleLanguage = (lang: string) =>
    setSelectedLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);

  const filteredCreators = useMemo(() => {
    if (selectedNiches.length === 0 && !searchQuery) return allCreators;

    return allCreators.filter(c => {
      const followerCount = c.follower_count || 0;
      const searchLower = searchQuery.toLowerCase();

      const matchesSearch = !searchQuery ||
        c.name?.toLowerCase().includes(searchLower) ||
        c.handle?.toLowerCase().includes(searchLower) ||
        c.niche?.toLowerCase().includes(searchLower);

      const matchesFollowers = followerCount >= minFollowers && followerCount <= maxFollowers;

      const matchesNiche = selectedNiches.length === 0 ||
        selectedNiches.some(n => c.niche?.toLowerCase().includes(n.toLowerCase()));

      const matchesLang = selectedLanguages.length === 0 || selectedLanguages.includes(c.language);

      const matchesVerified = !verifiedOnly || c.isAPIVerified || c.is_verified;

      return matchesSearch && matchesFollowers && matchesNiche && matchesLang && matchesVerified;
    });
  }, [allCreators, searchQuery, minFollowers, maxFollowers, selectedNiches, selectedLanguages, verifiedOnly]);

  const formatFollowers = (n: number) =>
    n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Compact top bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-[#e5e7eb] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => navigate('/brand-dashboard')}
            className="flex items-center gap-1.5 text-sm font-medium text-[#6b7280] hover:text-[#111827] transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="h-4 w-px bg-[#e5e7eb]" />
          <h1 className="text-sm font-semibold text-[#111827] shrink-0">Find Creators</h1>

          {/* Search */}
          <div className="flex-1 relative max-w-xl">
            <Search className="w-4 h-4 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, niche, or handle…"
              className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#2563eb] transition-colors"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className="lg:hidden flex items-center gap-1.5 text-sm font-medium text-[#374151] px-3 py-2 border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb]"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters {selectedNiches.length > 0 && <span className="bg-[#111827] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{selectedNiches.length}</span>}
          </button>

          <span className="text-xs text-[#9ca3af] font-medium shrink-0 hidden md:block">
            {filteredCreators.length} creator{filteredCreators.length !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 gap-6">

        {/* Sidebar Filters */}
        <div className={`shrink-0 w-64 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-4 flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
            </h2>

            {/* Verified Only */}
            <div className="mb-5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  onClick={() => setVerifiedOnly(v => !v)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${verifiedOnly ? 'bg-[#111827]' : 'bg-[#e5e7eb]'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${verifiedOnly ? 'left-4' : 'left-0.5'}`} />
                </div>
                <span className="text-sm font-medium text-[#374151]">API-Verified only</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              </label>
            </div>

            {/* Followers Range */}
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-[#374151] mb-3">Followers</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-[#9ca3af] mb-1">
                    <span>Min</span><span className="font-medium text-[#374151]">{formatFollowers(minFollowers)}</span>
                  </div>
                  <input type="range" min="1000" max="500000" step="1000" value={minFollowers}
                    onChange={e => setMinFollowers(parseInt(e.target.value))}
                    className="w-full accent-[#111827]" />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-[#9ca3af] mb-1">
                    <span>Max</span><span className="font-medium text-[#374151]">{formatFollowers(maxFollowers)}</span>
                  </div>
                  <input type="range" min="1000" max="5000000" step="1000" value={maxFollowers}
                    onChange={e => setMaxFollowers(Math.max(minFollowers, parseInt(e.target.value)))}
                    className="w-full accent-[#111827]" />
                </div>
              </div>
            </div>

            {/* Niche */}
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-[#374151] mb-3">Content Niche</h3>
              <div className="space-y-1.5">
                {NICHES.map(niche => (
                  <label key={niche} className="flex items-center gap-2 cursor-pointer group py-0.5">
                    <div
                      onClick={() => toggleNiche(niche)}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${selectedNiches.includes(niche) ? 'bg-[#111827] border-[#111827]' : 'border-[#d1d5db] group-hover:border-[#9ca3af]'}`}
                    >
                      {selectedNiches.includes(niche) && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={`text-sm ${selectedNiches.includes(niche) ? 'text-[#111827] font-semibold' : 'text-[#6b7280]'}`}>{niche}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <h3 className="text-xs font-semibold text-[#374151] mb-3">Language</h3>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${selectedLanguages.includes(lang) ? 'bg-[#111827] text-white' : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {(selectedNiches.length > 0 || selectedLanguages.length > 0 || verifiedOnly || searchQuery) && (
              <button
                onClick={() => { setSelectedNiches([]); setSelectedLanguages([]); setVerifiedOnly(false); setSearchQuery(''); setMinFollowers(5000); setMaxFollowers(500000); }}
                className="mt-5 text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Creator Grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-[3px] border-[#111827] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredCreators.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#e5e7eb] p-16 text-center">
              <Search className="w-8 h-8 text-[#d1d5db] mx-auto mb-3" />
              <p className="text-base font-semibold text-[#374151] mb-1">No creators match your filters</p>
              <p className="text-sm text-[#9ca3af]">Try broadening your follower range or removing some niche filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCreators.map(creator => {
                const followers = creator.follower_count || 0;
                const avgViews = creator.avg_views || creator.avgViewsLast10 || 0;
                const er = creator.engagement_rate || creator.engagementRate || 0;
                const isVerified = creator.isAPIVerified || creator.is_verified;
                const cpm = estimateBrandCPM(creator);
                const lastSynced = creator.lastSyncedAt;
                const velocityTrend = creator.velocityTrend || creator.viewership_velocity_trend;

                return (
                  <div
                    key={creator.id}
                    onClick={() => navigate(`/creator/${creator.id}`, { state: { creator } })}
                    className="bg-white rounded-2xl border border-[#e5e7eb] p-5 cursor-pointer hover:shadow-md hover:border-[#d1b07c] transition-all group"
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#e5e7eb] shrink-0 bg-[#f3f4f6] flex items-center justify-center text-lg font-bold text-[#374151]">
                        {creator.channelThumbnail ? (
                          <img src={creator.channelThumbnail} alt={creator.name} className="w-full h-full object-cover" />
                        ) : (
                          creator.name?.charAt(0)?.toUpperCase() || '?'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-[#111827] truncate group-hover:text-[#b59560] transition-colors">{creator.name}</h3>
                          {isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-[#9ca3af] mt-0.5">{creator.handle || `@${creator.name?.toLowerCase().replace(/\s+/g, '')}`}</p>
                        <span className="inline-block text-xs font-medium text-[#6b7280] bg-[#f3f4f6] px-2 py-0.5 rounded-full mt-1">{creator.niche}</span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center">
                        <p className="text-sm font-bold text-[#111827]">{formatFollowers(followers)}</p>
                        <p className="text-[10px] text-[#9ca3af] mt-0.5 flex items-center justify-center gap-0.5"><Users className="w-2.5 h-2.5" /> Followers</p>
                      </div>
                      <div className="text-center border-x border-[#f3f4f6]">
                        <p className="text-sm font-bold text-[#111827]">{avgViews >= 1000 ? `${(avgViews / 1000).toFixed(1)}K` : avgViews || '—'}</p>
                        <p className="text-[10px] text-[#9ca3af] mt-0.5 flex items-center justify-center gap-0.5"><Video className="w-2.5 h-2.5" /> Avg Views</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-[#111827]">{er ? `${typeof er === 'number' ? er.toFixed(1) : er}%` : '—'}</p>
                        <p className="text-[10px] text-[#9ca3af] mt-0.5 flex items-center justify-center gap-0.5"><TrendingUp className="w-2.5 h-2.5" /> Eng. Rate</p>
                      </div>
                    </div>

                    {/* CPM Estimate + data freshness */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#f3f4f6]">
                      {cpm > 0 ? (
                        <span className="text-xs text-[#6b7280] font-medium">
                          Est. <span className="text-[#111827] font-bold">₹{cpm}/1K views</span>
                        </span>
                      ) : (
                        <span className="text-xs text-[#9ca3af]">Rate on profile</span>
                      )}

                      <div className="flex items-center gap-1">
                        {isVerified ? (
                          <span className="text-[10px] text-green-600 font-semibold flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {lastSynced ? new Date(lastSynced).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'API Verified'}
                          </span>
                        ) : velocityTrend === 'accelerating' ? (
                          <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" /> Growing</span>
                        ) : (
                          <span className="text-[10px] text-[#9ca3af] flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> Self-reported</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
