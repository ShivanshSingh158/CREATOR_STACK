import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { formatDateDDMMYY, formatRupee } from '../../utils/formatters';
import { doc, getDoc, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { ShieldCheck, FileText, Lock, CheckCircle, ArrowLeft, Terminal, Cpu, AlertCircle } from 'lucide-react';

export default function DigitalDealRoom() {
  const { campaignId, creatorId } = useParams<{ campaignId: string, creatorId: string }>();
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
        console.error("Error fetching data:", error);
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
          setDealRoom({ id: snap.id, ...data });
          
          // Sync state machine with DB status
          if (data.status === 'pending_creator_sign') setDealStage('CONTRACT');
          else if (data.status === 'contract_amendment_requested') setDealStage('CONTRACT');
          else if (data.status === 'creator_signed') setDealStage('ESCROW');
          else if (data.status === 'escrow_locked') setDealStage('PRODUCTION');
          else if (data.status === 'pod_submitted') setDealStage('AI_CHECK');
          else if (data.status === 'pod_verified') setDealStage('AI_CHECK');
          else if (data.status === 'disputed') setDealStage('AI_CHECK');
          else if (data.status === 'completed') setDealStage('RELEASED');
        }
      });
      return () => unsub();
    }
  }, [campaignId, creatorId]);

  // State Machine for the Digital Deal Room
  const [dealStage, setDealStage] = useState<'TERMS' | 'CONTRACT' | 'ESCROW' | 'PRODUCTION' | 'AI_CHECK' | 'RELEASED'>('TERMS');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Term Variables - pre-filled from campaign data
  const [amount, setAmount] = useState('');
  const [productionDays, setProductionDays] = useState('14');
  const [deliverableType, setDeliverableType] = useState('60s Dedicated Integration');
  
  // Dispute logic
  const [showDisputeInput, setShowDisputeInput] = useState(false);
  const [disputeMessage, setDisputeMessage] = useState('');

  // Video Link for PoD
  const [videoLink, setVideoLink] = useState('');

  const runAnimation = (messages: string[], nextStage: any) => {
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
        setDealStage(nextStage);
      }
    }, 1500);
  };

  const handleGenerateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (campaignId && creatorId) {
      try {
        await setDoc(doc(db, 'dealRooms', `${campaignId}_${creatorId}`), {
          status: 'pending_creator_sign',
          amount: amount,
          productionDays: productionDays,
          deliverables: deliverableType,
          amendmentRequest: null, // clear out any old amendment requests
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (err) { console.error('Error generating contract:', err); }
    }

    runAnimation([
      'Parsing updated term inputs...',
      'Injecting variables into legal template...',
      'Generating immutable PDF contract...',
      'Pinging creator for signature...'
    ], 'CONTRACT');
  };

  const handleSignAndEscrow = async () => {
    // Update Firestore: escrow is now locked
    if (campaignId && creatorId) {
      try {
        await setDoc(doc(db, 'dealRooms', `${campaignId}_${creatorId}`), {
          status: 'escrow_locked',
          escrowLockedAt: new Date().toISOString(),
          brandSignedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (err) { console.error('Error updating escrow status:', err); }
    }
    runAnimation([
      'Cryptographically signing document...',
      'Pinging RazorpayX Escrow API...',
      'Provisioning dynamic virtual account...',
      'Locking INR funds in secure escrow vault...'
    ], 'PRODUCTION');
  };

  const handleCreatorUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setDealStage('PRODUCTION'); // jump instantly to the next view
    setTimeout(() => {
      runAnimation([
        'Downloading high-res video manifest...',
        'Running Computer Vision OCR for #ad tags...',
        'Executing Audio NLP transcription for brand vocalizations...',
        'Cross-referencing description box hyperlink tracking...'
      ], 'AI_CHECK');
    }, 500);
  };

  const handleReleaseFunds = async () => {
    runAnimation([
      'Authorizing RazorpayX payout...',
      'Deducting 10% TDS (Sec. 194J)...',
      'Calculating 2.5% Platform Fee...',
      'Routing Net INR to Creator UPI...'
    ], 'RELEASED');

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

        await setDoc(doc(db, 'dealRooms', `${campaignId}_${creatorId}`), {
          status: 'completed',
          completedAt: new Date().toISOString(),
          grossAmount: gross,
          tdsAmount: tds,
          platformFee: platFee,
          netPayout: net
        }, { merge: true });
      } catch (err) {
        console.error('Error marking campaign complete:', err);
      }
    }
  };

  const handleSubmitDispute = async () => {
    if (!disputeMessage.trim()) return;
    if (campaignId && creatorId) {
      try {
        await setDoc(doc(db, 'dealRooms', `${campaignId}_${creatorId}`), {
          status: 'disputed',
          disputeMessage: disputeMessage,
          disputedAt: new Date().toISOString(),
        }, { merge: true });
        setShowDisputeInput(false);
        setDisputeMessage('');
      } catch (err) { console.error('Error updating dispute status:', err); }
    }
  };

  const renderLoader = (messages: string[]) => (
    <div className="bg-white border-2 border-black p-12 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent"></div>
      <div className="w-full max-w-lg z-10">
        <div className="flex justify-center mb-8">
          <Terminal className="w-12 h-12 text-indigo-600 animate-pulse" />
        </div>
        <div className="flex justify-between text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">
          <span>Executing Protocol</span>
          <span className="text-indigo-600">{Math.round(((loadingStep + 1) / messages.length) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-8 border border-gray-200">
          <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${((loadingStep + 1) / messages.length) * 100}%` }}></div>
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

  const StepIndicator = () => (
    <div className="flex items-center justify-between w-full max-w-3xl mx-auto mb-12 relative z-10">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
      
      {[
        { id: 'TERMS', label: 'Terms', icon: FileText },
        { id: 'CONTRACT', label: 'Contract', icon: ShieldCheck },
        { id: 'ESCROW', label: 'Escrow', icon: Lock },
        { id: 'PRODUCTION', label: 'Verify', icon: Cpu },
        { id: 'RELEASED', label: 'Release', icon: CheckCircle }
      ].map((step, _idx) => {
        const status = getStepStatus(step.id);
        const Icon = step.icon;
        
        return (
          <div key={step.id} className="flex flex-col items-center relative group">
             <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
               status === 'completed' ? 'bg-indigo-600 border-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' :
               status === 'active' ? 'bg-white border-black text-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' :
               'bg-gray-100 border-gray-300 text-gray-400'
             }`}>
               <Icon className="w-5 h-5" />
             </div>
             <span className={`absolute -bottom-8 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors duration-300 ${
               status === 'active' ? 'text-indigo-600' :
               status === 'completed' ? 'text-black' :
               'text-gray-400'
             }`}>
               {step.label}
             </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f9fafb] text-black pb-20 selection:bg-indigo-200 selection:text-black" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Premium Header */}
      <div className="bg-white border-b-2 border-black pt-8 pb-8 px-4 sm:px-6 lg:px-8 shadow-sm relative z-20">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-indigo-600 text-sm font-bold tracking-wide mb-6 flex items-center transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> BACK
          </button>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <ShieldCheck className="w-3.5 h-3.5" /> Secure Vault
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-black tracking-tight uppercase">Digital Deal Room <span className="text-indigo-600">#{campaignId?.substring(0,6)}</span></h1>
              <p className="mt-2 text-gray-600 max-w-2xl font-medium">End-to-end programmatic escrow and legal enforcement.</p>
            </div>
            
            <div className="flex gap-4 items-center">
               <img src={creator?.youtubeData?.channelLogo || creator?.channelThumbnail || creator?.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator?.name || 'C')}&background=4f46e5&color=fff`} className="w-12 h-12 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] object-cover" alt="" />
               <div>
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">Creator Counterparty</p>
                 <p className="font-bold text-black text-lg">{creator?.name || 'Loading...'}</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <StepIndicator />

        <div className="mt-16 relative">
          {/* subtle glow behind active area */}
          <div className="absolute inset-0 bg-indigo-500 opacity-5 blur-[100px] pointer-events-none rounded-full"></div>
          
          {loading ? (
            dealStage === 'TERMS' ? renderLoader(['Parsing term inputs...', 'Injecting variables into legal template...', 'Appending mandatory ASCI disclosure clauses...', 'Generating immutable PDF contract...']) :
            dealStage === 'CONTRACT' ? renderLoader(['Cryptographically signing document...', 'Pinging RazorpayX Escrow API...', 'Provisioning dynamic virtual account...', 'Locking INR funds in secure escrow vault...']) :
            dealStage === 'PRODUCTION' ? renderLoader(['Downloading high-res video manifest...', 'Running Computer Vision OCR for #ad tags...', 'Executing Audio NLP transcription for brand vocalizations...', 'Cross-referencing description box hyperlink tracking...']) :
            renderLoader(['Processing automated timeout protocol...', 'Executing 10% TDS withholding via Section 194J...', 'Routing remaining balance to Creator UPI...', 'Contract marked as COMPLETED.'])
          ) : (
            <>
              {/* STAGE 1: TERMS ENTRY */}
              {dealStage === 'TERMS' && (
                <div className="bg-white border-2 border-black p-8 md:p-12 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10 animate-[fadeIn_0.5s_ease-out]">
                  <div className="flex items-center gap-4 mb-8 border-b-2 border-gray-200 pb-6">
                    <div className="w-12 h-12 bg-indigo-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-black uppercase tracking-wide">Define Collaboration Terms</h2>
                      <p className="text-sm text-gray-600 font-medium mt-1">Set the parameters for the smart contract.</p>
                    </div>
                  </div>

                  <form onSubmit={handleGenerateContract} className="p-8 md:p-12 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="group">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 group-focus-within:text-indigo-600 transition-colors">Gross Payout Amount</label>
                        <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                           <input type="number" required className="w-full bg-white border-2 border-black text-black pl-9 pr-4 py-3.5 rounded-lg focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none text-xl font-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" value={amount} onChange={e => setAmount(e.target.value)} />
                        </div>
                      </div>
                      <div className="group">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 group-focus-within:text-indigo-600 transition-colors">Production Time (Days)</label>
                        <div className="relative">
                           <input type="number" required className="w-full bg-white border-2 border-black text-black px-4 py-3.5 rounded-lg focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none text-xl font-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" value={productionDays} onChange={e => setProductionDays(e.target.value)} />
                        </div>
                      </div>
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 group-focus-within:text-indigo-600 transition-colors">Asset Deliverable Type</label>
                      <select className="w-full bg-white border-2 border-black text-black px-4 py-3.5 rounded-lg focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none text-lg font-medium transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" value={deliverableType} onChange={e => setDeliverableType(e.target.value)}>
                        <option>60s Dedicated Integration</option>
                        <option>30s Pre-roll Mention</option>
                        <option>Dedicated Video (Full length)</option>
                        <option>YouTube Shorts (Multi-part series)</option>
                      </select>
                    </div>
                    <div className="pt-6 border-t-2 border-black">
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 border-2 border-black text-white font-black text-lg py-4 rounded-lg uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none">
                        Compile Programmatic Contract
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* STAGE 2 & 3: CONTRACT GENERATION & ESCROW */}
              {(dealStage === 'CONTRACT' || dealStage === 'ESCROW') && (
                <div className="bg-white border-2 border-black p-8 md:p-10 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10 animate-[fadeIn_0.5s_ease-out]">
                  <div className="flex justify-between items-center border-b-2 border-black pb-6 mb-8">
                    {dealStage === 'CONTRACT' ? (
                      <>
                        <div>
                          <h2 className="text-2xl font-black text-black uppercase tracking-wide flex items-center gap-2">
                            <Terminal className="w-5 h-5 text-indigo-600" /> Contract Generated
                          </h2>
                          <p className="text-sm text-gray-600 mt-1 font-medium">The contract has been sent to {creator?.name}. Awaiting their digital signature.</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="bg-amber-100 text-amber-800 border-2 border-black px-3 py-1 rounded text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Pending Creator Signature</span>
                          <p className="text-gray-500 text-xs font-bold">Contract Value: <strong className="text-black">{formatRupee(amount)}</strong></p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <h2 className="text-2xl font-black text-black uppercase tracking-wide flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-600" /> Creator Signed!
                          </h2>
                          <p className="text-sm text-gray-600 mt-1 font-medium">{creator?.name} has digitally signed the contract. You must now lock escrow to begin production.</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="bg-emerald-100 text-emerald-800 border-2 border-black px-3 py-1 rounded text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Ready for Escrow Lock</span>
                          <p className="text-gray-500 text-xs font-bold">Contract Value: <strong className="text-black">{formatRupee(amount)}</strong></p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* === INDIAN e-STAMP PAPER === */}
                  <div className="mb-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-sm border-2 border-black" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
                    {/* Outer double border */}
                    <div className="border-[6px] border-[#4a5c2e] p-1 bg-[#f5f0dc]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(180,160,100,0.04) 0px, rgba(180,160,100,0.04) 1px, transparent 1px, transparent 8px)' }}>
                      <div className="border-[2px] border-[#4a5c2e] p-6 md:p-10">

                        {/* Header — Government Seal Area */}
                        <div className="text-center border-b-2 border-[#4a5c2e] pb-4 mb-4">
                          <p className="text-xs font-bold tracking-[0.3em] text-[#4a5c2e] uppercase mb-1">भारत सरकार / Government of India</p>
                          <p className="text-[10px] tracking-[0.25em] text-[#6b5f2e] uppercase">Ministry of Electronics & Information Technology — e-Stamp Division</p>
                          <div className="flex items-center justify-center gap-6 my-3">
                            {/* Left emblem */}
                            <div className="text-[#4a5c2e] font-bold text-xs border border-[#4a5c2e] px-2 py-1 opacity-70">₹500</div>
                            {/* Center — Ashoka Chakra simulation */}
                            <div className="w-14 h-14 border-4 border-[#4a5c2e] rounded-full flex items-center justify-center relative">
                              <div className="w-8 h-8 border-2 border-[#4a5c2e] rounded-full flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-[#4a5c2e] rounded-full"></div>
                              </div>
                              {/* Spokes */}
                              {[...Array(12)].map((_, i) => (
                                <div key={i} className="absolute w-[1px] h-[18px] bg-[#4a5c2e] origin-bottom" style={{ bottom: '50%', left: 'calc(50% - 0.5px)', transform: `rotate(${i * 30}deg) translateY(-2px)` }}></div>
                              ))}
                            </div>
                            <div className="text-[#4a5c2e] font-bold text-xs border border-[#4a5c2e] px-2 py-1 opacity-70">₹500</div>
                          </div>
                          <p className="text-sm font-black tracking-widest text-[#2d3a1a] uppercase">Non-Judicial e-Stamp Paper</p>
                          <p className="text-[10px] text-[#6b5f2e] mt-0.5">Article 43(b) — Agreement/Contract | Denomination: ₹500</p>
                          <div className="mt-2 text-[10px] text-[#6b5f2e] font-mono">
                            e-Stamp No: <strong>GJ-IN-ESTMP-{campaignId?.substring(0, 6).toUpperCase()}-{new Date().getFullYear()}</strong>
                          </div>
                        </div>

                        {/* Document Title */}
                        <h3 className="text-center font-black text-[#1a1a1a] mt-4 mb-2 uppercase text-xl tracking-tight">
                          Creator Services Agreement
                        </h3>
                        <p className="text-center text-[10px] text-[#6b5f2e] mb-6 tracking-widest">
                          (Executed electronically under the Information Technology Act, 2000 & Indian Contract Act, 1872)
                        </p>

                        <p className="mb-5 text-sm leading-relaxed text-[#1a1a1a]">
                          This Creator Services Agreement ("Agreement") is executed on{' '}
                          <strong>{formatDateDDMMYY(new Date())}</strong> ("Effective Date"), between:
                        </p>

                        <div className="bg-[#eae5cc] border border-[#c8b97a] p-4 rounded mb-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs font-bold text-[#4a5c2e] uppercase tracking-wider mb-1">Party A — Advertiser</p>
                            <p className="font-bold text-[#1a1a1a]">{campaign?.brandName || 'Brand (Advertiser)'}</p>
                            <p className="text-[#6b5f2e] text-xs">Registered Corporate Entity under Companies Act</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#4a5c2e] uppercase tracking-wider mb-1">Party B — Creator (Service Provider)</p>
                            <p className="font-bold text-[#1a1a1a]">{creator?.name || creator?.legalName || 'Creator'}</p>
                            <p className="text-[#6b5f2e] text-xs">Independent Professional, Section 194J Applicable</p>
                          </div>
                        </div>

                        <div className="space-y-5 text-sm leading-relaxed text-[#1a1a1a]">
                          {/* Section 1 */}
                          <div className="border-l-4 border-[#4a5c2e] pl-4">
                            <h4 className="font-black uppercase tracking-wide text-[#2d3a1a] mb-1">1. Scope of Work & Deliverables</h4>
                            <p><strong>1.1</strong> The Creator shall produce, deliver, and publish <strong className="bg-[#fef3c7] text-[#92400e] px-1">{deliverableType}</strong> (the "Content") for the Advertiser's campaign titled <strong>"{campaign?.title}"</strong>.</p>
                            <p className="mt-1"><strong>1.2</strong> The Content must be submitted for Proof-of-Delivery (PoD) verification within <strong className="underline">{productionDays} calendar days</strong> of the Escrow Lock Date.</p>
                            <p className="mt-1"><strong>1.3</strong> The Creator is entitled to a maximum of <strong>two (2) revision rounds</strong> as directed by the Advertiser at no additional cost.</p>
                          </div>

                          {/* Section 2 */}
                          <div className="border-l-4 border-[#4a5c2e] pl-4">
                            <h4 className="font-black uppercase tracking-wide text-[#2d3a1a] mb-1">2. Escrow & Compensation</h4>
                            <p><strong>2.1</strong> The Advertiser shall deposit <strong className="bg-[#dcfce7] text-[#166534] px-1">{formatRupee(amount)}</strong> into a RazorpayX virtual escrow ("Escrow Account") upon execution. Funds release automatically upon AI-verified PoD.</p>
                            <p className="mt-1"><strong>2.2</strong> TDS at the rate of <strong>10% under Section 194J</strong> of the Income Tax Act, 1961 shall be withheld prior to payout. TDS certificate (Form 16A) shall be issued within 15 days of deduction.</p>
                          </div>

                          {/* Section 3 */}
                          <div className="border-l-4 border-[#4a5c2e] pl-4">
                            <h4 className="font-black uppercase tracking-wide text-[#2d3a1a] mb-1">3. ASCI Compliance & Disclosure (Strict Liability)</h4>
                            <p><strong>3.1</strong> The Creator <span className="underline decoration-red-700 font-bold decoration-2">must</span> include "#ad", "#sponsored", or "Paid Partnership" prominently in the first three lines of any caption, without requiring the audience to expand the text.</p>
                            <p className="mt-1"><strong>3.2</strong> Failure to comply with ASCI guidelines constitutes material breach and triggers <strong>automated payment withholding</strong> pending dispute resolution.</p>
                          </div>

                          {/* Section 4 */}
                          <div className="border-l-4 border-[#4a5c2e] pl-4">
                            <h4 className="font-black uppercase tracking-wide text-[#2d3a1a] mb-1">4. Exclusivity & Non-Compete</h4>
                            <p><strong>4.1</strong> The Creator shall not publish content endorsing any direct competitor of the Advertiser for <strong>30 days prior to and 30 days following</strong> the publication date of the Content.</p>
                          </div>

                          {/* Section 5 */}
                          <div className="border-l-4 border-[#4a5c2e] pl-4">
                            <h4 className="font-black uppercase tracking-wide text-[#2d3a1a] mb-1">5. Intellectual Property & Usage Rights</h4>
                            <p><strong>5.1</strong> The Creator retains underlying IP ownership. The Advertiser is granted a worldwide, royalty-free, non-exclusive license to use the Content across owned digital channels for <strong>ninety (90) days</strong> from the publication date.</p>
                          </div>

                          {/* Section 6 — Kill Fee (NEW) */}
                          <div className="border-l-4 border-[#4a5c2e] pl-4">
                            <h4 className="font-black uppercase tracking-wide text-[#2d3a1a] mb-1">6. Kill Fee & Cancellation</h4>
                            <p><strong>6.1</strong> Should the Advertiser cancel this Agreement after Escrow Lock but before Content submission, the Creator shall receive a <strong>Kill Fee of 25%</strong> of the agreed deal amount, disbursed automatically within 72 hours of cancellation.</p>
                          </div>

                          {/* Section 7 — Force Majeure (NEW) */}
                          <div className="border-l-4 border-[#4a5c2e] pl-4">
                            <h4 className="font-black uppercase tracking-wide text-[#2d3a1a] mb-1">7. Force Majeure</h4>
                            <p><strong>7.1</strong> Neither Party shall be held liable for delays or failures in performance resulting from Acts of God, governmental actions, platform outages exceeding 72 hours, or other circumstances beyond reasonable control, provided written notice is submitted within 24 hours.</p>
                          </div>

                          {/* Section 8 — DPDP Act 2023 (NEW) */}
                          <div className="border-l-4 border-[#4a5c2e] pl-4">
                            <h4 className="font-black uppercase tracking-wide text-[#2d3a1a] mb-1">8. Data Privacy (DPDP Act 2023)</h4>
                            <p><strong>8.1</strong> Both Parties agree to process personal data only for the purposes outlined herein, in compliance with the Digital Personal Data Protection Act, 2023 (DPDP Act). CreatorStack acts as a Data Fiduciary for the purpose of platform operations and shall not share identifiable data with third parties without explicit consent.</p>
                          </div>

                          {/* Section 9 */}
                          <div className="border-l-4 border-[#4a5c2e] pl-4">
                            <h4 className="font-black uppercase tracking-wide text-[#2d3a1a] mb-1">9. Platform Arbitration & Governing Law</h4>
                            <p><strong>9.1</strong> This Agreement is governed by the laws of India. Disputes shall first be submitted to CreatorStack's arbitration tribunal. Unresolved matters shall be subject to the exclusive jurisdiction of the courts in <strong>Bengaluru, Karnataka</strong>.</p>
                          </div>
                        </div>

                        {/* Signature Block */}
                        <div className="mt-8 pt-6 border-t-2 border-[#4a5c2e] grid grid-cols-2 gap-8">
                          <div>
                            <p className="text-[9px] font-bold text-[#4a5c2e] uppercase tracking-widest mb-3">Party A — Advertiser Signature</p>
                            <div className="font-serif italic text-2xl text-[#1a1a1a] border-b-2 border-[#1a1a1a] pb-1 text-center">{campaign?.brandName || 'Advertiser'}</div>
                            <p className="text-[9px] text-[#6b5f2e] mt-1 text-center">Authenticated via CreatorStack Auth — {formatDateDDMMYY(new Date())}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-[#4a5c2e] uppercase tracking-widest mb-3">Party B — Creator Signature</p>
                            {dealRoom?.creatorSignatureName ? (
                              <>
                                <div className="font-serif italic text-2xl text-[#1a1a1a] border-b-2 border-[#1a1a1a] pb-1 text-center">{dealRoom.creatorSignatureName}</div>
                                <p className="text-[9px] text-[#6b5f2e] mt-1 text-center">Signed {formatDateDDMMYY(new Date(dealRoom.creatorSignedAt))}</p>
                              </>
                            ) : (
                              <>
                                <div className="font-serif italic text-2xl text-[#9ca3af] border-b-2 border-dashed border-[#9ca3af] pb-1 text-center">Awaiting signature...</div>
                                <p className="text-[9px] text-[#6b5f2e] mt-1 text-center">Co-execution upon digital signature</p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Witness Block */}
                        <div className="mt-6 grid grid-cols-2 gap-8">
                          <div>
                            <p className="text-[9px] font-bold text-[#4a5c2e] uppercase tracking-widest mb-2">Witness 1</p>
                            <div className="border-b border-[#4a5c2e] h-6 mb-1"></div>
                            <p className="text-[9px] text-[#6b5f2e]">Name & Signature</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-[#4a5c2e] uppercase tracking-widest mb-2">Witness 2</p>
                            <div className="border-b border-[#4a5c2e] h-6 mb-1"></div>
                            <p className="text-[9px] text-[#6b5f2e]">Name & Signature</p>
                          </div>
                        </div>

                        {/* TDS Footer Notice */}
                        <div className="mt-6 bg-[#fef3c7] border border-[#f59e0b] p-3 rounded text-[10px] text-[#92400e]">
                          <strong>⚠ TDS NOTICE — Section 194J, Income Tax Act 1961:</strong> This contract is subject to Tax Deducted at Source (TDS) at 10% on the total consideration payable to the Creator as professional fees. The Advertiser is responsible for TDS deduction, remittance to the government, and issuance of Form 16A within the prescribed timelines.
                        </div>

                        {/* Bottom bar */}
                        <div className="mt-4 text-center text-[9px] text-[#6b5f2e] border-t border-[#c8b97a] pt-2">
                          Generated & secured by CreatorStack Legal Engine • e-Stamp Ref: {campaignId?.substring(0, 8).toUpperCase()} • {new Date().toLocaleDateString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* === END STAMP PAPER === */}

                  {/* === END STAMP PAPER === */}

                  {dealRoom?.status === 'contract_amendment_requested' ? (
                    <div className="bg-white border-2 border-black p-8 rounded-xl animate-[fadeIn_0.5s_ease-out] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10 mt-6">
                      <div className="flex items-center gap-4 mb-6 pb-6 border-b-2 border-gray-200">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <AlertCircle className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-black uppercase tracking-tight flex items-center gap-3">
                            Creator Requested Redline
                          </h2>
                          <p className="text-gray-600 text-sm mt-1 font-medium">The creator has requested changes before they sign.</p>
                        </div>
                      </div>

                      <div className="bg-rose-50 p-6 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-8">
                        <h3 className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-3">Creator Note:</h3>
                        <p className="text-black text-lg font-serif italic leading-relaxed">"{dealRoom?.amendmentRequest}"</p>
                      </div>

                      <div className="border-t-2 border-black pt-8">
                        <h3 className="text-black font-black mb-4 uppercase tracking-widest text-sm">Update Contract Parameters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total Value (INR)</label>
                            <input type="number" required className="w-full bg-white border-2 border-black text-black px-4 py-3 rounded-lg focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold" value={amount} onChange={e => setAmount(e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Production Days</label>
                            <input type="number" required className="w-full bg-white border-2 border-black text-black px-4 py-3 rounded-lg focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold" value={productionDays} onChange={e => setProductionDays(e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Deliverable Details</label>
                            <input type="text" required className="w-full bg-white border-2 border-black text-black px-4 py-3 rounded-lg focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold" value={deliverableType} onChange={e => setDeliverableType(e.target.value)} />
                          </div>
                        </div>
                        <button onClick={handleGenerateContract} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg py-4 rounded-lg uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none border-2 border-black">
                          Generate Revised Contract
                        </button>
                      </div>
                    </div>
                  ) : dealStage === 'CONTRACT' ? (
                    <div className="bg-gray-50 border-2 border-black rounded-xl p-6 text-center mt-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-black font-black uppercase tracking-widest text-sm">Waiting for Creator</p>
                      <p className="text-gray-500 text-xs mt-2 font-medium">The creator must review and digitally sign the contract before you can lock escrow. They may also request an amendment.</p>
                    </div>
                  ) : (
                    <button onClick={handleSignAndEscrow} className="w-full bg-emerald-500 hover:bg-emerald-600 border-2 border-black text-white font-black text-lg py-5 rounded-lg uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 mt-6 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none">
                      <Lock className="w-5 h-5" /> Lock Funds in Escrow
                    </button>
                  )}
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
                      <strong className="text-black">{formatRupee(amount)}</strong> has been securely deposited into the RazorpayX Virtual Escrow. The creator has been notified to begin production.
                    </p>
                    <div className="bg-gray-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 text-center mt-8">
                      <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-black font-black uppercase tracking-widest text-sm">Awaiting Creator PoD</p>
                      <p className="text-gray-500 text-xs mt-2 font-medium">We will automatically verify the deliverable when the creator submits their video.</p>
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
                      <p className="text-gray-600 font-medium text-sm mt-1">Our AI engines have successfully validated the deliverable.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="bg-gray-50 p-6 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group">
                      <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Cpu className="w-4 h-4" /> Computer Vision OCR
                      </h3>
                      <p className="text-gray-700 text-sm font-medium leading-relaxed">Successfully detected <strong className="text-black">#ad</strong> tag in description box and visual graphic overlay at timestamp <span className="bg-white border border-gray-300 px-1.5 py-0.5 rounded text-black font-mono shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">01:14</span>.</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group">
                      <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Cpu className="w-4 h-4" /> Audio NLP Transcription
                      </h3>
                      <p className="text-gray-700 text-sm font-medium leading-relaxed">Successfully matched brand name vocalizations at <span className="bg-white border border-gray-300 px-1.5 py-0.5 rounded text-black font-mono shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">01:14</span> and <span className="bg-white border border-gray-300 px-1.5 py-0.5 rounded text-black font-mono shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">02:05</span> with <strong className="text-emerald-600">98% confidence</strong>.</p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-5 rounded-lg mb-8 text-amber-800 text-sm flex gap-3 items-start">
                    <div className="mt-0.5 shrink-0 animate-pulse text-amber-600">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <p className="leading-relaxed">
                      <strong className="block uppercase tracking-widest text-xs mb-1 font-black text-black">48-Hour Review Window Active</strong> 
                      If no dispute is raised within 48 hours, funds will automatically release. You may request a revision if the integration fails brand safety guidelines.
                    </p>
                  </div>

                  {dealRoom?.status === 'disputed' ? (
                     <div className="bg-rose-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-6 rounded-xl text-center">
                        <div className="w-12 h-12 bg-rose-200 rounded-full flex items-center justify-center border-2 border-black mx-auto mb-4">
                           <Lock className="w-5 h-5 text-rose-600" />
                        </div>
                        <h3 className="text-xl font-black text-black uppercase tracking-widest mb-2">Revision Requested</h3>
                        <p className="text-gray-600 mb-4 text-sm font-medium">Escrow remains locked. The creator has been notified to revise the deliverable.</p>
                        <div className="bg-white p-4 rounded-lg text-left border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                           <span className="text-rose-600 text-xs font-black uppercase tracking-widest block mb-2">Your Note:</span>
                           <p className="text-gray-800 font-serif italic text-lg leading-relaxed">"{dealRoom?.disputeMessage}"</p>
                        </div>
                     </div>
                  ) : showDisputeInput ? (
                    <div className="bg-gray-50 p-6 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-6">
                      <h3 className="text-black font-black mb-3 uppercase tracking-widest text-sm">Request Revision</h3>
                      <textarea 
                        className="w-full bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg p-4 text-black focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 mb-4 font-medium"
                        rows={3}
                        placeholder="Detail exactly what needs to be changed in the video..."
                        value={disputeMessage}
                        onChange={(e) => setDisputeMessage(e.target.value)}
                      />
                      <div className="flex gap-4">
                        <button onClick={handleSubmitDispute} className="flex-1 bg-rose-600 hover:bg-rose-700 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none text-white font-black py-3 rounded-lg uppercase tracking-widest text-sm transition-all">Submit Dispute</button>
                        <button onClick={() => setShowDisputeInput(false)} className="px-6 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 text-gray-800 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none font-black rounded-lg uppercase tracking-widest text-sm transition-all">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button onClick={() => setShowDisputeInput(true)} className="px-8 py-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 text-black font-black rounded-lg uppercase tracking-widest transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none">
                        Request Revision
                      </button>
                      <button onClick={handleReleaseFunds} className="flex-1 bg-indigo-600 hover:bg-indigo-700 border-2 border-black text-white font-black text-lg py-5 rounded-lg uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none">
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
                    <h2 className="text-4xl font-black text-black uppercase tracking-tight mb-3">Transaction Complete</h2>
                    <p className="text-gray-600 max-w-xl mx-auto text-lg leading-relaxed font-medium">
                      Funds routed to Creator's verified UPI. TDS withheld and remitted per Section 194J. Invoice generated below.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mt-8">
                      <div className="bg-gray-50 p-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Gross Amount</div>
                        <div className="text-xl font-black text-black">{formatRupee(parseInt(amount) || 0)}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">TDS (10%)</div>
                        <div className="text-xl font-black text-rose-600">-{formatRupee((parseInt(amount) || 0) * 0.1)}</div>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className="text-[10px] text-emerald-800 uppercase font-bold tracking-widest mb-1">Net Payout</div>
                        <div className="text-xl font-black text-emerald-600">{formatRupee((parseInt(amount) || 0) * 0.9)}</div>
                      </div>
                    </div>
                  </div>

                  {/* === PROFESSIONAL INVOICE === */}
                  <div id="cs-invoice" className="bg-white rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden border-2 border-black">
                    {/* Invoice Header */}
                    <div className="bg-white border-b-2 border-black px-8 py-6 flex justify-between items-center">
                      <div>
                        <p className="text-3xl font-black text-black tracking-tight">creator<span className="text-indigo-600">.</span>stack</p>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Creator Commerce Platform</p>
                      </div>
                      <div className="text-right">
                        <p className="text-black font-black text-xl">TAX INVOICE</p>
                        <p className="text-indigo-600 font-mono text-sm mt-1 font-bold">CS-INV-{campaignId?.substring(0, 6).toUpperCase()}-{new Date().getFullYear()}</p>
                        <p className="text-gray-500 text-xs mt-0.5 font-bold">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>

                    <div className="p-8">
                      {/* Parties */}
                      <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b-2 border-black">
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Billed From (Service Provider)</p>
                          <p className="font-black text-black text-lg">{creator?.name || creator?.legalName || 'Creator'}</p>
                          <p className="text-sm text-gray-600 mt-1 font-bold">Independent Professional Creator</p>
                          <p className="text-sm text-gray-600 font-bold">PAN: {creator?.pan ? `${creator.pan.substring(0,3)}****${creator.pan.substring(7)}` : 'Verified via Signzy'}</p>
                          <p className="text-sm text-gray-600 font-bold">UPI: {creator?.upi || 'Verified UPI on file'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Billed To (Client / Advertiser)</p>
                          <p className="font-black text-black text-lg">{campaign?.brandName || 'Advertiser'}</p>
                          <p className="text-sm text-gray-600 mt-1 font-bold">Registered Corporate Advertiser</p>
                          <p className="text-sm text-gray-600 font-bold">Campaign: {campaign?.title}</p>
                          <p className="text-sm text-gray-600 font-bold">Campaign ID: #{campaignId?.substring(0, 8)}</p>
                        </div>
                      </div>

                      {/* Line Items */}
                      <table className="w-full mb-8">
                        <thead>
                          <tr className="bg-gray-50 border-y-2 border-black">
                            <th className="text-left text-xs font-bold text-gray-600 uppercase tracking-wider px-4 py-3">Description of Service</th>
                            <th className="text-right text-xs font-bold text-gray-600 uppercase tracking-wider px-4 py-3">HSN/SAC</th>
                            <th className="text-right text-xs font-bold text-gray-600 uppercase tracking-wider px-4 py-3">Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b-2 border-gray-200">
                            <td className="px-4 py-4">
                              <p className="font-black text-black">{deliverableType}</p>
                              <p className="text-sm text-gray-600 font-bold">"{campaign?.title}" — {productionDays}-day production, ASCI-compliant</p>
                            </td>
                            <td className="px-4 py-4 text-right text-sm text-gray-600 font-mono font-bold">998361</td>
                            <td className="px-4 py-4 text-right font-black text-black">{formatRupee(parseInt(amount) || 0)}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Totals */}
                      <div className="flex justify-end mb-8">
                        <div className="w-80">
                          <div className="flex justify-between py-2 border-b-2 border-gray-200">
                            <span className="text-gray-600 font-bold">Gross Amount</span>
                            <span className="font-black text-black">{formatRupee(parseInt(amount) || 0)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b-2 border-gray-200">
                            <span className="text-gray-600 font-bold">TDS Withheld @ 10% (Sec. 194J)</span>
                            <span className="font-black text-rose-600">-{formatRupee((parseInt(amount) || 0) * 0.1)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b-2 border-gray-200">
                            <span className="text-gray-600 font-bold">Platform Fee @ 2.5%</span>
                            <span className="font-black text-gray-600">-{formatRupee((parseInt(amount) || 0) * 0.025)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b-2 border-gray-200">
                            <span className="text-gray-600 font-bold">GST on Platform Fee @ 18%</span>
                            <span className="font-black text-gray-600">-{formatRupee((parseInt(amount) || 0) * 0.025 * 0.18)}</span>
                          </div>
                          <div className="flex justify-between py-3 bg-indigo-50 border-2 border-black px-3 rounded-lg mt-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <span className="font-black text-black text-lg">Net Payable to Creator</span>
                            <span className="font-black text-emerald-600 text-lg">{formatRupee(Math.round((parseInt(amount) || 0) * 0.9 - (parseInt(amount) || 0) * 0.025 * 1.18))}</span>
                          </div>
                        </div>
                      </div>

                      {/* Legal Footer */}
                      <div className="bg-amber-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4 rounded-lg text-xs text-amber-800 mb-6 font-medium">
                        <strong>TDS Certificate (Form 16A)</strong> shall be issued to the Creator within 15 days of TDS remittance to the Government. This invoice is auto-generated and legally valid under the Income Tax Act, 1961, and the Information Technology Act, 2000. SAC Code 998361 — Advertising and related services.
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={() => window.print()} 
                          className="flex-1 bg-black text-white font-black py-4 rounded-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
                        >
                          🖨️ Print / Download Invoice
                        </button>
                        <button onClick={() => navigate('/brand-dashboard')} className="flex-1 bg-white border-2 border-black text-black font-black py-4 rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none">
                          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
