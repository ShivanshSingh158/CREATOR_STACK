import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { dummyCampaigns } from '../utils/dummyData';
import { useAuth } from '../contexts/AuthContext';

export default function CreatorDashboard() {
  const { currentUser } = useAuth();
  const [appliedCampaigns, setAppliedCampaigns] = useState<string[]>([]);

  const handleApply = (id: string) => {
    if (!appliedCampaigns.includes(id)) {
      setAppliedCampaigns([...appliedCampaigns, id]);
      alert('Application submitted successfully!');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Creator Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back, {currentUser?.email || 'Creator'}!</p>
        </div>
        <Link to="/profile" className="btn-secondary">Edit Profile</Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-500">Active Campaigns</p>
          <p className="mt-2 text-3xl font-semibold text-brand-600">2</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-500">Applied Campaigns</p>
          <p className="mt-2 text-3xl font-semibold text-brand-600">{appliedCampaigns.length}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-500">Total Earnings</p>
          <p className="mt-2 text-3xl font-semibold text-brand-600">₹1,20,000</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-500">Creator Score</p>
          <p className="mt-2 text-3xl font-semibold text-brand-600">94/100</p>
        </div>
      </div>

      {/* Campaign Feed */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Available Campaigns</h2>
        <div className="space-y-4">
          {dummyCampaigns.map(campaign => (
            <div key={campaign.id} className="card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 border-l-brand-500">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-brand-600">{campaign.brandName}</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{campaign.niche}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{campaign.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{campaign.description}</p>
                <div className="flex gap-4 mt-3 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {campaign.budget}
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    Deadline: {campaign.deadline}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
                <Link to={`/campaign/${campaign.id}`} className="btn-secondary w-full sm:w-auto text-center">
                  View Details
                </Link>
                {appliedCampaigns.includes(campaign.id) ? (
                  <button disabled className="btn-primary w-full sm:w-auto opacity-50 cursor-not-allowed">
                    Applied
                  </button>
                ) : (
                  <button onClick={() => handleApply(campaign.id)} className="btn-primary w-full sm:w-auto">
                    Apply Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
