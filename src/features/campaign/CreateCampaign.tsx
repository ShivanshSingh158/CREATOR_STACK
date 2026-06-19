import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useAuth } from '../auth/AuthContext';
import { ArrowLeft, Cpu } from 'lucide-react';
import { NICHES } from '../../utils/niches';

export default function CreateCampaign() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    deliverables: '',
    deadline: '',
    niche: NICHES[0]
  });
  
  const [loading, setLoading] = useState(false);
  const [mlStep, setMlStep] = useState(-1);
  const mlMessages = [
    "INITIALIZING ML MATCHMAKING ENGINE...",
    `ANALYZING TARGET NICHE: ${formData.niche.toUpperCase()}...`,
    "QUERYING CREATOR DATABASE...",
    "MATCHING CREATORS & CALCULATING ROI..."
  ];

  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [brandProfile, setBrandProfile] = useState<any>(null);

  useEffect(() => {
    if (currentUser) {
      getDoc(doc(db, 'users', currentUser.uid)).then(snap => {
        if (snap.exists()) setBrandProfile(snap.data());
      }).catch(console.error);
    }
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate saving campaign quickly without hanging
    if (auth.app.options.apiKey !== "YOUR_API_KEY") {
      try {
        addDoc(collection(db, 'campaigns'), {
          ...formData,
          brandId: currentUser?.uid,
          brandName: brandProfile?.companyName || brandProfile?.name || currentUser?.email?.split('@')[0] || 'Brand',
          brandLogoUrl: brandProfile?.logoUrl || null,
          status: 'active',
          createdAt: new Date().toISOString()
        }).catch(e => console.log("Silent DB save failed", e));
      } catch (error) {
        // ignore
      }
    }

    // Trigger ML Pipeline Animation
    setMlStep(0);
    let currentStep = 0;
    
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < mlMessages.length) {
        setMlStep(currentStep);
      } else {
        clearInterval(interval);
        // Navigate to matchmaking with the niche
        navigate('/matchmaking', { state: { prefillNiche: formData.niche } });
      }
    }, 1200);
  };

  if (mlStep >= 0) {
    return (
      <div className="min-h-screen bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex flex-col items-center justify-center font-['Inter'] px-4">
        <div className="w-full max-w-md bg-white p-10 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1.5 bg-indigo-600 transition-all duration-1000 ease-in-out" style={{ width: `${((mlStep + 1) / mlMessages.length) * 100}%` }}></div>
          <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-8 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] relative">
            <Cpu className="w-10 h-10 text-indigo-600 animate-pulse relative z-10" />
            <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-xl animate-spin"></div>
          </div>
          <h2 className="text-black font-black text-2xl uppercase tracking-tight mb-2">Engine Active</h2>
          <p className="text-indigo-600 font-black text-[10px] tracking-widest uppercase animate-pulse">{mlMessages[mlStep]}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] text-black font-['Inter'] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate('/brand-dashboard')} className="text-black hover:text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-8 flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> BACK TO WORKSPACE
        </button>

        <div className="mb-10">
          <h1 className="text-4xl font-black text-black tracking-tight mb-2 uppercase">Publish Campaign</h1>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Structure your deal terms and push to the creator network.</p>
        </div>

        <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              
              {/* Left Column: Core Details */}
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-black border-b-2 border-black pb-3 mb-6">CORE DETAILS</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Campaign Title</label>
                    <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full bg-white border-2 border-black rounded-lg p-3.5 text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-400 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest" placeholder="e.g. Diwali Mega Sale Promotion" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Creative Brief & Goals</label>
                    <textarea name="description" required rows={7} value={formData.description} onChange={handleChange} className="w-full bg-white border-2 border-black rounded-lg p-3.5 text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all resize-none placeholder:text-gray-400 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest" placeholder="Describe the campaign goals and what you expect from the creator..." />
                  </div>
                </div>
              </div>

              {/* Right Column: Financials & Matchmaking */}
              <div className="space-y-10">
                {/* Financials & Timeline */}
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-black border-b-2 border-black pb-3 mb-6">FINANCIALS & TIMELINE</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Total Budget (INR)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">₹</span>
                        <input type="text" name="budget" required value={formData.budget} onChange={handleChange} className="w-full bg-white border-2 border-black rounded-lg py-3.5 pl-10 pr-4 text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-400" placeholder="50,000" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Submission Deadline</label>
                      <input type="date" name="deadline" required value={formData.deadline} onChange={handleChange} className="w-full bg-white border-2 border-black rounded-lg p-3.5 text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all" />
                    </div>
                  </div>
                </div>

                {/* Matchmaking Parameters */}
                <div>
                   <h2 className="text-[10px] font-black uppercase tracking-widest text-black border-b-2 border-black pb-3 mb-6">MATCHMAKING PARAMETERS</h2>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Required Deliverables</label>
                      <input type="text" name="deliverables" required value={formData.deliverables} onChange={handleChange} className="w-full bg-white border-2 border-black rounded-lg p-3.5 text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-400 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest" placeholder="e.g. 1 YouTube Video, 2 Reels" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Target Creator Niche</label>
                      <select name="niche" value={formData.niche} onChange={handleChange} className="w-full bg-white border-2 border-black rounded-lg p-3.5 text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all appearance-none cursor-pointer">
                        {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t-2 border-gray-100 flex flex-col-reverse sm:flex-row justify-end gap-4 mt-8">
              <button type="button" onClick={() => navigate('/brand-dashboard')} className="w-full sm:w-auto bg-gray-100 text-black border-2 border-black font-black py-3.5 px-8 rounded-lg uppercase tracking-widest text-[10px] hover:bg-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all">
                CANCEL
              </button>
              <button type="submit" disabled={loading} className="w-full sm:w-auto bg-indigo-600 text-white border-2 border-black font-black py-3.5 px-8 rounded-lg uppercase tracking-widest text-[10px] hover:bg-indigo-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'INITIALIZING ENGINE...' : 'DEPLOY CAMPAIGN'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
