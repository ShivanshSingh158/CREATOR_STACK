import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { type ValuationOutput } from '../../utils/valuationEngine';
import { formatDateDDMMYY, formatRupee } from '../../utils/formatters';
import { collection, getDocs, addDoc, serverTimestamp, query, where, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { TrendingUp, Briefcase, CheckCircle2, Clock, XCircle, FileCheck, IndianRupee, BarChart3, Plus, ChevronRight } from 'lucide-react';

export default function CreatorDashboard() {
  const { currentUser } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [appliedCampaignIds, setAppliedCampaignIds] = useState<string[]>([]);
  const [selectedCampaignForApply, setSelectedCampaignForApply] = useState<any>(null);
  const [pitchMessage, setPitchMessage] = useState('');
  const [applying, setApplying] = useState(false);
  const [loadingApps, setLoadingApps] = useState(true);

  const location = useLocation();
  const valuation = location.state?.valuation as ValuationOutput | undefined;

  // Fetch creator profile
  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, 'users', currentUser.uid)).then(snap => {
      if (snap.exists()) setProfile(snap.data());
    }).catch(console.error);
  }, [currentUser]);

  // Fetch all available campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const querySnapshot = await getDocs(query(collection(db, 'campaigns'), where('status', '!=', 'completed')));
        const allCampaigns = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Also include campaigns without status field (legacy active ones)
        const legacySnap = await getDocs(collection(db, 'campaigns'));
        const legacyCampaigns = legacySnap.docs
          .filter(d => !d.data().status)
          .map(d => ({ id: d.id, ...d.data() }));
        const merged = [...allCampaigns, ...legacyCampaigns];
        const unique = Array.from(new Map(merged.map(c => [c.id, c])).values());
        unique.sort((a: any, b: any) => {
          if (a.createdAt && b.createdAt) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          return 0;
        });
        setCampaigns(unique);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      }
    };
    fetchCampaigns();
  }, []);

  // Fetch creator's applications with campaign details (real-time)
  useEffect(() => {
    if (!currentUser) return;
    const appsQuery = query(collection(db, 'applications'), where('creatorId', '==', currentUser.uid));
    const unsub = onSnapshot(appsQuery, async (appsSnap) => {
      const appliedIds = appsSnap.docs.map(d => d.data().campaignId);
      setAppliedCampaignIds(appliedIds);

      // Fetch campaign details for each application
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
    } catch (error) {
      console.error("Error applying:", error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  // Computed KPIs from real data
  const activeApplications = applications.filter((a: any) => a.status === 'pending' || a.status === 'interested');
  const completedDeals = applications.filter((a: any) => a.campaign?.status === 'completed');

  const displayName = profile?.name || profile?.legalName || currentUser?.email?.split('@')[0] || 'Creator';
  const fairRate = profile?.valuation?.fair_rate_card?.base_integration_fee || valuation?.fair_rate_card?.base_integration_fee;
  const leakage = profile?.valuation?.revenue_leakage_annual || valuation?.revenue_leakage_annual;

  const getStatusDisplay = (app: any) => {
    const campaignCompleted = app.campaign?.status === 'completed';
    if (campaignCompleted) return { label: 'Completed', color: 'text-green-700 bg-green-100 border-green-200', icon: CheckCircle2 };
    if (app.status === 'contracted') return { label: 'Contracted', color: 'text-purple-700 bg-purple-100 border-purple-200', icon: FileCheck };
    if (app.status === 'interested' || app.type === 'outbound') return { label: 'Brand Interested', color: 'text-[#b59560] bg-[#fef9ef] border-[#d1b07c]', icon: TrendingUp };
    if (app.status === 'pending') return { label: 'Under Review', color: 'text-[#6b7280] bg-[#f3f4f6] border-[#e5e7eb]', icon: Clock };
    return { label: app.status, color: 'text-gray-600 bg-gray-100 border-gray-200', icon: Clock };
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827] font-['Outfit'] pb-16">
      {/* Hero Header */}
      <div className="bg-white border-b border-[#e5e7eb] pt-10 pb-14 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-xs font-bold bg-brand-50 text-brand-700 px-2 py-1 rounded border border-brand-200 uppercase tracking-widest">Creator Workspace</span>
            <h1 className="text-4xl md:text-5xl font-black text-[#111827] tracking-tight mt-2">
              Welcome back, <span className="text-brand-600">{displayName}</span>
            </h1>
            <p className="mt-2 text-[#6b7280] text-lg">Your creator command centre — track deals, monitor applications, and discover brand campaigns.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/profile" className="bg-white border border-[#e5e7eb] text-[#111827] font-bold py-3 px-5 rounded-lg hover:bg-[#f9fafb] transition-all flex items-center gap-2 shadow-sm">
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-1">Applied</p>
              <p className="text-3xl font-black text-[#111827]">{applications.length}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-1">Active</p>
              <p className="text-3xl font-black text-[#111827]">{activeApplications.length}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-1">Completed</p>
              <p className="text-3xl font-black text-[#111827]">{completedDeals.length}</p>
            </div>
          </div>
          <div className="bg-[#111827] p-6 rounded-xl border border-[#111827] shadow-lg flex items-center gap-4 text-white">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-[#d1b07c]" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Fair Base Rate</p>
              <p className="text-2xl font-black text-white">
                {fairRate ? `₹${fairRate.toLocaleString()}` : 'Run Valuation'}
              </p>
            </div>
          </div>
        </div>

        {/* My Applications Tracker */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-black text-[#111827] tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-brand-600" /> My Application Pipeline
            </h2>
            <span className="text-sm text-[#6b7280] font-medium">{applications.length} total</span>
          </div>

          {loadingApps ? (
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-12 flex items-center justify-center">
              <div className="w-8 h-8 border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#e5e7eb] border-dashed p-16 text-center">
              <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-[#9ca3af]" />
              </div>
              <h3 className="text-xl font-bold text-[#111827] mb-2">No Applications Yet</h3>
              <p className="text-[#6b7280] max-w-md mx-auto">Discover brand campaigns below and apply to start building your pipeline.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {applications.map(app => {
                const statusDisplay = getStatusDisplay(app);
                const StatusIcon = statusDisplay.icon;
                return (
                  <div key={app.id} className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider">{app.campaign?.niche || 'Campaign'}</span>
                        <h3 className="text-lg font-black text-[#111827] truncate">{app.campaign?.title || 'Campaign Deleted'}</h3>
                        <p className="text-sm text-[#6b7280] truncate">{app.campaign?.brandName || 'Brand'}</p>
                      </div>
                      <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ml-3 shrink-0 ${statusDisplay.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" /> {statusDisplay.label}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      {app.campaign?.budget && (
                        <span className="text-[#6b7280]">💰 {formatRupee(app.campaign.budget)}</span>
                      )}
                      {app.campaign?.deadline && (
                        <span className="text-[#6b7280]">📅 {formatDateDDMMYY(app.campaign.deadline)}</span>
                      )}
                    </div>
                    {app.campaign?.status === 'completed' && (
                      <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-sm text-green-800 font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                        Deal completed. Funds have been released.
                      </div>
                    )}
                    {(app.status === 'interested' || app.type === 'outbound') && app.campaign?.status !== 'completed' && (
                      <div className="bg-[#fef9ef] border border-[#d1b07c]/30 rounded-lg p-3 text-sm text-[#b59560] font-medium flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 shrink-0" />
                        A brand has expressed interest — check your Messages!
                      </div>
                    )}
                    <div className="flex gap-3 pt-1">
                      <Link to="/messages" className="flex-1 text-center text-sm font-bold border border-[#e5e7eb] text-[#111827] py-2 rounded-lg hover:bg-[#f9fafb] transition-colors">
                        View Messages
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Revenue Leakage Warning */}
        {leakage && leakage > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-5 mb-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-800 uppercase tracking-wider">Annual Revenue Leakage Detected</p>
              <p className="text-2xl font-black text-red-700">-₹{leakage.toLocaleString()}</p>
              <p className="text-xs text-red-600 mt-1">Estimated loss from accepting unoptimized flat-fee deals. Use CreatorStack contracts to protect your rate.</p>
            </div>
          </div>
        )}

        {/* Available Campaigns Feed */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-black text-[#111827] tracking-tight flex items-center gap-2">
              <Plus className="w-6 h-6 text-brand-600" /> Discover Campaigns
            </h2>
            <span className="text-sm text-[#6b7280] font-medium">{campaigns.length} open</span>
          </div>

          {campaigns.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-12 text-center">
              <p className="text-[#6b7280] font-medium">No campaigns available right now. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map(campaign => (
                <div key={campaign.id} className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow border-l-4 border-l-brand-500">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-brand-600">{campaign.brandName}</span>
                      <span className="bg-[#f3f4f6] text-[#4b5563] px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">{campaign.niche}</span>
                    </div>
                    <h3 className="text-xl font-black text-[#111827]">{campaign.title}</h3>
                    <p className="text-sm text-[#6b7280] mt-1 line-clamp-2">{campaign.description}</p>
                    <div className="flex gap-5 mt-3 text-sm text-[#6b7280] font-medium">
                      <span>💰 {formatRupee(campaign.budget)}</span>
                      <span>📅 Deadline: {formatDateDDMMYY(campaign.deadline)}</span>
                      {campaign.deliverables && <span>🎬 {campaign.deliverables}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0 shrink-0">
                    {appliedCampaignIds.includes(campaign.id) ? (
                      <div className="flex items-center gap-2 text-sm font-bold text-green-700 bg-green-50 border border-green-200 px-4 py-2.5 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" /> Applied
                      </div>
                    ) : (
                      <button onClick={() => setSelectedCampaignForApply(campaign)} className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2">
                        Apply Now <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {selectedCampaignForApply && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-7 border border-[#e5e7eb]">
            <h2 className="text-2xl font-black text-[#111827] mb-1">Apply to Campaign</h2>
            <p className="text-sm text-[#6b7280] mb-1 font-medium">{selectedCampaignForApply.title}</p>
            <p className="text-sm text-brand-600 font-bold mb-6">by {selectedCampaignForApply.brandName}</p>

            <div className="mb-5">
              <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-2">Pitch Message (Optional)</label>
              <textarea
                className="w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none transition-all"
                rows={4}
                placeholder="Tell the brand why you are the perfect fit for this campaign..."
                value={pitchMessage}
                onChange={(e) => setPitchMessage(e.target.value)}
              />
              <p className="text-xs text-[#9ca3af] mt-2">A pitch message will start a direct conversation with the brand.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSelectedCampaignForApply(null)} className="flex-1 bg-[#f3f4f6] text-[#4b5563] font-bold py-3 rounded-lg hover:bg-[#e5e7eb] transition-colors" disabled={applying}>
                Cancel
              </button>
              <button onClick={submitApplication} className="flex-1 bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50" disabled={applying}>
                {applying ? 'Applying...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
