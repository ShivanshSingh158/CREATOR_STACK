import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { type ValuationOutput } from '../../utils/valuationEngine';
import { formatDateDDMMYY, formatRupee } from '../../utils/formatters';
import { collection, getDocs, addDoc, serverTimestamp, query, where, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import {
  TrendingUp, Briefcase, CheckCircle2, Clock, XCircle,
  FileCheck, IndianRupee, BarChart3, Plus, ChevronRight,
  MessageSquare, User, Video, Search
} from 'lucide-react';

export default function CreatorDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [appliedCampaignIds, setAppliedCampaignIds] = useState<string[]>([]);
  const [selectedCampaignForApply, setSelectedCampaignForApply] = useState<any>(null);
  const [pitchMessage, setPitchMessage] = useState('');
  const [applying, setApplying] = useState(false);
  const [loadingApps, setLoadingApps] = useState(true);
  const [campaignSearch, setCampaignSearch] = useState('');

  const location = useLocation();
  const valuation = location.state?.valuation as ValuationOutput | undefined;

  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, 'users', currentUser.uid)).then(snap => {
      if (snap.exists()) setProfile(snap.data());
    }).catch(console.error);
  }, [currentUser]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const snap = await getDocs(collection(db, 'campaigns'));
        const all = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((c: any) => c.status !== 'completed')
          .sort((a: any, b: any) => {
            if (a.createdAt && b.createdAt) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            return 0;
          });
        setCampaigns(all);
      } catch (err) { console.error('Error fetching campaigns:', err); }
    };
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const appsQuery = query(collection(db, 'applications'), where('creatorId', '==', currentUser.uid));
    const unsub = onSnapshot(appsQuery, async (appsSnap) => {
      const appliedIds = appsSnap.docs.map(d => d.data().campaignId);
      setAppliedCampaignIds(appliedIds);

      const enriched = await Promise.all(appsSnap.docs.map(async (appDoc) => {
        const appData = appDoc.data() as any;
        let campaignData: any = null;
        try {
          const campSnap = await getDoc(doc(db, 'campaigns', appData.campaignId));
          if (campSnap.exists()) campaignData = { id: campSnap.id, ...campSnap.data() };
        } catch (_) {}
        return { id: appDoc.id, ...appData, campaign: campaignData };
      }));

      enriched.sort((a: any, b: any) => {
        const tA = a.appliedAt?.toMillis?.() || 0;
        const tB = b.appliedAt?.toMillis?.() || 0;
        return tB - tA;
      });

      setApplications(enriched);
      setLoadingApps(false);
    });
    return () => unsub();
  }, [currentUser]);

  const submitApplication = async () => {
    if (!currentUser || !selectedCampaignForApply) return;
    setApplying(true);
    try {
      await addDoc(collection(db, 'applications'), {
        campaignId: selectedCampaignForApply.id,
        creatorId: currentUser.uid,
        status: 'pending',
        type: 'inbound',
        appliedAt: serverTimestamp()
      });
      if (pitchMessage.trim()) {
        const chatRef = await addDoc(collection(db, 'chats'), {
          campaignId: selectedCampaignForApply.id,
          creatorId: currentUser.uid,
          brandId: selectedCampaignForApply.brandId,
          initiatedBy: 'creator',
          lastMessage: pitchMessage,
          lastMessageAt: serverTimestamp(),
          status: 'active'
        });
        await addDoc(collection(db, 'messages'), {
          chatId: chatRef.id,
          senderId: currentUser.uid,
          senderRole: 'creator',
          text: pitchMessage,
          timestamp: serverTimestamp()
        });
      }
      setSelectedCampaignForApply(null);
      setPitchMessage('');
    } catch (err) {
      console.error('Error applying:', err);
    } finally {
      setApplying(false);
    }
  };

  const activeApplications = applications.filter((a: any) => a.status === 'pending' || a.status === 'interested');
  const completedDeals = applications.filter((a: any) => a.campaign?.status === 'completed');

  const displayName = profile?.name || profile?.legalName || currentUser?.email?.split('@')[0] || 'Creator';
  const fairRate = profile?.valuation?.fair_rate_card?.base_integration_fee || valuation?.fair_rate_card?.base_integration_fee;
  const leakage = profile?.valuation?.revenue_leakage_annual || valuation?.revenue_leakage_annual;

  const getStatusDisplay = (app: any) => {
    if (app.campaign?.status === 'completed') return { label: 'Completed', color: 'text-green-700 bg-green-50 border-green-200', icon: CheckCircle2 };
    if (app.status === 'contracted') return { label: 'Contracted', color: 'text-purple-700 bg-purple-50 border-purple-200', icon: FileCheck };
    if (app.status === 'interested' || app.type === 'outbound') return { label: 'Brand Interested', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: TrendingUp };
    if (app.status === 'pending') return { label: 'Under Review', color: 'text-[#6b7280] bg-[#f3f4f6] border-[#e5e7eb]', icon: Clock };
    return { label: app.status, color: 'text-gray-600 bg-gray-100 border-gray-200', icon: Clock };
  };

  const filteredCampaigns = campaignSearch
    ? campaigns.filter(c => c.title?.toLowerCase().includes(campaignSearch.toLowerCase()) || c.niche?.toLowerCase().includes(campaignSearch.toLowerCase()))
    : campaigns;

  return (
    <div className="min-h-screen bg-[#f9fafb]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="flex min-h-screen">

        {/* ─── Sidebar — xl+ only ─── */}
        <aside className="hidden xl:flex w-64 shrink-0 bg-white border-r border-[#e5e7eb] flex-col sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="p-5 border-b border-[#f3f4f6]">
            <div className="flex items-center gap-3">
              {profile?.channelThumbnail ? (
                <img src={profile.channelThumbnail} alt={displayName} className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#111827] text-white flex items-center justify-center font-bold text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#111827] truncate">{displayName}</p>
                <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded uppercase tracking-wide">Creator</span>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-1 flex-1">
            <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest px-2 mb-2">Workspace</div>
            {[
              { label: 'Dashboard', icon: BarChart3, href: '/creator-dashboard', active: true },
              { label: 'Messages', icon: MessageSquare, href: '/messages' },
              { label: 'My Profile', icon: User, href: '/profile' },
            ].map(item => (
              <Link key={item.label} to={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${item.active ? 'bg-[#f3f4f6] text-[#111827]' : 'text-[#6b7280] hover:text-[#111827] hover:bg-[#f9fafb]'}`}
              >
                <item.icon className="w-4 h-4" /> {item.label}
              </Link>
            ))}

            <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest px-2 mt-5 mb-2">Your Stats</div>
            <div className="space-y-2 px-1">
              <div className="bg-[#f9fafb] rounded-xl p-3 border border-[#e5e7eb]">
                <p className="text-[10px] font-bold text-[#9ca3af] uppercase mb-0.5">Applications</p>
                <p className="text-2xl font-black text-[#111827]">{applications.length}</p>
              </div>
              <div className="bg-[#f9fafb] rounded-xl p-3 border border-[#e5e7eb]">
                <p className="text-[10px] font-bold text-[#9ca3af] uppercase mb-0.5">Active</p>
                <p className="text-2xl font-black text-[#111827]">{activeApplications.length}</p>
              </div>
              <div className="bg-[#f9fafb] rounded-xl p-3 border border-[#e5e7eb]">
                <p className="text-[10px] font-bold text-[#9ca3af] uppercase mb-0.5">Completed</p>
                <p className="text-2xl font-black text-[#111827]">{completedDeals.length}</p>
              </div>
              {fairRate && (
                <div className="bg-[#111827] rounded-xl p-3">
                  <p className="text-[10px] font-bold text-[#9ca3af] uppercase mb-0.5">Fair Base Rate</p>
                  <p className="text-lg font-black text-[#d1b07c]">₹{fairRate.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-[#f3f4f6]">
            <Link to="/profile" className="flex items-center justify-center gap-2 w-full border border-[#e5e7eb] text-[#374151] text-sm font-semibold py-2.5 rounded-xl hover:bg-[#f9fafb] transition-colors">
              <User className="w-4 h-4" /> Edit Profile
            </Link>
          </div>
        </aside>

        {/* ─── Main Content ─── */}
        <main className="flex-1 min-w-0">
          {/* Header */}
          <div className="bg-white border-b border-[#e5e7eb] px-5 lg:px-10 py-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-black text-[#111827] tracking-tight">Creator Workspace</h1>
                <p className="text-sm text-[#6b7280] mt-0.5">Welcome back, <span className="font-semibold text-[#111827]">{displayName}</span></p>
              </div>
              <div className="flex gap-3">
                <Link to="/messages" className="flex items-center gap-2 text-sm font-semibold border border-[#e5e7eb] text-[#374151] px-4 py-2.5 rounded-xl hover:bg-[#f9fafb] transition-colors">
                  <MessageSquare className="w-4 h-4" /> Messages
                </Link>
                <Link to="/profile" className="flex items-center gap-2 text-sm font-semibold bg-[#111827] text-white px-4 py-2.5 rounded-xl hover:bg-black transition-colors">
                  <User className="w-4 h-4" /> My Profile
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile KPIs */}
          <div className="xl:hidden grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 bg-white border-b border-[#e5e7eb]">
            {[
              { label: 'Applied', value: applications.length },
              { label: 'Active', value: activeApplications.length },
              { label: 'Completed', value: completedDeals.length },
              { label: 'Fair Rate', value: fairRate ? `₹${(fairRate / 1000).toFixed(0)}K` : '—' },
            ].map(kpi => (
              <div key={kpi.label} className="bg-[#f9fafb] rounded-xl p-3 border border-[#e5e7eb]">
                <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wide mb-0.5">{kpi.label}</p>
                <p className="text-lg font-black text-[#111827]">{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="p-5 lg:p-8 xl:p-10">

            {/* Revenue Leakage Alert */}
            {leakage && leakage > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-800">Estimated Annual Revenue Leakage</p>
                  <p className="text-xl font-black text-red-700">-₹{leakage.toLocaleString()}/yr</p>
                  <p className="text-xs text-red-600 mt-0.5">Use CreatorStack contracts to protect your fair rate.</p>
                </div>
              </div>
            )}

            {/* Two-column on desktop */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">

              {/* Applications — wider column */}
              <div className="xl:col-span-3">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black text-[#111827] flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#6b7280]" /> My Applications
                  </h2>
                  <span className="text-xs text-[#9ca3af]">{applications.length} total</span>
                </div>

                {loadingApps ? (
                  <div className="bg-white rounded-2xl border border-[#e5e7eb] p-10 flex items-center justify-center">
                    <div className="w-7 h-7 border-[3px] border-[#111827] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : applications.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-[#e5e7eb] p-10 text-center">
                    <Briefcase className="w-8 h-8 text-[#d1d5db] mx-auto mb-3" />
                    <p className="font-semibold text-[#374151]">No applications yet</p>
                    <p className="text-sm text-[#9ca3af] mt-1">Browse campaigns below and apply.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.map(app => {
                      const statusDisplay = getStatusDisplay(app);
                      const StatusIcon = statusDisplay.icon;
                      return (
                        <div key={app.id} className="bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-wide">{app.campaign?.niche || 'Campaign'}</p>
                              <h3 className="font-bold text-[#111827] truncate mt-0.5">{app.campaign?.title || 'Campaign Deleted'}</h3>
                              <p className="text-xs text-[#6b7280] mt-0.5">{app.campaign?.brandName || 'Brand'}</p>
                            </div>
                            <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${statusDisplay.color}`}>
                              <StatusIcon className="w-3 h-3" /> {statusDisplay.label}
                            </span>
                          </div>

                          <div className="flex gap-4 mt-3 text-xs text-[#6b7280]">
                            {app.campaign?.budget && <span>💰 {formatRupee(app.campaign.budget)}</span>}
                            {app.campaign?.deadline && <span>📅 {formatDateDDMMYY(app.campaign.deadline)}</span>}
                          </div>

                          {app.campaign?.status === 'completed' && (
                            <div className="mt-3 bg-green-50 border border-green-100 rounded-lg p-2.5 text-xs font-semibold text-green-800 flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Deal completed — funds released ✓
                            </div>
                          )}
                          {(app.status === 'interested' || app.type === 'outbound') && app.campaign?.status !== 'completed' && (
                            <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg p-2.5 text-xs font-semibold text-amber-800 flex items-center gap-2">
                              <TrendingUp className="w-3.5 h-3.5" /> Brand interested — check your Messages!
                            </div>
                          )}

                          <div className="mt-3 pt-3 border-t border-[#f3f4f6]">
                            <Link to="/messages" className="text-xs font-bold text-[#374151] hover:text-[#111827] flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> View Messages <ChevronRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Discover Campaigns — narrower column */}
              <div className="xl:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black text-[#111827] flex items-center gap-2">
                    <Video className="w-5 h-5 text-[#6b7280]" /> Discover
                  </h2>
                  <span className="text-xs text-[#9ca3af]">{filteredCampaigns.length} open</span>
                </div>

                <div className="relative mb-3">
                  <Search className="w-4 h-4 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search campaigns…"
                    className="w-full pl-9 pr-4 py-2 border border-[#e5e7eb] rounded-xl bg-white text-sm focus:outline-none focus:border-[#374151] transition-all"
                    value={campaignSearch}
                    onChange={e => setCampaignSearch(e.target.value)}
                  />
                </div>

                {filteredCampaigns.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-[#e5e7eb] p-8 text-center">
                    <p className="text-sm text-[#9ca3af] font-medium">No open campaigns right now.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                    {filteredCampaigns.map(campaign => (
                      <div key={campaign.id} className="bg-white rounded-xl border border-[#e5e7eb] p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-[10px] font-bold text-[#6b7280] bg-[#f3f4f6] px-2 py-0.5 rounded-lg uppercase">{campaign.niche}</span>
                              {campaign.brandName && <span className="text-xs font-semibold text-[#374151]">{campaign.brandName}</span>}
                            </div>
                            <h3 className="font-bold text-[#111827] text-sm leading-snug">{campaign.title}</h3>
                          </div>
                        </div>
                        <div className="flex gap-3 text-xs text-[#6b7280] mb-3">
                          <span>💰 {formatRupee(campaign.budget)}</span>
                          <span>📅 {formatDateDDMMYY(campaign.deadline)}</span>
                        </div>

                        {appliedCampaignIds.includes(campaign.id) ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Applied
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedCampaignForApply(campaign)}
                            className="w-full bg-[#111827] text-white text-xs font-bold py-2 rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-1.5"
                          >
                            Apply Now <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Apply Modal */}
      {selectedCampaignForApply && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-[#e5e7eb]">
            <h2 className="text-xl font-black text-[#111827] mb-1">Apply to Campaign</h2>
            <p className="text-sm text-[#6b7280] mb-1">{selectedCampaignForApply.title}</p>
            <p className="text-sm font-semibold text-[#374151] mb-5">by {selectedCampaignForApply.brandName}</p>

            <div className="mb-5">
              <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Pitch Message <span className="text-[#9ca3af] font-normal normal-case tracking-normal">(optional)</span></label>
              <textarea
                className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl focus:outline-none focus:border-[#374151] resize-none transition-all text-sm"
                rows={4}
                placeholder="Tell the brand why you're the perfect fit…"
                value={pitchMessage}
                onChange={e => setPitchMessage(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSelectedCampaignForApply(null)} className="flex-1 bg-[#f3f4f6] text-[#4b5563] font-semibold py-3 rounded-xl hover:bg-[#e5e7eb] transition-colors text-sm" disabled={applying}>
                Cancel
              </button>
              <button onClick={submitApplication} className="flex-1 bg-[#111827] text-white font-semibold py-3 rounded-xl hover:bg-black transition-colors text-sm disabled:opacity-50" disabled={applying}>
                {applying ? 'Applying…' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
