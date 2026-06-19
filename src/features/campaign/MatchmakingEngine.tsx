import React, { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal, CheckCircle2, Video, TrendingUp, Users, ArrowLeft, Clock, Zap } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../auth/AuthContext';
import { NICHES } from '../../utils/niches';

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

  const [nicheSearchQuery, setNicheSearchQuery] = useState('');
  const [showAllNiches, setShowAllNiches] = useState(false);

  const filteredNichesList = useMemo(() => {
    if (!nicheSearchQuery) return NICHES;
    return NICHES.filter(n => n.toLowerCase().includes(nicheSearchQuery.toLowerCase()));
  }, [nicheSearchQuery]);

  const displayedNiches = showAllNiches || nicheSearchQuery ? filteredNichesList : filteredNichesList.slice(0, 10);

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

      const matchesVerified = !verifiedOnly || !!c.isAPIVerified;

      return matchesSearch && matchesFollowers && matchesNiche && matchesLang && matchesVerified;
    });
  }, [allCreators, searchQuery, minFollowers, maxFollowers, selectedNiches, selectedLanguages, verifiedOnly]);

  const formatFollowers = (n: number) =>
    n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  return (
    <div className="min-h-screen bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Compact top bar */}
      <div className="sticky top-0 z-50 bg-white border-b-2 border-black shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate('/brand-dashboard')}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-black hover:text-indigo-600 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" /> BACK
          </button>
          <div className="h-6 w-0.5 bg-black" />
          <h1 className="text-sm sm:text-base font-black text-black uppercase tracking-widest shrink-0">Find Creators</h1>

          {/* Search */}
          <div className="flex-1 relative max-w-xl ml-4">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="SEARCH CREATORS…"
              className="w-full bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg py-2 pl-9 pr-4 text-[10px] font-black text-black placeholder:text-gray-500 uppercase tracking-widest focus:outline-none focus:border-black transition-colors"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className="lg:hidden flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-black px-3 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg bg-white"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            FILTERS {selectedNiches.length > 0 && <span className="bg-black text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">{selectedNiches.length}</span>}
          </button>

          <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest shrink-0 hidden md:block">
            {filteredCreators.length} CREATOR{filteredCreators.length !== 1 ? 'S' : ''} FOUND
          </span>
        </div>
      </div>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 gap-6">

        {/* Sidebar Filters */}
        <div className={`shrink-0 w-64 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white rounded-xl border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-[10px] font-black text-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5" /> FILTERS
            </h2>

            {/* Verified Only */}
            <div className="mb-5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  onClick={() => setVerifiedOnly(v => !v)}
                  className={`w-9 h-5 rounded-full border-2 border-black transition-colors relative ${verifiedOnly ? 'bg-[#a3e635]' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-black transition-all ${verifiedOnly ? 'left-4' : 'left-0.5'}`} />
                </div>
                <span className="text-[10px] font-black text-black uppercase tracking-widest">API-Verified only</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              </label>
            </div>

            {/* Followers Range */}
            <div className="mb-5">
              <h3 className="text-[10px] font-black text-black uppercase tracking-widest mb-3">Followers</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                    <span>Min</span><span className="font-black text-black">{formatFollowers(minFollowers)}</span>
                  </div>
                  <input type="range" min="5000" max="500000" step="1000" value={minFollowers}
                    onChange={e => setMinFollowers(Math.min(parseInt(e.target.value), maxFollowers))}
                    className="w-full accent-black" />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                    <span>Max</span><span className="font-black text-black">{formatFollowers(maxFollowers)}</span>
                  </div>
                  <input type="range" min="5000" max="500000" step="1000" value={maxFollowers}
                    onChange={e => setMaxFollowers(Math.max(minFollowers, parseInt(e.target.value)))}
                    className="w-full accent-black" />
                </div>
              </div>
            </div>

            {/* Niche */}
            <div className="mb-5">
              <h3 className="text-[10px] font-black text-black uppercase tracking-widest mb-3">Content Niche</h3>
              
              <div className="relative mb-3">
                <Search className="w-3 h-3 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="SEARCH NICHES…"
                  className="w-full bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded py-1.5 pl-7 pr-2 text-[9px] font-black text-black placeholder:text-gray-400 uppercase tracking-widest focus:outline-none focus:border-black transition-colors"
                  value={nicheSearchQuery}
                  onChange={e => setNicheSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {displayedNiches.map(niche => (
                  <label key={niche} className="flex items-center gap-2 cursor-pointer group py-0.5">
                    <div
                      onClick={() => toggleNiche(niche)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0 ${selectedNiches.includes(niche) ? 'bg-black border-black' : 'border-black group-hover:border-indigo-600'}`}
                    >
                      {selectedNiches.includes(niche) && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest ${selectedNiches.includes(niche) ? 'text-black font-black' : 'text-gray-500 font-bold'}`}>{niche}</span>
                  </label>
                ))}
              </div>

              {!nicheSearchQuery && filteredNichesList.length > 10 && (
                <button
                  onClick={() => setShowAllNiches(v => !v)}
                  className="mt-3 text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest flex items-center gap-1"
                >
                  {showAllNiches ? 'SHOW LESS' : `+ SHOW ${filteredNichesList.length - 10} MORE`}
                </button>
              )}
            </div>

            {/* Language */}
            <div>
              <h3 className="text-[10px] font-black text-black uppercase tracking-widest mb-3">Language</h3>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    className={`text-[9px] px-2 py-1 rounded-md font-black uppercase tracking-widest transition-all border-2 ${selectedLanguages.includes(lang) ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black border-black hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {(selectedNiches.length > 0 || selectedLanguages.length > 0 || verifiedOnly || searchQuery) && (
              <button
                onClick={() => { setSelectedNiches([]); setSelectedLanguages([]); setVerifiedOnly(false); setSearchQuery(''); setMinFollowers(5000); setMaxFollowers(500000); }}
                className="mt-5 text-[10px] font-black text-red-600 hover:text-red-700 uppercase tracking-widest border-2 border-red-600 px-3 py-1.5 rounded bg-red-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all w-full"
              >
                CLEAR FILTERS
              </button>
            )}
          </div>
        </div>

        {/* Creator Grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-[3px] border-black border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredCreators.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-black p-10 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Search className="w-8 h-8 text-black mx-auto mb-3" />
              <p className="text-sm font-black text-black uppercase tracking-widest mb-1">NO CREATORS FOUND</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">TRY BROADENING YOUR SEARCH.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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
                    className="bg-white rounded-xl border-2 border-black p-4 cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group flex flex-col h-full"
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-black shrink-0 bg-gray-100 flex items-center justify-center text-lg font-black text-black">
                        {creator.youtubeData?.thumbnailUrl || creator.channelThumbnail ? (
                          <img src={creator.youtubeData?.thumbnailUrl || creator.channelThumbnail} alt={creator.name} className="w-full h-full object-cover" />
                        ) : (
                          creator.name?.charAt(0)?.toUpperCase() || '?'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-black text-black truncate uppercase tracking-tight">{creator.name}</h3>
                          {isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-[#a3e635] shrink-0" />}
                        </div>
                        <p className="text-[10px] font-bold text-gray-500 mt-0.5">{creator.handle || `@${creator.name?.toLowerCase().replace(/\s+/g, '')}`}</p>
                        <div className="flex gap-1.5 flex-wrap mt-1">
                          <span className="inline-block text-[9px] font-black text-black bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded uppercase tracking-widest">{creator.niche}</span>
                          {creator.language && (
                            <span className="inline-block text-[9px] font-black text-black bg-[#e0e7ff] border border-[#c7d2fe] px-1.5 py-0.5 rounded uppercase tracking-widest">{creator.language}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-2 mb-4 mt-auto">
                      <div className="text-center">
                        <p className="text-xs font-black text-black">{formatFollowers(followers)}</p>
                        <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1 flex items-center justify-center gap-0.5"><Users className="w-2.5 h-2.5" /> Subs</p>
                      </div>
                      <div className="text-center border-x-2 border-gray-100">
                        <p className="text-xs font-black text-black">{avgViews >= 1000 ? `${(avgViews / 1000).toFixed(1)}K` : avgViews || '—'}</p>
                        <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1 flex items-center justify-center gap-0.5"><Video className="w-2.5 h-2.5" /> Views</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-black text-black">{er ? `${typeof er === 'number' ? er.toFixed(1) : er}%` : '—'}</p>
                        <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1 flex items-center justify-center gap-0.5"><TrendingUp className="w-2.5 h-2.5" /> Eng</p>
                      </div>
                    </div>

                    {/* CPM Estimate + data freshness */}
                    <div className="flex items-center justify-between pt-3 border-t-2 border-gray-100 mt-auto">
                      {cpm > 0 ? (
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                          Est. <span className="text-black font-black">₹{cpm}/1K VIEWS</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Rate on profile</span>
                      )}

                      <div className="flex items-center gap-1">
                        {isVerified ? (
                          <span className="text-[9px] text-[#4d7c0f] bg-[#ecfccb] border border-[#bef264] px-1.5 py-0.5 rounded font-black uppercase tracking-widest flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {lastSynced ? new Date(lastSynced).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Verified'}
                          </span>
                        ) : velocityTrend === 'accelerating' ? (
                          <span className="text-[9px] text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded font-black uppercase tracking-widest flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" /> Growing</span>
                        ) : (
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> Self-reported</span>
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
