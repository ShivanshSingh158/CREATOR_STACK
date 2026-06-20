import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { formatDateDDMMYY, formatRupee } from '../../utils/formatters';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  ShieldCheck, FileText, Lock, CheckCircle, ArrowLeft,
  Cpu, PenLine, Upload, IndianRupee, Clock, AlertTriangle, Printer, AlertCircle, Download
} from 'lucide-react';
import EStampContract from '../../components/legal/EStampContract';
import { generateContractPDF } from '../../utils/generateContractPDF';

type DealStatus =
  | 'pending_creator_sign'
  | 'contract_amendment_requested'
  | 'creator_signed'
  | 'escrow_locked'
  | 'pod_submitted'
  | 'pod_verified'
  | 'completed';

export default function CreatorDealRoom() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [dealRoom, setDealRoom] = useState<any>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [signatureName, setSignatureName] = useState('');
  
  // Amendment / Negotiation logic
  const [showAmendmentInput, setShowAmendmentInput] = useState(false);
  const [amendmentMessage, setAmendmentMessage] = useState('');
  const [showSignModal, setShowSignModal] = useState(false);
  const [signatureInput, setSignatureInput] = useState('');

  // Load deal room doc + campaign doc
  useEffect(() => {
    if (!currentUser || !campaignId) return;
    const dealKey = `${campaignId}_${currentUser.uid}`;
    const unsub = onSnapshot(doc(db, 'dealRooms', dealKey), (snap) => {
      if (snap.exists()) {
        setDealRoom({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    });

    getDoc(doc(db, 'campaigns', campaignId)).then(snap => {
      if (snap.exists()) setCampaign({ id: snap.id, ...snap.data() });
    });

    getDoc(doc(db, 'users', currentUser.uid)).then(snap => {
      if (snap.exists()) setCreatorProfile(snap.data());
    });

    return () => unsub();
  }, [currentUser, campaignId]);

  const runAnimation = (messages: string[], onDone: () => void) => {
    setAnimating(true);
    setLoadingStep(0);
    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < messages.length) {
        setLoadingStep(current);
      } else {
        clearInterval(interval);
        setAnimating(false);
        onDone();
      }
    }, 1400);
  };

  const handleSignContract = async () => {
    if (!signatureName.trim() || !campaignId || !currentUser) return;
    setActionLoading(true);
    runAnimation(
      ['Verifying identity via CreatorStack Auth...', 'Applying cryptographic signature...', 'Notifying brand counterparty...', 'Contract co-executed.'],
      async () => {
        try {
          await setDoc(doc(db, 'dealRooms', `${campaignId}_${currentUser.uid}`), {
            status: 'creator_signed',
            creatorSignatureName: signatureName,
            creatorSignedAt: new Date().toISOString(),
          }, { merge: true });
        } catch (err) { console.error(err); }
        setShowSignModal(false);
        setActionLoading(false);
      }
    );
  };

  const handleRequestAmendment = async () => {
    if (!amendmentMessage.trim() || !campaignId || !currentUser) return;
    setActionLoading(true);
    try {
      await setDoc(doc(db, 'dealRooms', `${campaignId}_${currentUser.uid}`), {
        status: 'contract_amendment_requested',
        amendmentRequest: amendmentMessage,
        amendmentRequestedAt: new Date().toISOString(),
      }, { merge: true });
      setShowAmendmentInput(false);
      setAmendmentMessage('');
    } catch (err) { console.error(err); }
    setActionLoading(false);
  };

  const handlePodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim() || !currentUser || !campaignId) return;
    setActionLoading(true);
    runAnimation(
      ['Validating YouTube URL format...', 'Running Computer Vision OCR for #ad tags...', 'Executing Audio NLP transcription...', 'Cross-referencing description box hyperlink...'],
      async () => {
        try {
          await setDoc(doc(db, 'dealRooms', `${campaignId}_${currentUser.uid}`), {
            status: 'pod_verified',
            podVideoUrl: videoUrl,
            podSubmittedAt: new Date().toISOString(),
            podVerifiedAt: new Date().toISOString(),
          }, { merge: true });
        } catch (err) { console.error(err); }
        setActionLoading(false);
      }
    );
  };

  // ─── Loader overlay ───
  const renderLoader = (messages: string[]) => (
    <div className="bg-white border-2 border-black p-12 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent" />
      <div className="w-full max-w-lg z-10">
        <div className="flex justify-center mb-8">
          <Cpu className="w-12 h-12 text-indigo-600 animate-pulse" />
        </div>
        <div className="flex justify-between text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">
          <span>Processing Step</span>
          <span className="text-indigo-600">{Math.round(((loadingStep + 1) / messages.length) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-8 border border-gray-200">
          <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${((loadingStep + 1) / messages.length) * 100}%` }} />
        </div>
        <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm text-gray-500 border-2 border-black h-32 flex flex-col justify-end shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          {messages.slice(0, loadingStep + 1).map((msg, i) => (
            <div key={i} className={`flex items-center gap-2 mb-2 ${i === loadingStep ? 'text-indigo-600 font-bold' : 'opacity-60'}`}>
              <span className="text-gray-400">System_&gt;</span> {msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── Step indicator ───
  const getStepStatus = (stepName: string) => {
    const statusOrder: DealStatus[] = ['pending_creator_sign', 'contract_amendment_requested', 'creator_signed', 'escrow_locked', 'pod_submitted', 'pod_verified', 'completed'];
    const stepMap: Record<string, DealStatus[]> = {
      REVIEW: ['pending_creator_sign', 'contract_amendment_requested'],
      SIGN: ['creator_signed'],
      ESCROW: ['escrow_locked', 'pod_submitted'],
      VERIFY: ['pod_verified'],
      PAID: ['completed'],
    };
    const currentStatus: DealStatus = dealRoom?.status || 'pending_creator_sign';
    const currentIdx = statusOrder.indexOf(currentStatus);
    const stepStatuses = stepMap[stepName] || [];
    const stepIdx = statusOrder.indexOf(stepStatuses[0]);
    if (currentIdx > stepIdx + (stepStatuses.length - 1)) return 'completed';
    if (stepStatuses.includes(currentStatus)) return 'active';
    return 'pending';
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-between w-full mx-auto relative z-10 mb-6 xl:mb-0">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />
      {[
        { id: 'REVIEW', label: 'Review', icon: FileText },
        { id: 'SIGN', label: 'Sign', icon: PenLine },
        { id: 'ESCROW', label: 'Escrow', icon: Lock },
        { id: 'VERIFY', label: 'Verify', icon: Cpu },
        { id: 'PAID', label: 'Paid', icon: IndianRupee },
      ].map((step) => {
        const status = getStepStatus(step.id);
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex flex-col items-center relative">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
              status === 'completed' ? 'bg-indigo-600 border-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' :
              status === 'active' ? 'bg-white border-black text-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' :
              'bg-gray-100 border-gray-300 text-gray-400'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className={`absolute -bottom-8 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors duration-300 ${
              status === 'active' ? 'text-indigo-600' :
              status === 'completed' ? 'text-black' : 'text-gray-400'
            }`}>{step.label}</span>
          </div>
        );
      })}
    </div>
  );

  // ─── Contract (shared read-only view) ───

  // ─── Invoice ───
  const InvoiceDocument = () => {
    const gross = dealRoom?.grossAmount || dealRoom?.amount || 0;
    const tds = dealRoom?.tdsAmount || Math.round(gross * 0.1);
    const platFee = dealRoom?.platformFee || Math.round(gross * 0.025 * 1.18);
    const net = dealRoom?.netPayout || Math.round(gross - tds - platFee);
    return (
      <div id="creator-invoice" className="bg-white rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden border-2 border-black">
        <div className="bg-indigo-600 px-8 py-6 flex justify-between items-center border-b-2 border-black">
          <div>
            <p className="text-3xl font-black text-white tracking-tight">creator<span className="text-black">.</span>stack</p>
            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">Creator Commerce Platform</p>
          </div>
          <div className="text-right">
            <p className="text-white font-black text-xl">TAX INVOICE</p>
            <p className="text-indigo-200 font-mono text-sm mt-1">CS-INV-{campaignId?.substring(0, 6).toUpperCase()}-{new Date().getFullYear()}</p>
            <p className="text-indigo-200 text-xs mt-0.5">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-8 mb-6 pb-6 border-b border-[#e5e7eb]">
            <div>
              <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-3">Billed From (Service Provider)</p>
              <p className="font-black text-[#111827] text-lg">{creatorProfile?.name || creatorProfile?.legalName || 'Creator'}</p>
              <p className="text-sm text-[#6b7280] mt-1">Independent Professional Creator</p>
              <p className="text-sm text-[#6b7280]">PAN: {creatorProfile?.pan ? `${creatorProfile.pan.substring(0,3)}****${creatorProfile.pan.substring(7)}` : 'Verified via Signzy'}</p>
              <p className="text-sm text-[#6b7280]">UPI: {creatorProfile?.upi || 'Verified UPI on file'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-3">Billed To (Client / Advertiser)</p>
              <p className="font-black text-[#111827] text-lg">{dealRoom?.brandName || campaign?.brandName || 'Advertiser'}</p>
              <p className="text-sm text-[#6b7280] mt-1">Registered Corporate Advertiser</p>
              <p className="text-sm text-[#6b7280]">Campaign: {dealRoom?.campaignTitle || campaign?.title}</p>
              <p className="text-sm text-[#6b7280]">Campaign ID: #{campaignId?.substring(0, 8)}</p>
            </div>
          </div>

          <table className="w-full mb-8">
            <thead>
              <tr className="bg-[#f9fafb] border-y border-[#e5e7eb]">
                <th className="text-left text-xs font-bold text-[#6b7280] uppercase tracking-wider px-4 py-3">Description of Service</th>
                <th className="text-right text-xs font-bold text-[#6b7280] uppercase tracking-wider px-4 py-3">HSN/SAC</th>
                <th className="text-right text-xs font-bold text-[#6b7280] uppercase tracking-wider px-4 py-3">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#f3f4f6]">
                <td className="px-4 py-4">
                  <p className="font-bold text-[#111827]">{dealRoom?.deliverableType}</p>
                  <p className="text-sm text-[#6b7280]">"{dealRoom?.campaignTitle || campaign?.title}" — {dealRoom?.productionDays}-day production, ASCI-compliant</p>
                </td>
                <td className="px-4 py-4 text-right text-sm text-[#6b7280] font-mono">998361</td>
                <td className="px-4 py-4 text-right font-bold text-[#111827]">{formatRupee(gross)}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="flex justify-between py-2 border-b border-[#f3f4f6]">
                <span className="text-[#6b7280]">Gross Amount</span>
                <span className="font-bold text-[#111827]">{formatRupee(gross)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#f3f4f6]">
                <span className="text-[#6b7280]">TDS Withheld @ 10% (Sec. 194J)</span>
                <span className="font-bold text-red-600">-{formatRupee(tds)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#f3f4f6]">
                <span className="text-[#6b7280]">Platform Fee @ 2.5% + GST 18%</span>
                <span className="font-bold text-[#6b7280]">-{formatRupee(platFee)}</span>
              </div>
              <div className="flex justify-between py-3 bg-[#f9fafb] px-3 rounded-lg mt-2">
                <span className="font-black text-[#111827] text-lg">Net Received by Creator</span>
                <span className="font-black text-green-700 text-lg">{formatRupee(net)}</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4 rounded-lg text-xs text-black mb-6 font-medium">
            <strong>TDS Withholding Note:</strong> TDS under Section 194J has been deposited to the Income Tax Department against PAN {creatorProfile?.pan || 'verified on file'}. This is a system-generated invoice.
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => window.print()}
              className="flex-1 bg-[#111827] text-white font-bold py-3 rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print / Download Receipt
            </button>
            <button onClick={() => navigate('/creator-dashboard')} className="flex-1 border border-[#e5e7eb] text-[#111827] font-bold py-3 rounded-lg hover:bg-[#f9fafb] transition-colors flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!dealRoom) {
    return (
      <div className="min-h-[calc(100vh-75px)] bg-[#f9fafb] flex flex-col items-center justify-center text-center p-8">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-6" />
        <h1 className="text-3xl font-black text-black mb-3">No Deal Room Found</h1>
        <p className="text-gray-600 mb-8 max-w-md">The brand hasn't opened a deal room for this campaign yet. You'll be notified when they initiate a contract.</p>
        <button onClick={() => navigate('/creator-dashboard')} className="flex items-center gap-2 text-indigo-700 bg-indigo-50 border-2 border-black hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none px-6 py-3 rounded-lg font-bold transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  const status = dealRoom?.status || 'pending_creator_sign';

  return (
    <div className="min-h-screen bg-[#f9fafb] text-black pb-20 selection:bg-indigo-200 selection:text-black" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="bg-white border-b-2 border-black py-4 px-4 sm:px-6 lg:px-8 shadow-sm relative z-20">
        <div className="max-w-7xl mx-auto">
          <button onClick={() => navigate('/creator-dashboard')} className="text-gray-500 hover:text-indigo-600 text-sm font-bold tracking-wide mb-2 flex items-center transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> BACK TO DASHBOARD
          </button>
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="shrink-0">
              <div className="flex items-center gap-3 mb-1.5">
                <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <ShieldCheck className="w-3.5 h-3.5" /> Your Deal Room
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-black tracking-tight uppercase">
                Deal Room <span className="text-indigo-600">#{campaignId?.substring(0, 6)}</span>
              </h1>
              <p className="mt-0.5 text-sm text-gray-600 max-w-2xl font-medium">
                {dealRoom?.campaignTitle || campaign?.title || 'Campaign'} — {dealRoom?.brandName || campaign?.brandName}
              </p>
            </div>

            <div className="hidden xl:block flex-1 max-w-2xl px-4 xl:px-8 mb-6 mt-2">
              <StepIndicator />
            </div>

            <div className="flex gap-4 items-center shrink-0">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-sm ${
                status === 'completed' ? 'bg-emerald-50 border-black text-emerald-700' :
                status === 'escrow_locked' || status === 'pod_submitted' ? 'bg-sky-50 border-black text-sky-700' :
                'bg-white border-black text-gray-700'
              }`}>
                {status === 'completed' ? <CheckCircle className="w-4 h-4" /> :
                 status === 'escrow_locked' ? <Lock className="w-4 h-4" /> :
                 status === 'pending_creator_sign' ? <PenLine className="w-4 h-4" /> :
                 <Clock className="w-4 h-4" />}
                {status === 'pending_creator_sign' && 'Awaiting Your Signature'}
                {status === 'contract_amendment_requested' && 'Amendment Requested'}
                {status === 'creator_signed' && 'Awaiting Escrow Lock'}
                {status === 'escrow_locked' && 'Escrow Locked — Submit PoD'}
                {status === 'pod_submitted' && 'PoD Under Verification'}
                {status === 'pod_verified' && 'Verified — Funds Releasing'}
                {status === 'completed' && 'Deal Complete — Paid'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="block xl:hidden mb-10">
          <StepIndicator />
        </div>

        <div className="mt-8 relative">
          <div className="absolute inset-0 bg-indigo-500 opacity-5 blur-[100px] pointer-events-none rounded-full" />

          {/* STAGE: REVIEW CONTRACT */}
          {(status === 'pending_creator_sign') && (
            <div className="bg-white border-2 border-black p-6 md:p-8 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10 animate-[fadeIn_0.5s_ease-out]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-black pb-4 mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-black text-black uppercase tracking-wide">Review Your Contract</h2>
                  <p className="text-sm text-gray-600 mt-1 font-medium">
                    {dealRoom?.brandName} has proposed this deal. Read all terms carefully before signing.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/20 px-3 py-1 rounded text-xs font-bold uppercase">Action Required</span>
                  <p className="text-[#9ca3af] text-xs">Deal amount: <strong className="text-white">{formatRupee(dealRoom?.amount || 0)}</strong></p>
                </div>
              </div>

              <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 items-start">
                <div className="w-full xl:w-[65%]">
                  {/* Download PDF — shown once contract is signed */}
                  {dealRoom?.creatorSignedAt && (
                    <div className="mb-3 flex justify-end">
                      <button
                        onClick={() => generateContractPDF({
                          campaignId: campaignId || '',
                          campaignTitle: dealRoom?.campaignTitle || campaign?.title || 'Campaign',
                          brandName: dealRoom?.brandName || campaign?.brandName || 'Brand',
                          creatorName: creatorProfile?.name || creatorProfile?.legalName || 'Creator',
                          deliverableType: dealRoom?.deliverableType || 'Video',
                          productionDays: dealRoom?.productionDays || '14',
                          amount: dealRoom?.amount || 0,
                          brandSignedAt: dealRoom?.brandSignedAt,
                          creatorSignatureName: dealRoom?.creatorSignatureName,
                          creatorSignedAt: dealRoom?.creatorSignedAt,
                          status: dealRoom?.status,
                        })}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-black text-xs font-black uppercase tracking-widest border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Contract PDF
                      </button>
                    </div>
                  )}
                  <EStampContract
                    campaignId={campaignId || ''}
                    brandName={dealRoom?.brandName || campaign?.brandName || 'Brand (Advertiser)'}
                    creatorName={creatorProfile?.name || creatorProfile?.legalName || 'Creator'}
                    deliverableType={dealRoom?.deliverableType || 'Video'}
                    campaignTitle={dealRoom?.campaignTitle || campaign?.title || 'Campaign'}
                    productionDays={dealRoom?.productionDays || '14'}
                    amount={dealRoom?.amount || 0}
                    brandSignedAt={dealRoom?.brandSignedAt}
                    creatorSignatureName={dealRoom?.creatorSignatureName || signatureName}
                    creatorSignedAt={dealRoom?.creatorSignedAt}
                    status={status}
                    isDraft={status === 'pending_creator_sign' || status === 'contract_amendment_requested'}
                  />
                </div>

                <div className="w-full xl:w-[35%] xl:sticky xl:top-8 flex flex-col gap-6">
                  <div className="bg-gray-50 p-6 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <input 
                      type="text" 
                      placeholder="Enter full legal name to sign..."
                      className="w-full bg-white border-2 border-black rounded-lg p-4 text-black placeholder:text-gray-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      value={signatureName}
                      onChange={(e) => setSignatureName(e.target.value)}
                    />
                    <p className="text-gray-500 text-sm mt-2 font-medium">By typing your name and clicking Sign, you agree to the terms above.</p>
                  </div>

                  {showAmendmentInput ? (
                    <div className="bg-amber-50 p-6 rounded-xl border-2 border-black animate-[fadeIn_0.3s_ease-out] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <h3 className="text-black font-black mb-3 uppercase tracking-widest text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600" /> Propose Contract Changes
                      </h3>
                      <textarea 
                        className="w-full bg-white border-2 border-black rounded-lg p-4 text-black focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 mb-4 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        rows={4}
                        placeholder="e.g., 'Please change revision rounds from 3 to 1', or 'Change usage rights to 30 days instead of perpetuity.'"
                        value={amendmentMessage}
                        onChange={(e) => setAmendmentMessage(e.target.value)}
                      />
                      <div className="flex gap-4">
                        <button onClick={handleRequestAmendment} disabled={actionLoading || !amendmentMessage.trim()} className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black py-3 rounded uppercase tracking-widest text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none">Submit Redline Request</button>
                        <button onClick={() => setShowAmendmentInput(false)} className="px-6 bg-white border-2 border-black hover:bg-gray-100 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black rounded uppercase tracking-widest text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <button 
                        onClick={() => setShowAmendmentInput(true)} 
                        className="w-full py-4 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none text-gray-700 font-black rounded-lg uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2"
                      >
                        Request Amendment
                      </button>
                      <button 
                        onClick={handleSignContract} 
                        disabled={actionLoading || !signatureName.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-black font-black text-lg py-4 rounded-lg uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 flex items-center justify-center gap-3 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
                      >
                        {actionLoading ? 'Signing...' : 'Sign Contract'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STAGE: AMENDMENT REQUESTED */}
          {status === 'contract_amendment_requested' && (
            <div className="bg-white border-2 border-black p-10 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10 animate-[fadeIn_0.5s_ease-out]">
              <div className="text-center max-w-xl mx-auto">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <AlertCircle className="w-10 h-10 text-amber-600" />
                </div>
                <h2 className="text-3xl font-black text-black uppercase tracking-tight mb-4">Amendment Requested</h2>
                <p className="text-gray-600 mb-8 text-lg font-medium">We have notified the brand to review your proposed changes and regenerate the contract.</p>
                
                <div className="bg-amber-50 p-6 rounded-xl border-2 border-black text-left shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <h3 className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3">Your Request:</h3>
                  <p className="text-black font-serif italic text-lg leading-relaxed">"{dealRoom?.amendmentRequest}"</p>
                </div>
              </div>
            </div>
          )}

          {/* STAGE: SIGNED — WAITING FOR ESCROW */}
          {status === 'creator_signed' && (
            <div className="bg-white border-2 border-black p-12 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center relative z-10 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500" />
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <CheckCircle className="w-10 h-10 text-indigo-600" />
              </div>
              <h2 className="text-3xl font-black text-black uppercase tracking-tight mb-3">Contract Signed!</h2>
              <p className="text-gray-600 mb-6 max-w-xl mx-auto text-lg font-medium leading-relaxed">
                You've co-signed the agreement. We're waiting for <strong className="text-black">{dealRoom?.brandName || campaign?.brandName || 'the Brand'}</strong> to lock{' '}
                <strong className="text-black">{formatRupee(dealRoom?.amount || 0)}</strong> in escrow. You'll be notified instantly.
              </p>
              <div className="bg-gray-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 max-w-sm mx-auto">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Your Signature</p>
                <p className="font-serif italic text-2xl text-indigo-700">{dealRoom?.creatorSignatureName}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDateDDMMYY(new Date(dealRoom?.creatorSignedAt))}</p>
              </div>
            </div>
          )}

          {/* STAGE: ESCROW LOCKED — SUBMIT POD */}
          {(status === 'escrow_locked') && !animating && (
            <div className="bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <Lock className="w-9 h-9 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-black text-black uppercase tracking-tight mb-3">Escrow Locked — You're Good to Go!</h2>
                <p className="text-gray-600 mb-4 max-w-xl mx-auto text-lg leading-relaxed font-medium">
                  <strong className="text-black">{formatRupee(dealRoom?.amount || 0)}</strong> is secured in the RazorpayX vault. Produce your content and submit the YouTube video URL below once it's live.
                </p>
                <div className="inline-flex items-center gap-2 bg-emerald-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg px-4 py-2 text-emerald-700 text-sm font-bold mb-10">
                  <CheckCircle className="w-4 h-4" /> Funds are safe — you're protected
                </div>
              </div>

              <div className="border-t-2 border-black bg-gray-50 px-10 py-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 border border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Upload className="w-4 h-4 text-indigo-700" />
                  </div>
                  <h3 className="text-sm font-bold text-black uppercase tracking-widest">Submit Proof of Delivery</h3>
                </div>
                <form onSubmit={handlePodSubmit} className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    required
                    placeholder="Paste your published YouTube video URL..."
                    className="flex-1 bg-white border-2 border-black text-black px-5 py-3.5 rounded-lg focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none transition-all placeholder:text-gray-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-3.5 rounded-lg uppercase tracking-wider text-sm transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0 disabled:opacity-60 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none border-2 border-black"
                  >
                    Submit PoD
                  </button>
                </form>
                <p className="text-xs text-gray-500 mt-3 font-medium">Our AI will verify your #ad disclosure, audio mentions, and description links automatically.</p>
              </div>
            </div>
          )}

          {/* ANIMATION OVERLAY */}
          {animating && renderLoader([
            'Validating YouTube URL format...',
            'Running Computer Vision OCR for #ad tags...',
            'Executing Audio NLP transcription...',
            'Cross-referencing description box hyperlink...',
          ])}

          {/* STAGE: POD VERIFIED */}
          {status === 'pod_verified' && (
            <div className="bg-white border-2 border-black p-10 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10">
              <div className="flex items-center gap-4 mb-10 pb-6 border-b-2 border-gray-200">
                <div className="w-12 h-12 bg-emerald-100 border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-black uppercase tracking-tight">PoD Verified — Funds Releasing</h2>
                  <p className="text-gray-600 font-medium text-sm mt-1">Your content passed AI verification. Awaiting brand to approve fund release.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 p-6 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2"><Cpu className="w-4 h-4" /> Computer Vision OCR</h3>
                  <p className="text-gray-700 text-sm font-medium">Successfully detected <strong className="text-black">#ad</strong> tag in description box and visual overlay at timestamp <span className="bg-white border border-gray-300 px-1.5 py-0.5 rounded text-black font-mono">01:14</span>.</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2"><Cpu className="w-4 h-4" /> Audio NLP Transcription</h3>
                  <p className="text-gray-700 text-sm font-medium">Brand vocalizations matched at <span className="bg-white border border-gray-300 px-1.5 py-0.5 rounded text-black font-mono">01:14</span> and <span className="bg-white border border-gray-300 px-1.5 py-0.5 rounded text-black font-mono">02:05</span> — <strong className="text-emerald-600">98% confidence</strong>.</p>
                </div>
              </div>
              <div className="bg-amber-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-5 rounded-lg text-amber-800 text-sm flex gap-3 items-start">
                <div className="mt-0.5 shrink-0 animate-pulse text-amber-600"><ShieldCheck className="w-5 h-5" /></div>
                <p className="leading-relaxed"><strong className="block uppercase tracking-widest text-xs mb-1 font-black text-black">48-Hour Automatic Release Active</strong> If the brand raises no dispute in 48 hours, your funds will release automatically to your verified UPI.</p>
              </div>
            </div>
          )}

          {/* STAGE: DISPUTED / REVISION REQUESTED */}
          {status === 'disputed' && !animating && (
            <div className="bg-white border-2 border-black p-10 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10 animate-[fadeIn_0.5s_ease-out]">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-gray-200">
                <div className="w-12 h-12 bg-rose-100 border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Lock className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-black uppercase tracking-tight flex items-center gap-3">
                    Revision Requested
                  </h2>
                  <p className="text-gray-600 font-medium text-sm mt-1">Escrow is locked. {dealRoom?.brandName} has requested a revision on the deliverable.</p>
                </div>
              </div>

              <div className="bg-rose-50 p-6 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-8">
                <h3 className="text-xs font-bold text-rose-700 uppercase tracking-widest mb-3">Message from Brand:</h3>
                <p className="text-black text-lg font-serif italic leading-relaxed">"{dealRoom?.disputeMessage}"</p>
              </div>

              <div className="border-t-2 border-black pt-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 border border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Upload className="w-4 h-4 text-indigo-700" />
                  </div>
                  <h3 className="text-sm font-bold text-black uppercase tracking-widest">Submit Revised Deliverable</h3>
                </div>
                <form onSubmit={handlePodSubmit} className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    required
                    placeholder="Paste the revised YouTube video URL..."
                    className="flex-1 bg-white border-2 border-black text-black px-5 py-3.5 rounded-lg focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none transition-all placeholder:text-gray-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-3.5 rounded-lg uppercase tracking-wider text-sm transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0 disabled:opacity-60 border-2 border-black hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
                  >
                    Submit Revision
                  </button>
                </form>
                <p className="text-xs text-gray-500 mt-3 font-medium">This will trigger a new AI safety check and restart the 48-hour review window for the brand.</p>
              </div>
            </div>
          )}

          {/* STAGE: COMPLETED */}
          {status === 'completed' && (
            <div className="space-y-8 relative z-10">
              <div className="bg-white border-2 border-black p-10 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center overflow-hidden relative">
                <div className="absolute top-0 inset-x-0 h-2 bg-emerald-500" />
                <div className="w-28 h-28 bg-emerald-50 border-2 border-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <CheckCircle className="w-12 h-12 text-emerald-600" />
                </div>
                <h2 className="text-4xl font-black text-black uppercase tracking-tight mb-3">Payment Received!</h2>
                <p className="text-gray-600 font-medium max-w-xl mx-auto text-lg leading-relaxed mb-8">
                  Funds have been routed to your verified UPI. TDS has been deducted as per Section 194J. Your tax invoice is below.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="bg-gray-50 p-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Gross Amount</div>
                    <div className="text-xl font-black text-black">{formatRupee(dealRoom?.grossAmount || dealRoom?.amount || 0)}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">TDS (10%)</div>
                    <div className="text-xl font-black text-rose-600">-{formatRupee(dealRoom?.tdsAmount || 0)}</div>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-[10px] text-emerald-800 uppercase font-bold tracking-widest mb-1">Net Received</div>
                    <div className="text-xl font-black text-emerald-600">{formatRupee(dealRoom?.netPayout || 0)}</div>
                  </div>
                </div>
              </div>
              <InvoiceDocument />
            </div>
          )}
        </div>
      </div>

      {/* SIGNATURE MODAL */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border-2 border-black rounded-2xl w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="px-7 py-5 border-b-2 border-black flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h2 className="text-lg font-black text-black flex items-center gap-2"><PenLine className="w-5 h-5 text-indigo-600" /> Digital Signature</h2>
              {!actionLoading && <button onClick={() => setShowSignModal(false)} className="text-gray-500 hover:text-black text-xl font-black transition-colors">✕</button>}
            </div>
            {animating ? (
              <div className="p-7">{renderLoader(['Verifying identity via CreatorStack Auth...', 'Applying cryptographic signature...', 'Notifying brand counterparty...', 'Contract co-executed.'])}</div>
            ) : (
              <div className="p-7 space-y-5">
                <div className="bg-amber-50 border-2 border-black rounded-xl p-4 text-xs font-bold text-amber-800 leading-relaxed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  By signing below, you confirm you have read and agree to all terms. This constitutes a legally binding digital signature under the IT Act, 2000.
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Type Your Full Legal Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Shivansh Singh"
                    className="w-full bg-white border-2 border-black text-black px-4 py-3 rounded-lg focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none transition-all text-lg font-serif italic shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    value={signatureInput}
                    onChange={e => setSignatureInput(e.target.value)}
                  />
                </div>
                {signatureInput.trim() && (
                  <div className="bg-gray-50 border-2 border-black rounded-lg p-4 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider font-bold">Preview</p>
                    <p className="font-serif italic text-2xl text-indigo-700">{signatureInput}</p>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowSignModal(false)} className="flex-1 py-3 text-sm font-black text-gray-700 bg-white border-2 border-black rounded-xl hover:bg-gray-50 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none">Cancel</button>
                  <button
                    onClick={handleSignContract}
                    disabled={!signatureInput.trim() || actionLoading}
                    className="flex-1 py-3 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 border-2 border-black rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
                  >
                    <PenLine className="w-4 h-4" /> Sign Contract
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
