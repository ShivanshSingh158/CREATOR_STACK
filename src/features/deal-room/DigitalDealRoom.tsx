import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { formatDateDDMMYY, formatRupee } from '../../utils/formatters';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ShieldCheck, FileText, Lock, PlayCircle, CheckCircle, ArrowLeft, Terminal, Cpu } from 'lucide-react';

export default function DigitalDealRoom() {
  const { campaignId, creatorId } = useParams<{ campaignId: string, creatorId: string }>();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  
  const [campaign, setCampaign] = useState<any>(null);
  const [creator, setCreator] = useState<any>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!campaignId || !creatorId) return;
      try {
        const docRef = doc(db, 'campaigns', campaignId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCampaign({ id: docSnap.id, ...docSnap.data() });
        }

        const creatorRef = doc(db, 'creators', creatorId);
        const creatorSnap = await getDoc(creatorRef);
        if (creatorSnap.exists()) {
          setCreator({ id: creatorSnap.id, ...creatorSnap.data() });
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

  // Term Variables
  const [amount, setAmount] = useState('150000');
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
      ].map((step, idx) => {
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

              {/* STAGE 2: CONTRACT GENERATION & SIGNING */}
              {dealStage === 'CONTRACT' && (
                <div className="bg-[#111827] border border-[#1f2937] p-8 md:p-10 rounded-xl shadow-2xl relative z-10 animate-[fadeIn_0.5s_ease-out]">
                  <div className="flex justify-between items-center border-b border-[#1f2937] pb-6 mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-wide">Generated Digital Contract</h2>
                      <p className="text-sm text-[#9ca3af] mt-1 font-medium">Review the terms before locking funds into escrow.</p>
                    </div>
                    <span className="bg-[#052e16] text-[#34d399] border border-[#064e3b] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-inner flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Validated
                    </span>
                  </div>
                  
                  {/* Physical Paper Simulation */}
                  <div className="bg-[#ffffff] p-10 md:p-14 rounded-sm border-t-4 border-[#d1b07c] font-serif text-[#111827] leading-relaxed mb-10 h-[600px] overflow-y-auto shadow-[0_0_40px_rgba(0,0,0,0.5)] relative">
                    <div className="absolute top-0 right-0 p-8 pointer-events-none">
                      <div className="border-[3px] border-red-600/20 text-red-600/20 font-black uppercase tracking-widest text-2xl px-6 py-2 transform rotate-12 select-none">
                        Legally Binding
                      </div>
                    </div>
                    
                    <h3 className="text-center font-black text-[#111827] mb-12 uppercase text-3xl tracking-tight border-b-2 border-[#111827] pb-6">Digital Creator Services Agreement</h3>
                    
                    <p className="mb-8 text-base">
                      This Digital Creator Services Agreement ("Agreement") is dynamically executed on <strong className="font-bold">{formatDateDDMMYY(new Date())}</strong> ("Effective Date"), by and between the Brand ("Advertiser") and the independent content creator, <strong className="bg-[#f3f4f6] px-1.5 py-0.5 rounded border border-[#e5e7eb] font-bold">{creator?.name || 'Creator'}</strong> ("Creator"), collectively referred to as the "Parties."
                    </p>

                    <div className="space-y-8 text-base">
                      <section>
                        <h4 className="font-black text-[#111827] uppercase tracking-wide mb-3">1. Scope of Work & Deliverables</h4>
                        <p>The Creator agrees to produce, deliver, and publish <strong className="bg-[#fef3c7] text-[#b45309] px-1.5 py-0.5 rounded font-bold">{deliverableType}</strong> (the "Content") for the Advertiser. The final Content must be submitted to the CreatorStack portal for Proof-of-Delivery (PoD) verification within <strong className="font-bold underline">{productionDays} days</strong> of the Escrow Lock date. The Content must align with the creative brief provided by the Advertiser.</p>
                      </section>

                      <section>
                        <h4 className="font-black text-[#111827] uppercase tracking-wide mb-3">2. Escrow & Compensation</h4>
                        <p>In full consideration of the Creator's performance, the Advertiser shall deposit the total sum of <strong className="bg-[#dcfce3] text-[#166534] px-1.5 py-0.5 rounded font-bold">{formatRupee(amount)}</strong> into a RazorpayX virtual escrow account ("Escrow Account") upon execution of this Agreement. Funds shall be automatically released to the Creator by CreatorStack's smart-contract upon the successful AI-verification of the published Content.</p>
                      </section>

                      <section>
                        <h4 className="font-black text-[#111827] uppercase tracking-wide mb-3">3. ASCI Compliance & Disclosure (Strict Liability)</h4>
                        <p>The Creator expressly agrees to adhere to the Advertising Standards Council of India (ASCI) guidelines. The Creator <strong className="underline decoration-red-500 font-bold decoration-2">must</strong> explicitly include "#ad", "#sponsored", or "Partnership" within the first two lines of the caption/description without requiring the user to click "Read More". The Creator must also vocalize the brand association clearly during the video integration. Failure to comply constitutes a material breach and will result in automated payment withholding.</p>
                      </section>

                      <section>
                        <h4 className="font-black text-[#111827] uppercase tracking-wide mb-3">4. Exclusivity & Non-Compete</h4>
                        <p>The Creator agrees not to publish content promoting, endorsing, or featuring any direct competitor of the Advertiser for a period of thirty (30) days prior to the publication of the Content, and thirty (30) days following the publication of the Content.</p>
                      </section>

                      <section>
                        <h4 className="font-black text-[#111827] uppercase tracking-wide mb-3">5. Intellectual Property & Usage Rights</h4>
                        <p>The Creator retains ownership of the underlying IP in their channel, but grants the Advertiser a worldwide, royalty-free, non-exclusive license to use, repost, and amplify the Content across the Advertiser's owned digital channels for a period of <strong className="font-bold">ninety (90) days</strong> from the date of publication.</p>
                      </section>

                      <section>
                        <h4 className="font-black text-[#111827] uppercase tracking-wide mb-3">6. Governing Law & Dispute Resolution</h4>
                        <p>This Agreement shall be governed by and construed in accordance with the laws of India. Any disputes arising out of this Agreement that cannot be resolved via CreatorStack's automated arbitration systems shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka.</p>
                      </section>
                      
                      <div className="mt-16 border-t-2 border-[#e5e7eb] pt-8 flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-widest mb-2 font-sans">Advertiser Digital Signature</p>
                          <div className="font-serif italic text-3xl text-[#111827] border-b border-[#111827] pb-1 min-w-[200px] text-center inline-block">Verified via Auth</div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-[#6b7280] uppercase tracking-widest mb-2 font-sans">{creator?.name || 'Creator'} Digital Signature</p>
                          <div className="font-serif italic text-3xl text-[#9ca3af] border-b border-[#e5e7eb] pb-1 min-w-[200px] text-center inline-block">Pending...</div>
                        </div>
                      </div>
                    </div>
                  </div>

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

              {/* STAGE 5: RELEASED */}
              {dealStage === 'RELEASED' && (
                <div className="bg-[#111827] border border-[#1f2937] p-12 md:p-16 rounded-xl shadow-2xl animate-[fadeIn_0.5s_ease-out] text-center relative z-10 overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#d1b07c] via-white to-[#d1b07c]"></div>
                  
                  <div className="w-28 h-28 bg-[#d1b07c]/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-[#d1b07c]/30 shadow-[0_0_40px_rgba(209,176,124,0.15)]">
                    <CheckCircle className="w-12 h-12 text-[#d1b07c]" />
                  </div>
                  <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-4">Transaction Complete</h2>
                  <p className="text-[#9ca3af] mb-12 max-w-xl mx-auto text-lg leading-relaxed">
                    Funds have been routed to the Creator's verified UPI. Tax witholding (TDS) receipts have been securely generated and logged.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-6 max-w-md mx-auto mb-12">
                     <div className="bg-[#030712] p-6 rounded-xl border border-[#374151]">
                       <div className="text-[10px] text-[#9ca3af] uppercase font-bold tracking-widest mb-2">Creator Payout</div>
                       <div className="text-2xl font-black text-[#10b981]">{formatRupee(parseInt(amount) * 0.9)}</div>
                     </div>
                     <div className="bg-[#030712] p-6 rounded-xl border border-[#374151]">
                       <div className="text-[10px] text-[#9ca3af] uppercase font-bold tracking-widest mb-2">194J TDS (10%)</div>
                       <div className="text-2xl font-black text-[#d1b07c]">{formatRupee(parseInt(amount) * 0.1)}</div>
                     </div>
                  </div>
                  
                  <button onClick={() => navigate('/brand-dashboard')} className="text-[#d1b07c] hover:text-white font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 mx-auto transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Return to Dashboard
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
