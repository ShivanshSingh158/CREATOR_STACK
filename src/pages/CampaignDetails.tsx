import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dummyCampaigns } from '../utils/dummyData';
import { useAuth } from '../contexts/AuthContext';

export default function CampaignDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [applied, setApplied] = useState(false);

  const campaign = dummyCampaigns.find(c => c.id === id) || dummyCampaigns[0];

  if (!campaign) {
    return <div className="text-center py-20">Campaign not found</div>;
  }

  const handleApply = () => {
    setApplied(true);
    alert('Applied successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button onClick={() => navigate(-1)} className="text-brand-600 hover:text-brand-700 text-sm font-medium mb-6 flex items-center">
        &larr; Back
      </button>

      <div className="card overflow-hidden">
        <div className="bg-brand-600 px-8 py-10 text-white">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">{campaign.niche}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{campaign.title}</h1>
          <p className="text-brand-100 text-lg">by {campaign.brandName}</p>
        </div>
        
        <div className="p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">About the Campaign</h2>
          <p className="text-gray-600 mb-8 whitespace-pre-line">{campaign.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Budget</p>
              <p className="text-lg font-semibold text-gray-900">{campaign.budget}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Deadline</p>
              <p className="text-lg font-semibold text-gray-900">{campaign.deadline}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Deliverables</p>
              <p className="text-lg font-semibold text-gray-900">{campaign.deliverables}</p>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-100">
            {userRole === 'creator' && (
              applied ? (
                <button disabled className="btn-primary flex-1 opacity-50 cursor-not-allowed">Application Submitted</button>
              ) : (
                <button onClick={handleApply} className="btn-primary flex-1">Apply for this Campaign</button>
              )
            )}
            {userRole === 'brand' && (
              <button className="btn-secondary flex-1">Edit Campaign</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
