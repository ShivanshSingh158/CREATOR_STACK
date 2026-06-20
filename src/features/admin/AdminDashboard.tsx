import React, { useState, useEffect } from 'react';
import {
  collection, query, where, onSnapshot,
  updateDoc, doc, getDoc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  ShieldCheck, Clock, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Building2, User, Landmark, Star, AlertCircle,
} from 'lucide-react';

// ── Simple hardcoded admin PIN (replace with Firebase Custom Claims later) ──
const ADMIN_PIN = '2024CREATOR';

type Review = {
  id: string;
  userId: string;
  userRole: 'brand' | 'creator';
  companyName?: string;
  name?: string;
  pan: string;
  gstin?: string;
  cin?: string;
  verificationTier?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  rejectionReason?: string;
};

function TierBadge({ tier }: { tier?: string }) {
  if (tier === 'enterprise') return <span className="text-[10px] font-black bg-amber-100 border-2 border-black text-amber-800 px-2 py-0.5 rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1"><Star className="w-3 h-3" /> Enterprise</span>;
  if (tier === 'business') return <span className="text-[10px] font-black bg-emerald-100 border-2 border-black text-emerald-800 px-2 py-0.5 rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1"><Landmark className="w-3 h-3" /> Business</span>;
  if (tier === 'individual') return <span className="text-[10px] font-black bg-blue-100 border-2 border-black text-blue-800 px-2 py-0.5 rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1"><User className="w-3 h-3" /> Individual</span>;
  return <span className="text-[10px] font-black bg-gray-100 border-2 border-black text-gray-700 px-2 py-0.5 rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{tier || 'Creator'}</span>;
}

