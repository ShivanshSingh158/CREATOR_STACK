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
    const confirmed = window.confirm('Are you sure you want to permanently delete this campaign?');
    if (!confirmed) return;
    try {
      await deleteDoc(doc(db, 'campaigns', id!));
      navigate('/brand-dashboard');
    } catch (error) {
      console.error('Error deleting campaign:', error);
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
    <div className="min-h-[calc(100vh-64px)] bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] text-[#111827] font-['Inter'] pb-12">
      {/* Header */}
      <div className="bg-white border-b-2 border-black pt-6 pb-6 px-4 sm:px-6 lg:px-8 shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => navigate(-1)} className="text-black hover:text-indigo-600 text-xs font-black tracking-widest flex items-center transition-colors uppercase">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> BACK TO DASHBOARD
            </button>
            <div className="flex gap-3">
              <button onClick={() => navigate(`/edit-campaign/${id}`)} className="bg-white text-black border-2 border-black px-4 py-2 rounded-lg text-xs font-black tracking-widest uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all flex items-center">
                <Edit className="w-3.5 h-3.5 mr-2" /> EDIT CAMPAIGN
              </button>
              <button onClick={handleDeleteCampaign} className="bg-[#ef4444] text-white border-2 border-black px-4 py-2 rounded-lg text-xs font-black tracking-widest uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:bg-[#dc2626] active:translate-y-0 active:shadow-none transition-all flex items-center">
                <Trash2 className="w-4 h-4 mr-2" /> DELETE CAMPAIGN
              </button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mt-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-gray-200">{campaign.niche}</span>
                {campaign.status === 'completed' ? (
                  <span className="text-[10px] font-black text-black bg-[#a3e635] px-2.5 py-1 rounded border-2 border-black uppercase tracking-widest flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <CheckCircle className="w-3 h-3" /> COMPLETED
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-black bg-[#fbbf24] px-2.5 py-1 rounded border-2 border-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse"></span> ACTIVE
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-black tracking-tight uppercase">{campaign.title}</h1>
              <p className="mt-2 text-sm font-bold text-gray-500 max-w-2xl">{campaign.description}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex gap-6">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Budget</p>
                <p className="text-xl font-black text-black">{formatRupee(campaign.budget)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Deadline</p>
                <p className="text-xl font-black text-black">{formatDateDDMMYY(campaign.deadline)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 border-b-2 border-black pb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl lg:text-2xl font-black text-black tracking-tight uppercase">Creator Pipeline</h2>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <button 
              onClick={() => setActiveTab('interested')}
              className={`px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded transition-colors ${activeTab === 'interested' ? 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black text-black' : 'text-gray-500 hover:text-black border-2 border-transparent'}`}
            >
              Interested ({interested.length})
            </button>
            <button 
              onClick={() => setActiveTab('applicants')}
              className={`px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded transition-colors ${activeTab === 'applicants' ? 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black text-black' : 'text-gray-500 hover:text-black border-2 border-transparent'}`}
            >
              Applicants ({applicants.length})
            </button>
          </div>
        </div>

        {(activeTab === 'applicants' ? applicants : interested).length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-10 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-12 h-12 bg-gray-100 border-2 border-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-xl font-black text-black uppercase tracking-tight mb-2">{activeTab === 'applicants' ? 'No Applications Yet' : 'No Outbound Interests'}</h3>
            <p className="text-xs font-bold text-gray-500 max-w-md mx-auto uppercase tracking-widest leading-relaxed">
              {activeTab === 'applicants' 
                ? 'Your campaign is live! Creators are currently reviewing it. Check back soon to see who applies.' 
                : 'You have not reached out to any creators for this campaign yet. Go to Matchmaking to discover talent!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(activeTab === 'applicants' ? applicants : interested).map((creator) => (
              <div key={creator.applicationId} className="bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden">
                <div className="p-5 flex items-start gap-4 bg-white">
                  <img
                    src={creator.youtubeData?.thumbnailUrl || creator.channelThumbnail || creator.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=111827&color=fff`}
                    alt={creator.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-black shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-black text-black uppercase tracking-tight truncate">{creator.name}</h3>
                      {creator.status === 'pending' && (
                        <span className="text-[9px] font-black text-black bg-[#fbbf24] px-1.5 py-0.5 rounded border-2 border-black ml-2 shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-widest">Applied</span>
                      )}
                      {(creator.status === 'interested' || creator.type === 'outbound') && (
                        <span className="text-[9px] font-black text-black bg-[#60a5fa] px-1.5 py-0.5 rounded border-2 border-black ml-2 shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-widest">Outreach</span>
                      )}
                      {creator.status === 'contracted' && (
                        <span className="text-[9px] font-black text-black bg-[#a3e635] px-1.5 py-0.5 rounded border-2 border-black ml-2 shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-widest">Contracted</span>
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-gray-500 mt-1 uppercase tracking-widest">
                      {creator.niche} • {creator.follower_count ? `${(creator.follower_count / 1000).toFixed(1)}K subs` : 'Creator'}
                    </p>
                    {creator.avg_views && (
                      <p className="text-[10px] font-black text-black mt-1.5 bg-gray-100 border border-gray-200 inline-block px-1.5 py-0.5 rounded uppercase tracking-widest">{(creator.avg_views / 1000).toFixed(1)}K avg views</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row border-t-2 border-black bg-gray-50">
                  <Link
                    to={`/creator/${creator.creatorId}`}
                    className="flex-1 text-center text-[10px] font-black uppercase tracking-widest text-black border-b-2 sm:border-b-0 sm:border-r-2 border-black py-2.5 hover:bg-gray-100 transition-colors"
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={() => handleInitiateChat(creator)}
                    className="flex-1 text-center text-[10px] font-black uppercase tracking-widest text-black border-b-2 sm:border-b-0 sm:border-r-2 border-black py-2.5 hover:bg-gray-100 transition-colors"
                  >
                    Message
                  </button>
                  <Link
                    to={`/deal-room/${id}/${creator.creatorId}`}
                    className="flex-1 flex items-center justify-center text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white py-2.5 hover:bg-indigo-700 transition-colors"
                  >
                    Open Deal Room
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
