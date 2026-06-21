import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { type ValuationOutput } from '../../utils/valuationEngine';
import { formatDateDDMMYY, formatRupee, formatNumberCompact } from '../../utils/formatters';
import { generateMediaKitPDF } from '../../utils/generateMediaKitPDF';
import { RELATED_NICHES } from '../../utils/niches';
import {
  AnimatedCounter,
  EmptyState,
  NotificationBell,
} from '../../components/ui/SharedComponents';
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  where,
  doc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  TrendingUp,
  Briefcase,
  CheckCircle2,
  Clock,
  XCircle,
  FileCheck,
  IndianRupee,
  BarChart3,
  Plus,
  ChevronRight,
  MessageSquare,
  User,
  Video,
  Search,
  ShieldCheck,
  Bell,
  Download,
  Users,
  X,
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
  const [unreadChats, setUnreadChats] = useState(0);
  // Per-campaign applicant counts for urgency signals
  const [campaignApplicantCounts, setCampaignApplicantCounts] = useState<Record<string, number>>({});

  // In-app toast notification state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'interest' | 'contract' }[]>([]);
  // Ref to track previous application statuses — prevents firing on initial load
  const prevStatusRef = useRef<Record<string, string>>({});

  const location = useLocation();
  const valuation = location.state?.valuation as ValuationOutput | undefined;

  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, 'users', currentUser.uid))
      .then((snap) => {
        if (snap.exists()) setProfile(snap.data());
      })
      .catch(console.error);

    // Count unread chats for notification bell
    const chatsQuery = query(
      collection(db, 'chats'),
      where('creatorId', '==', currentUser.uid),
      where('status', '==', 'active'),
    );
    const unsubChats = onSnapshot(chatsQuery, (snap) => {
      setUnreadChats(
        snap.docs.filter((d) => {
          const data = d.data();
          return data.lastMessageSenderId && data.lastMessageSenderId !== currentUser.uid;
        }).length,
      );
    });
    return () => unsubChats();
  }, [currentUser]);

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

        // Fetch applicant counts per campaign for urgency signals
        if (all.length > 0) {
          const ids = all.map((c: any) => c.id);
          const chunks: string[][] = [];
          for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));
          const counts: Record<string, number> = {};
          for (const chunk of chunks) {
            const appsSnap = await getDocs(
              query(collection(db, 'applications'), where('campaignId', 'in', chunk)),
            );
            appsSnap.docs.forEach((d) => {
              const cid = d.data().campaignId;
              counts[cid] = (counts[cid] || 0) + 1;
            });
          }
          setCampaignApplicantCounts(counts);
        }
      } catch (err) {
        console.error('Error fetching campaigns:', err);
      }
    };
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const appsQuery = query(
      collection(db, 'applications'),
      where('creatorId', '==', currentUser.uid),
    );
    const unsub = onSnapshot(appsQuery, async (appsSnap) => {
      const appliedIds = appsSnap.docs.map((d) => d.data().campaignId);
      setAppliedCampaignIds(appliedIds);

      // ── Status change notifications ────────────────────────────────────────
      // Check each app's status against the previous known status.
      // Only fire toast on a genuine change (not on initial snapshot load).
      const isFirstLoad = Object.keys(prevStatusRef.current).length === 0;
      if (!isFirstLoad) {
        appsSnap.docs.forEach((appDoc) => {
          const data = appDoc.data();
          const prevStatus = prevStatusRef.current[appDoc.id];
          const newStatus = data.status as string;
          if (prevStatus && prevStatus !== newStatus) {
            if (newStatus === 'interested') {
              setToasts((prev) => [
                ...prev,
                {
                  id: appDoc.id,
                  message: `🎉 A brand marked you as Interested for "${data.campaignTitle || 'a campaign'}"!`,
                  type: 'interest',
                },
              ]);
            } else if (newStatus === 'contracted') {
              setToasts((prev) => [
                ...prev,
                {
                  id: appDoc.id,
                  message: `🤝 Congratulations! A brand wants to contract you for "${data.campaignTitle || 'a campaign'}"!`,
                  type: 'contract',
                },
              ]);
            }
          }
        });
      }
      // Update the status ref for next comparison
      appsSnap.docs.forEach((appDoc) => {
        prevStatusRef.current[appDoc.id] = appDoc.data().status;
      });
      // ─────────────────────────────────────────────────────────────────────

      const enriched = await Promise.all(
        appsSnap.docs.map(async (appDoc) => {
          const appData = appDoc.data() as any;
          let campaignData: any = null;
          let dealRoomData: any = null;
          try {
            const campSnap = await getDoc(doc(db, 'campaigns', appData.campaignId));
            if (campSnap.exists()) campaignData = { id: campSnap.id, ...campSnap.data() };
          } catch (_) {}
          try {
            const drSnap = await getDoc(
              doc(db, 'dealRooms', `${appData.campaignId}_${currentUser.uid}`),
            );
            if (drSnap.exists()) dealRoomData = { id: drSnap.id, ...drSnap.data() };
          } catch (_) {}
          return { id: appDoc.id, ...appData, campaign: campaignData, dealRoom: dealRoomData };
        }),
      );

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

  // Auto-dismiss toasts after 6 seconds
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 6000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const dismissToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const submitApplication = async () => {
    if (!currentUser || !selectedCampaignForApply) return;
    setApplying(true);
    try {
      await addDoc(collection(db, 'applications'), {
        campaignId: selectedCampaignForApply.id,
        creatorId: currentUser.uid,
        status: 'pending',
        type: 'inbound',
        appliedAt: serverTimestamp(),
      });
      if (pitchMessage.trim()) {
        const chatRef = await addDoc(collection(db, 'chats'), {
          campaignId: selectedCampaignForApply.id,
          creatorId: currentUser.uid,
          brandId: selectedCampaignForApply.brandId,
          initiatedBy: 'creator',
          lastMessage: pitchMessage,
          lastMessageAt: serverTimestamp(),
          lastMessageSenderId: currentUser.uid,
          status: 'active',
        });
        await addDoc(collection(db, 'messages'), {
          chatId: chatRef.id,
          senderId: currentUser.uid,
          senderRole: 'creator',
          text: pitchMessage,
          timestamp: serverTimestamp(),
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

  const activeApplications = applications.filter(
    (a: any) => a.status === 'pending' || a.status === 'interested',
  );
  const completedDeals = applications.filter((a: any) => a.campaign?.status === 'completed');

  const displayName =
    profile?.youtubeData?.channelName ||
    profile?.name ||
    profile?.legalName ||
    currentUser?.email?.split('@')[0] ||
    'Creator';
  const fairRate =
    profile?.valuation?.fair_rate_card?.base_integration_fee ||
    valuation?.fair_rate_card?.base_integration_fee;
  const leakage = profile?.valuation?.revenue_leakage_annual || valuation?.revenue_leakage_annual;

  const getStatusDisplay = (app: any) => {
    if (app.campaign?.status === 'completed')
      return {
        label: 'Completed',
        color: 'text-green-700 bg-green-50 border-green-200',
        icon: CheckCircle2,
      };
    if (app.status === 'contracted')
      return {
        label: 'Contracted',
        color: 'text-purple-700 bg-purple-50 border-purple-200',
        icon: FileCheck,
      };
    if (app.status === 'interested' || app.type === 'outbound')
      return {
        label: 'Brand Interested',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        icon: TrendingUp,
      };
    if (app.status === 'pending')
      return {
        label: 'Under Review',
        color: 'text-[#6b7280] bg-[#f3f4f6] border-[#e5e7eb]',
        icon: Clock,
      };
    return { label: app.status, color: 'text-gray-600 bg-gray-100 border-gray-200', icon: Clock };
  };

  const creatorNiche = profile?.niche || 'Daily Vlogs';
  const relatedNiches = RELATED_NICHES[creatorNiche] || [];
  const allowedNiches = [creatorNiche, ...relatedNiches].map((n) => n.toLowerCase());

  const filteredCampaigns = campaignSearch
    ? campaigns.filter(
        (c) =>
          c.title?.toLowerCase().includes(campaignSearch.toLowerCase()) ||
          (Array.isArray(c.niche)
            ? c.niche.some((n: string) => n.toLowerCase().includes(campaignSearch.toLowerCase()))
            : c.niche?.toLowerCase().includes(campaignSearch.toLowerCase())),
      )
    : campaigns.filter((c) => {
        if (!c.niche) return false;
        if (Array.isArray(c.niche))
          return c.niche.some((n: string) => allowedNiches.includes(n.toLowerCase()));
        return allowedNiches.includes(c.niche.toLowerCase());
      });

  return (
    <div
      className="min-h-[calc(100vh-64px)] bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Application status toast notifications ── */}
      <div className="fixed top-20 right-4 z-[999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-5 py-4 border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full animate-[slideInRight_0.4s_ease-out] ${
              toast.type === 'contract'
                ? 'bg-[#e8473f] text-white'
                : 'bg-[#a3e635] text-black'
            }`}
          >
            <Bell className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-xs font-black uppercase tracking-widest leading-relaxed flex-1">{toast.message}</p>
            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex min-h-[calc(100vh-64px)] max-w-screen-2xl mx-auto">
        {/* ─── Sidebar — xl+ only ─── */}
        <aside className="hidden xl:flex w-64 shrink-0 flex-col sticky top-16 h-[calc(100vh-64px)] overflow-y-auto px-5 py-6">
          {/* Profile Widget */}
          <Link
            to="/profile"
            className="block bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all p-4 mb-6 rounded-xl cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <img
                src={
                  profile?.youtubeData?.thumbnailUrl ||
                  profile?.channelThumbnail ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=e0e7ff&color=312e81`
                }
                alt={displayName}
                className="w-10 h-10 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=e0e7ff&color=312e81`;
                }}
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-black truncate">{displayName}</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  <span className="inline-block text-[8px] font-bold text-white bg-[#e8473f] border-2 border-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    Creator
                  </span>
                  {profile?.language && (
                    <span className="inline-block text-[8px] font-bold text-black bg-indigo-100 border-2 border-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      {profile.language}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>

          <div className="space-y-2 mb-6">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">
              Workspace
            </div>
            {[
              { label: 'Dashboard', icon: BarChart3, href: '/creator-dashboard', active: true },
              { label: 'Messages', icon: MessageSquare, href: '/messages' },
              { label: 'My Profile', icon: User, href: '/profile' },
              { label: 'Team Settings', icon: Users, href: '/team-settings' },
            ].map((item, i) => (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all border-2 
                  ${item.active ? 'border-black bg-red-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[#e8473f]' : 'border-transparent text-gray-600 hover:border-black hover:bg-white hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:text-black'}`}
              >
                <item.icon className={`w-4 h-4 ${item.active ? 'text-[#e8473f]' : ''}`} />{' '}
                {item.label}
              </Link>
            ))}
          </div>

          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">
            Your Stats
          </div>
          <div className="space-y-3 px-1 pb-10">
            {/* Stat Boxes */}
            <div className="bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-3 rounded-xl">
              <p className="text-xs font-semibold text-gray-500 mb-0.5">Applications</p>
              <p className="text-2xl font-black text-black">
                <AnimatedCounter target={applications.length} />
              </p>
            </div>

            <div className="bg-[#fff0ee] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-3 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-[#e8473f] mb-0.5">Active</p>
                <p className="text-2xl font-black text-black">
                  <AnimatedCounter target={activeApplications.length} />
                </p>
              </div>
            </div>

            <div className="bg-emerald-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-3 rounded-xl">
              <p className="text-xs font-semibold text-emerald-800 mb-0.5">Completed</p>
              <p className="text-2xl font-black text-emerald-950">
                <AnimatedCounter target={completedDeals.length} />
              </p>
            </div>

            {fairRate && (
              <div className="bg-[#e8473f] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-3 rounded-xl mt-4">
                <p className="text-xs font-semibold text-red-100 mb-0.5">Fair Base Rate</p>
                <p className="text-lg font-black text-white">₹{fairRate.toLocaleString()}</p>
              </div>
            )}

            {leakage > 0 && (
              <div className="bg-rose-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-3 rounded-xl mt-3">
                <p className="text-xs font-bold text-rose-900 mb-0.5 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Leakage
                </p>
                <p className="text-lg font-black text-rose-700">-₹{leakage.toLocaleString()}</p>
              </div>
            )}

            <button
              onClick={() => generateMediaKitPDF(profile)}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-white text-gray-800 border-2 border-black font-bold py-2.5 rounded-lg hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all"
            >
              <Download className="w-4 h-4" /> Media Kit PDF
            </button>
          </div>
        </aside>

        {/* ─── Main Content ─── */}
        <main className="flex-1 min-w-0 p-5 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 flex-wrap mb-8 border-b-2 border-gray-200 pb-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-black tracking-tight mb-1">
                Creator Workspace
              </h1>
              <p className="text-sm text-gray-600">Manage your deals and find new opportunities.</p>
            </div>
            <div className="flex gap-3 items-center">
              <NotificationBell
                unreadCount={unreadChats}
                onClick={() => navigate('/messages')}
              />
              <Link
                to="/profile"
                className="hidden sm:flex items-center gap-2 text-sm font-semibold border-2 border-black bg-[#fff0ee] text-[#e8473f] px-4 py-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <User className="w-4 h-4 text-[#e8473f]" /> Edit Profile
              </Link>
              <Link
                to="/disputes"
                className="hidden sm:flex items-center gap-2 text-sm font-semibold border-2 border-black bg-white text-gray-800 px-4 py-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                ⚖️ Disputes
              </Link>
            </div>
          </div>

          {/* Two-column on desktop */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Applications — wider column */}
            <div className="xl:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-black flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#e8473f]" /> Applications
                </h2>
                <span className="text-xs font-bold bg-[#fff0ee] text-[#e8473f] px-2.5 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {applications.length} Total
                </span>
              </div>

              {loadingApps ? (
                <div className="bg-white border-2 border-black p-10 flex flex-col gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                      <div className="h-6 bg-gray-200 rounded w-2/3 mb-1" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : applications.length === 0 ? (
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl">
                  <EmptyState
                    emoji="📭"
                    title="No Applications Yet"
                    description="Campaigns are waiting for you. Browse the marketplace and apply to start earning."
                    ctaLabel="Browse Campaigns →"
                    onCta={() => {
                      document.getElementById('campaign-browse-section')?.scrollIntoView({ behavior: 'smooth' });
                      document.getElementById('campaign-search-input')?.focus();
                    }}
                    ctaVariant="creator"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => {
                    const statusDisplay = getStatusDisplay(app);
                    const StatusIcon = statusDisplay.icon;
                    return (
                      <div
                        key={app.id}
                        className="bg-white border-2 border-black p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all rounded-xl"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <span className="inline-block bg-slate-100 border-2 border-black text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-slate-800">
                              {Array.isArray(app.campaign?.niche)
                                ? app.campaign.niche[0] +
                                  (app.campaign.niche.length > 1
                                    ? ` +${app.campaign.niche.length - 1}`
                                    : '')
                                : app.campaign?.niche || 'Campaign'}
                            </span>
                            <h3 className="text-lg font-bold text-black truncate">
                              {app.campaign?.title || 'Campaign Deleted'}
                            </h3>
                            <p className="text-xs text-gray-600 mt-1">
                              {app.campaign?.brandName || 'Brand'}
                            </p>
                          </div>

                          {/* Professional Status Pill */}
                          <div className="shrink-0">
                            <span
                              className={`flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-1 rounded-md border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${app.status === 'pending' ? 'bg-slate-50 text-slate-700' : app.status === 'interested' ? 'bg-amber-100 text-amber-800' : app.status === 'contracted' ? 'bg-purple-100 text-purple-800' : app.campaign?.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}
                            >
                              <StatusIcon className="w-3 h-3" /> {statusDisplay.label}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-3 mt-4 text-xs font-semibold text-gray-700">
                          {app.campaign?.budget && (
                            <span className="bg-white border-2 border-black px-2 py-1 rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-emerald-800">
                              💰 {formatRupee(app.campaign.budget)}
                            </span>
                          )}
                          {app.campaign?.deadline && (
                            <span className="bg-white border-2 border-black px-2 py-1 rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-slate-700">
                              📅 {formatDateDDMMYY(app.campaign.deadline)}
                            </span>
                          )}
                        </div>

                        {app.campaign?.status === 'completed' && (
                          <div className="mt-4 bg-emerald-50 border-2 border-black p-2.5 text-xs font-semibold text-emerald-800 flex items-center gap-2 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Deal completed —
                            funds released
                          </div>
                        )}
                        {(app.status === 'interested' || app.type === 'outbound') &&
                          app.campaign?.status !== 'completed' && (
                            <div className="mt-4 bg-amber-50 border-2 border-black p-2.5 text-xs font-semibold text-amber-800 flex items-center gap-2 rounded-lg">
                              <TrendingUp className="w-4 h-4 text-amber-600" /> Brand interested —
                              Check Messages!
                            </div>
                          )}

                        {/* Deal Room CTA — shown when brand has initiated a contract */}
                        {app.dealRoom && (
                          <div
                            className={`mt-4 border-2 border-black rounded-xl p-4 ${
                              app.dealRoom.status === 'completed'
                                ? 'bg-emerald-50'
                                : app.dealRoom.status === 'pending_creator_sign'
                                  ? 'bg-amber-50'
                                  : 'bg-indigo-50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <ShieldCheck
                                  className={`w-4 h-4 ${
                                    app.dealRoom.status === 'completed'
                                      ? 'text-emerald-600'
                                      : app.dealRoom.status === 'pending_creator_sign'
                                        ? 'text-amber-600'
                                        : 'text-indigo-600'
                                  }`}
                                />
                                <div>
                                  <p
                                    className={`text-xs font-black uppercase tracking-wider ${
                                      app.dealRoom.status === 'completed'
                                        ? 'text-emerald-900'
                                        : app.dealRoom.status === 'pending_creator_sign'
                                          ? 'text-amber-900'
                                          : 'text-indigo-900'
                                    }`}
                                  >
                                    {app.dealRoom.status === 'pending_creator_sign' &&
                                      '⚡ Action Required — Sign Contract'}
                                    {app.dealRoom.status === 'creator_signed' &&
                                      'Waiting for Escrow Lock'}
                                    {app.dealRoom.status === 'escrow_locked' &&
                                      'Escrow Locked — Submit Your Video'}
                                    {app.dealRoom.status === 'pod_submitted' &&
                                      'PoD Under Verification'}
                                    {app.dealRoom.status === 'pod_verified' &&
                                      'Verified — Funds Releasing'}
                                    {app.dealRoom.status === 'completed' &&
                                      'Deal Complete — Payment Received'}
                                  </p>
                                  <p className="text-[10px] text-gray-600 mt-0.5">
                                    {formatRupee(app.dealRoom.amount || 0)}
                                  </p>
                                </div>
                              </div>
                              <Link
                                to={`/creator-deal-room/${app.campaign?.id}`}
                                className={`shrink-0 flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all ${
                                  app.dealRoom.status === 'pending_creator_sign'
                                    ? 'bg-amber-600 text-white'
                                    : app.dealRoom.status === 'completed'
                                      ? 'bg-emerald-700 text-white'
                                      : 'bg-slate-900 text-white'
                                }`}
                              >
                                {app.dealRoom.status === 'pending_creator_sign'
                                  ? 'Sign Now'
                                  : 'View Deal'}{' '}
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <Link
                            to="/messages"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Open Chat{' '}
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Discover Campaigns */}
            <div id="campaign-browse-section" className="xl:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-black flex items-center gap-2">
                  <Video className="w-5 h-5 text-indigo-600" /> Discover
                </h2>
                <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {filteredCampaigns.length} Open
                </span>
              </div>

              <div className="relative mb-4">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="campaign-search-input"
                  type="text"
                  placeholder="Search campaigns…"
                  className="w-full pl-9 pr-4 py-2.5 border-2 border-black bg-white rounded-xl text-sm placeholder-gray-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:border-indigo-600 transition-colors"
                  value={campaignSearch}
                  onChange={(e) => setCampaignSearch(e.target.value)}
                />
              </div>

              {filteredCampaigns.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-300 p-6 text-center rounded-xl">
                  <p className="text-sm font-medium text-gray-500">No open campaigns.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 pb-10">
                  {filteredCampaigns.map((campaign) => {
                    const applicants = campaignApplicantCounts[campaign.id] || 0;
                    const deadline = campaign.deadline ? new Date(campaign.deadline) : null;
                    const daysLeft = deadline
                      ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : null;
                    const isUrgent = daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;

                    return (
                      <div
                        key={campaign.id}
                        className={`border-2 border-black p-5 transition-all rounded-xl ${
                          isUrgent
                            ? 'bg-amber-50 shadow-[0px_0px_15px_rgba(251,191,36,0.5)] border-amber-500 animate-pulse hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'
                            : 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'
                        }`}
                      >
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {Array.isArray(campaign.niche) ? (
                              campaign.niche.map((n: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-[10px] font-bold text-slate-800 bg-slate-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-2 py-0.5 rounded-md uppercase tracking-wider"
                                >
                                  {n}
                                </span>
                              ))
                            ) : campaign.niche ? (
                              <span className="text-[10px] font-bold text-slate-800 bg-slate-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-2 py-0.5 rounded-md uppercase tracking-wider">
                                {campaign.niche}
                              </span>
                            ) : null}
                            {campaign.brandName && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-600 font-bold">
                                {campaign.brandLogoUrl && (
                                  <img
                                    src={campaign.brandLogoUrl}
                                    alt="Logo"
                                    className="w-4 h-4 rounded-full object-cover border border-gray-300"
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                                {campaign.brandName}
                              </div>
                            )}
                          </div>
                          <h3 className="font-bold text-black text-base leading-snug">
                            {campaign.title}
                          </h3>
                        </div>

                        {/* Urgency Signals Row */}
                        {(() => {
                          const urgencyColor =
                            daysLeft !== null && daysLeft <= 3
                              ? 'bg-red-50 border-red-400 text-red-700'
                              : daysLeft !== null && daysLeft <= 7
                                ? 'bg-amber-50 border-amber-400 text-amber-700'
                                : 'bg-emerald-50 border-emerald-400 text-emerald-700';
                          return (
                            <div className="flex gap-2 flex-wrap text-[10px] font-black uppercase tracking-widest mb-4">
                              <span className="bg-slate-100 border-2 border-black px-2 py-1 rounded-md shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                👥 {applicants} applied
                              </span>
                              {daysLeft !== null && (
                                <span className={`border-2 px-2 py-1 rounded-md shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${urgencyColor}`}>
                                  ⏰ {daysLeft <= 0 ? 'Deadline passed' : `${daysLeft}d left`}
                                </span>
                              )}
                              <span className="bg-white border-2 border-black px-2 py-1 rounded-md shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-emerald-800">
                                💰 {formatRupee(campaign.budget)}
                              </span>
                            </div>
                          );
                        })()}

                        {appliedCampaignIds.includes(campaign.id) ? (
                          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg py-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Applied
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedCampaignForApply(campaign)}
                            className="w-full bg-slate-900 border-2 border-black text-white rounded-lg text-sm font-bold py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-800 active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-1.5"
                          >
                            Apply Now <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Apply Modal */}
      {selectedCampaignForApply && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <div className="bg-white border-2 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-6">
            <h2 className="text-xl font-black text-black mb-1">Apply to Campaign</h2>
            <p className="text-sm font-semibold text-gray-600 border-b border-gray-200 pb-3 mb-4">
              {selectedCampaignForApply.title}{' '}
              <span className="font-normal text-xs block mt-0.5">
                by {selectedCampaignForApply.brandName}
              </span>
            </p>

            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                Pitch Message{' '}
                <span className="font-normal normal-case text-gray-500">(optional)</span>
              </label>
              <textarea
                className="w-full px-4 py-3 bg-slate-50 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-white focus:border-indigo-600 transition-colors text-sm"
                rows={4}
                placeholder="Tell the brand why you're the perfect fit…"
                value={pitchMessage}
                onChange={(e) => setPitchMessage(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedCampaignForApply(null)}
                className="flex-1 bg-white border-2 border-black rounded-xl text-black font-semibold py-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all"
                disabled={applying}
              >
                Cancel
              </button>
              <button
                onClick={submitApplication}
                className="flex-1 bg-indigo-600 border-2 border-black rounded-xl text-white font-semibold py-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
                disabled={applying}
              >
                {applying ? 'Applying…' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
