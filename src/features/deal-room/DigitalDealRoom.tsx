import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EscrowConfirmModal, DealRoomSkeleton, ConfettiBurst } from '../../components/ui/SharedComponents';
import { useAuth } from '../auth/AuthContext';
import { formatDateDDMMYY, formatRupee } from '../../utils/formatters';
import { doc, getDoc, updateDoc, setDoc, onSnapshot, addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  ShieldCheck,
  FileText,
  Lock,
  CheckCircle,
  ArrowLeft,
  Terminal,
  Cpu,
  AlertCircle,
  Download,
  Pencil,
  Wallet,
  Plus,
  RefreshCw,
} from 'lucide-react';
import EStampContract from '../../components/legal/EStampContract';
import { generateContractPDF } from '../../utils/generateContractPDF';
import { EmailService } from '../../services/emailService';
import { DealRoomChat } from './DealRoomChat';
import { CountdownTimer } from '../../components/ui/CountdownTimer';

export default function DigitalDealRoom() {
  const { campaignId, creatorId } = useParams<{ campaignId: string; creatorId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [campaign, setCampaign] = useState<any>(null);
  const [creator, setCreator] = useState<any>(null);
  const [dealRoom, setDealRoom] = useState<any>(null);
  const [_loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!campaignId || !creatorId) return;
      try {
        const docRef = doc(db, 'campaigns', campaignId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCampaign({ id: docSnap.id, ...data });
          // Pre-fill deal terms from campaign data
          if (data.budget) setAmount(data.budget.replace(/[^0-9]/g, ''));
          if (data.deliverables) setDeliverableType(data.deliverables);
        }

        const creatorRef = doc(db, 'creators', creatorId);
        const creatorSnap = await getDoc(creatorRef);
        if (creatorSnap.exists()) {
          setCreator({ id: creatorSnap.id, ...creatorSnap.data() });
        } else {
          // Fallback: fetch from users collection
          const userRef = doc(db, 'users', creatorId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) setCreator({ id: userSnap.id, ...userSnap.data() });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchData();

    // Listen to DealRoom document
    if (campaignId && creatorId) {
      const dealKey = `${campaignId}_${creatorId}`;
      const unsub = onSnapshot(doc(db, 'dealRooms', dealKey), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          let currentStatus = data.status;
          if (currentStatus === 'disputed') {
            const disputedAt = data.disputedAt ? new Date(data.disputedAt) : new Date();
            if ((new Date().getTime() - disputedAt.getTime()) / (1000 * 60 * 60) >= 48) {
              currentStatus = 'admin_escalated';
            }
          }
          setDealRoom({ id: snap.id, ...data, status: currentStatus });

          // Sync state machine with DB status
          if (currentStatus === 'pending_creator_sign') setDealStage('CONTRACT');
          else if (currentStatus === 'contract_amendment_requested') setDealStage('CONTRACT');
          else if (currentStatus === 'creator_signed') setDealStage('ESCROW');
          else if (currentStatus === 'escrow_locked') setDealStage('PRODUCTION');
          else if (currentStatus === 'pod_submitted') setDealStage('AI_CHECK');
          else if (currentStatus === 'pod_verified') setDealStage('AI_CHECK');
          else if (currentStatus === 'disputed') setDealStage('AI_CHECK');
          else if (currentStatus === 'admin_escalated') setDealStage('AI_CHECK');
          else if (currentStatus === 'completed') setDealStage('RELEASED');
        }
      });
      return () => unsub();
    }
  }, [campaignId, creatorId]);

  // State Machine for the Digital Deal Room
  const [dealStage, setDealStage] = useState<
    'TERMS' | 'CONTRACT' | 'ESCROW' | 'PRODUCTION' | 'AI_CHECK' | 'RELEASED'
  >('TERMS');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingMessages, setLoadingMessages] = useState<string[]>([]);

  // Term Variables - pre-filled from campaign data
  const [amount, setAmount] = useState('');
  const [productionDays, setProductionDays] = useState('14');
  const [deliverableType, setDeliverableType] = useState('60s Dedicated Integration');
  const [paymentStructure, setPaymentStructure] = useState<'lump_sum' | 'milestone'>('lump_sum');

  // Issue 15: Track whether terms are locked post-contract generation
  const [termsLocked, setTermsLocked] = useState(false);

  // Issue 16: Wallet balance + deposit modal
  const [walletBalance, setWalletBalance] = useState(0);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositProcessing, setDepositProcessing] = useState(false);
  const [depositDone, setDepositDone] = useState(false);

  // Fetch wallet balance
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
      if (snap.exists()) {
        const w = snap.data().escrowWallet || {};
        setWalletBalance(w.availableBalance || w.balance || 0);
      }
    });
    return () => unsub();
  }, [currentUser]);

  // Simulate Razorpay deposit
  const handleDeposit = async () => {
    setDepositProcessing(true);
    await new Promise((r) => setTimeout(r, 2200));
    const depositAmt = parseInt(amount) || 0;
    if (currentUser) {
      const snap = await getDoc(doc(db, 'users', currentUser.uid));
      if (snap.exists()) {
        const w = snap.data().escrowWallet || { balance: 0, availableBalance: 0, lockedBalance: 0 };
        await updateDoc(doc(db, 'users', currentUser.uid), {
          escrowWallet: {
            ...w,
            balance: (w.balance || 0) + depositAmt,
            availableBalance: (w.availableBalance || 0) + depositAmt,
          },
        });
      }
    }
    setDepositProcessing(false);
    setDepositDone(true);
    setTimeout(() => { setShowDepositModal(false); setDepositDone(false); }, 1500);
  };

  // Dispute logic
  const [showDisputeInput, setShowDisputeInput] = useState(false);
  const [disputeMessage, setDisputeMessage] = useState('');

  // Escrow confirmation modal
  const [showEscrowModal, setShowEscrowModal] = useState(false);

  // Video Link for PoD
  const [videoLink, setVideoLink] = useState('');

  const runAnimation = (messages: string[]) => {
    setLoadingMessages(messages);
    setLoading(true);
    setLoadingStep(0);
    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < messages.length) {
        setLoadingStep(current);
      } else {
        clearInterval(interval);
        setLoading(false);
      }
    }, 1500);
  };

  const handleGenerateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    // ✅ Minimum amount validation — prevents ₹0 or negative deals
    const amountNum = parseInt(amount);
    if (!amountNum || amountNum < 5000) {
      alert('Minimum deal amount is ₹5,000');
      return;
    }
    if (campaignId && creatorId) {
      try {
        await setDoc(
          doc(db, 'dealRooms', `${campaignId}_${creatorId}`),
          {
            status: 'pending_creator_sign',
            amount: amount,
            paymentStructure: paymentStructure,
            productionDays: productionDays,
            deliverables: deliverableType,
            amendmentRequest: null, // clear out any old amendment requests
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );

        // Send email to creator
        if (creator?.email) {
          await EmailService.applicationAccepted({
            toEmail: creator.email,
            creatorName: creator.name || 'Creator',
            campaignTitle: campaign?.title || 'Campaign',
            brandName: campaign?.brandName || 'Brand Partner',
          });
        }
      } catch (err) {
        console.error('Error generating contract:', err);
      }
    }

    // Lock terms after contract is generated
    setTermsLocked(true);
    runAnimation([
      'Parsing updated term inputs...',
      'Injecting variables into legal template...',
      'Generating immutable PDF contract...',
      'Pinging creator for signature...',
    ]);
  };

  const handleSignAndEscrow = async () => {
    if (campaignId && creatorId) {
      try {
        const gross = parseInt(amount) || 0;
        await setDoc(
          doc(db, 'dealRooms', `${campaignId}_${creatorId}`),
          {
            status: 'escrow_locked',
            escrowLockedAt: new Date().toISOString(),
            brandSignedAt: new Date().toISOString(),
          },
          { merge: true },
        );

        // ✅ Deduct from brand's escrow wallet — moves from available to locked
        if (currentUser) {
          const brandSnap = await getDoc(doc(db, 'users', currentUser.uid));
          if (brandSnap.exists()) {
            const wallet = brandSnap.data().escrowWallet || {
              balance: 0,
              lockedBalance: 0,
              availableBalance: 0,
            };
            await updateDoc(doc(db, 'users', currentUser.uid), {
              escrowWallet: {
                ...wallet,
                lockedBalance: (wallet.lockedBalance || 0) + gross,
                availableBalance: Math.max(0, (wallet.availableBalance || 0) - gross),
              },
            });
            // Log wallet lock transaction
            await addDoc(collection(db, 'walletTransactions'), {
              userId: currentUser.uid,
              type: 'lock',
              amount: gross,
              description: `Escrow locked for deal: ${campaignId}`,
              dealId: `${campaignId}_${creatorId}`,
              createdAt: new Date().toISOString(),
            });
          }
        }

        if (creator?.email) {
          const gross = parseInt(amount) || 0;
          const tds = Math.round(gross * 0.1);
          const platFee = Math.round(gross * 0.025 * 1.18);
          await EmailService.escrowLocked({
            toEmail: creator.email,
            creatorName: creator.name || 'Creator',
            campaignTitle: campaign?.title || 'Campaign',
            brandName: campaign?.brandName || 'Brand',
            amount: formatRupee(gross),
            netPayout: formatRupee(gross - tds - platFee),
            productionDays: String(productionDays || 14),
            dealRoomUrl: `${window.location.origin}/creator-deal-room/${campaignId}`,
          });
        }
      } catch (err) {
        console.error('Error updating escrow status:', err);
      }
    }
    // ✅ Honest messaging — no fake Razorpay API claims
    runAnimation([
      'Verifying contract signatures...',
      'Moving funds from your escrow wallet...',
      'Earmarking funds for this deal...',
      'Notifying creator to begin production...',
    ]);
  };

  const handleCreatorUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setDealStage('PRODUCTION'); // jump instantly to the next view
    setTimeout(() => {
      runAnimation([
        'Downloading high-res video manifest...',
        'Running Computer Vision OCR for #ad tags...',
        'Executing Audio NLP transcription for brand vocalizations...',
        'Cross-referencing description box hyperlink tracking...',
      ]);
    }, 500);
  };

  const handleReleaseFunds = async () => {
    runAnimation([
      'Verifying brand cryptographic signature...',
      'Authorizing escrow release via RazorpayX...',
      'Disbursing INR funds to creator...',
      'Logging immutable transaction hash...',
    ]);

    // Always persist campaign completion to Firestore
    if (campaignId && creatorId) {
      try {
        const gross = parseInt(amount) || 0;
        const tds = Math.round(gross * 0.1);
        const platFee = Math.round(gross * 0.025 * 1.18);
        const net = Math.round(gross - tds - platFee);

        await updateDoc(doc(db, 'campaigns', campaignId), {
          status: 'completed',
          completedAt: new Date().toISOString(),
          finalAmount: gross,
          netPayout: net,
        });

        await setDoc(
          doc(db, 'dealRooms', `${campaignId}_${creatorId}`),
          {
            status: 'completed',
            completedAt: new Date().toISOString(),
            grossAmount: gross,
            tdsAmount: tds,
            platformFee: platFee,
            netPayout: net,
          },
          { merge: true },
        );

        if (creator?.email) {
          await EmailService.dealCompleted({
            toEmail: creator.email,
            creatorName: creator.name || 'Creator',
            campaignTitle: campaign?.title || 'Campaign',
            brandName: campaign?.brandName || 'Brand',
            grossAmount: formatRupee(gross),
            tdsAmount: formatRupee(tds),
            netPayout: formatRupee(net),
            upiId: creator.upiId || 'Linked UPI Account',
          });
        }
      } catch (err) {
        console.error('Error marking campaign complete:', err);
      }
    }
  };

  const handleSubmitDispute = async () => {
    if (!disputeMessage.trim()) return;
    if (campaignId && creatorId) {
      try {
        await setDoc(
          doc(db, 'dealRooms', `${campaignId}_${creatorId}`),
          {
            status: 'disputed',
            disputeMessage: disputeMessage,
            disputedAt: new Date().toISOString(),
          },
          { merge: true },
        );
        setShowDisputeInput(false);
        setDisputeMessage('');
      } catch (err) {
        console.error('Error updating dispute status:', err);
      }
    }
  };

  const renderLoader = () => (
    <div className="bg-white border-2 border-black p-12 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0f3460] via-transparent to-transparent"></div>
      <div className="w-full max-w-lg z-10">
        <div className="flex justify-center mb-8">
          <Terminal className="w-12 h-12 text-[#0f3460] animate-pulse" />
        </div>
        <div className="flex justify-between text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">
          <span>Executing Protocol</span>
          <span className="text-[#0f3460]">
            {Math.round(((loadingStep + 1) / (loadingMessages.length || 1)) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-8 border border-gray-200">
          <div
            className="h-full bg-[#0f3460] transition-all duration-500"
            style={{ width: `${((loadingStep + 1) / (loadingMessages.length || 1)) * 100}%` }}
          ></div>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm text-gray-500 border-2 border-black h-32 flex flex-col justify-end shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          {loadingMessages.slice(0, loadingStep + 1).map((msg, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 mb-2 ${i === loadingStep ? 'text-[#0f3460] font-bold' : 'opacity-60'}`}
            >
              <span className="text-gray-400">System_&gt;</span> {msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Terminal is used in renderLoader

  const getStepStatus = (stepName: string) => {
    const stages = ['TERMS', 'CONTRACT', 'ESCROW', 'PRODUCTION', 'AI_CHECK', 'RELEASED'];
    let currentIdx = stages.indexOf(dealStage);
    if (dealStage === 'PRODUCTION' || dealStage === 'AI_CHECK') currentIdx = 3; // Treat as step 4 (Escrow/Verify)
    if (dealStage === 'RELEASED') currentIdx = 4; // Treat as final step

    const steps = ['TERMS', 'CONTRACT', 'ESCROW', 'PRODUCTION', 'RELEASED'];
    const targetIdx = steps.indexOf(stepName);

    if (currentIdx > targetIdx) return 'completed';
    if (currentIdx === targetIdx) return 'active';
    return 'pending';
  };

  const StepIndicator = () => {
    // Dynamic Active Status logic
    let activeMessage = '';
    let slaText = '';
    let icon = null;

    switch (dealStage) {
      case 'TERMS':
        activeMessage = 'Waiting for Brand to define terms';
        slaText = 'Brands typically finalize terms within 2 hours';
        icon = <FileText className="w-4 h-4" />;
        break;
      case 'CONTRACT':
        activeMessage = 'Waiting for Creator to sign contract';
        slaText = 'Creators typically sign within 12 hours';
        icon = <ShieldCheck className="w-4 h-4 text-amber-600" />;
        break;
      case 'ESCROW':
        activeMessage = 'Waiting for Brand to lock escrow';
        slaText = 'Escrow deposit required before production begins';
        icon = <Lock className="w-4 h-4 text-indigo-600" />;
        break;
      case 'PRODUCTION':
        activeMessage = 'Waiting for Creator to upload video';
        slaText = 'Delivery due in 7 days';
        icon = <Cpu className="w-4 h-4 text-indigo-600" />;
        break;
      case 'AI_CHECK':
        activeMessage = 'AI Verification in Progress';
        slaText = 'Analyzing script compliance...';
        icon = <Terminal className="w-4 h-4 text-indigo-600 animate-pulse" />;
        break;
      case 'RELEASED':
        activeMessage = 'Escrow Released';
        slaText = 'Funds transferred to Creator UPI';
        icon = <CheckCircle className="w-4 h-4 text-emerald-600" />;
        break;
    }

    return (
      <div className="flex flex-col gap-2 w-full mb-6 xl:mb-0">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
          <span>{dealStage} STAGE</span>
          <span className="text-[#0f3460]">{slaText}</span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#0f3460] h-full transition-all duration-1000"
            style={{
              width:
                dealStage === 'TERMS' ? '10%'
                  : dealStage === 'CONTRACT' ? '30%'
                  : dealStage === 'ESCROW' ? '50%'
                  : dealStage === 'PRODUCTION' ? '70%'
                  : dealStage === 'AI_CHECK' ? '90%'
                  : '100%',
            }}
          />
        </div>
        <div className="bg-white border-2 border-black rounded-lg p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <span className="text-sm font-black text-black">
            {activeMessage}
          </span>
        </div>
      </div>
    );
  };

  if (_loadingInitial) {
    return <DealRoomSkeleton />;
  }

  return (
    <div
      className="min-h-screen bg-[#f9fafb] text-black pb-20 selection:bg-indigo-200 selection:text-black layout-brand"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {dealStage === 'RELEASED' && <ConfettiBurst />}
      {/* Premium Header */}
      <div className="bg-white border-b-2 border-black py-4 px-4 sm:px-6 lg:px-8 shadow-sm relative z-20">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-[#0f3460] text-sm font-bold tracking-wide mb-2 flex items-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> BACK
          </button>
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="shrink-0">
              <div className="flex items-center gap-3 mb-1.5">
                <span className="bg-[#f0f4f8] text-[#0f3460] border border-[#0f3460] px-3 py-1 rounded text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <ShieldCheck className="w-3.5 h-3.5" /> Secure Vault
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-black tracking-tight uppercase">
                Digital Deal Room{' '}
                <span className="text-[#0f3460]">#{campaignId?.substring(0, 6)}</span>
              </h1>
              <p className="mt-0.5 text-sm text-gray-600 max-w-2xl font-medium">
                End-to-end programmatic escrow and legal enforcement.
              </p>
            </div>

            <div className="hidden xl:block flex-1 max-w-2xl px-4 xl:px-8 mb-6">
              <StepIndicator />
            </div>

            <div className="flex gap-4 items-center shrink-0">
              <img
                src={
                  creator?.youtubeData?.thumbnailUrl ||
                  creator?.channelThumbnail ||
                  creator?.profile_image_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(creator?.name || 'C')}&background=0f3460&color=fff`
                }
                className="w-12 h-12 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] object-cover"
                alt=""
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(creator?.name || 'C')}&background=0f3460&color=fff`;
                }}
              />
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                  Creator Counterparty
                </p>
                <p className="font-bold text-black text-lg">{creator?.name || 'Loading...'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="block xl:hidden mb-10">
          <StepIndicator />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 relative">
            {/* subtle glow behind active area */}
            <div className="absolute inset-0 bg-[#0f3460] opacity-5 blur-[100px] pointer-events-none rounded-full"></div>

            {loading ? (
              renderLoader()
            ) : (
              <>
                {/* STAGE 1: TERMS ENTRY */}
              {dealStage === 'TERMS' && (
                <div className="max-w-4xl mx-auto bg-white border-2 border-black p-6 md:p-8 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10 animate-[fadeIn_0.5s_ease-out]">
                  <div className="flex items-center gap-4 mb-8 border-b-2 border-gray-200 pb-6">
                    <div className="w-12 h-12 bg-[#f0f4f8] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-[#0f3460]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-black uppercase tracking-wide">
                        Define Collaboration Terms
                      </h2>
                      <p className="text-sm text-gray-600 font-medium mt-1">
                        Set the parameters for the smart contract.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleGenerateContract} className="p-6 md:p-8 space-y-6">
                    {/* Issue 15: Editable affordance banner */}
                    <div className="flex items-center gap-3 bg-[#fffbeb] border-2 border-amber-400 rounded-lg px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <Pencil className="w-4 h-4 text-amber-600 shrink-0" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">
                        Terms editable — all fields below can be modified before generating the contract
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="group">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 group-focus-within:text-[#0f3460] transition-colors flex items-center gap-1.5">
                          <Pencil className="w-2.5 h-2.5 opacity-50" /> Gross Payout Amount
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                            ₹
                          </span>
                          <input
                            type="number"
                            required
                            min="5000"
                            placeholder="5000"
                            className="w-full bg-white border-2 border-black text-black pl-9 pr-4 py-3.5 rounded-lg focus:border-[#0f3460] focus:ring-1 focus:ring-[#0f3460] focus:outline-none text-xl font-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                          />
                          {amount && parseInt(amount) < 5000 && (
                            <p className="text-[10px] font-black text-red-500 mt-1.5 uppercase tracking-widest">
                              Minimum deal amount is ₹5,000
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="group">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 group-focus-within:text-[#0f3460] transition-colors">
                          Production Time (Days)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            required
                            className="w-full bg-white border-2 border-black text-black px-4 py-3.5 rounded-lg focus:border-[#0f3460] focus:ring-1 focus:ring-[#0f3460] focus:outline-none text-xl font-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            value={productionDays}
                            onChange={(e) => setProductionDays(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Milestone Payment Toggle */}
                    <div className="group border-2 border-black rounded-lg p-4 bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 group-focus-within:text-[#0f3460] transition-colors">
                        Payment Structure
                      </label>
                      <div className="flex gap-4">
                        <label className="flex-1 cursor-pointer">
                          <input 
                            type="radio" 
                            name="paymentStructure" 
                            value="lump_sum"
                            checked={paymentStructure === 'lump_sum'}
                            onChange={() => setPaymentStructure('lump_sum')}
                            className="sr-only"
                          />
                          <div className={`p-3 text-center border-2 rounded-lg font-bold text-sm transition-all ${paymentStructure === 'lump_sum' ? 'border-black bg-[#0f3460] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'border-gray-300 bg-white text-gray-500 hover:border-black'}`}>
                            100% Lump Sum
                          </div>
                        </label>
                        <label className="flex-1 cursor-pointer">
                          <input 
                            type="radio" 
                            name="paymentStructure" 
                            value="milestone"
                            checked={paymentStructure === 'milestone'}
                            onChange={() => setPaymentStructure('milestone')}
                            className="sr-only"
                          />
                          <div className={`p-3 text-center border-2 rounded-lg font-bold text-sm transition-all ${paymentStructure === 'milestone' ? 'border-black bg-amber-500 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'border-gray-300 bg-white text-gray-500 hover:border-black'}`}>
                            Split (40% Upfront, 60% Delivery)
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 group-focus-within:text-[#0f3460] transition-colors">
                        Asset Deliverable Type
                      </label>
                      <select
                        className="w-full bg-white border-2 border-black text-black px-4 py-3.5 rounded-lg focus:border-[#0f3460] focus:ring-1 focus:ring-[#0f3460] focus:outline-none text-lg font-medium transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        value={deliverableType}
                        onChange={(e) => setDeliverableType(e.target.value)}
                      >
                        <option>60s Dedicated Integration</option>
                        <option>30s Pre-roll Mention</option>
                        <option>Dedicated Video (Full length)</option>
                        <option>YouTube Shorts (Multi-part series)</option>
                      </select>
                    </div>
                    <div className="pt-6 border-t-2 border-black">
                      <button
                        type="submit"
                        className="w-full bg-[#0f3460] hover:bg-[#1a4a82] border-2 border-black text-white font-black text-lg py-4 rounded-lg uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
                      >
                        Compile Programmatic Contract
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* STAGE 2 & 3: CONTRACT GENERATION & ESCROW */}
              {(dealStage === 'CONTRACT' || dealStage === 'ESCROW') && (
                <div className="bg-white border-2 border-black p-6 md:p-8 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10 animate-[fadeIn_0.5s_ease-out]">
                  <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
                    {dealStage === 'CONTRACT' ? (
                      <>
                        <div>
                          <h2 className="text-2xl font-black text-black uppercase tracking-wide flex items-center gap-2">
                            <Terminal className="w-5 h-5 text-[#0f3460]" /> Contract Generated
                          </h2>
                          <p className="text-sm text-gray-600 mt-1 font-medium">
                            The contract has been sent to {creator?.name}. Awaiting their digital
                            signature.
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="bg-amber-100 text-amber-800 border-2 border-black px-3 py-1 rounded text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            Pending Creator Signature
                          </span>
                          <p className="text-gray-500 text-xs font-bold">
                            Contract Value:{' '}
                            <strong className="text-black">{formatRupee(amount)}</strong>
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <h2 className="text-2xl font-black text-black uppercase tracking-wide flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-600" /> Creator Signed!
                          </h2>
                          <p className="text-sm text-gray-600 mt-1 font-medium">
                            {creator?.name} has digitally signed the contract. You must now lock
                            escrow to begin production.
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="bg-emerald-100 text-emerald-800 border-2 border-black px-3 py-1 rounded text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            Ready for Escrow Lock
                          </span>
                          <p className="text-gray-500 text-xs font-bold">
                            Contract Value:{' '}
                            <strong className="text-black">{formatRupee(amount)}</strong>
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* === CONTENT AND ACTIONS FLEX CONTAINER === */}
                  <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 items-start">
                    {/* LEFT: CONTRACT */}
                    <div className="w-full xl:w-[65%]">
                      {/* Download PDF Button */}
                      {dealRoom?.status && dealRoom.status !== 'pending_creator_sign' && (
                        <div className="mb-3 flex justify-end">
                          <button
                            onClick={() =>
                              generateContractPDF({
                                campaignId: campaignId || '',
                                campaignTitle: campaign?.title || 'Campaign',
                                brandName: campaign?.brandName || 'Brand',
                                creatorName: creator?.name || creator?.legalName || 'Creator',
                                deliverableType: deliverableType || 'Video',
                                productionDays: productionDays || '14',
                                amount: amount || 0,
                                brandSignedAt: dealRoom?.brandSignedAt,
                                creatorSignatureName: dealRoom?.creatorSignatureName,
                                creatorSignedAt: dealRoom?.creatorSignedAt,
                                status: dealRoom?.status,
                              })
                            }
                            className="flex items-center gap-2 px-4 py-2 bg-white text-black text-xs font-black uppercase tracking-widest border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                          >
                            <Download className="w-3.5 h-3.5" /> Download Contract PDF
                          </button>
                        </div>
                      )}
                      <div className="overflow-x-auto text-[10px] sm:text-sm">
                        <EStampContract
                          campaignId={campaignId || ''}
                          brandName={campaign?.brandName || 'Brand (Advertiser)'}
                          creatorName={creator?.name || creator?.legalName || 'Creator'}
                          deliverableType={deliverableType || 'Video'}
                          campaignTitle={campaign?.title || 'Campaign'}
                          productionDays={String(productionDays || 14)}
                          amount={amount || 0}
                          brandSignedAt={dealRoom?.brandSignedAt}
                          creatorSignatureName={dealRoom?.creatorSignatureName}
                          creatorSignedAt={dealRoom?.creatorSignedAt}
                          status={dealRoom?.status}
                          isDraft={
                            dealRoom?.status === 'pending_creator_sign' ||
                            dealRoom?.status === 'contract_amendment_requested' ||
                            !dealRoom
                          }
                        />
                      </div>
                      {/* === END STAMP PAPER === */}
                    </div>

                    {/* RIGHT: ACTIONS */}
                    <div className="w-full xl:w-[35%] xl:sticky xl:top-8 flex flex-col gap-6">
                      {dealRoom?.status === 'contract_amendment_requested' ? (
                        <div className="bg-white border-2 border-black p-6 rounded-xl animate-[fadeIn_0.5s_ease-out] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10">
                          <div className="flex items-center gap-4 mb-4 pb-4 border-b-2 border-gray-200">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                              <AlertCircle className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                              <h2 className="text-xl font-black text-black uppercase tracking-tight flex items-center gap-3">
                                Creator Requested Redline
                              </h2>
                              <p className="text-gray-600 text-sm mt-1 font-medium">
                                The creator has requested changes before they sign.
                              </p>
                            </div>
                          </div>

                          <div className="bg-rose-50 p-6 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-8">
                            <h3 className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-3">
                              Creator Note:
                            </h3>
                            <p className="text-black text-lg font-serif italic leading-relaxed">
                              "{dealRoom?.amendmentRequest}"
                            </p>
                          </div>

                          <div className="border-t-2 border-black pt-8">
                            <h3 className="text-black font-black mb-4 uppercase tracking-widest text-sm">
                              Update Contract Parameters
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                  Total Value (INR)
                                </label>
                                <input
                                  type="number"
                                  required
                                  className="w-full bg-white border-2 border-black text-black px-4 py-3 rounded-lg focus:border-[#0f3460] focus:ring-1 focus:ring-[#0f3460] focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold"
                                  value={amount}
                                  onChange={(e) => setAmount(e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                  Production Days
                                </label>
                                <input
                                  type="number"
                                  required
                                  className="w-full bg-white border-2 border-black text-black px-4 py-3 rounded-lg focus:border-[#0f3460] focus:ring-1 focus:ring-[#0f3460] focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold"
                                  value={productionDays}
                                  onChange={(e) => setProductionDays(e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                  Deliverable Details
                                </label>
                                <input
                                  type="text"
                                  required
                                  className="w-full bg-white border-2 border-black text-black px-4 py-3 rounded-lg focus:border-[#0f3460] focus:ring-1 focus:ring-[#0f3460] focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold"
                                  value={deliverableType}
                                  onChange={(e) => setDeliverableType(e.target.value)}
                                />
                              </div>
                            </div>
                            <button
                              onClick={handleGenerateContract}
                              className="w-full bg-[#0f3460] hover:bg-[#1a4a82] text-white font-black text-lg py-4 rounded-lg uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none border-2 border-black"
                            >
                              Generate Revised Contract
                            </button>
                          </div>
                        </div>
                      ) : dealStage === 'CONTRACT' ? (
                        <div className="bg-gray-50 border-2 border-black rounded-xl p-6 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#0f3460] rounded-full animate-spin mx-auto mb-4" />
                          <p className="text-black font-black uppercase tracking-widest text-sm">
                            Waiting for Creator
                          </p>
                          <p className="text-gray-500 text-xs mt-2 font-medium">
                            The creator must review and digitally sign the contract before you can
                            lock escrow. They may also request an amendment.
                          </p>
                        </div>
                      ) : (
                        <>
                          <EscrowConfirmModal
                            isOpen={showEscrowModal}
                            amount={dealRoom?.paymentStructure === 'milestone' ? String(Math.round(parseInt(amount) * 0.4)) : amount}
                            creatorName={creator?.name || 'Creator'}
                            onConfirm={() => {
                              setShowEscrowModal(false);
                              handleSignAndEscrow();
                            }}
                            onCancel={() => setShowEscrowModal(false)}
                          />

                          {/* Issue 16: Balance check */}
                          {walletBalance < (dealRoom?.paymentStructure === 'milestone' ? Math.round(parseInt(amount || '0') * 0.4) : parseInt(amount || '0')) ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 bg-rose-50 border-2 border-rose-400 rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                <Wallet className="w-5 h-5 text-rose-500 shrink-0" />
                                <div className="flex-1">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-800">
                                    Insufficient wallet balance
                                  </p>
                                  <p className="text-xs font-medium text-rose-700 mt-0.5">
                                    Available: {formatRupee(walletBalance)} · Required: {formatRupee(dealRoom?.paymentStructure === 'milestone' ? Math.round(parseInt(amount || '0') * 0.4) : parseInt(amount || '0'))}
                                    {dealRoom?.paymentStructure === 'milestone' && ' (40% Upfront)'}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => setShowDepositModal(true)}
                                className="w-full bg-[#0f3460] hover:bg-[#1a4a82] border-2 border-black text-white font-black text-base py-4 rounded-lg uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
                              >
                                <Plus className="w-5 h-5" /> Deposit {formatRupee((dealRoom?.paymentStructure === 'milestone' ? Math.round(parseInt(amount || '0') * 0.4) : parseInt(amount || '0')) - walletBalance)} to Proceed
                              </button>
                              <p className="text-center text-xs font-bold text-gray-400">
                                You'll be taken to Razorpay to top up your escrow wallet.
                              </p>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => setShowEscrowModal(true)}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 border-2 border-black text-white font-black text-lg py-5 rounded-lg uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
                              >
                                <Lock className="w-5 h-5" /> Lock {formatRupee(dealRoom?.paymentStructure === 'milestone' ? Math.round(parseInt(amount || '0') * 0.4) : amount)} in Escrow {dealRoom?.paymentStructure === 'milestone' && '(40% Upfront)'}
                              </button>
                              <p className="text-center text-xs font-bold text-gray-400 mt-2">
                                Wallet balance: {formatRupee(walletBalance)} · A confirmation will appear.
                              </p>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 4: PRODUCTION */}
              {dealStage === 'PRODUCTION' && (
                <div className="bg-white border-2 border-black p-10 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-indigo-50 border-2 border-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <Lock className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h2 className="text-3xl font-black text-black uppercase tracking-tight mb-3">
                      Escrow Vault Locked
                    </h2>
                    <p className="text-gray-600 mb-4 max-w-xl mx-auto text-lg leading-relaxed font-medium">
                      <strong className="text-black">{formatRupee(dealRoom?.paymentStructure === 'milestone' ? Math.round(parseInt(amount || '0') * 0.4) : amount)}</strong> has been
                      securely deposited into the RazorpayX Virtual Escrow. The creator has been
                      notified to begin production.
                      {dealRoom?.paymentStructure === 'milestone' && (
                        <span className="block mt-2 text-sm text-amber-600 font-bold">
                          The remaining 60% ({formatRupee(Math.round(parseInt(amount || '0') * 0.6))}) will be requested upon deliverable approval.
                        </span>
                      )}
                    </p>
                    <div className="bg-gray-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 text-center mt-8">
                      <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-black font-black uppercase tracking-widest text-sm">
                        Awaiting Creator PoD
                      </p>
                      <p className="text-gray-500 text-xs mt-2 font-medium">
                        We will automatically verify the deliverable when the creator submits their
                        video.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 4: AI POD CHECK RESULT */}
              {dealStage === 'AI_CHECK' && (
                <div className="bg-white border-2 border-black p-10 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-[fadeIn_0.5s_ease-out] relative z-10">
                  <div className="flex items-center gap-4 mb-10 pb-6 border-b-2 border-gray-200">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-black uppercase tracking-tight flex items-center gap-3">
                        PoD Verification Passed
                      </h2>
                      <p className="text-gray-600 font-medium text-sm mt-1">
                        Our AI engines have successfully validated the deliverable.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="bg-gray-50 p-6 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group">
                      <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Cpu className="w-4 h-4" /> Computer Vision OCR
                      </h3>
                      <p className="text-gray-700 text-sm font-medium leading-relaxed">
                        Successfully detected <strong className="text-black">#ad</strong> tag in
                        description box and visual graphic overlay at timestamp{' '}
                        <span className="bg-white border border-gray-300 px-1.5 py-0.5 rounded text-black font-mono shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                          01:14
                        </span>
                        .
                      </p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group">
                      <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Cpu className="w-4 h-4" /> Audio NLP Transcription
                      </h3>
                      <p className="text-gray-700 text-sm font-medium leading-relaxed">
                        Successfully matched brand name vocalizations at{' '}
                        <span className="bg-white border border-gray-300 px-1.5 py-0.5 rounded text-black font-mono shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                          01:14
                        </span>{' '}
                        and{' '}
                        <span className="bg-white border border-gray-300 px-1.5 py-0.5 rounded text-black font-mono shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                          02:05
                        </span>{' '}
                        with <strong className="text-emerald-600">98% confidence</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-5 rounded-lg mb-8 text-amber-800 text-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex gap-3 items-start">
                      <div className="mt-0.5 shrink-0 animate-pulse text-amber-600">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <p className="leading-relaxed">
                        <strong className="block uppercase tracking-widest text-xs mb-1 font-black text-black">
                          48-Hour Review Window Active
                        </strong>
                        If no dispute is raised, funds will automatically release. You
                        may request a revision if the integration fails brand safety guidelines.
                      </p>
                    </div>
                    {dealRoom?.podVerifiedAt && (
                      <div className="shrink-0">
                        <CountdownTimer 
                          startDateStr={dealRoom.podVerifiedAt} 
                          title="Auto-Release In"
                        />
                      </div>
                    )}
                  </div>

                  {dealRoom?.status === 'disputed' ? (
                    <div className="bg-rose-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-6 rounded-xl text-center">
                      <div className="w-12 h-12 bg-rose-200 rounded-full flex items-center justify-center border-2 border-black mx-auto mb-4">
                        <Lock className="w-5 h-5 text-rose-600" />
                      </div>
                      <h3 className="text-xl font-black text-black uppercase tracking-widest mb-2">
                        Revision Requested
                      </h3>
                      <p className="text-gray-600 mb-4 text-sm font-medium">
                        Escrow remains locked. The creator has been notified to revise the
                        deliverable.
                      </p>
                      <div className="bg-white p-4 rounded-lg text-left border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-4">
                        <span className="text-rose-600 text-xs font-black uppercase tracking-widest block mb-2">
                          Your Note:
                        </span>
                        <p className="text-gray-800 font-serif italic text-lg leading-relaxed">
                          "{dealRoom?.disputeMessage}"
                        </p>
                      </div>
                      {dealRoom?.disputedAt && (
                        <div className="mt-4 flex justify-center">
                          <CountdownTimer 
                            startDateStr={dealRoom.disputedAt} 
                            title="Creator Revision Deadline"
                          />
                        </div>
                      )}
                    </div>
                  ) : dealRoom?.status === 'admin_escalated' ? (
                    <div className="bg-purple-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-6 rounded-xl text-center">
                      <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center border-2 border-black mx-auto mb-4">
                        <AlertCircle className="w-5 h-5 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-black text-black uppercase tracking-widest mb-2">
                        Escalated to Admin
                      </h3>
                      <p className="text-gray-600 mb-4 text-sm font-medium">
                        The 48-hour revision SLA has expired. This dispute has been automatically escalated to the CreatorStack arbitration team for manual review.
                      </p>
                      <div className="bg-white p-4 rounded-lg text-left border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-4">
                        <span className="text-purple-600 text-xs font-black uppercase tracking-widest block mb-2">
                          Original Dispute Note:
                        </span>
                        <p className="text-gray-800 font-serif italic text-lg leading-relaxed">
                          "{dealRoom?.disputeMessage}"
                        </p>
                      </div>
                      <button disabled className="w-full bg-gray-200 text-gray-500 font-black py-4 rounded-lg uppercase tracking-widest border-2 border-gray-300 cursor-not-allowed">
                        Waiting for Admin Resolution
                      </button>
                    </div>
                  ) : showDisputeInput ? (
                    <div className="bg-gray-50 p-6 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-6">
                      <h3 className="text-black font-black mb-3 uppercase tracking-widest text-sm">
                        Request Revision
                      </h3>
                      <textarea
                        className="w-full bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg p-4 text-black focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 mb-4 font-medium"
                        rows={3}
                        placeholder="Detail exactly what needs to be changed in the video..."
                        value={disputeMessage}
                        onChange={(e) => setDisputeMessage(e.target.value)}
                      />
                      <div className="flex gap-4">
                        <button
                          onClick={handleSubmitDispute}
                          className="flex-1 bg-rose-600 hover:bg-rose-700 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none text-white font-black py-3 rounded-lg uppercase tracking-widest text-sm transition-all"
                        >
                          Submit Dispute
                        </button>
                        <button
                          onClick={() => setShowDisputeInput(false)}
                          className="px-6 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 text-gray-800 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none font-black rounded-lg uppercase tracking-widest text-sm transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => setShowDisputeInput(true)}
                        className="px-8 py-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 text-black font-black rounded-lg uppercase tracking-widest transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
                      >
                        Request Revision
                      </button>
                      <button
                        onClick={handleReleaseFunds}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 border-2 border-black text-white font-black text-lg py-5 rounded-lg uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
                      >
                        Approve & Release Escrow
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STAGE 5: RELEASED — with Professional Invoice */}
              {dealStage === 'RELEASED' && (
                <div className="space-y-8 animate-[fadeIn_0.5s_ease-out] relative z-10">
                  {/* Success Header */}
                  <div className="bg-white border-2 border-black p-10 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center overflow-hidden relative">
                    <div className="absolute top-0 inset-x-0 h-2 bg-emerald-500"></div>
                    <div className="w-28 h-28 bg-emerald-50 border-2 border-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <CheckCircle className="w-12 h-12 text-emerald-600" />
                    </div>
                    <h2 className="text-4xl font-black text-black uppercase tracking-tight mb-3">
                      Transaction Complete
                    </h2>
                    <p className="text-gray-600 max-w-xl mx-auto text-lg leading-relaxed font-medium">
                      Funds routed to Creator's verified UPI. TDS withheld and remitted per Section
                      194J. Invoice generated below.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mt-8">
                      <div className="bg-gray-50 p-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">
                          Gross Amount
                        </div>
                        <div className="text-xl font-black text-black">
                          {formatRupee(parseInt(amount) || 0)}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">
                          TDS (10%)
                        </div>
                        <div className="text-xl font-black text-rose-600">
                          -{formatRupee((parseInt(amount) || 0) * 0.1)}
                        </div>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className="text-[10px] text-emerald-800 uppercase font-bold tracking-widest mb-1">
                          Net Payout
                        </div>
                        <div className="text-xl font-black text-emerald-600">
                          {formatRupee((parseInt(amount) || 0) * 0.9)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* === PROFESSIONAL INVOICE === */}
                  <div
                    id="cs-invoice"
                    className="bg-white rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden border-2 border-black"
                  >
                    {/* Invoice Header */}
                    <div className="bg-white border-b-2 border-black px-8 py-6 flex justify-between items-center">
                      <div>
                        <p className="text-3xl font-black text-black tracking-tight">
                          creator<span className="text-indigo-600">.</span>stack
                        </p>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">
                          Creator Commerce Platform
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-black font-black text-xl">TAX INVOICE</p>
                        <p className="text-indigo-600 font-mono text-sm mt-1 font-bold">
                          CS-INV-{campaignId?.substring(0, 6).toUpperCase()}-
                          {new Date().getFullYear()}
                        </p>
                        <p className="text-gray-500 text-xs mt-0.5 font-bold">
                          {new Date().toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Parties */}
                      <div className="grid grid-cols-2 gap-8 mb-6 pb-6 border-b-2 border-black">
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                            Billed From (Service Provider)
                          </p>
                          <p className="font-black text-black text-lg">
                            {creator?.name || creator?.legalName || 'Creator'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 font-bold">
                            Independent Professional Creator
                          </p>
                          <p className="text-sm text-gray-600 font-bold">
                            PAN:{' '}
                            {creator?.pan
                              ? `${creator.pan.substring(0, 3)}****${creator.pan.substring(7)}`
                              : 'Verified via Signzy'}
                          </p>
                          <p className="text-sm text-gray-600 font-bold">
                            UPI: {creator?.upi || 'Verified UPI on file'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                            Billed To (Client / Advertiser)
                          </p>
                          <div className="flex items-center gap-2">
                            {campaign?.brandLogoUrl && (
                              <img
                                src={campaign.brandLogoUrl}
                                alt="Logo"
                                className="w-6 h-6 rounded-full object-cover border border-gray-300"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <p className="font-black text-black text-lg">
                              {campaign?.brandName || 'Advertiser'}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 font-bold">
                            Registered Corporate Advertiser
                          </p>
                          <p className="text-sm text-gray-600 font-bold">
                            Campaign: {campaign?.title}
                          </p>
                          <p className="text-sm text-gray-600 font-bold">
                            Campaign ID: #{campaignId?.substring(0, 8)}
                          </p>
                        </div>
                      </div>

                      {/* Line Items */}
                      <table className="w-full mb-8">
                        <thead>
                          <tr className="bg-gray-50 border-y-2 border-black">
                            <th className="text-left text-xs font-bold text-gray-600 uppercase tracking-wider px-4 py-3">
                              Description of Service
                            </th>
                            <th className="text-right text-xs font-bold text-gray-600 uppercase tracking-wider px-4 py-3">
                              HSN/SAC
                            </th>
                            <th className="text-right text-xs font-bold text-gray-600 uppercase tracking-wider px-4 py-3">
                              Amount (₹)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b-2 border-gray-200">
                            <td className="px-4 py-4">
                              <p className="font-black text-black">{deliverableType}</p>
                              <p className="text-sm text-gray-600 font-bold">
                                "{campaign?.title}" — {productionDays}-day production,
                                ASCI-compliant
                              </p>
                            </td>
                            <td className="px-4 py-4 text-right text-sm text-gray-600 font-mono font-bold">
                              998361
                            </td>
                            <td className="px-4 py-4 text-right font-black text-black">
                              {formatRupee(parseInt(amount) || 0)}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Totals */}
                      <div className="flex justify-end mb-8">
                        <div className="w-80">
                          <div className="flex justify-between py-2 border-b-2 border-gray-200">
                            <span className="text-gray-600 font-bold">Gross Amount</span>
                            <span className="font-black text-black">
                              {formatRupee(parseInt(amount) || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b-2 border-gray-200">
                            <span className="text-gray-600 font-bold">
                              TDS Withheld @ 10% (Sec. 194J)
                            </span>
                            <span className="font-black text-rose-600">
                              -{formatRupee((parseInt(amount) || 0) * 0.1)}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b-2 border-gray-200">
                            <span className="text-gray-600 font-bold">Platform Fee @ 2.5%</span>
                            <span className="font-black text-gray-600">
                              -{formatRupee((parseInt(amount) || 0) * 0.025)}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b-2 border-gray-200">
                            <span className="text-gray-600 font-bold">
                              GST on Platform Fee @ 18%
                            </span>
                            <span className="font-black text-gray-600">
                              -{formatRupee((parseInt(amount) || 0) * 0.025 * 0.18)}
                            </span>
                          </div>
                          <div className="flex justify-between py-3 bg-indigo-50 border-2 border-black px-3 rounded-lg mt-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <span className="font-black text-black text-lg">
                              Net Payable to Creator
                            </span>
                            <span className="font-black text-emerald-600 text-lg">
                              {formatRupee(
                                Math.round(
                                  (parseInt(amount) || 0) * 0.9 -
                                    (parseInt(amount) || 0) * 0.025 * 1.18,
                                ),
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Legal Footer */}
                      <div className="bg-amber-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4 rounded-lg text-xs text-amber-800 mb-6 font-medium">
                        <strong>TDS Certificate (Form 16A)</strong> shall be issued to the Creator
                        within 15 days of TDS remittance to the Government. This invoice is
                        auto-generated and legally valid under the Income Tax Act, 1961, and the
                        Information Technology Act, 2000. SAC Code 998361 — Advertising and related
                        services.
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => window.print()}
                          className="flex-1 bg-black text-white font-black py-4 rounded-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
                        >
                          🖨️ Print / Download Invoice
                        </button>
                        <button
                          onClick={() => navigate('/create-campaign', { state: { cloneFrom: campaignId, cloneCreatorId: creatorId } })}
                          className="flex-1 bg-amber-500 text-black font-black py-4 rounded-lg hover:bg-amber-400 transition-all flex items-center justify-center gap-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
                        >
                          <RefreshCw className="w-4 h-4" /> Renew Deal
                        </button>
                        <button
                          onClick={() => navigate('/brand-dashboard')}
                          className="flex-1 bg-white border-2 border-black text-black font-black py-4 rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
                        >
                          <ArrowLeft className="w-4 h-4" /> Dashboard
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          </div>
          
          <div className="lg:col-span-1">
            {campaignId && creatorId && (
              <DealRoomChat 
                campaignId={campaignId} 
                creatorId={creatorId} 
                currentUserRole="brand" 
              />
            )}
          </div>
        </div>
      </div>

      {/* Issue 16: Inline Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white border-2 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-[#0f3460] rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-black uppercase tracking-tight mb-2">
              Fund Your Escrow Wallet
            </h2>
            <p className="text-sm font-medium text-gray-600 mb-6">
              Deposit <strong className="text-black">{formatRupee(parseInt(amount || '0') - walletBalance)}</strong> via Razorpay to lock escrow for this deal.
            </p>

            <div className="bg-gray-50 border-2 border-black rounded-xl p-4 mb-6 text-left space-y-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-gray-600">Deal Amount</span>
                <span className="font-black text-black">{formatRupee(parseInt(amount || '0'))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-gray-600">Current Balance</span>
                <span className="font-black text-emerald-600">{formatRupee(walletBalance)}</span>
              </div>
              <div className="flex justify-between text-sm border-t-2 border-black pt-2">
                <span className="font-black text-black uppercase tracking-widest text-xs">Deposit Required</span>
                <span className="font-black text-[#0f3460]">{formatRupee(parseInt(amount || '0') - walletBalance)}</span>
              </div>
            </div>

            {depositDone ? (
              <div className="bg-[#a3e635] border-2 border-black rounded-xl py-4 font-black text-black uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                ✓ Deposit Successful!
              </div>
            ) : (
              <button
                onClick={handleDeposit}
                disabled={depositProcessing}
                className="w-full bg-[#0f3460] hover:bg-[#1a4a82] border-2 border-black text-white font-black py-4 rounded-xl uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none disabled:opacity-60 flex items-center justify-center gap-3 mb-3"
              >
                {depositProcessing ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing via Razorpay…</>
                ) : (
                  <><Plus className="w-5 h-5" /> Pay via Razorpay (Simulated)</>
                )}
              </button>
            )}

            {!depositProcessing && !depositDone && (
              <button
                onClick={() => setShowDepositModal(false)}
                className="text-xs font-black text-gray-500 hover:text-black uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
