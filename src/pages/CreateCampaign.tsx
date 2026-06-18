import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

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
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (auth.app.options.apiKey !== "YOUR_API_KEY") {
      try {
        await addDoc(collection(db, 'campaigns'), {
          ...formData,
          brandId: currentUser?.uid,
          brandName: currentUser?.email?.split('@')[0] || 'Brand',
          createdAt: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error adding document: ", error);
        alert("Failed to create campaign. See console.");
      }
    } else {
      // Mock save
      console.log("Mock saved:", formData);
    }
    
    setLoading(false);
    navigate('/brand-dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Campaign</h1>
        <p className="text-sm text-gray-500">Publish a campaign to start receiving applications from creators.</p>
      </div>

      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Campaign Title</label>
            <input type="text" name="title" required value={formData.title} onChange={handleChange} className="input-field mt-1" placeholder="e.g. Diwali Mega Sale Promotion" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea name="description" required rows={4} value={formData.description} onChange={handleChange} className="input-field mt-1" placeholder="Describe the campaign goals and what you expect from the creator..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Budget</label>
              <input type="text" name="budget" required value={formData.budget} onChange={handleChange} className="input-field mt-1" placeholder="e.g. ₹50,000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Deadline</label>
              <input type="date" name="deadline" required value={formData.deadline} onChange={handleChange} className="input-field mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Deliverables</label>
              <input type="text" name="deliverables" required value={formData.deliverables} onChange={handleChange} className="input-field mt-1" placeholder="e.g. 1 YouTube Video, 2 Reels" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Creator Niche</label>
              <select name="niche" value={formData.niche} onChange={handleChange} className="input-field mt-1">
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

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-4">
            <button type="button" onClick={() => navigate('/brand-dashboard')} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Publishing...' : 'Publish Campaign'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
