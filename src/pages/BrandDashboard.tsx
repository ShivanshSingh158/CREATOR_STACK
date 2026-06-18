import React from 'react';
import { Link } from 'react-router-dom';
import { dummyCampaigns } from '../utils/dummyData';
import { useAuth } from '../contexts/AuthContext';

export default function BrandDashboard() {
  const { currentUser } = useAuth();
  
  // Filter mock campaigns for this specific brand (assuming they own the first 2 for the demo)
  const myCampaigns = dummyCampaigns.slice(0, 2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brand Dashboard</h1>
          <p className="text-sm text-gray-500">Manage your creator partnerships, {currentUser?.email || 'Brand'}!</p>
        </div>
        <div className="flex gap-4">
          <Link to="/profile" className="btn-secondary">Brand Profile</Link>
          <Link to="/create-campaign" className="btn-primary">Create Campaign</Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-500">Active Campaigns</p>
          <p className="mt-2 text-3xl font-semibold text-brand-600">{myCampaigns.length}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-500">Total Budget Deployed</p>
          <p className="mt-2 text-3xl font-semibold text-brand-600">₹80,000</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-500">Applications Received</p>
          <p className="mt-2 text-3xl font-semibold text-brand-600">47</p>
        </div>
      </div>

      {/* Active Campaigns */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Campaigns</h2>
        {myCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {myCampaigns.map(campaign => (
              <div key={campaign.id} className="card p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{campaign.title}</h3>
                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">Active</span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{campaign.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-500">Budget</p>
                      <p className="font-medium text-gray-900">{campaign.budget}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Deadline</p>
                      <p className="font-medium text-gray-900">{campaign.deadline}</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-brand-600">24</span> Pending Applications
                  </div>
                  <Link to={`/campaign/${campaign.id}`} className="btn-secondary text-sm">
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            <h3 className="text-sm font-medium text-gray-900">No campaigns yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new campaign.</p>
            <div className="mt-6">
              <Link to="/create-campaign" className="btn-primary">
                Create Campaign
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
