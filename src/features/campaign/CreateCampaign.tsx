import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useAuth } from '../auth/AuthContext';
import { ArrowLeft, Cpu } from 'lucide-react';

export default function CreateCampaign() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    deliverables: '',
    deadline: '',
    niche: 'Technology'
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
      <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center font-['Outfit'] px-4">
        <div className="w-full max-w-md bg-white p-10 rounded-2xl border border-[#e5e7eb] shadow-lg text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 bg-[#d1b07c] transition-all duration-1000 ease-in-out" style={{ width: `${((mlStep + 1) / mlMessages.length) * 100}%` }}></div>
          <div className="w-20 h-20 bg-[#f9fafb] rounded-full flex items-center justify-center mx-auto mb-8 border border-[#e5e7eb] relative">
            <Cpu className="w-10 h-10 text-[#d1b07c] animate-pulse relative z-10" />
            <div className="absolute inset-0 border-[3px] border-[#d1b07c] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-[#111827] font-black text-2xl tracking-tight mb-2">Engine Active</h2>
          <p className="text-[#d1b07c] font-bold text-sm tracking-widest uppercase animate-pulse">{mlMessages[mlStep]}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827] font-['Outfit'] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/brand-dashboard')} className="text-[#9ca3af] hover:text-[#111827] text-sm font-bold uppercase tracking-widest mb-8 flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Workspace
        </button>

        <div className="mb-10">
          <h1 className="text-4xl font-black text-[#111827] tracking-tight mb-2">Publish Campaign</h1>
          <p className="text-lg text-[#6b7280]">Structure your deal terms and push to the creator network.</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-10">
            
            {/* Core Details */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#9ca3af] border-b border-[#e5e7eb] pb-3 mb-6">Core Details</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#4b5563] mb-2">Campaign Title</label>
                  <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4 text-[#111827] font-medium focus:outline-none focus:border-[#d1b07c] focus:ring-1 focus:ring-[#d1b07c] transition-all" placeholder="e.g. Diwali Mega Sale Promotion" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#4b5563] mb-2">Creative Brief & Goals</label>
                  <textarea name="description" required rows={5} value={formData.description} onChange={handleChange} className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4 text-[#111827] font-medium focus:outline-none focus:border-[#d1b07c] focus:ring-1 focus:ring-[#d1b07c] transition-all resize-none" placeholder="Describe the campaign goals and what you expect from the creator..." />
                </div>
              </div>
            </div>

            {/* Financials & Timeline */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#9ca3af] border-b border-[#e5e7eb] pb-3 mb-6">Financials & Timeline</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-bold text-[#4b5563] mb-2">Total Budget (INR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af] font-bold">₹</span>
                    <input type="text" name="budget" required value={formData.budget} onChange={handleChange} className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg py-4 pl-10 pr-4 text-[#111827] font-bold focus:outline-none focus:border-[#d1b07c] focus:ring-1 focus:ring-[#d1b07c] transition-all" placeholder="50,000" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#4b5563] mb-2">Submission Deadline</label>
                  <input type="date" name="deadline" required value={formData.deadline} onChange={handleChange} className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4 text-[#111827] font-medium focus:outline-none focus:border-[#d1b07c] focus:ring-1 focus:ring-[#d1b07c] transition-all" />
                </div>
              </div>
            </div>

            {/* Matchmaking Parameters */}
            <div>
               <h2 className="text-sm font-bold uppercase tracking-widest text-[#9ca3af] border-b border-[#e5e7eb] pb-3 mb-6">Matchmaking Parameters</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-bold text-[#4b5563] mb-2">Required Deliverables</label>
                  <input type="text" name="deliverables" required value={formData.deliverables} onChange={handleChange} className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4 text-[#111827] font-medium focus:outline-none focus:border-[#d1b07c] focus:ring-1 focus:ring-[#d1b07c] transition-all" placeholder="e.g. 1 YouTube Video, 2 Reels" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#4b5563] mb-2">Target Creator Niche</label>
                  <select name="niche" value={formData.niche} onChange={handleChange} className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4 text-[#111827] font-medium focus:outline-none focus:border-[#d1b07c] focus:ring-1 focus:ring-[#d1b07c] transition-all appearance-none">
                    <option value="Technology">Technology</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Food">Food</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Finance">Finance</option>
                    <option value="Lifestyle">Lifestyle</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-[#e5e7eb] flex flex-col-reverse sm:flex-row justify-end gap-4">
              <button type="button" onClick={() => navigate('/brand-dashboard')} className="w-full sm:w-auto bg-white text-[#4b5563] border border-[#e5e7eb] font-bold py-4 px-8 rounded-lg uppercase tracking-widest text-sm hover:bg-[#f9fafb] transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="w-full sm:w-auto bg-[#d1b07c] text-white font-bold py-4 px-8 rounded-lg uppercase tracking-widest text-sm hover:bg-[#b59560] shadow-md transition-colors disabled:opacity-50">
                {loading ? 'Initializing Engine...' : 'Deploy Campaign'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
