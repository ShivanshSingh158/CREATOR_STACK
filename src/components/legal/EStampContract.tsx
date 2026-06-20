import React from 'react';
import { formatDateDDMMYY, formatRupee } from '../../utils/formatters';

export interface EStampContractProps {
  campaignId: string;
  brandName: string;
  creatorName: string;
  deliverableType: string;
  campaignTitle: string;
  productionDays: string | number;
  amount: number | string;
  brandSignedAt?: string | null;
  creatorSignatureName?: string;
  creatorSignedAt?: string | null;
  status?: string;
  isDraft?: boolean;
}

export default function EStampContract({
  campaignId,
  brandName,
  creatorName,
  deliverableType,
  campaignTitle,
  productionDays,
  amount,
  brandSignedAt,
  creatorSignatureName,
  creatorSignedAt,
  status,
  isDraft = false
}: EStampContractProps) {
  const effectiveDate = brandSignedAt ? new Date(brandSignedAt) : new Date();
  
  // Real e-Stamp watermark overlay
  const DraftWatermark = () => {
    if (!isDraft) return null;
    return (
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-[0.03]">
        <div className="text-[12rem] font-black text-[#4a5c2e] uppercase tracking-[1em] rotate-[-45deg] select-none">
          DRAFT
        </div>
      </div>
    );
  };

  return (
    <div className="relative shadow-[0_0_60px_rgba(0,0,0,0.7)] rounded-sm overflow-hidden" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
      <DraftWatermark />
      
      {/* Outer borders and security pattern */}
      <div className="relative z-10 border-[8px] border-[#364522] p-1.5 bg-[#f5f0dc]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(180,160,100,0.06) 0px, rgba(180,160,100,0.06) 1px, transparent 1px, transparent 10px)' }}>
        <div className="border-[3px] border-[#4a5c2e] p-6 md:p-8 bg-white/95">
          
          {/* Header — Government Seal Area */}
          <div className="text-center border-b-[3px] border-[#364522] pb-5 mb-6 relative">
            <p className="text-sm font-black tracking-[0.4em] text-[#364522] uppercase mb-1.5">भारत सरकार / Government of India</p>
            <p className="text-[11px] font-bold tracking-[0.3em] text-[#55633a] uppercase">Ministry of Electronics & Information Technology — e-Stamp Division</p>
            
            <div className="flex items-center justify-center gap-8 my-5">
              <div className="text-[#364522] font-black text-sm border-2 border-[#364522] px-3 py-1.5 bg-[#f5f0dc]">₹500</div>
              
              {/* Center Emblem */}
              <div className="w-16 h-16 border-[5px] border-[#364522] rounded-full flex items-center justify-center relative bg-[#f5f0dc]">
                <div className="w-9 h-9 border-[3px] border-[#364522] rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-[#364522] rounded-full"></div>
                </div>
                {[...Array(24)].map((_, i) => (
                  <div key={i} className="absolute w-[1.5px] h-[19px] bg-[#364522] origin-bottom" style={{ bottom: '50%', left: 'calc(50% - 0.75px)', transform: `rotate(${i * 15}deg) translateY(-2px)` }}></div>
                ))}
              </div>
              
              <div className="text-[#364522] font-black text-sm border-2 border-[#364522] px-3 py-1.5 bg-[#f5f0dc]">₹500</div>
            </div>
            
            <p className="text-lg font-black tracking-[0.2em] text-[#1a230e] uppercase">Non-Judicial e-Stamp Paper</p>
            <p className="text-xs font-bold text-[#55633a] mt-1 tracking-widest">Article 43(b) — Master Service Agreement | Denomination: ₹500</p>
            
            <div className="mt-4 inline-block bg-[#eae5cc] border border-[#c8b97a] px-4 py-2">
              <p className="text-xs text-[#364522] font-mono font-bold tracking-widest">
                e-Stamp Ref No: <span className="text-black">GJ-IN-ESTMP-{campaignId?.substring(0, 8).toUpperCase()}-{new Date().getFullYear()}</span>
              </p>
            </div>
          </div>

          {/* Document Title */}
          <h3 className="text-center font-black text-[#111827] mt-8 mb-2 uppercase text-2xl tracking-widest underline underline-offset-8 decoration-2">
            Creator Master Services Agreement
          </h3>
          <p className="text-center text-[10px] font-bold text-[#55633a] mb-8 tracking-[0.2em] uppercase">
            (Executed Electronically under the Information Technology Act, 2000 & Indian Contract Act, 1872)
          </p>

          <div className="text-sm leading-[1.8] text-[#111827] space-y-4 text-justify">
            <p>
              This Creator Master Services Agreement (the <strong>"Agreement"</strong>) is made and entered into on this <strong>{formatDateDDMMYY(effectiveDate)}</strong> (the <strong>"Effective Date"</strong>), by and between:
            </p>

            <div className="bg-[#fcfaf5] border border-[#d6cfad] p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-inner">
              <div>
                <p className="text-xs font-black text-[#364522] uppercase tracking-widest mb-2 border-b border-[#364522] pb-1 inline-block">Party A — Advertiser / Client</p>
                <p className="font-black text-lg text-[#111827] mt-1">{brandName || 'Brand (Advertiser)'}</p>
                <p className="text-[#4b5563] text-xs font-medium mt-1">A company duly incorporated and validly existing under the Companies Act, 2013, hereinafter referred to as the <strong>"Advertiser"</strong> (which expression shall, unless repugnant to the context or meaning thereof, be deemed to mean and include its successors and permitted assigns).</p>
              </div>
              <div>
                <p className="text-xs font-black text-[#364522] uppercase tracking-widest mb-2 border-b border-[#364522] pb-1 inline-block">Party B — Creator / Service Provider</p>
                <p className="font-black text-lg text-[#111827] mt-1">{creatorName || 'Creator'}</p>
                <p className="text-[#4b5563] text-xs font-medium mt-1">An independent professional service provider, hereinafter referred to as the <strong>"Creator"</strong> (which expression shall, unless repugnant to the context or meaning thereof, be deemed to mean and include their legal heirs, executors, and administrators).</p>
              </div>
            </div>

            <p className="font-serif italic text-[#4b5563]">
              The Advertiser and the Creator are hereinafter collectively referred to as the <strong>"Parties"</strong> and individually as a <strong>"Party"</strong>.
            </p>

            <p className="font-black mt-6 mb-2">WHEREAS:</p>
            <ol className="list-[upper-alpha] list-outside ml-6 space-y-2 mb-6">
              <li>The Advertiser desires to engage the Creator to perform certain influencer marketing and content creation services in connection with their digital campaign.</li>
              <li>The Creator represents that they possess the requisite skill, audience reach, and expertise to perform such services and agrees to render the same subject to the terms and conditions set forth herein.</li>
            </ol>

            <p className="font-black mt-6 mb-4">NOW, THEREFORE, in consideration of the mutual covenants and promises herein contained, the Parties hereby agree as follows:</p>

            {/* Structured Clauses */}
            <div className="space-y-6">
              
              <div className="pl-6 relative">
                <span className="absolute left-0 font-black text-[#364522]">1.</span>
                <h4 className="font-black uppercase tracking-wide text-[#111827] mb-2">Scope of Work & Deliverables</h4>
                <p><strong>1.1</strong> The Creator agrees to independently produce, edit, and publish <strong className="bg-[#fef3c7] text-[#92400e] px-1.5 py-0.5 border border-[#f59e0b] rounded shadow-sm">{deliverableType}</strong> (the "Content") for the Advertiser's marketing campaign titled <strong>"{campaignTitle}"</strong>.</p>
                <p className="mt-2"><strong>1.2</strong> The Creator shall submit the Content for Proof-of-Delivery (PoD) verification no later than <strong className="underline decoration-2 underline-offset-2">{productionDays} calendar days</strong> from the Escrow Lock Date.</p>
                <p className="mt-2"><strong>1.3</strong> The Creator agrees to incorporate up to <strong>two (2) rounds of reasonable revisions</strong> upon the Advertiser's request prior to final publication, at no additional charge.</p>
              </div>

              <div className="pl-6 relative">
                <span className="absolute left-0 font-black text-[#364522]">2.</span>
                <h4 className="font-black uppercase tracking-wide text-[#111827] mb-2">Consideration & Escrow Mechanism</h4>
                <p><strong>2.1</strong> In full consideration for the services rendered, the Advertiser shall deposit the gross sum of <strong className="bg-[#dcfce7] text-[#166534] px-1.5 py-0.5 border border-[#22c55e] rounded shadow-sm">{formatRupee(Number(amount) || 0)}</strong> into a designated RazorpayX nodal escrow account (the "Escrow Account") upon execution of this Agreement.</p>
                <p className="mt-2"><strong>2.2</strong> Funds shall be disbursed to the Creator's designated bank account automatically upon AI-verified Proof-of-Delivery (PoD) and clearance of the 48-hour dispute window.</p>
                <p className="mt-2"><strong>2.3</strong> All payments are subject to Tax Deducted at Source (TDS) at the applicable rate (currently <strong>10% under Section 194J</strong> of the Income Tax Act, 1961). The Advertiser assumes full liability for remittance of such TDS and issuance of Form 16A.</p>
              </div>

              <div className="pl-6 relative">
                <span className="absolute left-0 font-black text-[#364522]">3.</span>
                <h4 className="font-black uppercase tracking-wide text-[#111827] mb-2">Strict Liability: ASCI Compliance & Disclosure</h4>
                <p><strong>3.1</strong> The Creator acknowledges their statutory obligation under the Advertising Standards Council of India (ASCI) guidelines and Consumer Protection Act, 2019.</p>
                <p className="mt-2"><strong>3.2</strong> The Creator <span className="underline decoration-red-700 font-black decoration-2">shall prominently feature</span> clear disclosure tags including "#ad", "#sponsored", or "Paid Partnership" within the first three lines of the caption or prominently within the visual media. Failure to adhere shall constitute a material breach, triggering automated withholding of escrow funds.</p>
              </div>

              <div className="pl-6 relative">
                <span className="absolute left-0 font-black text-[#364522]">4.</span>
                <h4 className="font-black uppercase tracking-wide text-[#111827] mb-2">Exclusivity & Non-Compete</h4>
                <p><strong>4.1</strong> The Creator covenants that they shall not endorse, promote, or publish content for any direct market competitor of the Advertiser for a period of <strong>thirty (30) days prior to and thirty (30) days following</strong> the publication date of the Content.</p>
              </div>

              <div className="pl-6 relative">
                <span className="absolute left-0 font-black text-[#364522]">5.</span>
                <h4 className="font-black uppercase tracking-wide text-[#111827] mb-2">Intellectual Property & Licensing</h4>
                <p><strong>5.1</strong> The Creator retains all underlying right, title, and interest in their intellectual property. Upon full payment, the Advertiser is hereby granted a worldwide, royalty-free, non-exclusive license to amplify, repurpose, and distribute the Content across their owned digital platforms for a period of <strong>ninety (90) days</strong>.</p>
              </div>

              <div className="pl-6 relative">
                <span className="absolute left-0 font-black text-[#364522]">6.</span>
                <h4 className="font-black uppercase tracking-wide text-[#111827] mb-2">Cancellation & Kill Fee</h4>
                <p><strong>6.1</strong> In the event the Advertiser terminates this Agreement without cause subsequent to the Escrow Lock but prior to Content submission, the Creator shall be entitled to a liquidated damages sum (the "Kill Fee") equal to <strong>twenty-five percent (25%)</strong> of the total consideration. Such Kill Fee shall be automatically deducted from the Escrow Account and remitted to the Creator.</p>
              </div>

              <div className="pl-6 relative">
                <span className="absolute left-0 font-black text-[#364522]">7.</span>
                <h4 className="font-black uppercase tracking-wide text-[#111827] mb-2">Data Privacy & Protection (DPDP Act, 2023)</h4>
                <p><strong>7.1</strong> The Parties mutually agree to process any personal data strictly in adherence with the Digital Personal Data Protection Act, 2023 (DPDP Act). CreatorStack acts merely as a technological intermediary and Data Fiduciary to facilitate escrow and execution, bound by strict confidentiality constraints.</p>
              </div>

              <div className="pl-6 relative">
                <span className="absolute left-0 font-black text-[#364522]">8.</span>
                <h4 className="font-black uppercase tracking-wide text-[#111827] mb-2">Governing Law & Dispute Resolution</h4>
                <p><strong>8.1</strong> This Agreement shall be construed in accordance with the laws of the Republic of India.</p>
                <p className="mt-2"><strong>8.2</strong> Any dispute, controversy, or claim arising out of or relating to this Agreement, or the breach thereof, shall initially be subjected to mandatory mediation via CreatorStack's internal tribunal. Should mediation fail, the dispute shall be subject to the exclusive jurisdiction of the competent courts in <strong>Bengaluru, Karnataka</strong>.</p>
              </div>
            </div>
          </div>

          <p className="font-black text-[#111827] mt-8 mb-6 text-center">IN WITNESS WHEREOF, the Parties hereto have electronically executed this Agreement as of the Effective Date.</p>

          {/* Signature Block */}
          <div className="mt-6 pt-8 border-t-[3px] border-[#364522] grid grid-cols-2 gap-10">
            <div className="bg-[#fcfaf5] p-4 border border-[#d6cfad] shadow-inner">
              <p className="text-[10px] font-black text-[#364522] uppercase tracking-[0.2em] mb-4 text-center">For & On Behalf of Advertiser</p>
              {brandSignedAt ? (
                <>
                  <div className="font-serif italic text-2xl text-[#111827] border-b border-[#9ca3af] pb-2 text-center">
                    {brandName || 'Advertiser'}
                  </div>
                  <p className="text-[9px] font-bold text-[#4b5563] mt-2 text-center tracking-widest uppercase">
                    Authenticated Signature via OAUTH<br/>
                    {formatDateDDMMYY(new Date(brandSignedAt))}
                  </p>
                </>
              ) : (
                <>
                  <div className="font-serif italic text-2xl text-[#9ca3af] border-b border-dashed border-[#9ca3af] pb-2 text-center">
                    Awaiting Execution
                  </div>
                  <p className="text-[9px] font-bold text-[#4b5563] mt-2 text-center tracking-widest uppercase">
                    Pending Escrow Lock
                  </p>
                </>
              )}
            </div>

            <div className="bg-[#fcfaf5] p-4 border border-[#d6cfad] shadow-inner">
              <p className="text-[10px] font-black text-[#364522] uppercase tracking-[0.2em] mb-4 text-center">For & On Behalf of Creator</p>
              {creatorSignedAt && creatorSignatureName ? (
                <>
                  <div className="font-serif italic text-2xl text-[#111827] border-b border-[#9ca3af] pb-2 text-center">
                    {creatorSignatureName}
                  </div>
                  <p className="text-[9px] font-bold text-[#4b5563] mt-2 text-center tracking-widest uppercase">
                    Digitally Signed<br/>
                    {formatDateDDMMYY(new Date(creatorSignedAt))}
                  </p>
                </>
              ) : creatorSignatureName ? (
                <>
                  <div className="font-serif italic text-2xl text-[#111827] border-b border-[#9ca3af] pb-2 text-center opacity-50">
                    {creatorSignatureName}
                  </div>
                  <p className="text-[9px] font-bold text-[#d97706] mt-2 text-center tracking-widest uppercase animate-pulse">
                    Previewing Signature...
                  </p>
                </>
              ) : (
                <>
                  <div className="font-serif italic text-2xl text-[#9ca3af] border-b border-dashed border-[#9ca3af] pb-2 text-center">
                    Awaiting Execution
                  </div>
                  <p className="text-[9px] font-bold text-[#4b5563] mt-2 text-center tracking-widest uppercase">
                    Pending Digital Signature
                  </p>
                </>
              )}
            </div>
          </div>

          {/* TDS Footer Notice */}
          <div className="mt-8 bg-[#fef3c7] border-l-4 border-[#f59e0b] p-4 shadow-sm text-xs text-[#92400e] leading-relaxed">
            <strong className="uppercase tracking-widest text-[#b45309]">Statutory Tax Warning (Sec 194J):</strong> By executing this agreement, the Advertiser affirms absolute liability to deduct 10% TDS on the total gross invoice amount, deposit the same with the Income Tax Department within the statutory timelines, and issue Form 16A to the Creator's registered PAN. CreatorStack Platform assumes no liability for tax non-compliance.
          </div>

          {/* Bottom bar */}
          <div className="mt-6 text-center text-[10px] font-bold text-[#6b5f2e] border-t border-[#c8b97a] pt-3 uppercase tracking-[0.15em]">
            System Generated Immutable Contract • Block Hash: 0x{campaignId?.substring(0, 8).toUpperCase()}... • Timestamp: {new Date().toISOString()}
          </div>

        </div>
      </div>
    </div>
  );
}
