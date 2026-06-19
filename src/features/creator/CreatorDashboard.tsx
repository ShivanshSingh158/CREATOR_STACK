import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { type ValuationOutput } from '../../utils/valuationEngine';
import { formatDateDDMMYY, formatRupee } from '../../utils/formatters';
import { collection, getDocs, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../../firebase';

export default function CreatorDashboard() {
  const { currentUser } = useAuth();
  const [appliedCampaigns, setAppliedCampaigns] = useState<string[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignForApply, setSelectedCampaignForApply] = useState<any>(null);
  const [pitchMessage, setPitchMessage] = useState('');
  const [applying, setApplying] = useState(false);
  
  const location = useLocation();
  const valuation = location.state?.valuation as ValuationOutput | undefined;

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'campaigns'));
        const fetchedCampaigns = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        fetchedCampaigns.sort((a: any, b: any) => {
          if (a.createdAt && b.createdAt) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          return 0;
        });

        setCampaigns(fetchedCampaigns);

        if (currentUser) {
          const appsQuery = query(collection(db, 'applications'), where('creatorId', '==', currentUser.uid));
          const appsSnap = await getDocs(appsQuery);
          const appliedIds = appsSnap.docs.map(doc => doc.data().campaignId);
          setAppliedCampaigns(appliedIds);
        }
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      }
    };
    fetchCampaigns();
  }, [currentUser]);

  const submitApplication = async () => {
    if (!currentUser || !selectedCampaignForApply) return;
    setApplying(true);
    try {
      await addDoc(collection(db, 'applications'), {
        campaignId: selectedCampaignForApply.id,
        creatorId: currentUser.uid,
        status: 'pending',
        type: 'inbound',
        appliedAt: serverTimestamp()
      });
      
      if (pitchMessage.trim()) {
        const chatRef = await addDoc(collection(db, 'chats'), {
          campaignId: selectedCampaignForApply.id,
          creatorId: currentUser.uid,
          brandId: selectedCampaignForApply.brandId,
          initiatedBy: 'creator',
          lastMessage: pitchMessage,
          lastMessageAt: serverTimestamp(),
          status: 'active'
        });

        await addDoc(collection(db, 'messages'), {
          chatId: chatRef.id,
          senderId: currentUser.uid,
          senderRole: 'creator',
          text: pitchMessage,
          timestamp: serverTimestamp()
        });
      }

      setAppliedCampaigns([...appliedCampaigns, selectedCampaignForApply.id]);
      setSelectedCampaignForApply(null);
      setPitchMessage('');
      alert('Application submitted successfully!');
    } catch (error) {
      console.error("Error applying to campaign:", error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setApplying(false);
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
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Fair Base Rate</p>
          <p className="mt-2 text-3xl font-black text-brand-600">
            {valuation ? `₹${valuation.fair_rate_card.base_integration_fee.toLocaleString()}` : '₹50,000'}
          </p>
        </div>
        <div className="card p-6 border-red-100 bg-red-50/30">
          <p className="text-sm font-medium text-red-500 uppercase tracking-wider">Annual Leakage</p>
          <p className="mt-2 text-3xl font-black text-red-600">
            {valuation ? `-₹${valuation.revenue_leakage_annual.toLocaleString()}` : '-₹0'}
          </p>
        </div>
      </div>

      {/* Campaign Feed */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Available Campaigns</h2>
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <p className="text-gray-500">Loading campaigns...</p>
          ) : campaigns.map(campaign => (
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
                    {formatRupee(campaign.budget)}
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    Deadline: {formatDateDDMMYY(campaign.deadline)}
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
                  <button onClick={() => setSelectedCampaignForApply(campaign)} className="btn-primary w-full sm:w-auto">
                    Apply Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Apply Modal */}
      {selectedCampaignForApply && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Apply to {selectedCampaignForApply.brandName}</h2>
            <p className="text-sm text-gray-500 mb-6">Campaign: {selectedCampaignForApply.title}</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Pitch Message (Optional)</label>
                <textarea 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 resize-none"
                  rows={4}
                  placeholder="Tell the brand why you are a great fit for this campaign..."
                  value={pitchMessage}
                  onChange={(e) => setPitchMessage(e.target.value)}
                ></textarea>
                <p className="text-xs text-gray-500 mt-2">Sending a pitch message will start a direct chat with the brand.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setSelectedCampaignForApply(null)} 
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={applying}
              >
                Cancel
              </button>
              <button 
                onClick={submitApplication} 
                className="flex-1 bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
                disabled={applying}
              >
                {applying ? 'Applying...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
