import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import {
  ArrowLeft,
  TrendingUp,
  Users,
  Eye,
  BarChart2,
  IndianRupee,
  CheckCircle2,
  Clock,
  Zap,
  Activity,
  Target,
} from 'lucide-react';

function fmt(n: number): string {
  if (!n) return '0';
  if (n >= 10_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 100_000) return `${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtRupee(n: number): string {
  if (!n) return '₹0';
  return `₹${n.toLocaleString('en-IN')}`;
}

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
  if (score >= 60) return { label: 'Good', color: 'text-blue-700 bg-blue-50 border-blue-300' };
  if (score >= 40) return { label: 'Average', color: 'text-amber-700 bg-amber-50 border-amber-300' };
  return { label: 'Below Avg', color: 'text-red-700 bg-red-50 border-red-300' };
}

export default function CampaignAnalyticsDetail() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<any>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [creatorMap, setCreatorMap] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!currentUser || !campaignId) return;
    const fetchData = async () => {
      try {
        // Fetch campaign
        const cSnap = await getDoc(doc(db, 'campaigns', campaignId));
        if (cSnap.exists()) setCampaign({ id: cSnap.id, ...cSnap.data() });

        // Fetch deals for this campaign
        const dQ = query(collection(db, 'dealRooms'), where('campaignId', '==', campaignId));
        const dSnap = await getDocs(dQ);
        const dealData = dSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
        setDeals(dealData);

        // Fetch creator profiles
        const creatorIds = [...new Set(dealData.map((d: any) => d.creatorId))];
        const map: Record<string, any> = {};
        for (const cid of creatorIds) {
          try {
            const cRef = doc(db, 'creators', cid);
            const cSnap2 = await getDoc(cRef);
            if (cSnap2.exists()) map[cid] = { id: cSnap2.id, ...cSnap2.data() };
          } catch (_) {}
        }
        setCreatorMap(map);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser, campaignId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Campaign not found</p>
      </div>
    );
  }

  const completedDeals = deals.filter((d) => d.status === 'completed');
  const activeDeals = deals.filter((d) => !['completed', 'cancelled'].includes(d.status));
  const totalSpent = completedDeals.reduce((sum, d) => sum + (d.grossAmount || parseInt(d.amount || '0') || 0), 0);
  const totalReach = completedDeals.reduce((sum, d) => {
    const c = creatorMap[d.creatorId];
    return sum + (c?.avg_views || c?.avgViewsLast10 || 0);
  }, 0);
  const costPerView = totalReach > 0 ? totalSpent / totalReach : 0;

  return (
    <div
      className="min-h-screen bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pb-16"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Header */}
      <div className="bg-white border-b-2 border-black px-6 lg:px-10 py-5">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/brand-analytics')}
            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Analytics
          </button>
          <div className="h-5 w-0.5 bg-black" />
          <div>
            <h1 className="text-xl font-black text-black uppercase tracking-tight">{campaign.title}</h1>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Campaign Drilldown · {Array.isArray(campaign.niche) ? campaign.niche.join(', ') : campaign.niche}
            </p>
          </div>
          <span className={`ml-auto text-[10px] font-black px-3 py-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${campaign.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
            {campaign.status === 'completed' ? '✅ Completed' : '🔴 Active'}
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Deals', value: String(deals.length), sub: `${activeDeals.length} active`, icon: Target, color: 'bg-indigo-600', text: 'text-white', sub_: 'text-indigo-200' },
            { label: 'Completed', value: String(completedDeals.length), sub: 'deliveries received', icon: CheckCircle2, color: 'bg-white', text: 'text-black', sub_: 'text-gray-500' },
            { label: 'Total Spent', value: fmtRupee(totalSpent), sub: 'across completed deals', icon: IndianRupee, color: 'bg-white', text: 'text-black', sub_: 'text-gray-500' },
            { label: 'Est. Reach', value: fmt(totalReach), sub: 'combined avg views', icon: Eye, color: 'bg-[#a3e635]', text: 'text-black', sub_: 'text-black/60' },
          ].map((k) => (
            <div key={k.label} className={`${k.color} border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${k.sub_}`}>{k.label}</p>
                <k.icon className={`w-4 h-4 ${k.text}`} />
              </div>
              <p className={`text-2xl font-black ${k.text}`}>{k.value}</p>
              <p className={`text-[10px] font-bold mt-1 ${k.sub_}`}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Efficiency Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Cost Per View
            </p>
            <p className="text-3xl font-black text-black">{costPerView > 0 ? `₹${costPerView.toFixed(2)}` : '—'}</p>
            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">per 1 video view</p>
          </div>
          <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-500" /> Completion Rate
            </p>
            <p className="text-3xl font-black text-black">
              {deals.length > 0 ? `${Math.round((completedDeals.length / deals.length) * 100)}%` : '—'}
            </p>
            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">deals completed</p>
          </div>
          <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Avg Deal Value
            </p>
            <p className="text-3xl font-black text-black">
              {completedDeals.length > 0 ? fmtRupee(totalSpent / completedDeals.length) : '—'}
            </p>
            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">per completed deal</p>
          </div>
        </div>

        {/* Creator Performance Table */}
        <div className="bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="px-6 py-4 border-b-2 border-black bg-indigo-50 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-black text-black uppercase tracking-wide">Creator Performance</h2>
          </div>

          {deals.length === 0 ? (
            <div className="p-16 text-center">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No deals yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-50">
                    {['Creator', 'Status', 'Amount', 'Avg Views', 'ER', 'Score'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-100">
                  {deals.map((deal) => {
                    const creator = creatorMap[deal.creatorId];
                    const avgViews = creator?.avg_views || creator?.avgViewsLast10 || 0;
                    const er = parseFloat(creator?.engagement_rate || creator?.engagementRate) || 0;
                    const dealAmt = deal.grossAmount || parseInt(deal.amount || '0') || 0;
                    // Simple composite score: 40% ER + 30% views normalized + 30% deal completion
                    const erScore = Math.min(er * 10, 40);
                    const viewScore = Math.min((avgViews / 50000) * 30, 30);
                    const completionScore = deal.status === 'completed' ? 30 : deal.status === 'pod_submitted' ? 15 : 0;
                    const score = Math.round(erScore + viewScore + completionScore);
                    const { label, color } = getScoreLabel(score);

                    return (
                      <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(creator?.name || 'C')}&background=e0e7ff&color=312e81`}
                              alt={creator?.name}
                              className="w-8 h-8 rounded-full border-2 border-black"
                            />
                            <div>
                              <p className="text-sm font-black text-black">{creator?.name || deal.creatorId.slice(0, 8) + '…'}</p>
                              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{creator?.niche ? (Array.isArray(creator.niche) ? creator.niche[0] : creator.niche) : '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-md border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                            deal.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                            deal.status === 'escrow_locked' ? 'bg-blue-100 text-blue-800' :
                            deal.status === 'pod_submitted' ? 'bg-purple-100 text-purple-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {deal.status?.replace(/_/g, ' ') || 'Pending'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-black text-black">{dealAmt ? fmtRupee(dealAmt) : '—'}</td>
                        <td className="px-5 py-4 text-sm font-black text-black">{fmt(avgViews)}</td>
                        <td className="px-5 py-4 text-sm font-black text-black">{er ? `${er.toFixed(1)}%` : '—'}</td>
                        <td className="px-5 py-4">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-md border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${color}`}>
                            {score}/100 · {label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