function ReviewCard({ review, onApprove, onReject }: {
  review: Review;
  onApprove: (id: string, userId: string, role: string, tier?: string) => void;
  onReject: (id: string, userId: string, reason: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    setProcessing(true);
    await onApprove(review.id, review.userId, review.userRole, review.verificationTier);
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!reason.trim()) return;
    setProcessing(true);
    await onReject(review.id, review.userId, reason);
    setProcessing(false);
    setRejecting(false);
  };

  return (
    <div className={`bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden ${review.status !== 'pending' ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between gap-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0 ${review.userRole === 'brand' ? 'bg-indigo-100' : 'bg-emerald-100'}`}>
            {review.userRole === 'brand' ? <Building2 className="w-5 h-5 text-indigo-700" /> : <User className="w-5 h-5 text-emerald-700" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-black truncate">{review.companyName || review.name || review.userId}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{review.userRole} · {new Date(review.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <TierBadge tier={review.verificationTier} />
          {review.status === 'pending' && <span className="text-[10px] font-black bg-amber-100 border-2 border-black text-amber-800 px-2 py-0.5 rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>}
          {review.status === 'approved' && <span className="text-[10px] font-black bg-emerald-100 border-2 border-black text-emerald-800 px-2 py-0.5 rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</span>}
          {review.status === 'rejected' && <span className="text-[10px] font-black bg-red-100 border-2 border-black text-red-700 px-2 py-0.5 rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>}
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t-2 border-black px-6 py-5 space-y-4 bg-slate-50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">PAN</p>
              <p className="text-sm font-black font-mono text-black">{review.pan || '—'}</p>
            </div>
            <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">GSTIN</p>
              <p className="text-sm font-black font-mono text-black">{review.gstin || '—'}</p>
            </div>
            <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">CIN</p>
              <p className="text-sm font-black font-mono text-black">{review.cin || '—'}</p>
            </div>
          </div>

          <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Firebase UID</p>
            <p className="text-xs font-mono text-black break-all">{review.userId}</p>
          </div>

          {review.status === 'pending' && !rejecting && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 py-3 text-xs font-black uppercase tracking-widest bg-emerald-600 text-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> {processing ? 'Processing...' : 'Approve & Verify'}
              </button>
              <button
                onClick={() => setRejecting(true)}
                disabled={processing}
                className="flex-1 py-3 text-xs font-black uppercase tracking-widest bg-red-600 text-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          )}

          {rejecting && (
            <div className="space-y-3 pt-2">
              <textarea
                className="w-full px-4 py-3 border-2 border-black rounded-xl text-sm font-medium resize-none focus:outline-none focus:border-red-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white"
                rows={3}
                placeholder="Reason for rejection (shown to the user)..."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
              <div className="flex gap-3">
                <button onClick={() => setRejecting(false)} className="flex-1 py-2.5 text-xs font-black uppercase tracking-widest border-2 border-black bg-white text-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all">Cancel</button>
                <button onClick={handleReject} disabled={processing || !reason.trim()} className="flex-1 py-2.5 text-xs font-black uppercase tracking-widest bg-red-600 text-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all disabled:opacity-50">
                  {processing ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          )}

          {review.status === 'rejected' && review.rejectionReason && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">Rejection Reason</p>
              <p className="text-sm font-medium text-red-800">{review.rejectionReason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [pinInput, setPinInput] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [pinError, setPinError] = useState('');

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    if (!authenticated) return;
    const q = query(collection(db, 'adminReviews'));
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Review[];
      data.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      setReviews(data);
      setStats({
        total: data.length,
        pending: data.filter(r => r.status === 'pending').length,
        approved: data.filter(r => r.status === 'approved').length,
        rejected: data.filter(r => r.status === 'rejected').length,
      });
      setLoading(false);
    });
    return () => unsub();
  }, [authenticated]);

  const handleApprove = async (reviewId: string, userId: string, role: string, tier?: string) => {
    try {
      // 1. Mark adminReview as approved
      await updateDoc(doc(db, 'adminReviews', reviewId), {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
      });
      // 2. Update the user's Firestore document
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          verified: true,
          verificationStatus: 'verified',
          panVerified: true,
          verificationTier: tier || 'individual',
          trustScore: tier === 'enterprise' ? 85 : tier === 'business' ? 70 : 55,
          verifiedAt: new Date().toISOString(),
        });
      }
      // 3. Also update the role-specific collection document if it exists
      const roleCollection = role === 'brand' ? 'brands' : 'creators';
      try {
        const roleRef = doc(db, roleCollection, userId);
        const roleSnap = await getDoc(roleRef);
        if (roleSnap.exists()) {
          await updateDoc(roleRef, {
            verified: true,
            verificationStatus: 'verified',
            panVerified: true,
          });
        }
      } catch (_) { /* OK if role doc doesn't exist */ }
    } catch (err) {
      console.error('Error approving review:', err);
      alert('Error approving. Check console.');
    }
  };

  const handleReject = async (reviewId: string, userId: string, reason: string) => {
    try {
      await updateDoc(doc(db, 'adminReviews', reviewId), {
        status: 'rejected',
        rejectionReason: reason,
        reviewedAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, 'users', userId), {
        verified: false,
        verificationStatus: 'rejected',
        rejectionReason: reason,
        rejectedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error rejecting review:', err);
      alert('Error rejecting. Check console.');
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setAuthenticated(true);
    } else {
      setPinError('Incorrect PIN. Access denied.');
      setPinInput('');
    }
  };

  // PIN gate
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center p-4">
        <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl p-10 w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-indigo-600 border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-black uppercase tracking-tight">Admin Panel</h1>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">CreatorStack Internal</p>
            </div>
          </div>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Admin PIN</label>
              <input
                type="password"
                value={pinInput}
                onChange={e => { setPinInput(e.target.value); setPinError(''); }}
                className="w-full px-4 py-3 border-2 border-black rounded-xl text-sm font-mono font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                placeholder="Enter PIN..."
                autoFocus
              />
              {pinError && <p className="text-[10px] font-black text-red-500 mt-1.5 uppercase tracking-widest">{pinError}</p>}
            </div>
            <button type="submit" className="w-full py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
              Access Admin →
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filtered = reviews.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="min-h-screen bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pb-16" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="bg-indigo-600 border-b-2 border-black px-6 lg:px-10 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-white" />
            <div>
              <h1 className="text-xl font-black text-white uppercase tracking-tight">Admin KYC Panel</h1>
              <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">CreatorStack Internal — Restricted Access</p>
            </div>
          </div>
          <button onClick={() => setAuthenticated(false)} className="text-[10px] font-black text-indigo-200 hover:text-white uppercase tracking-widest transition-colors border-2 border-indigo-400 px-3 py-1.5 rounded-lg hover:border-white">
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Reviews', value: stats.total, color: 'bg-white' },
            { label: 'Pending', value: stats.pending, color: 'bg-amber-50' },
            { label: 'Approved', value: stats.approved, color: 'bg-emerald-50' },
            { label: 'Rejected', value: stats.rejected, color: 'bg-red-50' },
          ].map(s => (
            <div key={s.label} className={`${s.color} border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-3xl font-black text-black">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Pending Alert */}
        {stats.pending > 0 && (
          <div className="bg-amber-50 border-2 border-black rounded-xl p-4 flex items-center gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-sm font-black text-amber-900">
              {stats.pending} review{stats.pending !== 1 ? 's' : ''} waiting for your action.
            </p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['pending', 'all', 'approved', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-xs font-black uppercase tracking-widest border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${filter === f ? 'bg-indigo-600 text-white' : 'bg-white text-black'}`}
            >
              {f === 'pending' ? `⏳ Pending (${stats.pending})` : f === 'approved' ? `✅ Approved (${stats.approved})` : f === 'rejected' ? `❌ Rejected (${stats.rejected})` : `All (${stats.total})`}
            </button>
          ))}
        </div>

        {/* Review Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-16 text-center">
            <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-black text-gray-400 uppercase tracking-wide">No {filter !== 'all' ? filter : ''} reviews</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(review => (
              <ReviewCard
                key={review.id}
                review={review}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
