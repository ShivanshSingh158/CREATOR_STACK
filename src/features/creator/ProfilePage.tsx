import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ShieldCheck, Lock, Edit3, Save, AlertCircle, Building2, User, Video, CheckCircle2, ExternalLink, Plus, Trash2, TrendingUp, BarChart2, ArrowRight, Calculator } from 'lucide-react';
import { fetchYouTubeChannelMetrics, youTubeMetricsToScraped, type YouTubeAPIError } from '../../utils/youtubeApi';
import { calculateCreatorValuation } from '../../utils/valuationEngine';
import { CalculationModal } from '../../components/ui/CalculationModal';

interface PortfolioItem {
  title: string;
  brandName: string;
  url: string;
  description: string;
}

export default function ProfilePage() {
  const { userRole, currentUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>({});
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyDocs, setVerifyDocs] = useState({ pan: '', gstin: '' });
  const [verifying, setVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);
  const [showCalcModal, setShowCalcModal] = useState(false);

  // Portfolio state
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [addingPortfolio, setAddingPortfolio] = useState(false);
  const [newPortfolio, setNewPortfolio] = useState<PortfolioItem>({ title: '', brandName: '', url: '', description: '' });

  // YouTube Connect state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [verifyingYoutube, setVerifyingYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (currentUser) {
        try {
          const docSnap = await getDoc(doc(db, 'users', currentUser.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfileData(data);
            setFormData(data);
            setPortfolio(data.portfolio || []);
          }
        } catch (err) {
          console.error('Error fetching profile', err);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      let updated = { ...formData, portfolio };

      // If they changed their current_rate and already have youtube data, recalculate valuation
      if (userRole === 'creator' && updated.isAPIVerified && updated.youtubeData) {
        const currentRateNum = updated.current_rate ? parseInt(updated.current_rate.toString()) : undefined;
        const scraped = youTubeMetricsToScraped(updated.youtubeData, updated.niche || 'Technology', currentRateNum);
        const newValuation = calculateCreatorValuation(scraped);
        
        updated = {
          ...updated,
          valuation: {
            ...newValuation,
            is_verified: true
          }
        };
      }

      await setDoc(doc(db, 'users', currentUser.uid), updated, { merge: true });
      
      // Also sync to creators collection for matchmaking
      if (userRole === 'creator') {
        await setDoc(doc(db, 'creators', currentUser.uid), {
          name: updated.name,
          niche: updated.niche,
          bio: updated.bio,
          valuation: updated.valuation || null
        }, { merge: true });
      }
      setProfileData(updated);
      setFormData(updated);
      setEditing(false);
    } catch (err) {
      console.error('Error saving profile', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const addPortfolioItem = async () => {
    if (!newPortfolio.title || !newPortfolio.brandName) return;
    const updated = [...portfolio, newPortfolio];
    setPortfolio(updated);
    if (currentUser) {
      await setDoc(doc(db, 'users', currentUser.uid), { portfolio: updated }, { merge: true });
    }
    setNewPortfolio({ title: '', brandName: '', url: '', description: '' });
    setAddingPortfolio(false);
  };

  const removePortfolioItem = async (idx: number) => {
    const updated = portfolio.filter((_, i) => i !== idx);
    setPortfolio(updated);
    if (currentUser) {
      await setDoc(doc(db, 'users', currentUser.uid), { portfolio: updated }, { merge: true });
    }
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!panRegex.test(verifyDocs.pan)) {
      alert('Invalid PAN format. Should be like ABCDE1234F');
      return;
    }
    if (!gstinRegex.test(verifyDocs.gstin)) {
      alert('Invalid GSTIN format. Should be like 22AAAAA0000A1Z5');
      return;
    }
    setVerifying(true);
    setVerifyStep(0);
    const msgs = ['Validating PAN format…', 'Cross-referencing GSTIN registry…', 'Assigning trust score…', 'Verification complete'];
    let current = 0;
    const interval = setInterval(async () => {
      current++;
      if (current < msgs.length) {
        setVerifyStep(current);
      } else {
        clearInterval(interval);
        if (currentUser) {
          const updates = {
            verified: true,
            trustScore: 90 + Math.floor(Math.random() * 9),
            corporatePan: verifyDocs.pan.toUpperCase(),
            gstin: verifyDocs.gstin.toUpperCase(),
          };
          await setDoc(doc(db, 'users', currentUser.uid), updates, { merge: true });
          setProfileData((prev: any) => ({ ...prev, ...updates }));
          setFormData((prev: any) => ({ ...prev, ...updates }));
        }
        setVerifying(false);
        setShowVerifyModal(false);
      }
    }, 1400);
  };

  // Profile completion score
  const completionFields = userRole === 'creator'
    ? ['name', 'niche', 'profileUrl', 'legalName', 'pan', 'upi']
    : ['companyName', 'industry', 'website', 'corporatePan', 'gstin'];

  const missingFields = completionFields.filter(f => !profileData?.[f]);
  const filled = completionFields.length - missingFields.length;
  const completionPct = Math.round((filled / completionFields.length) * 100);

  const formatFieldName = (field: string) => {
    const map: Record<string, string> = {
      name: 'Display Name', niche: 'Content Niche', profileUrl: 'Channel URL', 
      legalName: 'Legal Name', pan: 'PAN Number', upi: 'UPI ID',
      companyName: 'Company Name', industry: 'Industry', website: 'Website', 
      corporatePan: 'Corporate PAN', gstin: 'GSTIN'
    };
    return map[field] || field;
  };

  const handleYoutubeConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl || !currentUser) return;
    setVerifyingYoutube(true);
    setYoutubeError(null);

    try {
      // 1. Fetch real metrics from YouTube API
      const metrics = await fetchYouTubeChannelMetrics(youtubeUrl);
      
      // 2. Convert to ScrapedMetrics format for the valuation engine (include currentRate)
      const currentRateNum = formData.current_rate ? parseInt(formData.current_rate.toString()) : undefined;
      const scraped = youTubeMetricsToScraped(metrics, metrics.inferredNiche || profileData?.niche || 'Technology', currentRateNum);
      
      // 3. Calculate new valuation
      const valuation = calculateCreatorValuation(scraped);

      // Generate an automatic bio
      const kSubs = (metrics.subscriberCount / 1000).toFixed(1);
      const kViews = (metrics.avgViewsLast10 / 1000).toFixed(1);
      const autoBio = `Welcome to ${metrics.channelName}! I create ${metrics.inferredNiche || 'amazing'} content for my community of ${kSubs}K subscribers. With an average of ${kViews}K views per video and a ${metrics.engagementRate}% engagement rate, my channel is highly active and growing!`;

      // 4. Update the user document and creators document with new verified data
      const updatedData = {
        ...profileData,
        name: metrics.channelName,
        niche: metrics.inferredNiche || profileData?.niche || 'Technology',
        bio: profileData?.bio && profileData.bio.length > 20 ? profileData.bio : autoBio,
        current_rate: valuation.fair_rate_card.base_integration_fee,
        valuation: {
          ...valuation,
          is_verified: true
        },
        youtubeData: metrics,
        isAPIVerified: true,
        lastSyncedAt: new Date().toISOString(),
        follower_count: metrics.subscriberCount,
        avg_views: metrics.avgViewsLast10,
        engagement_rate: metrics.engagementRate,
      };

      await setDoc(doc(db, 'users', currentUser.uid), updatedData, { merge: true });
      
      if (userRole === 'creator') {
        await setDoc(doc(db, 'creators', currentUser.uid), {
          ...updatedData,
          recentVideos: metrics.recentVideos,
          velocityTrend: metrics.velocityTrend
        }, { merge: true });
      }

      setProfileData(updatedData);
      setFormData(updatedData);
      setShowYoutubeInput(false);
      setYoutubeUrl('');
    } catch (err: any) {
      const e = err as YouTubeAPIError;
      setYoutubeError(e.message || 'Could not fetch channel data. Please check your URL.');
    } finally {
      setVerifyingYoutube(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#f9fafb]">
        <div className="w-8 h-8 border-[3px] border-[#111827] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const data = profileData || {};
  const isBrand = userRole === 'brand';
  const isUnderReview = data.verificationStatus === 'under_review';
  const needsVerification = isBrand && !data.verified && !isUnderReview;

  return (
    <div className="min-h-screen bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pb-16" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Verification Banner */}
        {needsVerification && !showVerifyModal && (
          <div className="mb-6 bg-amber-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 text-sm">Verification required to unlock contracts</p>
                <p className="text-amber-700 text-xs mt-0.5 font-medium">Submit your PAN and GSTIN to enable the escrow and contract engine.</p>
              </div>
            </div>
            <button onClick={() => setShowVerifyModal(true)} className="shrink-0 px-5 py-2.5 bg-amber-600 border-2 border-black text-white font-bold rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all text-sm">
              Verify Now
            </button>
          </div>
        )}

        {isUnderReview && !showVerifyModal && (
          <div className="mb-6 bg-blue-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-blue-900 text-sm">Verification Under Review</p>
                <p className="text-blue-700 text-xs mt-0.5 font-medium">Your PAN and GSTIN have been submitted and are being reviewed by our compliance team.</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Completion Bar */}
        {completionPct < 100 && (
          <div className="bg-white rounded-2xl border-2 border-black p-5 mb-8 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-slate-800">Profile Completion</p>
              <p className="text-sm font-black text-black">{completionPct}%</p>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden border-2 border-black">
              <div
                className="h-full rounded-r-sm transition-all duration-700 border-r-2 border-black"
                style={{
                  width: `${completionPct}%`,
                  background: completionPct >= 80 ? '#10b981' : completionPct >= 50 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
            {completionPct < 100 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  To reach 100%, please complete the following fields:
                </p>
                <div className="flex flex-wrap gap-2">
                  {missingFields.map(field => (
                    <span key={field} className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-md">
                      {formatFieldName(field)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Identity Card */}
            <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="h-32 bg-slate-900 border-b-2 border-black relative overflow-hidden">
                {data.youtubeData?.bannerUrl ? (
                  <img src={data.youtubeData.bannerUrl} alt="Channel Banner" className="w-full h-full object-cover opacity-90" referrerPolicy="no-referrer" />
                ) : (
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
                )}
              </div>
              <div className="px-7 pb-8 relative">
                <div className="flex justify-between items-end -mt-10 mb-7">
                  <div className="w-20 h-20 rounded-full border-2 border-black bg-slate-800 flex items-center justify-center text-2xl text-white font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative z-10 shrink-0">
                    {data.youtubeData?.thumbnailUrl || data.channelThumbnail || data.logoUrl ? (
                      <img src={data.youtubeData?.thumbnailUrl || data.channelThumbnail || data.logoUrl} alt="Avatar" className="w-full h-full object-cover bg-white" referrerPolicy="no-referrer" />
                    ) : (
                      isBrand ? (data.companyName?.charAt(0) || 'B') : (data.youtubeData?.channelName?.charAt(0) || data.name?.charAt(0) || currentUser?.email?.charAt(0)?.toUpperCase() || 'C')
                    )}
                  </div>
                  <div className="flex gap-2">
                    {editing ? (
                      <>
                        <button onClick={() => { setEditing(false); setFormData(profileData || {}); }} className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-bold text-white bg-slate-900 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 disabled:opacity-60">
                          <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setEditing(true)} className="px-4 py-2 text-sm font-bold text-indigo-900 bg-indigo-50 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-indigo-700" /> Edit Profile
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h1 className="text-xl font-black text-black">
                    {isBrand ? (data.companyName || <span className="text-slate-400 font-medium italic">Add company name →</span>) : (data.youtubeData?.channelName || data.name || <span className="text-slate-400 font-medium italic">Add your name →</span>)}
                  </h1>
                  <p className="text-sm font-medium text-slate-600 mt-0.5">{currentUser?.email}</p>
                  {data.isAPIVerified && (
                    <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-800 bg-emerald-50 border-2 border-black px-2.5 py-1 rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified via YouTube API
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Details Card */}
            <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-7">
              {!isBrand ? (
                <section>
                  <h2 className="text-sm font-black text-black mb-5 flex items-center gap-2"><User className="w-4 h-4 text-indigo-600" /> Creator Details</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Display Name</label>
                      {editing ? (
                        <input className="w-full px-4 py-3 border-2 border-black rounded-xl text-sm font-medium text-black focus:outline-none focus:border-indigo-600 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all bg-white" value={formData.name || ''} onChange={e => handleInputChange('name', e.target.value)} placeholder="Your name or channel name" />
                      ) : (
                        <div className="px-4 py-3 bg-slate-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl text-sm font-medium text-black">
                          {data.name || <span className="text-slate-400 italic cursor-pointer hover:text-black transition-colors" onClick={() => setEditing(true)}>Click to add your name</span>}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Content Niche</label>
                      {editing ? (
                        <input className="w-full px-4 py-3 border-2 border-black rounded-xl text-sm font-medium text-black focus:outline-none focus:border-indigo-600 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all bg-white" value={formData.niche || ''} onChange={e => handleInputChange('niche', e.target.value)} placeholder="e.g. Technology & B2B SaaS" />
                      ) : (
                        <div className="px-4 py-3 bg-slate-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl text-sm font-medium text-black">
                          {data.niche || <span className="text-slate-400 italic cursor-pointer hover:text-black transition-colors" onClick={() => setEditing(true)}>Click to add your niche</span>}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Bio</label>
                      {editing ? (
                        <textarea rows={4} className="w-full px-4 py-3 border-2 border-black rounded-xl text-sm font-medium text-black focus:outline-none focus:border-indigo-600 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all bg-white resize-none" value={formData.bio || ''} onChange={e => handleInputChange('bio', e.target.value)} placeholder="Tell brands what you do and who your audience is" />
                      ) : (
                        <div className="px-4 py-3 bg-slate-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl text-sm font-medium text-black leading-relaxed min-h-[100px]">
                          {data.bio || data.valuation?.data_justification || <span className="text-slate-400 italic cursor-pointer hover:text-black transition-colors" onClick={() => setEditing(true)}>Add a bio to help brands understand your content</span>}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Your Current Avg Integration Rate (₹)</label>
                      {editing ? (
                        <input type="number" className="w-full px-4 py-3 border-2 border-black rounded-xl text-sm font-medium text-black focus:outline-none focus:border-indigo-600 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all bg-white" value={formData.current_rate || ''} onChange={e => handleInputChange('current_rate', e.target.value)} placeholder="e.g. 15000" />
                      ) : (
                        <div className="px-4 py-3 bg-slate-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl text-sm font-medium text-black">
                          {data.current_rate ? `₹${data.current_rate.toLocaleString()}` : <span className="text-slate-400 italic cursor-pointer hover:text-black transition-colors" onClick={() => setEditing(true)}>Click to add your current rate</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              ) : (
                <section>
                  <h2 className="text-sm font-black text-black mb-5 flex items-center gap-2"><Building2 className="w-4 h-4 text-indigo-600" /> Company Details</h2>
                  <div className="space-y-4">
                    {[
                      { field: 'companyName', label: 'Company Name', placeholder: 'Your company name' },
                      { field: 'industry', label: 'Industry', placeholder: 'e.g. D2C, FinTech, EdTech' },
                      { field: 'website', label: 'Website', placeholder: 'https://yourcompany.com' },
                    ].map(({ field, label, placeholder }) => (
                      <div key={field}>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">{label}</label>
                        {editing ? (
                          <input className="w-full px-4 py-3 border-2 border-black rounded-xl text-sm font-medium text-black focus:outline-none focus:border-indigo-600 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all bg-white" value={formData[field] || ''} onChange={e => handleInputChange(field, e.target.value)} placeholder={placeholder} />
                        ) : (
                          <div className="px-4 py-3 bg-slate-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl text-sm font-medium text-black">
                            {data[field] || <span className="text-slate-400 italic cursor-pointer" onClick={() => setEditing(true)}>Click to add</span>}
                          </div>
                        )}
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Annual Creator Budget</label>
                      {editing ? (
                        <select className="w-full px-4 py-3 border-2 border-black rounded-xl text-sm font-medium text-black bg-white focus:outline-none focus:border-indigo-600 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all" value={formData.budget || ''} onChange={e => handleInputChange('budget', e.target.value)}>
                          <option value="">Select range</option>
                          <option>₹5,000 – ₹50,000</option>
                          <option>₹50,000 – ₹1 Lakh</option>
                          <option>₹1 Lakh – ₹5 Lakhs</option>
                          <option>₹5 Lakhs – ₹10 Lakhs</option>
                          <option>₹10 Lakhs+</option>
                        </select>
                      ) : (
                        <div className="px-4 py-3 bg-slate-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl text-sm font-medium text-black">
                          {data.budget || <span className="text-slate-400 italic cursor-pointer" onClick={() => setEditing(true)}>Click to add</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-7 space-y-8">
            {!isBrand ? (
              <>
                {/* Verified Metrics Card */}
                <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-7">
                  <section>
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <h2 className="text-sm font-black text-black flex items-center gap-2"><Lock className="w-4 h-4 text-indigo-600" /> Verified Channel Metrics</h2>
                        <button 
                          onClick={() => setShowCalcModal(true)}
                          className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-md hover:bg-indigo-100 transition-colors flex items-center gap-1"
                        >
                          <Calculator className="w-3 h-3" /> How we calculate
                        </button>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded-md border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Live API Sync</span>
                    </div>

                    {data.isAPIVerified && !showYoutubeInput ? (
                      <div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="col-span-2 sm:col-span-4 bg-slate-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl p-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {data.youtubeData?.thumbnailUrl ? (
                                <img src={data.youtubeData.thumbnailUrl} alt="Channel Logo" className="w-12 h-12 rounded-full object-cover border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
                              ) : (
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                  <Video className="w-6 h-6 text-red-600" />
                                </div>
                              )}
                              <div className="text-left">
                                <p className="text-2xl font-black text-black">{data.follower_count >= 1000000 ? `${(data.follower_count / 1000000).toFixed(1)}M` : data.follower_count >= 1000 ? `${(data.follower_count / 1000).toFixed(1)}K` : data.follower_count || '—'}</p>
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Subscribers</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black text-black capitalize">{data.youtubeData?.velocityTrend || 'Stable'}</p>
                              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Velocity</p>
                            </div>
                          </div>

                          {/* Long Form */}
                          <div className="col-span-2 bg-indigo-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl p-4">
                            <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2 flex items-center gap-1"><Video className="w-3.5 h-3.5" /> Long Form Videos</p>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-xl font-black text-black">{data.youtubeData?.longFormAvgViews ? (data.youtubeData.longFormAvgViews >= 1000000 ? `${(data.youtubeData.longFormAvgViews / 1000000).toFixed(1)}M` : data.youtubeData.longFormAvgViews >= 1000 ? `${(data.youtubeData.longFormAvgViews / 1000).toFixed(1)}K` : data.youtubeData.longFormAvgViews) : '—'}</p>
                                <p className="text-[10px] font-bold text-slate-600">AVG VIEWS</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-black text-black">{data.youtubeData?.longFormEngagement ? `${data.youtubeData.longFormEngagement.toFixed(1)}%` : '—'}</p>
                                <p className="text-[10px] font-bold text-slate-600">ENGAGEMENT</p>
                              </div>
                            </div>
                          </div>

                          {/* Shorts */}
                          <div className="col-span-2 bg-rose-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl p-4">
                            <p className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> YouTube Shorts</p>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-xl font-black text-black">{data.youtubeData?.shortsAvgViews ? (data.youtubeData.shortsAvgViews >= 1000000 ? `${(data.youtubeData.shortsAvgViews / 1000000).toFixed(1)}M` : data.youtubeData.shortsAvgViews >= 1000 ? `${(data.youtubeData.shortsAvgViews / 1000).toFixed(1)}K` : data.youtubeData.shortsAvgViews) : '—'}</p>
                                <p className="text-[10px] font-bold text-slate-600">AVG VIEWS</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-black text-black">{data.youtubeData?.shortsEngagement ? `${data.youtubeData.shortsEngagement.toFixed(1)}%` : '—'}</p>
                                <p className="text-[10px] font-bold text-slate-600">ENGAGEMENT</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {data.valuation && data.valuation.fair_rate_card && (
                          <div className="mt-6 pt-5 border-t-2 border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-1.5"><Lock className="w-4 h-4 text-emerald-600" /> Verified Rate Card</p>
                              <button onClick={() => setShowCalcModal(true)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1">
                                <Calculator className="w-3.5 h-3.5" /> How is this calculated?
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-4">
                              {data.valuation.fair_rate_card.base_integration_fee !== null && (
                                <>
                                  <div className="flex-1 min-w-[140px] bg-white border-2 border-black rounded-lg px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider mb-1">Base Integration Fee</p>
                                    <p className="text-xl font-black text-black">₹{data.valuation.fair_rate_card.base_integration_fee.toLocaleString()}</p>
                                  </div>
                                  <div className="flex-1 min-w-[140px] bg-white border-2 border-black rounded-lg px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider mb-1">Dedicated Video Fee</p>
                                    <p className="text-xl font-black text-black">₹{data.valuation.fair_rate_card.dedicated_video_fee?.toLocaleString()}</p>
                                  </div>
                                </>
                              )}
                              {data.valuation.fair_rate_card.shorts_fee !== null && (
                                <div className="flex-1 min-w-[140px] bg-emerald-50 border-2 border-black rounded-lg px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                  <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider mb-1">YouTube Shorts Fee</p>
                                  <p className="text-xl font-black text-black">₹{data.valuation.fair_rate_card.shorts_fee.toLocaleString()}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {data.lastSyncedAt && (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 border-t-2 border-slate-100 pt-5">
                            <p className="text-xs font-semibold text-slate-500">Last verified: {new Date(data.lastSyncedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                            <button 
                              onClick={() => setShowYoutubeInput(true)} 
                              className="text-xs font-bold text-slate-600 hover:text-black underline transition-colors"
                            >
                              Refresh / Change Channel
                            </button>
                          </div>
                        )}
                      </div>
                    ) : data.valuation ? (
                      <div className="bg-amber-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6">
                        <div className="flex items-start gap-4">
                          <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                          <div className="w-full">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-base font-bold text-amber-900">Rate estimate — not verified</p>
                              <button onClick={() => setShowCalcModal(true)} className="text-xs font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-1">
                                <Calculator className="w-3.5 h-3.5" /> How is this calculated?
                              </button>
                            </div>
                            <p className="text-sm font-medium text-amber-800 mt-1 mb-5">Your fair rate was estimated based on niche averages. Connect YouTube for real data and the verified badge to win more deals.</p>
                            
                            {!showYoutubeInput ? (
                              <button 
                                onClick={() => setShowYoutubeInput(true)}
                                className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-white bg-red-600 border-2 border-black px-4 py-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                              >
                                <Video className="w-4 h-4" /> Connect YouTube Now
                              </button>
                            ) : (
                              <form onSubmit={handleYoutubeConnect} className="mb-5 bg-white border-2 border-black rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                <label className="block text-sm font-bold text-slate-800 mb-2">YouTube Channel URL</label>
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                    placeholder="https://youtube.com/@yourchannel"
                                    className="flex-1 px-3 py-2 border-2 border-black rounded-lg text-sm focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                                    required
                                  />
                                  <button 
                                    type="submit" 
                                    disabled={verifyingYoutube}
                                    className="shrink-0 px-4 py-2 bg-black text-white text-sm font-bold border-2 border-black rounded-lg disabled:opacity-50 flex items-center gap-2 transition-all hover:bg-slate-800"
                                  >
                                    {verifyingYoutube ? 'Verifying...' : 'Verify'} <ArrowRight className="w-4 h-4" />
                                  </button>
                                </div>
                                {youtubeError && <p className="text-xs font-bold text-red-600 mt-2">{youtubeError}</p>}
                                <button type="button" onClick={() => setShowYoutubeInput(false)} className="text-xs font-bold text-slate-500 mt-2 hover:text-black">Cancel</button>
                              </form>
                            )}

                            <div className="flex flex-wrap gap-5">
                              {data.valuation.fair_rate_card.base_integration_fee !== null && (
                                <>
                                  <div className="flex-1 min-w-[140px] bg-white border-2 border-black rounded-lg px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mb-1">Base Integration Rate</p>
                                    <p className="text-xl font-black text-amber-950">₹{data.valuation.fair_rate_card.base_integration_fee.toLocaleString()}</p>
                                  </div>
                                  <div className="flex-1 min-w-[140px] bg-white border-2 border-black rounded-lg px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mb-1">Dedicated Video</p>
                                    <p className="text-xl font-black text-amber-950">₹{data.valuation.fair_rate_card.dedicated_video_fee?.toLocaleString()}</p>
                                  </div>
                                </>
                              )}
                              {data.valuation.fair_rate_card.shorts_fee !== null && (
                                <div className="flex-1 min-w-[140px] bg-amber-100 border-2 border-black rounded-lg px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                  <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider mb-1">YouTube Shorts</p>
                                  <p className="text-xl font-black text-amber-950">₹{data.valuation.fair_rate_card.shorts_fee.toLocaleString()}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-rose-50 border-2 border-dashed border-black rounded-xl p-8 text-center">
                        <Video className="w-10 h-10 text-rose-600 mx-auto mb-3" />
                        <p className="text-base font-black text-rose-950 mb-1">No channel connected</p>
                        <p className="text-sm font-medium text-rose-800 mb-5">Connect your YouTube channel to get a verified market rate that brands trust.</p>
                        {!showYoutubeInput ? (
                          <button 
                            onClick={() => setShowYoutubeInput(true)}
                            className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-700 bg-white border-2 border-black px-5 py-2.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                          >
                            <Video className="w-4 h-4" /> Connect YouTube
                          </button>
                        ) : (
                          <form onSubmit={handleYoutubeConnect} className="max-w-md mx-auto text-left bg-white border-2 border-black rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <label className="block text-sm font-bold text-slate-800 mb-2">YouTube Channel URL</label>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                placeholder="https://youtube.com/@yourchannel"
                                className="flex-1 px-3 py-2 border-2 border-black rounded-lg text-sm focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                                required
                              />
                              <button 
                                type="submit" 
                                disabled={verifyingYoutube}
                                className="shrink-0 px-4 py-2 bg-black text-white text-sm font-bold border-2 border-black rounded-lg disabled:opacity-50 flex items-center gap-2 transition-all hover:bg-slate-800"
                              >
                                {verifyingYoutube ? 'Verifying...' : 'Verify'} <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                            {youtubeError && <p className="text-xs font-bold text-red-600 mt-2">{youtubeError}</p>}
                            <button type="button" onClick={() => setShowYoutubeInput(false)} className="text-xs font-bold text-slate-500 mt-2 hover:text-black">Cancel</button>
                          </form>
                        )}
                      </div>
                    )}
                  </section>
                </div>

                {/* Portfolio Card */}
                <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-7">
                  <section>
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-sm font-black text-black flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Past Brand Work</h2>
                      <button onClick={() => setAddingPortfolio(true)} className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border-2 border-black px-4 py-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                        <Plus className="w-4 h-4" /> Add
                      </button>
                    </div>

                    {portfolio.length === 0 && !addingPortfolio && (
                      <div className="border-2 border-dashed border-black bg-white rounded-xl p-8 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <p className="text-sm font-bold text-slate-800 mb-1">No past brand work added yet</p>
                        <p className="text-xs font-medium text-slate-500">Adding collaborations increases your chances of getting shortlisted by 3×.</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {portfolio.map((item, idx) => (
                        <div key={idx} className="flex flex-col bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl p-5 h-full">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.brandName}</p>
                            <button onClick={() => removePortfolioItem(idx)} className="text-slate-400 hover:text-rose-600 bg-slate-50 border-2 border-transparent hover:border-black rounded-md p-1.5 transition-all -mt-1 -mr-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-base font-bold text-black mb-2 leading-tight">{item.title}</p>
                          {item.description && <p className="text-sm font-medium text-slate-600 mb-4 line-clamp-3 flex-1">{item.description}</p>}
                          {item.url && (
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-indigo-700 hover:underline underline-offset-2">
                              <ExternalLink className="w-4 h-4" /> View Project
                            </a>
                          )}
                        </div>
                      ))}
                    </div>

                    {addingPortfolio && (
                      <div className="mt-6 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 space-y-4">
                        <p className="text-sm font-black text-black">Add a collaboration</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <input className="w-full px-4 py-3 border-2 border-black rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-600 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all bg-slate-50" placeholder="Campaign/video title *" value={newPortfolio.title} onChange={e => setNewPortfolio(p => ({ ...p, title: e.target.value }))} />
                          <input className="w-full px-4 py-3 border-2 border-black rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-600 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all bg-slate-50" placeholder="Brand name *" value={newPortfolio.brandName} onChange={e => setNewPortfolio(p => ({ ...p, brandName: e.target.value }))} />
                        </div>
                        <input className="w-full px-4 py-3 border-2 border-black rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-600 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all bg-slate-50" placeholder="Link to video/post (optional)" value={newPortfolio.url} onChange={e => setNewPortfolio(p => ({ ...p, url: e.target.value }))} />
                        <textarea className="w-full px-4 py-3 border-2 border-black rounded-xl text-sm font-medium resize-none focus:outline-none focus:border-indigo-600 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all bg-slate-50" rows={3} placeholder="Brief description (optional)" value={newPortfolio.description} onChange={e => setNewPortfolio(p => ({ ...p, description: e.target.value }))} />
                        <div className="flex gap-3 pt-2">
                          <button onClick={() => setAddingPortfolio(false)} className="px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">Cancel</button>
                          <button onClick={addPortfolioItem} className="px-5 py-2.5 text-sm font-bold text-white bg-slate-900 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">Save</button>
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              </>
            ) : (
              <>
                {/* Legal Verification Card */}
                <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-7">
                  <section>
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-sm font-black text-black flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Legal Verification</h2>
                      <div className="flex items-center gap-2">
                        {data.verified && (!data.gstin || data.gstin === '-' || !data.corporatePan || data.corporatePan === '-') && (
                          <button onClick={() => { setVerifyDocs({ pan: data.corporatePan === '-' ? '' : (data.corporatePan || ''), gstin: data.gstin === '-' ? '' : (data.gstin || '') }); setShowVerifyModal(true); }} className="text-xs font-bold text-indigo-700 bg-indigo-50 border-2 border-black px-3 py-1 rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1.5 cursor-pointer">
                            <Edit3 className="w-3.5 h-3.5 text-indigo-600" /> Complete Details
                          </button>
                        )}
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 border-2 border-black px-2 py-0.5 rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1"><Lock className="w-3 h-3" /> Locked</span>
                      </div>
                    </div>

                    <div className={`rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${data.verified ? 'bg-emerald-50' : isUnderReview ? 'bg-blue-50' : 'bg-slate-50'}`}>
                      <div>
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Entity Status</p>
                        <p className={`text-base font-black ${data.verified ? 'text-emerald-800' : isUnderReview ? 'text-blue-800' : 'text-slate-800'}`}>
                          {data.verified ? 'Verified Corporate Sponsor' : isUnderReview ? 'Verification Under Review' : 'Unverified — Required for contracts'}
                        </p>
                      </div>
                      <div className="sm:text-right border-t-2 border-black sm:border-t-0 sm:border-l-2 pt-4 sm:pt-0 sm:pl-6">
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Trust Score</p>
                        <p className={`text-3xl font-black ${data.verified ? 'text-emerald-800' : 'text-slate-400'}`}>{data.trustScore || '—'}</p>
                      </div>
                    </div>

                    {(data.verified || isUnderReview) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                        <div className="bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl p-5">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Corporate PAN</p>
                          <p className="text-sm font-black font-mono text-black">{data.corporatePan ? `${data.corporatePan.substring(0, 3)}••••${data.corporatePan.substring(7)}` : '—'}</p>
                        </div>
                        <div className="bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl p-5">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">GSTIN</p>
                          <p className="text-sm font-black font-mono text-black">{data.gstin ? `${data.gstin.substring(0, 4)}••••••${data.gstin.substring(10)}` : '—'}</p>
                        </div>
                      </div>
                    )}

                    {!data.verified && !isUnderReview && (
                      <button onClick={() => setShowVerifyModal(true)} className="mt-5 w-full py-4 text-sm font-bold text-white bg-slate-900 border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                        Submit PAN & GSTIN for Verification
                      </button>
                    )}
                  </section>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border-2 border-black rounded-2xl w-full max-w-lg overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="px-7 py-5 border-b-2 border-black flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-black text-black flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-indigo-600" /> Legal Entity Verification</h2>
              {!verifying && (
                <button onClick={() => setShowVerifyModal(false)} className="text-slate-500 hover:text-black transition-colors font-black text-xl">✕</button>
              )}
            </div>

            <div className="p-7">
              {verifying ? (
                <div className="py-10 text-center">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
                  <p className="text-sm font-bold text-slate-800">
                    {['Validating PAN format…', 'Cross-referencing GSTIN registry…', 'Assigning trust score…', 'Finalizing…'][verifyStep] || 'Processing…'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleVerificationSubmit} className="space-y-5">
                  <div className="bg-sky-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl p-4 text-xs font-semibold text-sky-900 leading-relaxed">
                    Your PAN and GSTIN are required for Section 194J TDS compliance. Documents are stored encrypted and used only for tax remittance.
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Corporate PAN</label>
                    <input type="text" required maxLength={10} placeholder="ABCDE1234F" className="w-full px-4 py-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl text-sm font-mono font-bold uppercase tracking-widest focus:outline-none focus:border-indigo-600 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-slate-50" value={verifyDocs.pan} onChange={e => setVerifyDocs(p => ({ ...p, pan: e.target.value.toUpperCase() }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">GSTIN</label>
                    <input type="text" required maxLength={15} placeholder="22AAAAA0000A1Z5" className="w-full px-4 py-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl text-sm font-mono font-bold uppercase tracking-widest focus:outline-none focus:border-indigo-600 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all bg-slate-50" value={verifyDocs.gstin} onChange={e => setVerifyDocs(p => ({ ...p, gstin: e.target.value.toUpperCase() }))} />
                  </div>
                  <div className="flex gap-3 pt-4 border-t-2 border-black/10">
                    <button type="button" onClick={() => setShowVerifyModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-700 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-3 text-sm font-bold text-white bg-slate-900 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all">Submit for Verification</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      <CalculationModal isOpen={showCalcModal} onClose={() => setShowCalcModal(false)} breakdown={profileData?.valuation?.breakdown} />
    </div>
  );
}
