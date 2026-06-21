import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Search, Filter, Clock, Users, ArrowRight, IndianRupee } from 'lucide-react';
import { NICHES } from '../../utils/niches';

export default function CampaignMarketplace() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNiche, setSelectedNiche] = useState<string>('All');

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const snap = await getDocs(collection(db, 'campaigns'));
        const all = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((c: any) => c.status !== 'completed')
          .sort((a: any, b: any) => {
            if (a.createdAt && b.createdAt)
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            return 0;
          });
        setCampaigns(all);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch = c.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.brandName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNiche = selectedNiche === 'All' || 
                         (Array.isArray(c.niche) ? c.niche.includes(selectedNiche) : c.niche === selectedNiche);
    return matchesSearch && matchesNiche;
  });

  return (
    <div className="min-h-screen bg-[#fafaf9] layout-creator font-['Inter']">
      {/* Header */}
      <div className="bg-white border-b-2 border-black py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-black uppercase tracking-tight mb-4">
            Campaign <span className="text-[#e8473f]">Marketplace</span>
          </h1>
          <p className="text-lg text-gray-600 font-medium max-w-2xl">
            Browse high-value briefs from premium brands. Apply directly and negotiate terms in your Deal Room.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search campaigns by title or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-2 border-black text-black pl-12 pr-4 py-3.5 rounded-xl focus:border-[#e8473f] focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-lg font-bold placeholder:text-gray-400 transition-all"
            />
          </div>
          <div className="relative md:w-64">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedNiche}
              onChange={(e) => setSelectedNiche(e.target.value)}
              className="w-full bg-white border-2 border-black text-black pl-12 pr-4 py-3.5 rounded-xl focus:border-[#e8473f] focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-lg font-bold transition-all appearance-none cursor-pointer"
            >
              <option value="All">All Niches</option>
              {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {/* Campaign Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-black border-t-[#e8473f] rounded-full animate-spin" />
          </div>
        ) : filteredCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => {
              const daysLeft = campaign.deadline
                ? Math.ceil((new Date(campaign.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;
              
              const isUrgent = daysLeft !== null && daysLeft <= 3;

              return (
                <div 
                  key={campaign.id} 
                  className={`bg-white rounded-xl border-2 p-6 flex flex-col transition-all cursor-pointer ${
                    isUrgent 
                      ? 'border-amber-400 shadow-[4px_4px_0px_0px_rgba(251,191,36,0.6)] animate-pulse bg-amber-50/30 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(251,191,36,0.8)]' 
                      : 'border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                  onClick={() => navigate(`/creator-dashboard`, { state: { targetCampaignId: campaign.id } })}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-100 border border-slate-300 px-2 py-1 rounded">
                      {Array.isArray(campaign.niche) ? campaign.niche[0] : campaign.niche}
                    </span>
                    {isUrgent && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-100 border border-amber-300 px-2 py-1 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Closing Soon
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-black text-black leading-tight mb-2 line-clamp-2">
                    {campaign.title}
                  </h3>
                  <p className="text-sm font-bold text-gray-500 mb-4">{campaign.brandName}</p>
                  
                  <div className="mt-auto space-y-3 pt-4 border-t-2 border-dashed border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-bold flex items-center gap-1.5"><IndianRupee className="w-4 h-4"/> Budget</span>
                      <span className="font-black text-emerald-700">{campaign.budget ? `₹${campaign.budget}` : 'Variable'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-bold flex items-center gap-1.5"><Clock className="w-4 h-4"/> Deadline</span>
                      <span className="font-black text-black">{daysLeft ? `${daysLeft} days left` : 'Open'}</span>
                    </div>
                  </div>
                  
                  <button className="mt-6 w-full btn-press bg-black text-white py-3 rounded-lg font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                    View Details <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border-2 border-black rounded-xl p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-2xl font-black text-black mb-2">No Campaigns Found</h3>
            <p className="text-gray-600 font-medium">Try adjusting your search or niche filter to find more opportunities.</p>
          </div>
        )}
      </div>
    </div>
  );
}
