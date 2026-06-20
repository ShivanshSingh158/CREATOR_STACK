import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { formatDateDDMMYY, formatRupee, formatNumberCompact } from '../../utils/formatters';
import { Search, Filter, Plus, TrendingUp, Users, Activity, Edit2, ChevronRight, CheckCircle2, Clock, Zap } from 'lucide-react';
import { collection, query, where, getDocs, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function BrandDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [pipelineCount, setPipelineCount] = useState(0);
  const [totalReach, setTotalReach] = useState(0);
  const [campaignPipeline, setCampaignPipeline] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) setProfileData(docSnap.data());
    });

    const q = query(collection(db, 'campaigns'), where('brandId', '==', currentUser.uid));
    const unsubCampaigns = onSnapshot(q, async (querySnapshot) => {
      const fetchedCampaigns = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetchedCampaigns.sort((a: any, b: any) => {
        if (a.createdAt && b.createdAt) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return 0;
      });
      setCampaigns(fetchedCampaigns);

      if (fetchedCampaigns.length > 0) {
        try {
          const campaignIds = fetchedCampaigns.map((c: any) => c.id);
          const chunks = [];
          for (let i = 0; i < campaignIds.length; i += 10) chunks.push(campaignIds.slice(i, i + 10));

          const creatorIds = new Set<string>();
          let appsCount = 0;
          const pipelineMap: Record<string, number> = {};

          for (const chunk of chunks) {
            const appsQuery = query(collection(db, 'applications'), where('campaignId', 'in', chunk));
            const appsSnap = await getDocs(appsQuery);
            appsCount += appsSnap.size;
            appsSnap.docs.forEach(d => {
              const data = d.data();
              creatorIds.add(data.creatorId);
              pipelineMap[data.campaignId] = (pipelineMap[data.campaignId] || 0) + 1;
            });
          }
          setPipelineCount(appsCount);
          setCampaignPipeline(pipelineMap);

          // Fetch reach
          const cIds = Array.from(creatorIds);
          const cChunks = [];
          for (let i = 0; i < cIds.length; i += 10) cChunks.push(cIds.slice(i, i + 10));
          let reach = 0;
          for (const chunk of cChunks) {
            const creatorsQuery = query(collection(db, 'creators'), where('__name__', 'in', chunk));
            const creatorsSnap = await getDocs(creatorsQuery);
            creatorsSnap.docs.forEach(doc => {
              const data = doc.data();
              reach += parseInt(data.follower_count) || 0;
            });
          }
          setTotalReach(reach);
        } catch (err) { console.error('Pipeline metrics error', err); }
      } else {
        setPipelineCount(0); setTotalReach(0);
      }
      setLoading(false);
    });

    return () => { unsubProfile(); unsubCampaigns(); };
  }, [currentUser]);

  const filteredCampaigns = useMemo(() => {
    let filtered = [...campaigns];
    if (searchQuery) filtered = filtered.filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || c.niche?.toLowerCase().includes(searchQuery.toLowerCase()));
    if (statusFilter !== 'All') {
      filtered = filtered.filter(c => statusFilter === 'Active' ? c.status !== 'completed' : c.status === 'completed');
    }
    return filtered;
  }, [campaigns, searchQuery, statusFilter]);

  const activeCampaigns = campaigns.filter((c: any) => c.status !== 'completed');
  const completedCampaigns = campaigns.filter((c: any) => c.status === 'completed');
  const totalBudget = campaigns.reduce((sum, c) => {
    const b = typeof c.budget === 'number' ? c.budget : parseInt((c.budget || '').replace(/[^0-9]/g, '') || '0');
    return sum + b;
  }, 0);

  const displayName = profileData?.companyName || profileData?.name || currentUser?.email?.split('@')[0] || 'Brand';

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ─── Desktop Sidebar + Main Layout ─── */}
      <div className="flex min-h-[calc(100vh-64px)] max-w-screen-2xl mx-auto">

        {/* Sidebar — desktop only */}
        <aside className="hidden xl:flex w-64 shrink-0 flex-col sticky top-16 h-[calc(100vh-64px)] overflow-y-auto px-5 py-6">
          <Link to="/profile" className="block bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all p-4 mb-6 rounded-xl cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-black bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden shrink-0">
                {profileData?.logoUrl ? (
                  <img src={profileData.logoUrl} alt="Logo" className="w-full h-full object-cover bg-white" referrerPolicy="no-referrer" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-black uppercase tracking-tight truncate">{displayName}</p>
                <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100 border border-indigo-200 px-1.5 py-0.5 rounded uppercase tracking-widest mt-0.5 inline-block">Brand Partner</span>
              </div>
            </div>
          </Link>

          <div className="space-y-1 flex-1">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">Overview</div>
            {[
              { label: 'Dashboard', icon: Activity, href: '/brand-dashboard', active: true },
              { label: 'Find Creators', icon: Users, href: '/matchmaking' },
              { label: 'Messages', icon: TrendingUp, href: '/messages' },
            ].map(item => (
              <Link key={item.label} to={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold transition-all border-2 ${item.active ? 'bg-indigo-50 border-black text-indigo-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'border-transparent text-gray-600 hover:border-black hover:bg-white hover:text-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
              >
                <item.icon className="w-4 h-4" /> {item.label}
              </Link>
            ))}

            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mt-8 mb-2">Stats</div>
            <div className="space-y-3 px-1">
              <div className="bg-white rounded-xl p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Active Campaigns</p>
                <p className="text-2xl font-black text-black">{activeCampaigns.length}</p>
              </div>
              <div className="bg-white rounded-xl p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Creator Pipeline</p>
                <p className="text-2xl font-black text-black">{pipelineCount}</p>
              </div>
              <div className="bg-white rounded-xl p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Total Reach</p>
                <p className="text-xl font-black text-black">{totalReach > 0 ? formatNumberCompact(totalReach) : '—'}</p>
              </div>
              <div className="bg-[#fbbf24] rounded-xl p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform">
                <p className="text-[9px] font-bold text-amber-900 uppercase tracking-widest mb-0.5">Budget Deployed</p>
                <p className="text-lg font-black text-black">{formatRupee(totalBudget)}</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Link to="/create-campaign"
              className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white text-xs font-black py-3 rounded-lg border-2 border-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:bg-indigo-700 active:translate-y-0 active:shadow-none transition-all"
            >
              <Plus className="w-4 h-4" /> New Campaign
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">

          {/* Top header bar */}
          <div className="bg-white border-b-2 border-black px-6 lg:px-10 py-5 relative z-10">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-black tracking-tight uppercase">Executive Workspace</h1>
                <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">Welcome back, <span className="text-indigo-600">{displayName}</span></p>
              </div>
              <div className="flex gap-3">
                <Link to="/matchmaking"
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border-2 border-black bg-white text-black px-4 py-2.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:bg-gray-50 active:translate-y-0 active:shadow-none transition-all"
                >
                  <Search className="w-3.5 h-3.5" /> Find Creators
                </Link>
                <Link to="/create-campaign"
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border-2 border-black bg-indigo-600 text-white px-4 py-2.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:bg-indigo-700 active:translate-y-0 active:shadow-none transition-all"
                >
                  <Plus className="w-4 h-4" /> New Campaign
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile KPI row — hidden on xl (sidebar has it) */}
          <div className="xl:hidden grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-white border-b-2 border-black">
            {[
              { label: 'Active', value: activeCampaigns.length, icon: Activity },
              { label: 'Pipeline', value: pipelineCount, icon: Users },
              { label: 'Reach', value: totalReach > 0 ? formatNumberCompact(totalReach) : '0', icon: TrendingUp },
              { label: 'Budget', value: formatRupee(totalBudget), icon: Zap },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">{kpi.label}</p>
                <p className="text-lg font-black text-black">{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="p-5 lg:p-8 xl:p-10">

            {/* Filter row */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="SEARCH CAMPAIGNS…"
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-black rounded-lg bg-white text-xs font-black text-black placeholder:text-gray-400 uppercase tracking-widest focus:outline-none focus:ring-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative">
                <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  className="pl-10 pr-10 py-2.5 border-2 border-black rounded-lg bg-white text-xs font-black text-black uppercase tracking-widest focus:outline-none focus:ring-0 appearance-none cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="All">All statuses</option>
                  <option value="Active">Active only</option>
                  <option value="Completed">Completed only</option>
                </select>
              </div>
              <div className="text-xs font-black text-indigo-600 bg-indigo-50 border-2 border-black px-4 py-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-widest self-center ml-auto">
                {filteredCampaigns.length} CAMPAIGN{filteredCampaigns.length !== 1 ? 'S' : ''}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-[3px] border-[#111827] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-10 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-gray-300">
                  <Plus className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-xl font-black text-black mb-1 uppercase tracking-tight">No campaigns yet</h3>
                <p className="text-[10px] font-bold text-gray-500 mb-6 uppercase tracking-widest">Create your first campaign to start working with verified creators.</p>
                <Link to="/create-campaign" className="inline-flex items-center gap-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest border-2 border-black px-4 py-2.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:bg-indigo-700 active:translate-y-0 active:shadow-none transition-all">
                  <Plus className="w-3 h-3" /> Create Campaign
                </Link>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                <p className="text-gray-500 font-bold uppercase tracking-widest">No campaigns match your filters.</p>
                <button onClick={() => { setSearchQuery(''); setStatusFilter('All'); }} className="mt-4 text-sm font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest hover:underline">Clear filters</button>
              </div>
            ) : (
              <>
                {/* Desktop table view */}
                <div className="hidden lg:block bg-white rounded-xl border-2 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-black bg-indigo-50">
                        <th className="text-left px-6 py-4 text-xs font-black text-indigo-900 uppercase tracking-widest">Campaign</th>
                        <th className="text-left px-4 py-4 text-xs font-black text-indigo-900 uppercase tracking-widest">Niche</th>
                        <th className="text-left px-4 py-4 text-xs font-black text-indigo-900 uppercase tracking-widest">Budget</th>
                        <th className="text-left px-4 py-4 text-xs font-black text-indigo-900 uppercase tracking-widest">Deadline</th>
                        <th className="text-left px-4 py-4 text-xs font-black text-indigo-900 uppercase tracking-widest">Pipeline</th>
                        <th className="text-left px-4 py-4 text-xs font-black text-indigo-900 uppercase tracking-widest">Status</th>
                        <th className="px-4 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-gray-100">
                      {filteredCampaigns.map(campaign => {
                        const isCompleted = campaign.status === 'completed';
                        const pCount = campaignPipeline[campaign.id] || 0;
                        return (
                          <tr key={campaign.id} className="hover:bg-indigo-50/30 transition-colors group">
                            <td className="px-6 py-4">
                              <p className="font-black text-black uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{campaign.title}</p>
                              <p className="text-xs font-bold text-gray-500 mt-1 line-clamp-1">{campaign.description}</p>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-1.5">
                                {Array.isArray(campaign.niche) ? (
                                  campaign.niche.map((n, idx) => (
                                    <span key={idx} className="text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-1 rounded uppercase tracking-widest">{n}</span>
                                  ))
                                ) : (
                                  <span className="text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-1 rounded uppercase tracking-widest">{campaign.niche}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 font-black text-black text-sm">{formatRupee(campaign.budget)}</td>
                            <td className="px-4 py-4 text-sm font-bold text-gray-500">{formatDateDDMMYY(campaign.deadline)}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-black text-black">{pCount}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {isCompleted ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-black bg-[#a3e635] border-2 border-black px-2 py-1 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-widest">
                                  <CheckCircle2 className="w-3 h-3" /> Completed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-black bg-[#fbbf24] border-2 border-black px-2 py-1 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-widest">
                                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" /> Active
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => navigate(`/edit-campaign/${campaign.id}`)}
                                  className="p-2 text-black bg-white border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                                  title="Edit campaign"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <Link
                                  to={`/campaign/${campaign.id}`}
                                  className="flex items-center gap-1 text-xs font-black text-white bg-black border-2 border-black px-4 py-2.5 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-widest hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
                                >
                                  Manage <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card view */}
                <div className="lg:hidden space-y-4">
                  {filteredCampaigns.map(campaign => {
                    const isCompleted = campaign.status === 'completed';
                    const pCount = campaignPipeline[campaign.id] || 0;
                    return (
                      <div key={campaign.id} className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex flex-wrap gap-1">
                                  {Array.isArray(campaign.niche) ? (
                                    campaign.niche.map((n, idx) => (
                                      <span key={idx} className="text-[9px] font-black text-gray-600 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded uppercase tracking-widest">{n}</span>
                                    ))
                                  ) : (
                                    <span className="text-[9px] font-black text-gray-600 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded uppercase tracking-widest">{campaign.niche}</span>
                                  )}
                                </div>
                                {isCompleted ? (
                                  <span className="flex items-center gap-1 text-[10px] font-black text-black bg-[#a3e635] border-2 border-black px-2 py-0.5 rounded uppercase tracking-widest">
                                    <CheckCircle2 className="w-3 h-3" /> Done
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[10px] font-black text-black bg-[#fbbf24] border-2 border-black px-2 py-0.5 rounded uppercase tracking-widest">
                                    <Clock className="w-3 h-3" /> Active
                                  </span>
                                )}
                              </div>
                              <h3 className="font-black text-black text-lg uppercase tracking-tight">{campaign.title}</h3>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            <div>
                              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Budget</p>
                              <p className="text-sm font-black text-black">{formatRupee(campaign.budget)}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Deadline</p>
                              <p className="text-sm font-black text-black">{formatDateDDMMYY(campaign.deadline)}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Pipeline</p>
                              <p className="text-sm font-black text-black">{pCount}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex border-t-2 border-black bg-gray-50">
                          <button
                            onClick={() => navigate(`/edit-campaign/${campaign.id}`)}
                            className="flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black text-black uppercase tracking-widest hover:bg-gray-100 transition-colors border-r-2 border-black"
                          >
                            <Edit2 className="w-4 h-4" /> Edit
                          </button>
                          <Link
                            to={`/campaign/${campaign.id}`}
                            className="flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black text-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
                          >
                            Manage <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Summary row */}
            {completedCampaigns.length > 0 && (
              <div className="mt-8 bg-[#a3e635] border-2 border-black rounded-xl p-5 flex items-center gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <CheckCircle2 className="w-6 h-6 text-black shrink-0" />
                <p className="text-sm font-black text-black uppercase tracking-widest">
                  {completedCampaigns.length} CAMPAIGN{completedCampaigns.length > 1 ? 'S' : ''} COMPLETED SUCCESSFULLY. 
                  <span className="text-black font-bold ml-2 opacity-80">Invoices are available in each campaign's Deal Room.</span>
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
