import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Camera, Video, Briefcase, BarChart3, TrendingUp, CheckCircle2 } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../auth/AuthContext';

export default function CreatorProfileDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [creator, setCreator] = useState<any>(location.state?.creator || null);
  const [loading, setLoading] = useState(!creator);
  
  const { currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [brandCampaigns, setBrandCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!creator && id) {
      const fetchCreator = async () => {
        try {
          const docRef = doc(db, 'creators', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setCreator({ id: docSnap.id, ...docSnap.data() });
          }
        } catch (error) {
          console.error("Error fetching creator:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchCreator();
    } else {
      setLoading(false);
    }
  }, [id, creator]);

  useEffect(() => {
    if (showModal && currentUser) {
      const fetchCamps = async () => {
        try {
          const q = query(collection(db, 'campaigns'), where('brandId', '==', currentUser.uid));
          const snap = await getDocs(q);
          const camps = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setBrandCampaigns(camps);
          if (camps.length > 0) setSelectedCampaignId(camps[0].id);
        } catch (err) {
          console.error("Error fetching campaigns:", err);
        }
      };
      fetchCamps();
    }
  }, [showModal, currentUser]);

  const handleExpressInterest = async () => {
    if (!selectedCampaignId || !message.trim() || !currentUser) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'applications'), {
        campaignId: selectedCampaignId,
        creatorId: creator.id,
        status: 'interested',
        type: 'outbound',
        appliedAt: serverTimestamp()
      });
      
      const chatRef = await addDoc(collection(db, 'chats'), {
        campaignId: selectedCampaignId,
        creatorId: creator.id,
        brandId: currentUser.uid,
        initiatedBy: 'brand',
        lastMessage: message,
        lastMessageAt: serverTimestamp(),
        status: 'active'
      });

      await addDoc(collection(db, 'messages'), {
        chatId: chatRef.id,
        senderId: currentUser.uid,
        senderRole: 'brand',
        text: message,
        timestamp: serverTimestamp()
      });

      setShowModal(false);
      navigate('/messages');
    } catch (error) {
      console.error("Error sending interest:", error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-matte-200 flex flex-col items-center justify-center p-6">
         <div className="w-10 h-10 border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-matte-200 flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
        <p className="text-gray-500 mb-8">The creator profile data could not be loaded.</p>
        <button onClick={() => navigate('/matchmaking')} className="btn-primary">Return to Matchmaking</button>
      </div>
    );
  }

  const renderPlatformIcon = (platform: string) => {
    switch(platform) {
      case 'YouTube': return <Video className="w-6 h-6 text-red-600" />;
      case 'Instagram': return <Camera className="w-6 h-6 text-pink-600" />;
      case 'LinkedIn': return <Briefcase className="w-6 h-6 text-blue-600" />;
      default: return <Play className="w-6 h-6 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-matte-200 text-gray-900 font-sans pb-16">
      {/* Navigation */}
      <div className="p-6 md:px-10 border-b border-gray-200 bg-white flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 font-medium text-gray-500 hover:text-brand-600 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <div className="flex gap-4">
           <button onClick={() => setShowModal(true)} className="btn-primary">
             Express Interest / Message
           </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 px-4 sm:px-6">
        
        {/* Header Profile */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-10 mb-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-gray-50 bg-gray-100 shrink-0 flex items-center justify-center shadow-sm relative z-10">
            {renderPlatformIcon(creator.platform)}
          </div>
          
          <div className="flex-1 text-center md:text-left relative z-10">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-1 justify-center md:justify-start">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{creator.name}</h1>
              {creator.is_verified && (
                <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 text-xs font-medium rounded-full border border-green-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </div>
              )}
            </div>
            <p className="text-lg font-medium text-gray-500 mb-6">{creator.handle}</p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className="bg-brand-50 text-brand-700 px-3 py-1 font-medium text-sm rounded-md border border-brand-100">{creator.niche}</span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 font-medium text-sm rounded-md border border-gray-200">{creator.platform}</span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 font-medium text-sm rounded-md border border-gray-200">{creator.language}</span>
            </div>
          </div>
        </div>

        {/* Analytics Grid */}
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-600" /> Deep Analytics
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm font-medium text-gray-500 mb-1">Total Followers</p>
            <p className="text-3xl font-bold text-gray-900">{((creator.follower_count || 0) / 1000).toFixed(1)}K</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm font-medium text-gray-500 mb-1">Avg Views</p>
            <p className="text-3xl font-bold text-gray-900">{((creator.avg_views || 0) / 1000).toFixed(1)}K</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm font-medium text-gray-500 mb-1">Engagement Rate</p>
            <p className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              {creator.engagement_rate || 0}% <TrendingUp className="w-5 h-5 text-green-500" />
            </p>
          </div>
          <div className="bg-brand-50 rounded-xl shadow-sm border border-brand-100 p-6">
            <p className="text-sm font-medium text-brand-600 mb-1">Conversion Rate</p>
            <p className="text-3xl font-bold text-brand-700">{creator.conversion_rate || 0}%</p>
          </div>
        </div>

        {/* Engagement History Matrix */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-gray-900">Recent Content Performance</h3>
            <span className="text-brand-600 bg-brand-50 px-3 py-1 rounded-full text-xs font-medium border border-brand-100">Last 10 Uploads</span>
          </div>
          
          <div className="flex items-end gap-2 md:gap-4 h-48 w-full border-b border-l border-gray-200 pb-2 pl-2">
            {(creator.engagement_history || []).map((views: number, idx: number) => {
              const maxViews = Math.max(...(creator.engagement_history || [1]));
              const heightPercent = Math.max((views / maxViews) * 100, 10);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <div 
                    className="w-full bg-brand-400 rounded-t-sm transition-all group-hover:bg-brand-500"
                    style={{ height: `${heightPercent}%` }}
                  ></div>
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-gray-900 text-white font-medium text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap shadow-sm z-10 transition-opacity">
                    {(views / 1000).toFixed(1)}K Views
                  </div>
                </div>
              );
            })}
            {(!creator.engagement_history || creator.engagement_history.length === 0) && (
               <div className="flex-1 h-full flex items-center justify-center text-gray-400 font-medium">No performance data available</div>
            )}
          </div>
          <div className="flex justify-between mt-4 text-xs font-medium text-gray-400">
            <span>Older</span>
            <span>Newer</span>
          </div>
        </div>

      </div>

      {/* Express Interest Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect with {creator.name}</h2>
            <p className="text-sm text-gray-500 mb-6">Select a campaign to reach out about.</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Select Campaign</label>
                <select 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-500"
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                >
                  {brandCampaigns.map(camp => (
                    <option key={camp.id} value={camp.id}>{camp.title}</option>
                  ))}
                  {brandCampaigns.length === 0 && (
                    <option value="" disabled>No active campaigns found</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Initial Message</label>
                <textarea 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 resize-none"
                  rows={4}
                  placeholder="Hi! We love your content and would love to collaborate..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowModal(false)} 
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={sending}
              >
                Cancel
              </button>
              <button 
                onClick={handleExpressInterest} 
                className="flex-1 bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
                disabled={sending || !selectedCampaignId || !message.trim()}
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
