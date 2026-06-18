import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BrandOnboarding() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSaveAndContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate setting up brand trust score
    setTimeout(() => {
      setLoading(false);
      navigate('/brand-dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-matte-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-matte-900 uppercase">Brand Verification</h2>
          <p className="mt-2 text-matte-800">Set up your brand profile to unlock access to our verified creator network.</p>
        </div>

        <div className="card bg-white shadow-brutal p-8">
          <form onSubmit={handleSaveAndContinue} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-matte-900 uppercase tracking-wide mb-2">Company Name</label>
              <input type="text" required placeholder="e.g. Acme Corp" className="input-field" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-matte-900 uppercase tracking-wide mb-2">Company Website</label>
              <input type="url" required placeholder="https://acmecorp.com" className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-bold text-matte-900 uppercase tracking-wide mb-2">Industry</label>
              <select className="input-field">
                <option>Technology & SaaS</option>
                <option>Fintech</option>
                <option>D2C E-commerce</option>
                <option>EdTech</option>
                <option>FMCG</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-matte-900 uppercase tracking-wide mb-2">Estimated Annual Influencer Budget</label>
              <select className="input-field">
                <option>₹1 Lakh - ₹5 Lakhs</option>
                <option>₹5 Lakhs - ₹20 Lakhs</option>
                <option>₹20 Lakhs - ₹1 Crore</option>
                <option>₹1 Crore+</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-lg">
              {loading ? 'Verifying...' : 'Complete Setup & Go to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
