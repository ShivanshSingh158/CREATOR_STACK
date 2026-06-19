import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { formatDateDDMMYY, formatRupee, formatNumberCompact } from '../../utils/formatters';
import { Search, Filter, Plus, TrendingUp, Users, Activity } from 'lucide-react';
import { collection, query, where, getDocs, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function BrandDashboard() {
  const { currentUser } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [budgetFilter, setBudgetFilter] = useState('All');

  const [pipelineCount, setPipelineCount] = useState(0);
  const [totalReach, setTotalReach] = useState(0);

  useEffect(() => {
    if (!currentUser?.uid) return;

    // Listen to user profile
    const unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setProfileData(docSnap.data());
      }
    });

    // Listen to campaigns
    const q = query(
      collection(db, 'campaigns'), 
      where('brandId', '==', currentUser.uid)
    );
    const unsubCampaigns = onSnapshot(q, async (querySnapshot) => {
      const fetchedCampaigns = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCampaigns(fetchedCampaigns);
      
      // Compute pipeline stats for these campaigns
      if (fetchedCampaigns.length > 0) {
        try {
          const campaignIds = fetchedCampaigns.map(c => c.id);
          
          // chunk array into sizes of 10 for Firestore 'in' query limitations
          const chunks = [];
          for (let i = 0; i < campaignIds.length; i += 10) {
              chunks.push(campaignIds.slice(i, i + 10));
          }

          const creatorIds = new Set<string>();
          let appsCount = 0;

          for (const chunk of chunks) {
              const appsQuery = query(collection(db, 'applications'), where('campaignId', 'in', chunk));
              const appsSnap = await getDocs(appsQuery);
              appsCount += appsSnap.size;

              appsSnap.docs.forEach(d => {
                 creatorIds.add(d.data().creatorId);
              });
          }
          
          setPipelineCount(appsCount);

          // Fetch creators to get reach
          const cIds = Array.from(creatorIds);
          const cChunks = [];
          for(let i = 0; i < cIds.length; i += 10) {
              cChunks.push(cIds.slice(i, i + 10));
          }

          let reach = 0;
          for (const chunk of cChunks) {
              // We check 'creators' collection as that's where matchmaking data is stored
              const creatorsQuery = query(collection(db, 'creators'), where('__name__', 'in', chunk));
              const creatorsSnap = await getDocs(creatorsQuery);
              creatorsSnap.docs.forEach(doc => {
                  const data = doc.data();
                  // Depending on the field name: could be follower_count or valuation.follower_count
                  const followers = parseInt(data.follower_count) || (data.valuation && parseInt(data.valuation.follower_count)) || 0;
                  reach += followers;
              });
          }
          setTotalReach(reach);
        } catch (err) {
          console.error("Error computing pipeline metrics", err);
        }
      } else {
        setPipelineCount(0);
        setTotalReach(0);
      }
      setLoading(false);
    });

    return () => {
      unsubProfile();
      unsubCampaigns();
    };
  }, [currentUser]);

  const filteredCampaigns = useMemo(() => {
    let filtered = [...campaigns];
    
    if (searchQuery) {
      filtered = filtered.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    if (statusFilter !== 'All') {
      filtered = filtered.filter(c => {
        const idNum = parseInt(c.id.replace('camp', '')) || 0;
        const status = idNum % 2 === 0 ? 'Active' : 'Completed';
        return status === statusFilter;
      });
    }
    
    if (budgetFilter !== 'All') {
      if (budgetFilter === '< 50k') {
        filtered = filtered.filter(c => c.budget.includes('30,000') || c.budget.includes('40,000') || parseInt(c.budget.replace(/[^0-9]/g, '')) < 50000);
      } else if (budgetFilter === '> 50k') {
        filtered = filtered.filter(c => !c.budget.includes('30,000') && !c.budget.includes('40,000') && parseInt(c.budget.replace(/[^0-9]/g, '')) >= 50000);
      }
    }
    
    return filtered;
  }, [campaigns, searchQuery, statusFilter, budgetFilter]);

  const activeCount = filteredCampaigns.length;
  const totalBudget = filteredCampaigns.reduce((sum, c) => sum + parseInt(c.budget.replace(/[^0-9]/g, '') || '0'), 0);

  const displayName = profileData?.companyName || profileData?.name || currentUser?.email?.split('@')[0] || 'Brand';

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827] font-['Outfit'] pb-12">
      {/* Premium Hero Section */}
      <div className="bg-white border-b border-[#e5e7eb] pt-12 pb-16 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold bg-[#d1b07c]/10 text-[#b59560] px-2 py-1 rounded uppercase tracking-widest border border-[#d1b07c]/20">Verified Brand</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[#111827] tracking-tight">Executive Workspace</h1>
            <p className="mt-3 text-lg text-[#6b7280]">Welcome back, <span className="font-semibold text-[#111827]">{displayName}</span>. Manage your campaigns and creator pipeline.</p>
          </div>
          <div className="flex gap-4">
             <Link to="/matchmaking" className="bg-white hover:bg-[#f9fafb] text-[#111827] border border-[#e5e7eb] font-semibold py-3 px-6 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">
               <Search className="w-5 h-5" /> Discover Creators
             </Link>
             <Link to="/create-campaign" className="bg-[#d1b07c] hover:bg-[#b59560] text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all flex items-center justify-center gap-2">
               <Plus className="w-5 h-5" /> New Campaign
             </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-[#d1b07c]/10 flex items-center justify-center text-[#b59560]">
               <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-1">Active Campaigns</p>
              <p className="text-3xl font-black text-[#111827]">{activeCount}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-[#111827]/5 flex items-center justify-center text-[#111827]">
               <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-1">Deployed Capital</p>
              <p className="text-2xl font-black text-[#111827]">{formatRupee(totalBudget)}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-[#111827]/5 flex items-center justify-center text-[#111827]">
               <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-1">Creators Pipeline</p>
              <p className="text-3xl font-black text-[#111827]">{pipelineCount}</p>
            </div>
          </div>
          <div className="bg-[#111827] p-6 rounded-xl border border-[#111827] shadow-lg flex items-center gap-4 text-white">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Audience Reach</p>
              <p className="text-3xl font-black text-white">{totalReach > 0 ? formatNumberCompact(totalReach) : '0'}</p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#e5e7eb] shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-5 h-5 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search campaigns..." 
              className="w-full pl-10 pr-4 py-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#d1b07c] focus:ring-1 focus:ring-[#d1b07c] transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-48">
              <Filter className="w-4 h-4 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2" />
              <select 
                className="w-full pl-9 pr-4 py-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#d1b07c] appearance-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <select 
              className="w-full md:w-48 px-4 py-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-[#d1b07c]"
              value={budgetFilter}
              onChange={(e) => setBudgetFilter(e.target.value)}
            >
              <option value="All">All Budgets</option>
              <option value="< 50k">Under ₹50k</option>
              <option value="> 50k">Over ₹50k</option>
            </select>
          </div>
        </div>

        {/* Campaign Grid */}
        {campaigns.length === 0 && !loading ? (
          <div className="text-center py-20 bg-white rounded-xl border border-[#e5e7eb] border-dashed">
            <p className="text-xl text-[#6b7280] font-medium mb-4">No campaigns created yet.</p>
            <Link to="/create-campaign" className="text-[#d1b07c] font-bold hover:underline">
              Create your first campaign
            </Link>
          </div>
        ) : filteredCampaigns.length === 0 && !loading ? (
          <div className="text-center py-20 bg-white rounded-xl border border-[#e5e7eb] border-dashed">
            <p className="text-xl text-[#6b7280] font-medium">No campaigns found matching your criteria.</p>
            <button onClick={() => { setSearchQuery(''); setStatusFilter('All'); setBudgetFilter('All'); }} className="mt-4 text-[#d1b07c] font-bold hover:underline">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredCampaigns.map((campaign, idx) => {
              const isActive = (parseInt(campaign.id.replace('camp', '')) || 0) % 2 === 0;
              
              return (
                <div key={campaign.id} className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
                  <div className="p-8 flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <span className="bg-[#f3f4f6] text-[#4b5563] px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border border-[#e5e7eb]">{campaign.niche}</span>
                      {isActive ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[#15803d] bg-[#15803d]/10 px-3 py-1 rounded-full">
                          <span className="w-2 h-2 rounded-full bg-[#15803d] animate-pulse"></span> ACTIVE
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[#6b7280] bg-[#f3f4f6] px-3 py-1 rounded-full border border-[#e5e7eb]">COMPLETED</span>
                      )}
                    </div>
                    
                    <h3 className="text-2xl font-black text-[#111827] mb-3 leading-tight group-hover:text-[#b59560] transition-colors">{campaign.title}</h3>
                    <p className="text-[#6b7280] line-clamp-2 mb-8 leading-relaxed">{campaign.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#f9fafb] p-4 rounded-lg border border-[#e5e7eb]">
                        <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-1">Budget</p>
                        <p className="text-lg font-bold text-[#111827]">{formatRupee(campaign.budget)}</p>
                      </div>
                      <div className="bg-[#f9fafb] p-4 rounded-lg border border-[#e5e7eb]">
                        <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-1">Deadline</p>
                        <p className="text-lg font-bold text-[#111827]">{formatDateDDMMYY(campaign.deadline)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-8 py-5 bg-[#f9fafb] border-t border-[#e5e7eb] flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="flex -space-x-3">
                        {[...Array(Math.floor(Math.random() * 3) + 1)].map((_, i) => (
                          <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-[#e5e7eb] flex items-center justify-center text-xs font-bold text-[#6b7280] z-${4-i} shadow-sm`}>
                            {['A','B','C','D','E'][Math.floor(Math.random() * 5)]}
                          </div>
                        ))}
                      </div>
                      <span className="ml-4 text-sm font-medium text-[#6b7280]">Pipeline Active</span>
                    </div>
                    <Link to={`/campaign/${campaign.id}`} className="text-sm font-bold text-[#d1b07c] hover:text-[#b59560] uppercase tracking-widest flex items-center gap-1">
                      Manage <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
