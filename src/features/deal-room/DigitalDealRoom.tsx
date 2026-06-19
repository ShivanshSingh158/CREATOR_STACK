import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { formatDateDDMMYY, formatRupee } from '../../utils/formatters';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { ShieldCheck, FileText, Lock, CheckCircle, ArrowLeft, Terminal, Cpu } from 'lucide-react';

export default function DigitalDealRoom() {
  const { campaignId, creatorId } = useParams<{ campaignId: string, creatorId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [campaign, setCampaign] = useState<any>(null);
  const [creator, setCreator] = useState<any>(null);
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
  }, [campaignId, creatorId]);

  // State Machine for the Digital Deal Room
  const [dealStage, setDealStage] = useState<'TERMS' | 'CONTRACT' | 'ESCROW' | 'PRODUCTION' | 'AI_CHECK' | 'RELEASED'>('TERMS');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Term Variables - pre-filled from campaign data
  const [amount, setAmount] = useState('');
  const [productionDays, setProductionDays] = useState('14');
  const [deliverableType, setDeliverableType] = useState('60s Dedicated Integration');

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

  const handleGenerateContract = (e: React.FormEvent) => {
    e.preventDefault();
    runAnimation([
      'Parsing term inputs...',
      'Injecting variables into legal template...',
      'Appending mandatory ASCI disclosure clauses...',
      'Generating immutable PDF contract...'
    ], 'CONTRACT');
  };

  const handleSignAndEscrow = () => {
    runAnimation([
      'Cryptographically signing document...',
      'Pinging RazorpayX Escrow API...',
      'Provisioning dynamic virtual account...',
      'Locking INR funds in secure escrow vault...'
    ], 'ESCROW');
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

  const handleReleaseFunds = () => {
    runAnimation([
      'Processing automated timeout protocol...',
      'Executing 10% TDS withholding via Section 194J...',
      'Routing remaining balance to Creator UPI...',
      'Contract marked as COMPLETED.'
    ], 'RELEASED');
    
    if (auth.app.options.apiKey !== "YOUR_API_KEY" && campaignId) {
      updateDoc(doc(db, 'campaigns', campaignId), { status: 'completed' }).catch(console.error);
    }
  };

  const renderLoader = (messages: string[]) => (
    <div className="bg-[#111827] border border-[#374151] p-12 rounded-xl shadow-2xl flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#d1b07c] via-transparent to-transparent"></div>
      
      <div className="w-full max-w-lg z-10">
        <div className="flex justify-center mb-8">
          <Cpu className="w-12 h-12 text-[#d1b07c] animate-pulse" />
        </div>
        
        <div className="flex justify-between text-xs font-bold text-[#9ca3af] mb-3 uppercase tracking-widest">
          <span>Processing Step</span>
          <span className="text-[#d1b07c]">{Math.round(((loadingStep + 1) / messages.length) * 100)}%</span>
        </div>
        
        <div className="h-1.5 bg-[#374151] rounded-full overflow-hidden mb-8">
            <div className="h-full bg-[#d1b07c] transition-all duration-500 ease-in-out relative" style={{ width: `${((loadingStep + 1) / messages.length) * 100}%` }}>
               <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
            </div>
        </div>
        
        <div className="bg-[#030712] rounded-lg p-4 font-mono text-sm text-[#9ca3af] border border-[#1f2937] shadow-inner h-32 flex flex-col justify-end">
          {messages.slice(0, loadingStep + 1).map((msg, i) => (
             <div key={i} className={`flex items-center gap-2 mb-2 ${i === loadingStep ? 'text-[#d1b07c] font-bold' : 'opacity-50'}`}>
                <span className="text-[#6b7280]">System_&gt;</span> {msg}
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
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-[#374151] -z-10"></div>
      
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
             <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
               status === 'completed' ? 'bg-[#d1b07c] text-white shadow-[0_0_15px_rgba(209,176,124,0.4)]' :
               status === 'active' ? 'bg-[#1f2937] border-2 border-[#d1b07c] text-[#d1b07c]' :
               'bg-[#1f2937] border-2 border-[#374151] text-[#6b7280]'
             }`}>
               <Icon className="w-5 h-5" />
             </div>
             <span className={`absolute -bottom-8 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors duration-300 ${
               status === 'active' ? 'text-[#d1b07c]' :
               status === 'completed' ? 'text-white' :
               'text-[#6b7280]'
             }`}>
               {step.label}
             </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#030712] text-white font-['Outfit'] pb-20 selection:bg-[#d1b07c]/30 selection:text-white">
      {/* Premium Header */}
      <div className="bg-[#111827] border-b border-[#1f2937] pt-8 pb-8 px-4 sm:px-6 lg:px-8 shadow-sm relative z-20">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate(-1)} className="text-[#9ca3af] hover:text-white text-sm font-bold tracking-wide mb-6 flex items-center transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> BACK
          </button>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-[#d1b07c]/10 text-[#d1b07c] border border-[#d1b07c]/20 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Secure Vault
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">Digital Deal Room <span className="text-[#d1b07c]">#{campaignId?.substring(0,6)}</span></h1>
              <p className="mt-2 text-[#9ca3af] max-w-2xl font-medium">End-to-end programmatic escrow and legal enforcement.</p>
            </div>
            
            <div className="flex gap-4 items-center">
               <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(creator?.name || 'C')}&background=d1b07c&color=fff`} className="w-12 h-12 rounded-full border-2 border-[#1f2937]" alt="" />
               <div>
                 <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-0.5">Creator Counterparty</p>
                 <p className="font-bold text-white text-lg">{creator?.name || 'Loading...'}</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <StepIndicator />

        <div className="mt-16 relative">
          {/* subtle glow behind active area */}
          <div className="absolute inset-0 bg-[#d1b07c] opacity-5 blur-[100px] pointer-events-none rounded-full"></div>
          
          {loading ? (
            dealStage === 'TERMS' ? renderLoader(['Parsing term inputs...', 'Injecting variables into legal template...', 'Appending mandatory ASCI disclosure clauses...', 'Generating immutable PDF contract...']) :
            dealStage === 'CONTRACT' ? renderLoader(['Cryptographically signing document...', 'Pinging RazorpayX Escrow API...', 'Provisioning dynamic virtual account...', 'Locking INR funds in secure escrow vault...']) :
            dealStage === 'PRODUCTION' ? renderLoader(['Downloading high-res video manifest...', 'Running Computer Vision OCR for #ad tags...', 'Executing Audio NLP transcription for brand vocalizations...', 'Cross-referencing description box hyperlink tracking...']) :
            renderLoader(['Processing automated timeout protocol...', 'Executing 10% TDS withholding via Section 194J...', 'Routing remaining balance to Creator UPI...', 'Contract marked as COMPLETED.'])
          ) : (
            <>
              {/* STAGE 1: TERMS ENTRY */}
              {dealStage === 'TERMS' && (
                <div className="bg-[#111827] border border-[#1f2937] p-8 md:p-12 rounded-xl shadow-2xl relative z-10 animate-[fadeIn_0.5s_ease-out]">
                  <div className="flex items-center gap-4 mb-8 border-b border-[#1f2937] pb-6">
                    <div className="w-12 h-12 bg-[#1f2937] rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-[#d1b07c]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-wide">Define Collaboration Terms</h2>
                      <p className="text-sm text-[#9ca3af] font-medium mt-1">Set the parameters for the smart contract.</p>
                    </div>
                  </div>

                  <form onSubmit={handleGenerateContract} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="group">
                        <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-2 group-focus-within:text-[#d1b07c] transition-colors">Total Deal Amount (INR)</label>
                        <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af] font-bold">₹</span>
                           <input type="number" required className="w-full bg-[#030712] border border-[#374151] text-white pl-9 pr-4 py-3.5 rounded-lg focus:border-[#d1b07c] focus:ring-1 focus:ring-[#d1b07c] focus:outline-none text-xl font-black transition-all" value={amount} onChange={e => setAmount(e.target.value)} />
                        </div>
                      </div>
                      <div className="group">
                        <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-2 group-focus-within:text-[#d1b07c] transition-colors">Production Time (Days)</label>
                        <div className="relative">
                           <input type="number" required className="w-full bg-[#030712] border border-[#374151] text-white px-4 py-3.5 rounded-lg focus:border-[#d1b07c] focus:ring-1 focus:ring-[#d1b07c] focus:outline-none text-xl font-black transition-all" value={productionDays} onChange={e => setProductionDays(e.target.value)} />
                        </div>
                      </div>
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-2 group-focus-within:text-[#d1b07c] transition-colors">Asset Deliverable Type</label>
                      <select className="w-full bg-[#030712] border border-[#374151] text-white px-4 py-3.5 rounded-lg focus:border-[#d1b07c] focus:ring-1 focus:ring-[#d1b07c] focus:outline-none text-lg font-medium transition-all" value={deliverableType} onChange={e => setDeliverableType(e.target.value)}>
                        <option>60s Dedicated Integration</option>
                        <option>30s Pre-roll Mention</option>
                        <option>Dedicated Video (Full length)</option>
                        <option>YouTube Shorts (Multi-part series)</option>
                      </select>
                    </div>
                    <div className="pt-6 border-t border-[#1f2937]">
                      <button type="submit" className="w-full bg-[#d1b07c] hover:bg-[#b59560] text-white font-black text-lg py-4 rounded-lg uppercase tracking-widest transition-colors shadow-[0_4px_14px_0_rgba(209,176,124,0.39)] hover:shadow-[0_6px_20px_rgba(209,176,124,0.23)]">
                        Compile Programmatic Contract
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* STAGE 2: CONTRACT GENERATION & SIGNING — Indian e-Stamp Paper */}
              {dealStage === 'CONTRACT' && (
                <div className="bg-[#111827] border border-[#1f2937] p-8 md:p-10 rounded-xl shadow-2xl relative z-10 animate-[fadeIn_0.5s_ease-out]">
                  <div className="flex justify-between items-center border-b border-[#1f2937] pb-6 mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-wide">Generated Digital Contract</h2>
                      <p className="text-sm text-[#9ca3af] mt-1 font-medium">Review all terms carefully before digitally signing and locking escrow.</p>
                    </div>
                    <span className="bg-[#052e16] text-[#34d399] border border-[#064e3b] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-inner flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Validated
                    </span>
                  </div>

                  {/* === INDIAN e-STAMP PAPER === */}
                  <div className="mb-10 shadow-[0_0_60px_rgba(0,0,0,0.7)] rounded-sm" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
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
                            <div className="font-serif italic text-2xl text-[#9ca3af] border-b-2 border-dashed border-[#9ca3af] pb-1 text-center">Pending Escrow Lock...</div>
                            <p className="text-[9px] text-[#6b5f2e] mt-1 text-center">Co-execution upon fund lock confirmation</p>
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

                  <button onClick={handleSignAndEscrow} className="w-full bg-[#111827] border border-[#d1b07c] hover:bg-[#d1b07c] text-[#d1b07c] hover:text-white font-black text-lg py-5 rounded-lg uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(209,176,124,0.15)] group">
                    <Lock className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Digitally Sign & Lock Funds in Escrow
                  </button>
                </div>
              )}

              {/* STAGE 3: ESCROW LOCKED (Waiting for Creator) */}
              {dealStage === 'ESCROW' && (
                <div className="bg-[#111827] border border-[#1f2937] p-12 rounded-xl shadow-2xl animate-[fadeIn_0.5s_ease-out] text-center relative z-10 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#10b981] to-transparent opacity-50"></div>
                  
                  <div className="w-24 h-24 bg-[#064e3b] rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-[#022c22] shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    <Lock className="w-10 h-10 text-[#34d399]" />
                  </div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-3">Escrow Successfully Locked</h2>
                  <p className="text-[#9ca3af] mb-10 max-w-xl mx-auto text-lg leading-relaxed">
                    <strong className="text-white">{formatRupee(amount)}</strong> has been secured in the RazorpayX vault. Production has officially begun and the creator has been notified.
                  </p>
                  
                  <div className="bg-[#030712] p-8 rounded-xl border border-[#374151] text-left max-w-2xl mx-auto shadow-inner">
                    <div className="flex items-center gap-3 mb-6">
                      <Terminal className="w-5 h-5 text-[#d1b07c]" />
                      <h3 className="text-sm font-bold text-[#d1b07c] uppercase tracking-widest">Simulator (Demo Action)</h3>
                    </div>
                    <form onSubmit={handleCreatorUpload} className="flex flex-col sm:flex-row gap-4">
                      <input type="url" required placeholder="Paste YouTube Video URL..." className="flex-1 bg-[#111827] border border-[#374151] text-white px-5 py-3.5 rounded-lg focus:border-[#d1b07c] focus:ring-1 focus:ring-[#d1b07c] focus:outline-none transition-all placeholder:text-[#6b7280]" value={videoLink} onChange={e => setVideoLink(e.target.value)} />
                      <button type="submit" className="bg-white text-[#111827] font-black px-8 py-3.5 rounded-lg uppercase tracking-wider text-sm hover:bg-gray-100 transition-colors shrink-0">Submit PoD</button>
                    </form>
                  </div>
                </div>
              )}

              {/* STAGE 4: AI POD CHECK RESULT */}
              {dealStage === 'AI_CHECK' && (
                <div className="bg-[#111827] border border-[#1f2937] p-10 rounded-xl shadow-2xl animate-[fadeIn_0.5s_ease-out] relative z-10">
                  <div className="flex items-center gap-4 mb-10 pb-6 border-b border-[#1f2937]">
                    <div className="w-12 h-12 bg-[#064e3b] rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-[#34d399]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        PoD Verification Passed
                      </h2>
                      <p className="text-[#9ca3af] font-medium text-sm mt-1">Our AI engines have successfully validated the deliverable.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="bg-[#030712] p-6 rounded-xl border border-[#374151] hover:border-[#10b981]/50 transition-colors group">
                      <h3 className="text-xs font-bold text-[#10b981] uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Cpu className="w-4 h-4" /> Computer Vision OCR
                      </h3>
                      <p className="text-[#9ca3af] text-sm leading-relaxed group-hover:text-white transition-colors">Successfully detected <strong className="text-white">#ad</strong> tag in description box and visual graphic overlay at timestamp <span className="bg-[#1f2937] px-1.5 py-0.5 rounded text-white font-mono">01:14</span>.</p>
                    </div>
                    <div className="bg-[#030712] p-6 rounded-xl border border-[#374151] hover:border-[#10b981]/50 transition-colors group">
                      <h3 className="text-xs font-bold text-[#10b981] uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Cpu className="w-4 h-4" /> Audio NLP Transcription
                      </h3>
                      <p className="text-[#9ca3af] text-sm leading-relaxed group-hover:text-white transition-colors">Successfully matched brand name vocalizations at <span className="bg-[#1f2937] px-1.5 py-0.5 rounded text-white font-mono">01:14</span> and <span className="bg-[#1f2937] px-1.5 py-0.5 rounded text-white font-mono">02:05</span> with <strong className="text-green-400">98% confidence</strong>.</p>
                    </div>
                  </div>

                  <div className="bg-[#fffbeb]/5 border border-[#fbbf24]/30 p-5 rounded-lg mb-8 text-[#fcd34d] text-sm flex gap-3 items-start">
                    <div className="mt-0.5 shrink-0 animate-pulse">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <p className="leading-relaxed">
                      <strong className="block uppercase tracking-widest text-xs mb-1">48-Hour Review Window Active</strong> 
                      If no dispute is raised, funds will automatically release. For demo purposes, you can manually trigger the release now.
                    </p>
                  </div>

                  <button onClick={handleReleaseFunds} className="w-full bg-[#d1b07c] hover:bg-[#b59560] text-white font-black text-lg py-5 rounded-lg uppercase tracking-widest transition-colors shadow-[0_4px_14px_0_rgba(209,176,124,0.39)]">
                    Approve Deliverable & Release Escrow
                  </button>
                </div>
              )}

              {/* STAGE 5: RELEASED — with Professional Invoice */}
              {dealStage === 'RELEASED' && (
                <div className="space-y-8 animate-[fadeIn_0.5s_ease-out] relative z-10">
                  {/* Success Header */}
                  <div className="bg-[#111827] border border-[#1f2937] p-10 rounded-xl shadow-2xl text-center overflow-hidden relative">
                    <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#d1b07c] via-white to-[#d1b07c]"></div>
                    <div className="w-28 h-28 bg-[#d1b07c]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#d1b07c]/30 shadow-[0_0_40px_rgba(209,176,124,0.15)]">
                      <CheckCircle className="w-12 h-12 text-[#d1b07c]" />
                    </div>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-3">Transaction Complete</h2>
                    <p className="text-[#9ca3af] max-w-xl mx-auto text-lg leading-relaxed">
                      Funds routed to Creator's verified UPI. TDS withheld and remitted per Section 194J. Invoice generated below.
                    </p>
                    <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-8">
                      <div className="bg-[#030712] p-4 rounded-xl border border-[#374151]">
                        <div className="text-[10px] text-[#9ca3af] uppercase font-bold tracking-widest mb-1">Gross Amount</div>
                        <div className="text-xl font-black text-white">{formatRupee(parseInt(amount) || 0)}</div>
                      </div>
                      <div className="bg-[#030712] p-4 rounded-xl border border-[#374151]">
                        <div className="text-[10px] text-[#9ca3af] uppercase font-bold tracking-widest mb-1">TDS (10%)</div>
                        <div className="text-xl font-black text-[#d1b07c]">-{formatRupee((parseInt(amount) || 0) * 0.1)}</div>
                      </div>
                      <div className="bg-[#030712] p-4 rounded-xl border border-[#374151]">
                        <div className="text-[10px] text-[#9ca3af] uppercase font-bold tracking-widest mb-1">Net Payout</div>
                        <div className="text-xl font-black text-[#10b981]">{formatRupee((parseInt(amount) || 0) * 0.9)}</div>
                      </div>
                    </div>
                  </div>

                  {/* === PROFESSIONAL INVOICE === */}
                  <div id="cs-invoice" className="bg-white rounded-xl shadow-2xl overflow-hidden border border-[#e5e7eb]">
                    {/* Invoice Header */}
                    <div className="bg-[#111827] px-8 py-6 flex justify-between items-center">
                      <div>
                        <p className="text-3xl font-black text-white tracking-tight">creator<span className="text-[#d1b07c]">.</span>stack</p>
                        <p className="text-[#9ca3af] text-xs font-bold uppercase tracking-widest mt-1">Creator Commerce Platform</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-black text-xl">TAX INVOICE</p>
                        <p className="text-[#d1b07c] font-mono text-sm mt-1">CS-INV-{campaignId?.substring(0, 6).toUpperCase()}-{new Date().getFullYear()}</p>
                        <p className="text-[#9ca3af] text-xs mt-0.5">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>

                    <div className="p-8">
                      {/* Parties */}
                      <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-[#e5e7eb]">
                        <div>
                          <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-3">Billed From (Service Provider)</p>
                          <p className="font-black text-[#111827] text-lg">{creator?.name || creator?.legalName || 'Creator'}</p>
                          <p className="text-sm text-[#6b7280] mt-1">Independent Professional Creator</p>
                          <p className="text-sm text-[#6b7280]">PAN: {creator?.pan ? `${creator.pan.substring(0,3)}****${creator.pan.substring(7)}` : 'Verified via Signzy'}</p>
                          <p className="text-sm text-[#6b7280]">UPI: {creator?.upi || 'Verified UPI on file'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-3">Billed To (Client / Advertiser)</p>
                          <p className="font-black text-[#111827] text-lg">{campaign?.brandName || 'Advertiser'}</p>
                          <p className="text-sm text-[#6b7280] mt-1">Registered Corporate Advertiser</p>
                          <p className="text-sm text-[#6b7280]">Campaign: {campaign?.title}</p>
                          <p className="text-sm text-[#6b7280]">Campaign ID: #{campaignId?.substring(0, 8)}</p>
                        </div>
                      </div>

                      {/* Line Items */}
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
                              <p className="font-bold text-[#111827]">{deliverableType}</p>
                              <p className="text-sm text-[#6b7280]">"{campaign?.title}" — {productionDays}-day production, ASCI-compliant</p>
                            </td>
                            <td className="px-4 py-4 text-right text-sm text-[#6b7280] font-mono">998361</td>
                            <td className="px-4 py-4 text-right font-bold text-[#111827]">{formatRupee(parseInt(amount) || 0)}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Totals */}
                      <div className="flex justify-end mb-8">
                        <div className="w-80">
                          <div className="flex justify-between py-2 border-b border-[#f3f4f6]">
                            <span className="text-[#6b7280]">Gross Amount</span>
                            <span className="font-bold text-[#111827]">{formatRupee(parseInt(amount) || 0)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-[#f3f4f6]">
                            <span className="text-[#6b7280]">TDS Withheld @ 10% (Sec. 194J)</span>
                            <span className="font-bold text-red-600">-{formatRupee((parseInt(amount) || 0) * 0.1)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-[#f3f4f6]">
                            <span className="text-[#6b7280]">Platform Fee @ 2.5%</span>
                            <span className="font-bold text-[#6b7280]">-{formatRupee((parseInt(amount) || 0) * 0.025)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-[#f3f4f6]">
                            <span className="text-[#6b7280]">GST on Platform Fee @ 18%</span>
                            <span className="font-bold text-[#6b7280]">-{formatRupee((parseInt(amount) || 0) * 0.025 * 0.18)}</span>
                          </div>
                          <div className="flex justify-between py-3 bg-[#f9fafb] px-3 rounded-lg mt-2">
                            <span className="font-black text-[#111827] text-lg">Net Payable to Creator</span>
                            <span className="font-black text-green-700 text-lg">{formatRupee(Math.round((parseInt(amount) || 0) * 0.9 - (parseInt(amount) || 0) * 0.025 * 1.18))}</span>
                          </div>
                        </div>
                      </div>

                      {/* Legal Footer */}
                      <div className="bg-[#fef9ef] border border-[#d1b07c]/30 p-4 rounded-lg text-xs text-[#6b5f2e] mb-6">
                        <strong>TDS Certificate (Form 16A)</strong> shall be issued to the Creator within 15 days of TDS remittance to the Government. This invoice is auto-generated and legally valid under the Income Tax Act, 1961, and the Information Technology Act, 2000. SAC Code 998361 — Advertising and related services.
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={() => window.print()} 
                          className="flex-1 bg-[#111827] text-white font-bold py-3 rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2"
                        >
                          🖨️ Print / Download Invoice
                        </button>
                        <button onClick={() => navigate('/brand-dashboard')} className="flex-1 border border-[#e5e7eb] text-[#111827] font-bold py-3 rounded-lg hover:bg-[#f9fafb] transition-colors flex items-center justify-center gap-2">
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
