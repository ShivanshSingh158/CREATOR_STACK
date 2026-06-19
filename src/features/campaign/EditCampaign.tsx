import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../auth/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { NICHES } from '../../utils/niches';

export default function EditCampaign() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    deliverables: '',
    deadline: '',
    niche: NICHES[0]
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'campaigns', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            title: data.title || '',
            description: data.description || '',
            budget: data.budget || '',
            deliverables: data.deliverables || '',
            deadline: data.deadline || '',
            niche: data.niche || NICHES[0]
          });
        }
      } catch (error) {
        console.error("Error fetching campaign:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaign();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'campaigns', id), {
        ...formData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating campaign', error);
    }
    setSaving(false);
    navigate(`/campaign/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex flex-col items-center justify-center p-6 font-['Inter']">
        <div className="w-10 h-10 border-[4px] border-indigo-600 border-t-transparent rounded-full animate-spin shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"></div>
        <p className="mt-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest animate-pulse">Loading campaign details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] text-black font-['Inter'] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate(-1)} className="text-black hover:text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-8 flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> BACK TO CAMPAIGN
        </button>

        <div className="mb-10">
          <h1 className="text-4xl font-black text-black tracking-tight mb-2 uppercase">Edit Campaign</h1>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Modify your deal terms and push updates to the creator network.</p>
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
                    <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full bg-white border-2 border-black rounded-lg p-3.5 text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-400 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Creative Brief & Goals</label>
                    <textarea name="description" required rows={7} value={formData.description} onChange={handleChange} className="w-full bg-white border-2 border-black rounded-lg p-3.5 text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all resize-none placeholder:text-gray-400 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest" />
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
                        <input type="text" name="budget" required value={formData.budget} onChange={handleChange} className="w-full bg-white border-2 border-black rounded-lg py-3.5 pl-10 pr-4 text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-400" />
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
                      <input type="text" name="deliverables" required value={formData.deliverables} onChange={handleChange} className="w-full bg-white border-2 border-black rounded-lg p-3.5 text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-400 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest" />
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

            <div className="pt-8 mt-8 border-t-2 border-black flex flex-col-reverse sm:flex-row justify-end gap-4">
              <button type="button" onClick={() => navigate(-1)} className="w-full sm:w-auto bg-gray-100 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black py-4 px-8 rounded uppercase tracking-widest text-[10px] hover:bg-gray-200 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all">
                CANCEL
              </button>
              <button type="submit" disabled={saving} className="w-full sm:w-auto bg-indigo-600 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black py-4 px-8 rounded uppercase tracking-widest text-[10px] hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? (
                   <>
                     <div className="w-3 h-3 border-[2px] border-white border-t-transparent rounded-full animate-spin"></div>
                     SAVING...
                   </>
                ) : 'SAVE CHANGES'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
