import React, { useState, useMemo, useEffect } from 'react';
import { Search, SlidersHorizontal, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const NICHES = ["Technology", "Personal Finance", "Finance", "Beauty & Skincare", "EdTech", "Fashion", "Gaming", "Food", "Fitness", "Lifestyle", "B2B Tech"];
const LANGUAGES = ["Hinglish", "Hindi", "English", "Tamil", "Telugu"];

export default function MatchmakingEngine() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [allCreators, setAllCreators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [minFollowers, setMinFollowers] = useState(10000);
  const [maxFollowers, setMaxFollowers] = useState(50000);
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'creators'));
        const creatorsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllCreators(creatorsData);
      } catch (error) {
        console.error("Error fetching creators:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCreators();
  }, []);

  // Auto-fill from Create Campaign routing state
  useEffect(() => {
    if (location.state?.prefillNiche) {
      if (!selectedNiches.includes(location.state.prefillNiche)) {
        setSelectedNiches([location.state.prefillNiche]);
      }
    }
  }, [location.state]);

  const toggleNiche = (niche: string) => {
    setSelectedNiches(prev => prev.includes(niche) ? prev.filter(n => n !== niche) : [...prev, niche]);
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);
  };

  const filteredCreators = useMemo(() => {
    // DO NOT SHOW ANY CREATORS UNLESS A NICHE IS SELECTED (Matchmaking requirement)
    if (selectedNiches.length === 0) return [];

    return allCreators.filter(c => {
      const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.handle?.toLowerCase().includes(searchQuery.toLowerCase()) || c.niche?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFollowers = c.follower_count >= minFollowers && c.follower_count <= maxFollowers;
      const matchesNiche = selectedNiches.includes(c.niche);
      const matchesLang = selectedLanguages.length === 0 || selectedLanguages.includes(c.language);

      return matchesSearch && matchesFollowers && matchesNiche && matchesLang;
    });
  }, [allCreators, searchQuery, minFollowers, maxFollowers, selectedNiches, selectedLanguages]);

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827] font-['Outfit'] flex flex-col">
      {/* Top Navigation Bar */}
      <div className="h-16 bg-white border-b border-[#e5e7eb] flex items-center justify-between px-6 shrink-0 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate('/brand-dashboard')} className="text-[#6b7280] hover:text-[#111827] transition-colors flex items-center gap-1 text-sm font-bold uppercase tracking-wider">
             &larr; Back
           </button>
           <h1 className="text-xl font-bold text-[#111827] tracking-tight flex items-center gap-2 border-l border-[#e5e7eb] pl-4">
             CreatorStack <span className="text-[#d1b07c] font-black">/ Matchmaking Terminal</span>
           </h1>
        </div>
        
        <div className="flex-1 max-w-xl mx-8 relative">
          <Search className="w-4 h-4 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search creators, keywords, or competitors..." 
            className="w-full bg-[#f9fafb] border border-[#e5e7eb] text-[#111827] rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[#d1b07c] focus:ring-1 focus:ring-[#d1b07c] transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 bg-[#f9fafb] border border-[#e5e7eb] px-4 py-1.5 rounded-md">
            <span className="text-xs text-[#6b7280] uppercase font-bold tracking-wider">Corporate Escrow Wallet</span>
            <span className="text-sm font-bold text-[#111827]">₹5,00,000</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#d1b07c] flex items-center justify-center text-white font-bold shadow-sm">
            B
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Filter Engine */}
        <div className="w-72 bg-white border-r border-[#e5e7eb] flex flex-col shrink-0 overflow-y-auto hidden lg:flex shadow-sm z-10">
          <div className="p-6 border-b border-[#e5e7eb]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#6b7280] flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Filter Engine
            </h2>
          </div>
          
          <div className="p-6 space-y-8 flex-1">
            {/* Audience Size */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827] mb-4">Audience Size (Followers)</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-[10px] text-[#6b7280] font-bold uppercase tracking-wider mb-2">
                    <span>Minimum: {(minFollowers/1000).toFixed(1)}K</span>
                  </div>
                  <input 
                    type="range" min="10000" max="50000" step="1000"
                    value={minFollowers} onChange={(e) => setMinFollowers(parseInt(e.target.value))}
                    className="w-full accent-[#d1b07c]"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-[#6b7280] font-bold uppercase tracking-wider mb-2">
                    <span>Maximum: {(maxFollowers/1000).toFixed(1)}K</span>
                  </div>
                  <input 
                    type="range" min="10000" max="50000" step="1000"
                    value={maxFollowers} onChange={(e) => setMaxFollowers(Math.max(minFollowers, parseInt(e.target.value)))}
                    className="w-full accent-[#d1b07c]"
                  />
                </div>
              </div>
            </div>

            {/* Content Niche */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827] mb-4">Content Niche</h3>
              <div className="space-y-3">
                {NICHES.slice(0, 10).map(niche => (
                  <label key={niche} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={selectedNiches.includes(niche)} 
                      onChange={() => toggleNiche(niche)} 
                    />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedNiches.includes(niche) ? 'bg-[#d1b07c] border-[#d1b07c]' : 'bg-[#f9fafb] border-[#e5e7eb] group-hover:border-[#d1b07c]'}`}>
                      {selectedNiches.includes(niche) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={`text-sm ${selectedNiches.includes(niche) ? 'text-[#d1b07c] font-bold' : 'text-[#4b5563]'}`}>{niche}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area: Simplified Creator Grid */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#f9fafb]">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-black text-[#111827] tracking-tight mb-2">Creator Intelligence</h2>
              <p className="text-sm text-[#6b7280] font-medium">Showing {filteredCreators.length} Data-Validated Creators</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-10 h-10 border-[3px] border-[#d1b07c] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : selectedNiches.length === 0 ? (
            <div className="border border-[#e5e7eb] border-dashed rounded-xl bg-white p-12 text-center flex flex-col items-center justify-center h-64 shadow-sm">
              <div className="w-12 h-12 bg-[#f9fafb] border border-[#e5e7eb] rounded-full flex items-center justify-center mb-4">
                <SlidersHorizontal className="w-6 h-6 text-[#9ca3af]" />
              </div>
              <h3 className="text-lg font-black text-[#111827] mb-2">Awaiting Matchmaking Parameters</h3>
              <p className="text-[#6b7280] font-medium text-sm">Please select a Content Niche from the Filter Engine to initiate discovery.</p>
            </div>
          ) : filteredCreators.length === 0 ? (
            <div className="border border-[#e5e7eb] border-dashed rounded-xl bg-white p-12 text-center flex flex-col items-center justify-center h-64 shadow-sm">
              <Search className="w-8 h-8 text-[#9ca3af] mb-4" />
              <p className="text-[#6b7280] font-medium text-lg">No creators match these strict parameters.</p>
              <button onClick={() => { setMinFollowers(10000); setMaxFollowers(50000); setSelectedNiches([]); setSelectedLanguages([]); setSearchQuery(''); }} className="mt-4 text-[#d1b07c] text-sm font-bold hover:underline">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {filteredCreators.map(creator => (
                <div 
                  key={creator.id} 
                  onClick={() => navigate(`/creator/${creator.id}`, { state: { creator } })}
                  className="bg-white border border-[#e5e7eb] rounded-xl p-5 hover:shadow-lg hover:border-[#d1b07c] transition-all cursor-pointer group flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f9fafb] to-[#e5e7eb] flex items-center justify-center shrink-0 border border-[#e5e7eb]">
                      <User className="w-5 h-5 text-[#9ca3af]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-black text-[#111827] truncate group-hover:text-[#d1b07c] transition-colors">{creator.name}</h3>
                      <p className="text-xs text-[#6b7280] font-bold uppercase tracking-wider">{creator.niche}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-auto">
                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-2.5 text-center">
                      <div className="text-[10px] uppercase font-bold text-[#9ca3af] tracking-widest mb-0.5">Followers</div>
                      <div className="text-sm font-black text-[#111827]">{(creator.follower_count / 1000).toFixed(1)}K</div>
                    </div>
                    <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-2.5 text-center">
                      <div className="text-[10px] uppercase font-bold text-[#9ca3af] tracking-widest mb-0.5">Avg Views</div>
                      <div className="text-sm font-black text-[#111827]">{(creator.avg_views / 1000).toFixed(1)}K</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
