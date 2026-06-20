import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Target,
  CheckCircle2,
  Clock,
  Zap,
  Activity,
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

export default function BrandAnalytics() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [dealRooms, setDealRooms] = useState<any[]>([]);
  const [totalCreators, setTotalCreators] = useState(0);
  const [totalReach, setTotalReach] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [avgCPM, setAvgCPM] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    const fetchAnalytics = async () => {
      try {
        // Fetch brand's campaigns
        const cQ = query(collection(db, 'campaigns'), where('brandId', '==', currentUser.uid));
        const cSnap = await getDocs(cQ);
        const cData = cSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
        setCampaigns(cData);

        // Fetch deal rooms for this brand
        const dQ = query(collection(db, 'dealRooms'), where('brandId', '==', currentUser.uid));
        const dSnap = await getDocs(dQ);
        const dData = dSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
        setDealRooms(dData);

        // Compute aggregates
        const completedDeals = dData.filter((d) => d.status === 'completed');
        const creatorIds = new Set(dData.map((d: any) => d.creatorId));
        setTotalCreators(creatorIds.size);

        let reach = 0;
        let spent = 0;
        let cpmTotal = 0;
        let cpmCount = 0;

        for (const deal of completedDeals) {
          spent += deal.grossAmount || parseInt(deal.amount || '0') || 0;
          // Fetch creator avg_views for reach estimate
          try {
            const cRef = doc(db, 'creators', deal.creatorId);
            const cSnap2 = await getDoc(cRef);
            if (cSnap2.exists()) {
              const avgViews = cSnap2.data().avg_views || cSnap2.data().avgViewsLast10 || 0;
              reach += avgViews;
              if (avgViews > 0 && deal.grossAmount) {
                cpmTotal += (deal.grossAmount / avgViews) * 1000;
                cpmCount++;
              }
            }
          } catch (_) {}
        }

        setTotalSpent(spent);
        setTotalReach(reach);
        setAvgCPM(cpmCount > 0 ? Math.round(cpmTotal / cpmCount) : 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [currentUser]);

  const completedCampaigns = campaigns.filter((c) => c.status === 'completed');
  const activeCampaigns = campaigns.filter((c) => c.status !== 'completed');
  const completedDeals = dealRooms.filter((d) => d.status === 'completed');
  const activeDeals = dealRooms.filter((d) => d.status !== 'completed' && d.status !== 'cancelled');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pb-16"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Header */}
      <div className="bg-white border-b-2 border-black px-6 lg:px-10 py-5">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/brand-dashboard')}
            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="h-5 w-0.5 bg-black" />
          <div>
            <h1 className="text-xl font-black text-black uppercase tracking-tight">
              Campaign Analytics
            </h1>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              ROI & Performance Overview
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Campaigns',
              value: String(campaigns.length),
              sub: `${activeCampaigns.length} active`,
              icon: Target,
              color: 'bg-indigo-600',
              textColor: 'text-white',
              subColor: 'text-indigo-200',
              iconColor: 'text-white',
            },
            {
              label: 'Creators Hired',
              value: String(totalCreators),
              sub: `${completedDeals.length} completed`,
              icon: Users,
              color: 'bg-white',
              textColor: 'text-black',
              subColor: 'text-gray-500',
              iconColor: 'text-indigo-600',
            },
            {
              label: 'Total Spent',
              value: fmtRupee(totalSpent),
              sub: 'across all deals',
              icon: IndianRupee,
              color: 'bg-white',
              textColor: 'text-black',
              subColor: 'text-gray-500',
              iconColor: 'text-emerald-600',
            },
            {
              label: 'Est. Reach',
              value: fmt(totalReach),
              sub: 'combined views',
              icon: Eye,
              color: 'bg-[#a3e635]',
              textColor: 'text-black',
              subColor: 'text-black/60',
              iconColor: 'text-black',
            },
          ].map((k) => (
            <div
              key={k.label}
              className={`${k.color} border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${k.subColor}`}>
                  {k.label}
                </p>
                <k.icon className={`w-4 h-4 ${k.iconColor}`} />
              </div>
              <p className={`text-2xl font-black ${k.textColor}`}>{k.value}</p>
              <p className={`text-[10px] font-bold mt-1 ${k.subColor}`}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* CPM & ROI row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Avg CPM Paid
            </p>
            <p className="text-3xl font-black text-black">{avgCPM > 0 ? fmtRupee(avgCPM) : '—'}</p>
            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
              per 1,000 views
            </p>
          </div>
          <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-500" /> Active Deals
            </p>
            <p className="text-3xl font-black text-black">{activeDeals.length}</p>
            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
              in production now
            </p>
          </div>
          <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Completed Deals
            </p>
            <p className="text-3xl font-black text-black">{completedDeals.length}</p>
            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
              total deliveries received
            </p>
          </div>
        </div>

        {/* Campaign Performance Table */}
        <div className="bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <div className="px-6 py-4 border-b-2 border-black bg-indigo-50 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-black text-black uppercase tracking-wide">
              Campaign Performance
            </h2>
          </div>
          {campaigns.length === 0 ? (
            <div className="p-16 text-center">
              <Target className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
                No campaigns yet
              </p>
              <button
                onClick={() => navigate('/create-campaign')}
                className="mt-4 px-5 py-2 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
              >
                Create Campaign →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-50">
                    {['Campaign', 'Status', 'Budget', 'Deals', 'Completed'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-100">
                  {campaigns.map((c) => {
                    const cDeals = dealRooms.filter((d) => d.campaignId === c.id);
                    const cCompleted = cDeals.filter((d) => d.status === 'completed').length;
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/campaign/${c.id}`)}
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-black">{c.title}</p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                            {Array.isArray(c.niche) ? c.niche[0] : c.niche}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-[10px] font-black px-2 py-1 rounded-md border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${c.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}
                          >
                            {c.status === 'completed' ? '✅ Completed' : '🔴 Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-black">
                          {c.budget || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-black">{cDeals.length}</td>
                        <td className="px-6 py-4 text-sm font-black text-emerald-600">
                          {cCompleted}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Deal History Table */}
        {completedDeals.length > 0 && (
          <div className="bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="px-6 py-4 border-b-2 border-black bg-emerald-50 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-black text-black uppercase tracking-wide">
                Completed Deals
              </h2>
            </div>
            <div className="divide-y-2 divide-gray-100">
              {completedDeals.map((deal) => (
                <div key={deal.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-black">
                      {deal.deliverables || 'Deliverable'}
                    </p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                      {deal.completedAt
                        ? new Date(deal.completedAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-black">
                      {fmtRupee(deal.grossAmount || 0)}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-600 mt-0.5">
                      Net: {fmtRupee(deal.netPayout || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
