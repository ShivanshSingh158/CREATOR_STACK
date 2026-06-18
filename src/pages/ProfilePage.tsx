import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dummyCreators, dummyBrands } from '../utils/dummyData';

export default function ProfilePage() {
  const { userRole, currentUser } = useAuth();
  const [editing, setEditing] = useState(false);

  // Mocking profile data based on role
  const creatorData = dummyCreators[0];
  const brandData = dummyBrands[0];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="card overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-brand-500 to-brand-700"></div>
        <div className="px-8 pb-8 relative">
          <div className="flex justify-between items-end -mt-12 mb-6">
            <div className="h-24 w-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-sm flex items-center justify-center text-3xl text-brand-600 font-bold">
              {userRole === 'creator' ? creatorData.name.charAt(0) : brandData.name.charAt(0)}
            </div>
            <button onClick={() => setEditing(!editing)} className="btn-secondary">
              {editing ? 'Save Profile' : 'Edit Profile'}
            </button>
          </div>

          {userRole === 'creator' ? (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{creatorData.name}</h1>
              <p className="text-brand-600 font-medium mb-4">{creatorData.niche} Creator</p>
              
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Bio</h2>
                {editing ? (
                  <textarea className="input-field" defaultValue={creatorData.bio} rows={3} />
                ) : (
                  <p className="text-gray-700">{creatorData.bio}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6 p-6 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Followers</p>
                  <p className="text-2xl font-bold text-gray-900">{creatorData.followers}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Engagement Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{creatorData.engagementRate}</p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{brandData.name}</h1>
              <div className="flex gap-2 items-center mb-4">
                <span className="text-gray-500">{brandData.website}</span>
                <span className="bg-brand-100 text-brand-800 text-xs px-2 py-0.5 rounded-full font-medium">{brandData.industry}</span>
              </div>
              
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Company Description</h2>
                {editing ? (
                  <textarea className="input-field" defaultValue={brandData.description} rows={3} />
                ) : (
                  <p className="text-gray-700">{brandData.description}</p>
                )}
              </div>

              <div className="p-6 bg-green-50 rounded-xl border border-green-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800 mb-1">Platform Trust Score</p>
                  <p className="text-sm text-green-600">Verified Brand Entity</p>
                </div>
                <div className="text-3xl font-bold text-green-700">{brandData.trustScore}/100</div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Account Details</h2>
            <div className="text-sm text-gray-600">
              <p className="mb-2"><span className="font-medium text-gray-900">Email:</span> {currentUser?.email || 'demo@creatorstack.com'}</p>
              <p><span className="font-medium text-gray-900">Account Type:</span> {userRole === 'creator' ? 'Creator' : 'Brand Sponsor'}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
