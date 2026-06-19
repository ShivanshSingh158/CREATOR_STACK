import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../auth/AuthContext';
import { Building2, Briefcase, IndianRupee } from 'lucide-react';

export default function BrandOnboarding() {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('Technology & SaaS');
  const [budget, setBudget] = useState('₹5 Lakhs - ₹10 Lakhs');
  
  const [corporatePan, setCorporatePan] = useState('');
  const [gstin, setGstin] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleVerifyCorporate = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingStep(0);
    const msgs = ['Routing payload to Signzy Corporate Registry...', 'Validating Section 194J compliance...', 'Confirming legal entity billing address...'];
    
    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < msgs.length) {
        setLoadingStep(current);
      } else {
        clearInterval(interval);
        setLoading(false);
        setStep(3);
      }
    }, 1200);
  };

  const handleProvisionEscrow = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingStep(0);
    const msgs = ['Connecting to RazorpayX API...', 'Provisioning dedicated virtual account pipeline...', 'Activating 1-click escrow deposit routes...'];
    
    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < msgs.length) {
        setLoadingStep(current);
      } else {
        clearInterval(interval);
        finalizeOnboarding();
      }
    }, 1200);
  };

  const finalizeOnboarding = () => {
    if (currentUser) {
      setDoc(doc(db, 'users', currentUser.uid), {
        companyName,
        website,
        industry,
        budget,
        corporatePan,
        gstin,
        profileCompleted: true,
        trustScore: Math.floor(Math.random() * 20) + 80,
        verified: true 
      }, { merge: true }).catch(err => console.error("Error saving brand profile", err));
    }
    
    setTimeout(() => {
      setLoading(false);
      navigate('/brand-dashboard');
    }, 800);
  };

  const renderLoader = (messages: string[]) => (
    <div className="bg-white p-12 text-center flex flex-col items-center rounded-2xl border border-[#e5e7eb] shadow-sm border-t-4 border-t-[#d1b07c]">
      <svg className="animate-spin h-12 w-12 text-[#d1b07c] mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <h3 className="text-xl font-bold text-[#111827] animate-pulse">{messages[loadingStep]}</h3>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9fafb] text-[#111827] font-['Outfit'] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full">
        
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-[#111827] text-[#d1b07c]' : 'bg-gray-200 text-gray-400'}`}>1</div>
            <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-[#111827]' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-[#111827] text-[#d1b07c]' : 'bg-gray-200 text-gray-400'}`}>2</div>
            <div className={`w-16 h-0.5 ${step >= 3 ? 'bg-[#111827]' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 3 ? 'bg-[#111827] text-[#d1b07c]' : 'bg-gray-200 text-gray-400'}`}>3</div>
          </div>
        </div>

        {/* Step 1: Corporate Profile Setup */}
        {step === 1 && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-black text-[#111827] tracking-tight">Corporate Workspace</h2>
              <p className="mt-3 text-lg text-[#6b7280]">Establish your entity to access the verified creator network.</p>
            </div>
            <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-8 sm:p-10">
              <form onSubmit={handleStep1} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#4b5563] mb-2">Company Name</label>
                  <input type="text" required placeholder="e.g. Acme Corp" className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 text-[#111827] focus:outline-none focus:border-[#d1b07c] focus:ring-1 focus:ring-[#d1b07c] transition-all" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#4b5563] mb-2">Company Website</label>
                  <input type="url" required placeholder="https://acmecorp.com" className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 text-[#111827] focus:outline-none focus:border-[#d1b07c] focus:ring-1 focus:ring-[#d1b07c] transition-all" value={website} onChange={e => setWebsite(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#4b5563] mb-2">Industry</label>
                  <select className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 text-[#111827] focus:outline-none focus:border-[#d1b07c] focus:ring-1 focus:ring-[#d1b07c] transition-all appearance-none" value={industry} onChange={e => setIndustry(e.target.value)}>
                    <option>Technology & SaaS</option>
                    <option>Fintech & BFSI</option>
                    <option>D2C E-commerce</option>
                    <option>EdTech & Education</option>
                    <option>FMCG & Consumer Goods</option>
                    <option>Fashion & Apparel</option>
                    <option>Beauty & Cosmetics</option>
                    <option>Food & Beverage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#4b5563] mb-2">Annual Influencer Budget</label>
                  <select className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 text-[#111827] focus:outline-none focus:border-[#d1b07c] focus:ring-1 focus:ring-[#d1b07c] transition-all appearance-none" value={budget} onChange={e => setBudget(e.target.value)}>
                    <option>₹5,000 - ₹50,000</option>
                    <option>₹50,000 - ₹1 Lakh</option>
                    <option>₹1 Lakh - ₹5 Lakhs</option>
                    <option>₹5 Lakhs - ₹10 Lakhs</option>
                    <option>₹10 Lakhs+</option>
                  </select>
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-[#111827] text-[#d1b07c] font-bold py-4 rounded-lg uppercase tracking-widest text-sm hover:bg-black shadow-md transition-colors">
                    Continue to Legal Verification
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Step 2: Legal Entity Verification */}
        {step === 2 && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-[#d1b07c]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#d1b07c]">
                <Building2 className="w-8 h-8" />
              </div>
              <h2 className="text-4xl font-black text-[#111827] tracking-tight">Corporate Verification</h2>
              <p className="mt-3 text-lg text-[#6b7280]">Ensure compliance under Section 194J (TDS routing).</p>
            </div>
            {loading ? renderLoader([
              'Routing payload to Signzy Corporate Registry...',
              'Validating Section 194J compliance...',
              'Confirming legal entity billing address...'
            ]) : (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-8 sm:p-10">
                <div className="mb-8 bg-[#f9fafb] p-4 rounded-lg border border-[#e5e7eb] text-sm text-[#4b5563] font-medium flex gap-3">
                  <Briefcase className="w-5 h-5 text-[#d1b07c] shrink-0" />
                  <span>We verify Corporate PAN & GSTIN to automate future 10% TDS withholding requirements via our escrow systems.</span>
                </div>
                <form onSubmit={handleVerifyCorporate} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-[#4b5563] mb-2">Corporate PAN</label>
                    <input type="text" required placeholder="ABCDE1234F" className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 text-[#111827] uppercase focus:outline-none focus:border-[#d1b07c] focus:ring-1 focus:ring-[#d1b07c] transition-all" maxLength={10} value={corporatePan} onChange={e => setCorporatePan(e.target.value.toUpperCase())} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#4b5563] mb-2">Corporate GSTIN</label>
                    <input type="text" required placeholder="22AAAAA0000A1Z5" className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 text-[#111827] uppercase focus:outline-none focus:border-[#d1b07c] focus:ring-1 focus:ring-[#d1b07c] transition-all" maxLength={15} value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())} />
                  </div>
                  <div className="pt-4">
                    <button type="submit" className="w-full bg-[#111827] text-[#d1b07c] font-bold py-4 rounded-lg uppercase tracking-widest text-sm hover:bg-black shadow-md transition-colors">
                      Validate Entity via Signzy
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Escrow Provisioning */}
        {step === 3 && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-10">
               <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                <IndianRupee className="w-8 h-8" />
              </div>
              <h2 className="text-4xl font-black text-[#111827] tracking-tight">Escrow Provisioning</h2>
              <p className="mt-3 text-lg text-[#6b7280]">Setup your secure financial pipeline for smart contracts.</p>
            </div>
            {loading ? renderLoader([
              'Connecting to RazorpayX API...',
              'Provisioning dedicated virtual account pipeline...',
              'Activating 1-click escrow deposit routes...'
            ]) : (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-8 sm:p-12 text-center">
                <h3 className="text-2xl font-black text-[#111827] mb-4">Initialize Virtual Account</h3>
                <p className="text-[#6b7280] mb-10 text-lg">This enables you to deposit campaign capital directly into secure escrow routes with a single click.</p>
                <form onSubmit={handleProvisionEscrow}>
                  <button type="submit" className="w-full bg-[#d1b07c] text-[#111827] font-black py-4 rounded-lg uppercase tracking-widest text-sm hover:bg-[#b59560] shadow-md transition-colors">
                    Provision Escrow Pipeline
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
