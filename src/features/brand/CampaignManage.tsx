import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { formatDateDDMMYY, formatRupee } from '../../utils/formatters';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, Users, CheckCircle, Clock, Trash2, Edit } from 'lucide-react';

export default function CampaignManage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, userRole } = useAuth();
  
  const [campaign, setCampaign] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [interested, setInterested] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'applicants' | 'interested'>('interested');

  useEffect(() => {
    const fetchCampaignAndApplicants = async () => {
      if (!id) return;
      try {
        // Fetch campaign details
        const docRef = doc(db, 'campaigns', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCampaign({ id: docSnap.id, ...docSnap.data() });
        }

        // Fetch applications for this campaign
        const appsQuery = query(collection(db, 'applications'), where('campaignId', '==', id));
        const appsSnap = await getDocs(appsQuery);
        
        const applicantsData: any[] = [];
        const interestedData: any[] = [];
        
        // Fetch creator profiles for each application
        for (const applicationDoc of appsSnap.docs) {
          const appData = applicationDoc.data();
          let creatorData: any = null;

          // Try creators collection first (seeded/onboarded)
          const creatorRef = doc(db, 'creators', appData.creatorId);
          const creatorSnap = await getDoc(creatorRef);
          if (creatorSnap.exists()) {
            creatorData = { id: creatorSnap.id, ...creatorSnap.data() };
          } else {
            // Fallback: users collection for real onboarded creators
            const userRef = doc(db, 'users', appData.creatorId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              creatorData = { id: userSnap.id, ...userSnap.data() };
            }
          }
          
          if (creatorData) {
            const data = {
              applicationId: applicationDoc.id,
              status: appData.status,
              type: appData.type || 'inbound',
              appliedAt: appData.appliedAt,
              creatorId: appData.creatorId,
              ...creatorData
            };

            if (data.type === 'outbound' || data.status === 'interested') {
              interestedData.push(data);
            } else {
              applicantsData.push(data);
            }
          }
        }
        
        setApplicants(applicantsData);
        setInterested(interestedData);
      } catch (error) {
        console.error("Error fetching campaign data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaignAndApplicants();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-[#d1b07c] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[#6b7280] font-medium">Loading campaign details...</p>
      </div>
    );
  }

  const handleInitiateChat = async (creatorObj: any) => {
    try {
      if (!currentUser) return;
      const chatQ = query(collection(db, 'chats'), 
        where('campaignId', '==', id),
        where('creatorId', '==', creatorObj.creatorId)
      );
      const chatSnap = await getDocs(chatQ);
      
      if (chatSnap.empty) {
        await addDoc(collection(db, 'chats'), {
          campaignId: id,
          creatorId: creatorObj.creatorId,
          brandId: currentUser.uid,
          initiatedBy: 'brand',
          lastMessage: '',
          lastMessageAt: serverTimestamp()
        });
      }
      navigate('/messages');
    } catch (error) {
      console.error("Error initiating chat:", error);
    }
  };

  const handleDeleteCampaign = async () => {
    if (window.confirm("Are you sure you want to permanently delete this campaign? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, 'campaigns', id!));
        navigate('/brand-dashboard');
      } catch (error) {
        console.error("Error deleting campaign:", error);
        alert("Failed to delete campaign.");
      }
    }
  };

  if (!campaign) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign Not Found</h2>
        <button onClick={() => navigate('/brand-dashboard')} className="btn-primary">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827] font-['Outfit'] pb-12">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb] pt-8 pb-8 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => navigate(-1)} className="text-[#6b7280] hover:text-[#111827] text-sm font-bold tracking-wide flex items-center transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> BACK TO DASHBOARD
            </button>
            <div className="flex gap-3">
              <button onClick={() => navigate(`/edit-campaign/${id}`)} className="text-[#111827] hover:bg-[#f3f4f6] border border-[#e5e7eb] px-4 py-2 rounded-lg text-sm font-bold tracking-wide flex items-center transition-colors shadow-sm">
                <Edit className="w-4 h-4 mr-2" /> EDIT CAMPAIGN
              </button>
              <button onClick={handleDeleteCampaign} className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-lg text-sm font-bold tracking-wide flex items-center transition-colors shadow-sm">
                <Trash2 className="w-4 h-4 mr-2" /> DELETE CAMPAIGN
              </button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-[#f3f4f6] text-[#4b5563] px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border border-[#e5e7eb]">{campaign.niche}</span>
                {campaign.status === 'completed' ? (
                  <span className="text-xs font-bold text-[#6b7280] bg-[#f3f4f6] px-3 py-1 rounded-full border border-[#e5e7eb] uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3" /> COMPLETED
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#15803d] bg-[#15803d]/10 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-[#15803d] animate-pulse"></span> ACTIVE
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[#111827] tracking-tight">{campaign.title}</h1>
              <p className="mt-2 text-[#6b7280] max-w-2xl">{campaign.description}</p>
            </div>
            <div className="bg-[#f9fafb] p-4 rounded-lg border border-[#e5e7eb] flex gap-8">
              <div>
                <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-1">Budget</p>
                <p className="text-xl font-bold text-[#111827]">{formatRupee(campaign.budget)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-1">Deadline</p>
                <p className="text-xl font-bold text-[#111827]">{formatDateDDMMYY(campaign.deadline)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex items-center justify-between mb-6 border-b border-[#e5e7eb] pb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-[#d1b07c]" />
            <h2 className="text-2xl font-black text-[#111827] tracking-tight">Creator Pipeline</h2>
          </div>
          <div className="flex bg-[#f3f4f6] p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('interested')}
              className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'interested' ? 'bg-white shadow-sm text-[#111827]' : 'text-[#6b7280] hover:text-[#111827]'}`}
            >
              Interested ({interested.length})
            </button>
            <button 
              onClick={() => setActiveTab('applicants')}
              className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'applicants' ? 'bg-white shadow-sm text-[#111827]' : 'text-[#6b7280] hover:text-[#111827]'}`}
            >
              Applicants ({applicants.length})
            </button>
          </div>
        </div>

        {(activeTab === 'applicants' ? applicants : interested).length === 0 ? (
          <div className="bg-white border border-[#e5e7eb] border-dashed rounded-xl p-16 text-center">
            <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-[#9ca3af]" />
            </div>
            <h3 className="text-xl font-bold text-[#111827] mb-2">{activeTab === 'applicants' ? 'No Applications Yet' : 'No Outbound Interests'}</h3>
            <p className="text-[#6b7280] max-w-md mx-auto">
              {activeTab === 'applicants' 
                ? 'Your campaign is live! Creators are currently reviewing it. Check back soon to see who applies.' 
                : 'You have not reached out to any creators for this campaign yet. Go to Matchmaking to discover talent!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(activeTab === 'applicants' ? applicants : interested).map((creator) => (
              <div key={creator.applicationId} className="bg-white border border-[#e5e7eb] rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center hover:shadow-md transition-shadow">
                <img 
                  src={creator.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=111827&color=fff`} 
                  alt={creator.name} 
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#e5e7eb]"
                />
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-xl font-bold text-[#111827]">{creator.name}</h3>
                    {creator.status === 'pending' && (
                      <span className="text-xs font-bold text-[#b45309] bg-[#fef3c7] px-2 py-1 rounded border border-[#fde68a] uppercase tracking-wider">Applicant</span>
                    )}
                    {creator.status === 'interested' && (
                      <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded border border-brand-200 uppercase tracking-wider">Interested</span>
                    )}
                    {creator.status !== 'pending' && creator.status !== 'interested' && (
                      <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded border border-green-200 uppercase tracking-wider">Contracted</span>
                    )}
                  </div>
                  <p className="text-sm text-[#6b7280] mb-3">{creator.niche} • {(creator.follower_count / 1000).toFixed(1)}K Followers</p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <Link to={`/creator/${creator.creatorId}`} className="flex-1 bg-white border border-[#e5e7eb] text-[#111827] text-center text-sm font-bold py-2.5 rounded-lg hover:bg-[#f9fafb] transition-colors">
                      View Profile
                    </Link>
                    <button onClick={() => handleInitiateChat(creator)} className="flex-1 bg-[#d1b07c] hover:bg-[#b59560] text-white text-center text-sm font-bold py-2.5 rounded-lg transition-colors">
                      Initiate Chat
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
