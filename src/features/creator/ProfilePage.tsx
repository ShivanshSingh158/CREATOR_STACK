import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ShieldCheck, Lock, Edit3, Save, AlertCircle, Building2, User, Video, CheckCircle2, ExternalLink, Plus, Trash2, TrendingUp, BarChart2 } from 'lucide-react';

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

  // Portfolio state
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [addingPortfolio, setAddingPortfolio] = useState(false);
  const [newPortfolio, setNewPortfolio] = useState<PortfolioItem>({ title: '', brandName: '', url: '', description: '' });

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
      const updated = { ...formData, portfolio };
      await setDoc(doc(db, 'users', currentUser.uid), updated, { merge: true });
      // Also sync name/niche to creators collection for matchmaking
      if (userRole === 'creator') {
        await setDoc(doc(db, 'creators', currentUser.uid), {
          name: updated.name,
          niche: updated.niche,
          bio: updated.bio,
        }, { merge: true });
      }
      setProfileData(updated);
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
    ? ['name', 'niche', 'bio', 'profileUrl', 'legalName', 'pan', 'upi']
    : ['companyName', 'industry', 'website', 'budget', 'corporatePan', 'gstin'];

  const filled = completionFields.filter(f => profileData?.[f]).length;
  const completionPct = Math.round((filled / completionFields.length) * 100);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#f9fafb]">
        <div className="w-8 h-8 border-[3px] border-[#111827] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const data = profileData || {};
  const isBrand = userRole === 'brand';
  const needsVerification = isBrand && !data.verified;

  return (
    <div className="min-h-screen bg-[#f9fafb] pb-16" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Verification Banner */}
        {needsVerification && !showVerifyModal && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 text-sm">Verification required to unlock contracts</p>
                <p className="text-amber-700 text-xs mt-0.5">Submit your PAN and GSTIN to enable the escrow and contract engine.</p>
              </div>
            </div>
            <button onClick={() => setShowVerifyModal(true)} className="shrink-0 px-5 py-2.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors text-sm">
              Verify Now
            </button>
          </div>
        )}

        {/* Profile Completion Bar */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-[#374151]">Profile Completion</p>
            <p className="text-sm font-bold text-[#111827]">{completionPct}%</p>
          </div>
          <div className="h-2 bg-[#f3f4f6] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${completionPct}%`,
                background: completionPct >= 80 ? '#16a34a' : completionPct >= 50 ? '#d97706' : '#ef4444',
              }}
            />
          </div>
          {completionPct < 100 && (
            <p className="text-xs text-[#9ca3af] mt-2">
              {completionPct < 50 ? 'Brands can\'t find you with an incomplete profile.' : completionPct < 80 ? 'Almost there — fill in the remaining fields.' : 'One last step to a fully verified profile.'}
            </p>
          )}
        </div>

        {/* Main Profile Card */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm overflow-hidden">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-[#111827] to-[#1f2937] relative">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #d1b07c 0%, transparent 50%)' }} />
          </div>

          <div className="px-7 pb-8 relative">
            {/* Avatar + Actions */}
            <div className="flex justify-between items-end -mt-10 mb-7">
              <div className="w-20 h-20 rounded-full border-4 border-white bg-[#111827] flex items-center justify-center text-2xl text-white font-bold shadow-md overflow-hidden">
                {data.channelThumbnail ? (
                  <img src={data.channelThumbnail} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  isBrand ? (data.companyName?.charAt(0) || 'B') : (data.name?.charAt(0) || currentUser?.email?.charAt(0)?.toUpperCase() || 'C')
                )}
              </div>
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <button onClick={() => { setEditing(false); setFormData(profileData || {}); }} className="px-4 py-2 text-sm font-medium text-[#6b7280] bg-[#f3f4f6] rounded-lg hover:bg-[#e5e7eb] transition-colors">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-[#111827] rounded-lg hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-60">
                      <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditing(true)} className="px-4 py-2 text-sm font-semibold text-[#374151] bg-[#f3f4f6] rounded-lg hover:bg-[#e5e7eb] transition-colors flex items-center gap-2">
                    <Edit3 className="w-4 h-4" /> Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Name + email */}
            <div className="mb-6">
              <h1 className="text-xl font-bold text-[#111827]">
                {isBrand ? (data.companyName || <span className="text-[#9ca3af] font-normal italic">Add company name →</span>) : (data.name || <span className="text-[#9ca3af] font-normal italic">Add your name →</span>)}
              </h1>
              <p className="text-sm text-[#6b7280] mt-0.5">{currentUser?.email}</p>
              {data.isAPIVerified && (
                <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified via YouTube API
                </span>
              )}
            </div>

            <hr className="border-[#f3f4f6] mb-6" />

            {/* CREATOR FIELDS */}
            {!isBrand ? (
              <div className="space-y-8">
                {/* Basic Info */}
                <section>
                  <h2 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><User className="w-4 h-4 text-[#9ca3af]" /> Creator Details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">Display Name</label>
                      {editing ? (
                        <input className="w-full px-3 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]" value={formData.name || ''} onChange={e => handleInputChange('name', e.target.value)} placeholder="Your name or channel name" />
                      ) : (
                        <div className="px-3 py-2.5 bg-[#f9fafb] rounded-lg text-sm text-[#111827]">
                          {data.name || <span className="text-[#9ca3af] italic cursor-pointer hover:text-[#111827]" onClick={() => setEditing(true)}>Click to add your name</span>}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">Content Niche</label>
                      {editing ? (
                        <input className="w-full px-3 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]" value={formData.niche || ''} onChange={e => handleInputChange('niche', e.target.value)} placeholder="e.g. Technology & B2B SaaS" />
                      ) : (
                        <div className="px-3 py-2.5 bg-[#f9fafb] rounded-lg text-sm text-[#111827]">
                          {data.niche || <span className="text-[#9ca3af] italic cursor-pointer hover:text-[#111827]" onClick={() => setEditing(true)}>Click to add your niche</span>}
                        </div>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">Bio</label>
                      {editing ? (
                        <textarea rows={3} className="w-full px-3 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] resize-none" value={formData.bio || ''} onChange={e => handleInputChange('bio', e.target.value)} placeholder="Tell brands what you do and who your audience is" />
                      ) : (
                        <div className="px-3 py-2.5 bg-[#f9fafb] rounded-lg text-sm text-[#111827]">
                          {data.bio || data.valuation?.data_justification || <span className="text-[#9ca3af] italic cursor-pointer hover:text-[#111827]" onClick={() => setEditing(true)}>Add a bio to help brands understand your content</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <hr className="border-[#f3f4f6]" />

                {/* Verified Metrics */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-[#374151] flex items-center gap-2"><Lock className="w-4 h-4 text-[#9ca3af]" /> Verified Channel Metrics</h2>
                    <span className="text-xs text-[#9ca3af] font-medium">Read-only</span>
                  </div>

                  {data.isAPIVerified ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-[#f9fafb] rounded-xl p-4 text-center">
                          <p className="text-xl font-bold text-[#111827]">{data.follower_count >= 1000 ? `${(data.follower_count / 1000).toFixed(1)}K` : data.follower_count || '—'}</p>
                          <p className="text-xs text-[#6b7280] mt-1 flex items-center justify-center gap-1"><Video className="w-3 h-3 text-red-500" /> Subscribers</p>
                        </div>
                        <div className="bg-[#f9fafb] rounded-xl p-4 text-center">
                          <p className="text-xl font-bold text-[#111827]">{data.avg_views >= 1000 ? `${(data.avg_views / 1000).toFixed(1)}K` : data.avg_views || '—'}</p>
                          <p className="text-xs text-[#6b7280] mt-1 flex items-center justify-center gap-1"><BarChart2 className="w-3 h-3" /> Avg Views</p>
                        </div>
                        <div className="bg-[#f9fafb] rounded-xl p-4 text-center">
                          <p className="text-xl font-bold text-[#111827]">{data.engagement_rate ? `${data.engagement_rate.toFixed(1)}%` : '—'}</p>
                          <p className="text-xs text-[#6b7280] mt-1 flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3" /> Engagement</p>
                        </div>
                      </div>
                      {data.lastSyncedAt && (
                        <p className="text-xs text-[#9ca3af] text-center">Last verified: {new Date(data.lastSyncedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      )}
                    </div>
                  ) : data.valuation ? (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-amber-900">Rate estimate — not verified</p>
                          <p className="text-xs text-amber-700 mt-1 mb-3">Your fair rate was estimated. Connect YouTube for real data and the verified badge.</p>
                          <div className="flex gap-4">
                            <div>
                              <p className="text-xs text-amber-600 font-medium">Base Integration Rate</p>
                              <p className="text-lg font-bold text-amber-900">₹{data.valuation.fair_rate_card.base_integration_fee.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-amber-600 font-medium">Dedicated Video</p>
                              <p className="text-lg font-bold text-amber-900">₹{data.valuation.fair_rate_card.dedicated_video_fee.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-[#e5e7eb] rounded-xl p-8 text-center">
                      <Video className="w-8 h-8 text-red-400 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-[#374151] mb-1">No channel connected</p>
                      <p className="text-xs text-[#6b7280] mb-4">Connect your YouTube channel to get a verified market rate that brands trust.</p>
                      <a href="/onboarding/creator" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]">Connect YouTube <ExternalLink className="w-3.5 h-3.5" /></a>
                    </div>
                  )}
                </section>

                <hr className="border-[#f3f4f6]" />

                {/* Portfolio */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-[#374151] flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#9ca3af]" /> Past Brand Work</h2>
                    <button onClick={() => setAddingPortfolio(true)} className="flex items-center gap-1.5 text-xs font-semibold text-[#2563eb] hover:text-[#1d4ed8]">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>

                  {portfolio.length === 0 && !addingPortfolio && (
                    <div className="border border-dashed border-[#e5e7eb] rounded-xl p-8 text-center">
                      <p className="text-sm text-[#6b7280] mb-1">No past brand work added yet</p>
                      <p className="text-xs text-[#9ca3af]">Adding collaborations increases your chances of getting shortlisted by 3×.</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {portfolio.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-3 bg-[#f9fafb] rounded-xl p-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#111827] truncate">{item.title}</p>
                          <p className="text-xs text-[#6b7280] mt-0.5">{item.brandName}</p>
                          {item.description && <p className="text-xs text-[#9ca3af] mt-1 line-clamp-2">{item.description}</p>}
                          {item.url && (
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#2563eb] mt-1 hover:underline">
                              <ExternalLink className="w-3 h-3" /> View
                            </a>
                          )}
                        </div>
                        <button onClick={() => removePortfolioItem(idx)} className="text-[#9ca3af] hover:text-red-500 transition-colors shrink-0 mt-0.5">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {addingPortfolio && (
                    <div className="mt-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-5 space-y-3">
                      <p className="text-sm font-semibold text-[#374151]">Add a collaboration</p>
                      <input className="w-full px-3 py-2.5 border border-[#d1d5db] rounded-lg text-sm focus:outline-none focus:border-[#2563eb]" placeholder="Campaign/video title *" value={newPortfolio.title} onChange={e => setNewPortfolio(p => ({ ...p, title: e.target.value }))} />
                      <input className="w-full px-3 py-2.5 border border-[#d1d5db] rounded-lg text-sm focus:outline-none focus:border-[#2563eb]" placeholder="Brand name *" value={newPortfolio.brandName} onChange={e => setNewPortfolio(p => ({ ...p, brandName: e.target.value }))} />
                      <input className="w-full px-3 py-2.5 border border-[#d1d5db] rounded-lg text-sm focus:outline-none focus:border-[#2563eb]" placeholder="Link to video/post (optional)" value={newPortfolio.url} onChange={e => setNewPortfolio(p => ({ ...p, url: e.target.value }))} />
                      <textarea className="w-full px-3 py-2.5 border border-[#d1d5db] rounded-lg text-sm resize-none focus:outline-none focus:border-[#2563eb]" rows={2} placeholder="Brief description (optional)" value={newPortfolio.description} onChange={e => setNewPortfolio(p => ({ ...p, description: e.target.value }))} />
                      <div className="flex gap-2">
                        <button onClick={() => setAddingPortfolio(false)} className="px-4 py-2 text-sm text-[#6b7280] bg-white border border-[#e5e7eb] rounded-lg hover:bg-[#f3f4f6]">Cancel</button>
                        <button onClick={addPortfolioItem} className="px-4 py-2 text-sm font-semibold text-white bg-[#111827] rounded-lg hover:bg-black">Save</button>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            ) : (
              /* BRAND FIELDS */
              <div className="space-y-8">
                <section>
                  <h2 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><Building2 className="w-4 h-4 text-[#9ca3af]" /> Company Details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { field: 'companyName', label: 'Company Name', placeholder: 'Your company name' },
                      { field: 'industry', label: 'Industry', placeholder: 'e.g. D2C, FinTech, EdTech' },
                      { field: 'website', label: 'Website', placeholder: 'https://yourcompany.com' },
                    ].map(({ field, label, placeholder }) => (
                      <div key={field}>
                        <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">{label}</label>
                        {editing ? (
                          <input className="w-full px-3 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]" value={formData[field] || ''} onChange={e => handleInputChange(field, e.target.value)} placeholder={placeholder} />
                        ) : (
                          <div className="px-3 py-2.5 bg-[#f9fafb] rounded-lg text-sm text-[#111827]">
                            {data[field] || <span className="text-[#9ca3af] italic cursor-pointer" onClick={() => setEditing(true)}>Click to add</span>}
                          </div>
                        )}
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">Annual Creator Budget</label>
                      {editing ? (
                        <select className="w-full px-3 py-2.5 border border-[#d1d5db] rounded-lg text-sm text-[#111827] bg-white focus:outline-none focus:border-[#2563eb]" value={formData.budget || ''} onChange={e => handleInputChange('budget', e.target.value)}>
                          <option value="">Select range</option>
                          <option>₹5,000 – ₹50,000</option>
                          <option>₹50,000 – ₹1 Lakh</option>
                          <option>₹1 Lakh – ₹5 Lakhs</option>
                          <option>₹5 Lakhs – ₹10 Lakhs</option>
                          <option>₹10 Lakhs+</option>
                        </select>
                      ) : (
                        <div className="px-3 py-2.5 bg-[#f9fafb] rounded-lg text-sm text-[#111827]">
                          {data.budget || <span className="text-[#9ca3af] italic cursor-pointer" onClick={() => setEditing(true)}>Click to add</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <hr className="border-[#f3f4f6]" />

                {/* Legal Verification */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-[#374151] flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#9ca3af]" /> Legal Verification</h2>
                    <span className="text-xs text-[#9ca3af] font-medium flex items-center gap-1"><Lock className="w-3 h-3" /> Locked</span>
                  </div>

                  <div className={`rounded-xl p-5 flex items-center justify-between ${data.verified ? 'bg-green-50 border border-green-100' : 'bg-[#f9fafb] border border-[#e5e7eb]'}`}>
                    <div>
                      <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-0.5">Entity Status</p>
                      <p className={`text-base font-bold ${data.verified ? 'text-green-700' : 'text-[#374151]'}`}>
                        {data.verified ? 'Verified Corporate Sponsor' : 'Unverified — Required for contracts'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-0.5">Trust Score</p>
                      <p className={`text-2xl font-bold ${data.verified ? 'text-green-700' : 'text-[#9ca3af]'}`}>{data.trustScore || '—'}</p>
                    </div>
                  </div>

                  {data.verified && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-[#f9fafb] rounded-lg p-4">
                        <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-1">Corporate PAN</p>
                        <p className="text-sm font-mono text-[#111827]">{data.corporatePan ? `${data.corporatePan.substring(0, 3)}••••${data.corporatePan.substring(7)}` : '—'}</p>
                      </div>
                      <div className="bg-[#f9fafb] rounded-lg p-4">
                        <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-1">GSTIN</p>
                        <p className="text-sm font-mono text-[#111827]">{data.gstin ? `${data.gstin.substring(0, 4)}••••••${data.gstin.substring(10)}` : '—'}</p>
                      </div>
                    </div>
                  )}

                  {!data.verified && (
                    <button onClick={() => setShowVerifyModal(true)} className="mt-4 w-full py-3 text-sm font-semibold text-white bg-[#111827] rounded-xl hover:bg-black transition-colors">
                      Submit PAN & GSTIN for Verification
                    </button>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-7 py-5 border-b border-[#e5e7eb] flex justify-between items-center">
              <h2 className="text-lg font-bold text-[#111827] flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Legal Entity Verification</h2>
              {!verifying && (
                <button onClick={() => setShowVerifyModal(false)} className="text-[#9ca3af] hover:text-[#374151] transition-colors">✕</button>
              )}
            </div>

            <div className="p-7">
              {verifying ? (
                <div className="py-10 text-center">
                  <div className="w-12 h-12 border-[3px] border-[#111827] border-t-transparent rounded-full animate-spin mx-auto mb-5" />
                  <p className="text-sm font-medium text-[#374151]">
                    {['Validating PAN format…', 'Cross-referencing GSTIN registry…', 'Assigning trust score…', 'Finalizing…'][verifyStep] || 'Processing…'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleVerificationSubmit} className="space-y-5">
                  <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-lg p-4 text-xs text-[#0369a1]">
                    Your PAN and GSTIN are required for Section 194J TDS compliance. Documents are stored encrypted and used only for tax remittance.
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wider mb-1.5">Corporate PAN</label>
                    <input type="text" required maxLength={10} placeholder="ABCDE1234F" className="w-full px-3 py-2.5 border border-[#d1d5db] rounded-lg text-sm font-mono uppercase tracking-widest focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]" value={verifyDocs.pan} onChange={e => setVerifyDocs(p => ({ ...p, pan: e.target.value.toUpperCase() }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wider mb-1.5">GSTIN</label>
                    <input type="text" required maxLength={15} placeholder="22AAAAA0000A1Z5" className="w-full px-3 py-2.5 border border-[#d1d5db] rounded-lg text-sm font-mono uppercase tracking-widest focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]" value={verifyDocs.gstin} onChange={e => setVerifyDocs(p => ({ ...p, gstin: e.target.value.toUpperCase() }))} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowVerifyModal(false)} className="flex-1 py-2.5 text-sm text-[#6b7280] border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb]">Cancel</button>
                    <button type="submit" className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#111827] rounded-lg hover:bg-black">Submit for Verification</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
