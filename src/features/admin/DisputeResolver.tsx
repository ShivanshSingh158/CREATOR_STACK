import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { db } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldCheck,
  FileText,
  Scale,
} from 'lucide-react';

type Dispute = {
  id: string;
  dealId: string;
  campaignId: string;
  brandId: string;
  creatorId: string;
  status: 'open' | 'under_review' | 'resolved_brand' | 'resolved_creator' | 'resolved_split';
  initiatedBy: 'brand' | 'creator';
  reason: string;
  evidence?: string;
  resolution?: string;
  createdAt: any;
  resolvedAt?: any;
  dealAmount?: number;
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    open: { label: '🔴 Open', cls: 'bg-red-100 text-red-800' },
    under_review: { label: '🟡 Under Review', cls: 'bg-amber-100 text-amber-800' },
    resolved_brand: { label: '✅ Resolved — Brand Wins', cls: 'bg-indigo-100 text-indigo-800' },
    resolved_creator: {
      label: '✅ Resolved — Creator Wins',
      cls: 'bg-emerald-100 text-emerald-800',
    },
    resolved_split: { label: '🤝 Resolved — Split', cls: 'bg-blue-100 text-blue-800' },
  };
  const s = map[status] || { label: status, cls: 'bg-gray-100 text-gray-700' };
  return (
    <span
      className={`text-[10px] font-black px-2 py-1 rounded-md border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

export default function DisputeResolver() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const field = userRole === 'brand' ? 'brandId' : 'creatorId';
    const q = query(collection(db, 'disputes'), where(field, '==', currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Dispute[];
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setDisputes(data);
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser, userRole]);

  const handleSubmitEvidence = async () => {
    if (!evidence.trim() || !selected || !currentUser) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, 'disputes', selected.id), {
        evidence: evidence.trim(),
        status: 'under_review',
        evidenceSubmittedAt: serverTimestamp(),
        evidenceBy: userRole,
      });
      // Also update the deal room
      await updateDoc(doc(db, 'dealRooms', selected.dealId), {
        disputeEvidence: evidence.trim(),
      });
      setSubmitted(true);
      setEvidence('');
      setSelected(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const openDisputes = disputes.filter((d) => d.status === 'open' || d.status === 'under_review');
  const resolvedDisputes = disputes.filter((d) => d.status.startsWith('resolved_'));

  return (
    <div
      className="min-h-screen bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pb-16"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Header */}
      <div className="bg-white border-b-2 border-black px-6 lg:px-10 py-5">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="h-5 w-0.5 bg-black" />
          <div>
            <h1 className="text-xl font-black text-black uppercase tracking-tight flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-600" /> Dispute Center
            </h1>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Manage disputed deals
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* How disputes work */}
        <div className="bg-indigo-50 border-2 border-black rounded-xl p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> How CreatorStack Dispute Resolution Works
          </h3>
          <ol className="text-xs font-medium text-indigo-800 space-y-1 list-decimal list-inside leading-relaxed">
            <li>A dispute is raised from the Deal Room when content delivery is rejected.</li>
            <li>Both parties submit their evidence below (links, screenshots, reasoning).</li>
            <li>The CreatorStack team reviews within 48 hours and issues a final decision.</li>
            <li>
              Resolution options: full release to creator, full refund to brand, or a negotiated
              split.
            </li>
          </ol>
        </div>

        {/* Evidence submission modal */}
        {selected && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border-2 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg p-8">
              <h2 className="text-lg font-black text-black uppercase tracking-tight mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" /> Submit Evidence
              </h2>
              <p className="text-xs font-medium text-gray-600 mb-6">
                Describe your case. Include links to the content, timestamps, communication records,
                or any other proof.
              </p>
              <textarea
                className="w-full px-4 py-3 border-2 border-black rounded-xl text-sm font-medium resize-none focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white min-h-[140px]"
                placeholder="e.g. The creator did not include the required #ad disclosure. Here is the video link: youtube.com/watch?v=... At timestamp 2:30 you can see..."
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
              />
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 py-3 text-xs font-black uppercase tracking-widest border-2 border-black bg-white rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitEvidence}
                  disabled={submitting || !evidence.trim()}
                  className="flex-1 py-3 text-xs font-black uppercase tracking-widest bg-indigo-600 text-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Evidence →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {submitted && (
          <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-4 flex items-center gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-black text-emerald-900">
              Evidence submitted! The CreatorStack team will review within 48 hours.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="ml-auto text-emerald-600 hover:text-emerald-800 font-black text-sm"
            >
              ✕
            </button>
          </div>
        )}

        {/* Open Disputes */}
        <div>
          <h2 className="text-sm font-black text-black uppercase tracking-widest mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Open Disputes ({openDisputes.length})
          </h2>
          {openDisputes.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-10 text-center">
              <CheckCircle2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
                No open disputes
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {openDisputes.map((d) => (
                <div
                  key={d.id}
                  className="bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <StatusBadge status={d.status} />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          Deal: {d.dealId}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-black mb-2">{d.reason}</p>
                      {d.evidence && (
                        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3 mt-3">
                          <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">
                            Evidence Submitted
                          </p>
                          <p className="text-xs font-medium text-amber-900">{d.evidence}</p>
                        </div>
                      )}
                    </div>
                    {d.status === 'open' && !d.evidence && (
                      <button
                        onClick={() => setSelected(d)}
                        className="shrink-0 px-4 py-2 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Submit Evidence
                      </button>
                    )}
                    {d.status === 'under_review' && (
                      <span className="shrink-0 flex items-center gap-1.5 text-[10px] font-black text-amber-800 bg-amber-100 border-2 border-black px-3 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <Clock className="w-3.5 h-3.5" /> Under Review
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolved Disputes */}
        {resolvedDisputes.length > 0 && (
          <div>
            <h2 className="text-sm font-black text-black uppercase tracking-widest mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Resolved (
              {resolvedDisputes.length})
            </h2>
            <div className="space-y-3">
              {resolvedDisputes.map((d) => (
                <div
                  key={d.id}
                  className="bg-white border-2 border-gray-300 rounded-xl p-5 opacity-70"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-bold text-gray-700">{d.reason}</p>
                    <StatusBadge status={d.status} />
                  </div>
                  {d.resolution && (
                    <p className="text-xs font-medium text-gray-500 mt-2">{d.resolution}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
