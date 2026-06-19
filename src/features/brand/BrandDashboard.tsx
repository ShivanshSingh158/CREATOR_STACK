import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { formatDateDDMMYY, formatRupee, formatNumberCompact } from '../../utils/formatters';
import { Search, Filter, Plus, TrendingUp, Users, Activity, Edit2, ChevronRight, CheckCircle2, Clock, Zap } from 'lucide-react';
import { collection, query, where, getDocs, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase';

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
    <div className="min-h-screen bg-[#f9fafb]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ─── Desktop Sidebar + Main Layout ─── */}
      <div className="flex min-h-screen">

        {/* Sidebar — desktop only */}
        <aside className="hidden xl:flex w-64 shrink-0 bg-white border-r border-[#e5e7eb] flex-col sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="p-6 border-b border-[#f3f4f6]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#111827] text-white flex items-center justify-center font-bold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#111827] truncate">{displayName}</p>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-wide">Brand</span>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-1 flex-1">
            <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest px-2 mb-2">Overview</div>
            {[
              { label: 'Dashboard', icon: Activity, href: '/brand-dashboard', active: true },
              { label: 'Find Creators', icon: Users, href: '/matchmaking' },
              { label: 'Messages', icon: TrendingUp, href: '/messages' },
            ].map(item => (
              <Link key={item.label} to={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${item.active ? 'bg-[#f3f4f6] text-[#111827]' : 'text-[#6b7280] hover:text-[#111827] hover:bg-[#f9fafb]'}`}
              >
                <item.icon className="w-4 h-4" /> {item.label}
              </Link>
            ))}

            <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest px-2 mt-5 mb-2">Stats</div>
            <div className="space-y-2 px-1">
              <div className="bg-[#f9fafb] rounded-xl p-3 border border-[#e5e7eb]">
                <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wide mb-0.5">Active Campaigns</p>
                <p className="text-2xl font-black text-[#111827]">{activeCampaigns.length}</p>
              </div>
              <div className="bg-[#f9fafb] rounded-xl p-3 border border-[#e5e7eb]">
                <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wide mb-0.5">Creator Pipeline</p>
                <p className="text-2xl font-black text-[#111827]">{pipelineCount}</p>
              </div>
              <div className="bg-[#f9fafb] rounded-xl p-3 border border-[#e5e7eb]">
                <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wide mb-0.5">Total Reach</p>
                <p className="text-xl font-black text-[#111827]">{totalReach > 0 ? formatNumberCompact(totalReach) : '—'}</p>
              </div>
              <div className="bg-[#111827] rounded-xl p-3">
                <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wide mb-0.5">Budget Deployed</p>
                <p className="text-lg font-black text-white">{formatRupee(totalBudget)}</p>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-[#f3f4f6]">
            <Link to="/create-campaign"
              className="flex items-center justify-center gap-2 w-full bg-[#111827] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-black transition-colors"
            >
              <Plus className="w-4 h-4" /> New Campaign
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">

          {/* Top header bar */}
          <div className="bg-white border-b border-[#e5e7eb] px-6 lg:px-10 py-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-black text-[#111827] tracking-tight">Executive Workspace</h1>
                <p className="text-sm text-[#6b7280] mt-0.5">Welcome back, <span className="font-semibold text-[#111827]">{displayName}</span></p>
              </div>
              <div className="flex gap-3">
                <Link to="/matchmaking"
                  className="flex items-center gap-2 text-sm font-semibold border border-[#e5e7eb] text-[#374151] px-4 py-2.5 rounded-xl hover:bg-[#f9fafb] transition-colors"
                >
                  <Search className="w-4 h-4" /> Find Creators
                </Link>
                <Link to="/create-campaign"
                  className="flex items-center gap-2 text-sm font-semibold bg-[#111827] text-white px-4 py-2.5 rounded-xl hover:bg-black transition-colors"
                >
                  <Plus className="w-4 h-4" /> New Campaign
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile KPI row — hidden on xl (sidebar has it) */}
          <div className="xl:hidden grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-white border-b border-[#e5e7eb]">
            {[
              { label: 'Active', value: activeCampaigns.length, icon: Activity },
              { label: 'Pipeline', value: pipelineCount, icon: Users },
              { label: 'Reach', value: totalReach > 0 ? formatNumberCompact(totalReach) : '0', icon: TrendingUp },
              { label: 'Budget', value: formatRupee(totalBudget), icon: Zap },
            ].map(kpi => (
              <div key={kpi.label} className="bg-[#f9fafb] rounded-xl p-3 border border-[#e5e7eb]">
                <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wide mb-0.5">{kpi.label}</p>
                <p className="text-lg font-black text-[#111827]">{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="p-5 lg:p-8 xl:p-10">

            {/* Filter row */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search campaigns…"
                  className="w-full pl-9 pr-4 py-2.5 border border-[#e5e7eb] rounded-xl bg-white text-sm focus:outline-none focus:border-[#374151] focus:ring-1 focus:ring-[#374151] transition-all"
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative">
                <Filter className="w-4 h-4 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  className="pl-9 pr-8 py-2.5 border border-[#e5e7eb] rounded-xl bg-white text-sm focus:outline-none focus:border-[#374151] appearance-none cursor-pointer"
                  value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="All">All statuses</option>
                  <option value="Active">Active only</option>
                  <option value="Completed">Completed only</option>
                </select>
              </div>
              <div className="text-sm text-[#9ca3af] self-center ml-auto">
                {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-[3px] border-[#111827] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-[#e5e7eb] p-16 text-center">
                <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-[#9ca3af]" />
                </div>
                <h3 className="text-lg font-bold text-[#111827] mb-1">No campaigns yet</h3>
                <p className="text-sm text-[#6b7280] mb-5">Create your first campaign to start working with verified creators.</p>
                <Link to="/create-campaign" className="inline-flex items-center gap-2 bg-[#111827] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-black transition-colors">
                  <Plus className="w-4 h-4" /> Create Campaign
                </Link>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-[#e5e7eb] p-12 text-center">
                <p className="text-[#6b7280] font-medium">No campaigns match your filters.</p>
                <button onClick={() => { setSearchQuery(''); setStatusFilter('All'); }} className="mt-3 text-sm font-semibold text-[#374151] hover:underline">Clear filters</button>
              </div>
            ) : (
              <>
                {/* Desktop table view */}
                <div className="hidden lg:block bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden shadow-sm">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
                        <th className="text-left px-6 py-3.5 text-xs font-bold text-[#9ca3af] uppercase tracking-wider">Campaign</th>
                        <th className="text-left px-4 py-3.5 text-xs font-bold text-[#9ca3af] uppercase tracking-wider">Niche</th>
                        <th className="text-left px-4 py-3.5 text-xs font-bold text-[#9ca3af] uppercase tracking-wider">Budget</th>
                        <th className="text-left px-4 py-3.5 text-xs font-bold text-[#9ca3af] uppercase tracking-wider">Deadline</th>
                        <th className="text-left px-4 py-3.5 text-xs font-bold text-[#9ca3af] uppercase tracking-wider">Pipeline</th>
                        <th className="text-left px-4 py-3.5 text-xs font-bold text-[#9ca3af] uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f3f4f6]">
                      {filteredCampaigns.map(campaign => {
                        const isCompleted = campaign.status === 'completed';
                        const pCount = campaignPipeline[campaign.id] || 0;
                        return (
                          <tr key={campaign.id} className="hover:bg-[#f9fafb] transition-colors group">
                            <td className="px-6 py-4">
                              <p className="font-bold text-[#111827] group-hover:text-[#b59560] transition-colors">{campaign.title}</p>
                              <p className="text-xs text-[#9ca3af] mt-0.5 line-clamp-1">{campaign.description}</p>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-xs font-semibold text-[#6b7280] bg-[#f3f4f6] px-2 py-1 rounded-lg">{campaign.niche}</span>
                            </td>
                            <td className="px-4 py-4 font-bold text-[#111827] text-sm">{formatRupee(campaign.budget)}</td>
                            <td className="px-4 py-4 text-sm text-[#6b7280]">{formatDateDDMMYY(campaign.deadline)}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-[#9ca3af]" />
                                <span className="text-sm font-semibold text-[#374151]">{pCount}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {isCompleted ? (
                                <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                                  <CheckCircle2 className="w-3 h-3" /> Completed
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs font-bold text-[#15803d] bg-[#15803d]/10 px-2.5 py-1 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#15803d] animate-pulse" /> Active
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => navigate(`/edit-campaign/${campaign.id}`)}
                                  className="p-1.5 text-[#9ca3af] hover:text-[#374151] hover:bg-[#f3f4f6] rounded-lg transition-colors"
                                  title="Edit campaign"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <Link
                                  to={`/campaign/${campaign.id}`}
                                  className="flex items-center gap-1 text-xs font-bold text-[#111827] bg-[#f3f4f6] hover:bg-[#e5e7eb] px-3 py-1.5 rounded-lg transition-colors"
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
                      <div key={campaign.id} className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm overflow-hidden">
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-[#6b7280] bg-[#f3f4f6] px-2 py-0.5 rounded-lg">{campaign.niche}</span>
                                {isCompleted ? (
                                  <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" /> Done
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                    <Clock className="w-3 h-3" /> Active
                                  </span>
                                )}
                              </div>
                              <h3 className="font-bold text-[#111827] text-base">{campaign.title}</h3>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            <div>
                              <p className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-wide">Budget</p>
                              <p className="text-sm font-bold text-[#111827]">{formatRupee(campaign.budget)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-wide">Deadline</p>
                              <p className="text-sm font-bold text-[#111827]">{formatDateDDMMYY(campaign.deadline)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-wide">Pipeline</p>
                              <p className="text-sm font-bold text-[#111827]">{pCount} creators</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex border-t border-[#f3f4f6]">
                          <button
                            onClick={() => navigate(`/edit-campaign/${campaign.id}`)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-[#6b7280] hover:bg-[#f9fafb] transition-colors border-r border-[#f3f4f6]"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <Link
                            to={`/campaign/${campaign.id}`}
                            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-[#111827] hover:bg-[#f9fafb] transition-colors"
                          >
                            Manage <ChevronRight className="w-3.5 h-3.5" />
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
              <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <p className="text-sm font-semibold text-green-800">
                  {completedCampaigns.length} campaign{completedCampaigns.length > 1 ? 's' : ''} completed successfully. 
                  <span className="text-green-600 font-normal ml-1">Invoices are available in each campaign's Deal Room.</span>
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
