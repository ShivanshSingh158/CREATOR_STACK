import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../auth/AuthContext';
import { ArrowLeft } from 'lucide-react';

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
    niche: 'Technology'
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
            niche: data.niche || 'Technology'
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
      <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-[3px] border-[#d1b07c] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[#6b7280] font-medium">Loading campaign details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827] font-['Outfit'] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="text-[#9ca3af] hover:text-[#111827] text-sm font-bold uppercase tracking-widest mb-8 flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Campaign
        </button>

        <div className="mb-10">
          <h1 className="text-4xl font-black text-[#111827] tracking-tight mb-2">Edit Campaign</h1>
          <p className="text-lg text-[#6b7280]">Modify your deal terms and push updates to the creator network.</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-10">
            
            {/* Core Details */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#9ca3af] border-b border-[#e5e7eb] pb-3 mb-6">Core Details</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#4b5563] mb-2">Campaign Title</label>
                  <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4 text-[#111827] font-medium focus:outline-none focus:border-[#d1b07c] focus:ring-1 focus:ring-[#d1b07c] transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#4b5563] mb-2">Creative Brief & Goals</label>
                  <textarea name="description" required rows={5} value={formData.description} onChange={handleChange} className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4 text-[#111827] font-medium focus:outline-none focus:border-[#d1b07c] focus:ring-1 focus:ring-[#d1b07c] transition-all resize-none" />
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
                    <input type="text" name="budget" required value={formData.budget} onChange={handleChange} className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg py-4 pl-10 pr-4 text-[#111827] font-bold focus:outline-none focus:border-[#d1b07c] focus:ring-1 focus:ring-[#d1b07c] transition-all" />
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
                  <input type="text" name="deliverables" required value={formData.deliverables} onChange={handleChange} className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4 text-[#111827] font-medium focus:outline-none focus:border-[#d1b07c] focus:ring-1 focus:ring-[#d1b07c] transition-all" />
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
              <button type="button" onClick={() => navigate(-1)} className="w-full sm:w-auto bg-white text-[#4b5563] border border-[#e5e7eb] font-bold py-4 px-8 rounded-lg uppercase tracking-widest text-sm hover:bg-[#f9fafb] transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="w-full sm:w-auto bg-[#d1b07c] text-white font-bold py-4 px-8 rounded-lg uppercase tracking-widest text-sm hover:bg-[#b59560] shadow-md transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
