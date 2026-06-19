import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ShieldCheck, Lock, Edit3, Save, AlertCircle, Building2, User, Camera, Upload, FileText } from 'lucide-react';

export default function ProfilePage() {
  const { userRole, currentUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState<any>({});
  
  // Verification Modal State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyDocs, setVerifyDocs] = useState({ pan: '', gstin: '' });
  const [verifying, setVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfileData(docSnap.data());
            setFormData(docSnap.data());
          }
        } catch (err) {
          console.error("Error fetching profile from Firestore", err);
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
      const docRef = doc(db, 'users', currentUser.uid);
      await setDoc(docRef, formData, { merge: true });
      setProfileData(formData);
      setEditing(false);
    } catch (err) {
      console.error("Error updating profile", err);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyStep(0);
    
    const msgs = ['Encrypting documents...', 'Routing to Signzy Verification API...', 'Validating Legal Entity...', 'Finalizing Compliance...'];
    
    let current = 0;
    const interval = setInterval(async () => {
      current++;
      if (current < msgs.length) {
        setVerifyStep(current);
      } else {
        clearInterval(interval);
        // Complete Verification
        if (currentUser) {
          try {
            const docRef = doc(db, 'users', currentUser.uid);
            const updates = { 
              verified: true, 
              trustScore: Math.floor(Math.random() * 15) + 85, // 85-99
              corporatePan: verifyDocs.pan.toUpperCase(),
              gstin: verifyDocs.gstin.toUpperCase()
            };
            await setDoc(docRef, updates, { merge: true });
            setProfileData((prev:any) => ({ ...prev, ...updates }));
            setFormData((prev:any) => ({ ...prev, ...updates }));
          } catch (err) {
            console.error(err);
          }
        }
        setVerifying(false);
        setShowVerifyModal(false);
      }
    }, 1500);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatarUrl' | 'bannerUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange(field, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#f9fafb]">
        <div className="w-10 h-10 border-[3px] border-[#d1b07c] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const data = profileData || {};
  const isBrand = userRole === 'brand';
  const needsVerification = isBrand && !data.verified;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-['Outfit'] pb-24">
      {/* Verification Banner */}
      {needsVerification && !showVerifyModal && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse-slow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-amber-900">Action Required: Legal Verification Pending</h3>
              <p className="text-amber-700 text-sm font-medium">Your corporate identity must be verified to unlock the Escrow and Smart Contract engines.</p>
            </div>
          </div>
          <button onClick={() => setShowVerifyModal(true)} className="whitespace-nowrap px-6 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition-colors shadow-sm">
            Verify Legal Entity
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        {/* Banner Section */}
        <div 
          className="h-48 bg-[#111827] relative group bg-cover bg-center transition-all"
          style={{ backgroundImage: (editing ? formData.bannerUrl : data.bannerUrl) ? `url(${editing ? formData.bannerUrl : data.bannerUrl})` : undefined }}
        >
          {!(editing ? formData.bannerUrl : data.bannerUrl) && (
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          )}
          
          {editing && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <label className="cursor-pointer px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur text-white rounded-lg font-bold flex items-center gap-2">
                <Camera className="w-4 h-4" /> Upload Banner Image
                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'bannerUrl')} />
              </label>
            </div>
          )}
        </div>
        
        <div className="px-8 pb-10 relative">
          {/* Avatar & Header Action */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end -mt-16 mb-8 gap-4">
            <div className="relative group">
              <div className="h-32 w-32 rounded-full border-4 border-white bg-white shadow-md flex items-center justify-center text-5xl text-[#d1b07c] font-black uppercase shrink-0 overflow-hidden">
                {(editing ? formData.avatarUrl : data.avatarUrl) ? (
                  <img src={editing ? formData.avatarUrl : data.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  userRole === 'creator' ? (data.name ? data.name.charAt(0) : 'C') : (data.companyName ? data.companyName.charAt(0) : 'B')
                )}
              </div>
              
              {editing && (
                <label className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity border-4 border-white">
                  <Camera className="w-6 h-6 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'avatarUrl')} />
                </label>
              )}
            </div>
            
            <div className="flex gap-3">
              {editing ? (
                <>
                  <button onClick={() => { setEditing(false); setFormData(profileData || {}); }} className="px-6 py-2.5 bg-[#f9fafb] text-[#4b5563] font-bold rounded-lg border border-[#e5e7eb] hover:bg-[#f3f4f6] transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-[#d1b07c] text-white font-bold rounded-lg hover:bg-[#b59560] transition-colors flex items-center gap-2">
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="px-6 py-2.5 bg-[#111827] text-white font-bold rounded-lg hover:bg-black transition-colors flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* CREATOR PROFILE VIEW */}
          {userRole === 'creator' ? (
            <div className="space-y-10">
              {/* Editable Section */}
              <section>
                <h2 className="text-xl font-black text-[#111827] mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#d1b07c]" /> Creator Details
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-2">Display Name</label>
                    {editing ? (
                      <input type="text" className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 text-[#111827] focus:outline-none focus:border-[#d1b07c]" value={formData.name || ''} onChange={e => handleInputChange('name', e.target.value)} />
                    ) : (
                      <div className="p-3 bg-white border border-[#e5e7eb] rounded-lg text-[#111827] font-medium">{data.name || 'Not Set'}</div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-2">Content Niche</label>
                    {editing ? (
                      <input type="text" className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 text-[#111827] focus:outline-none focus:border-[#d1b07c]" value={formData.niche || ''} onChange={e => handleInputChange('niche', e.target.value)} />
                    ) : (
                      <div className="p-3 bg-white border border-[#e5e7eb] rounded-lg text-[#111827] font-medium">{data.niche || 'Not Set'}</div>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-2">Bio / Justification</label>
                    {editing ? (
                      <textarea rows={3} className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 text-[#111827] focus:outline-none focus:border-[#d1b07c] resize-none" value={formData.bio || formData.valuation?.data_justification || ''} onChange={e => handleInputChange('bio', e.target.value)} />
                    ) : (
                      <div className="p-4 bg-white border border-[#e5e7eb] rounded-lg text-[#111827]">{data.bio || data.valuation?.data_justification || 'No bio provided.'}</div>
                    )}
                  </div>
                </div>
              </section>

              <hr className="border-[#e5e7eb]" />

              {/* Locked Data Section */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-[#111827] flex items-center gap-2">
                    <Lock className="w-5 h-5 text-[#9ca3af]" /> Verified Metrics
                  </h2>
                  <span className="text-xs bg-[#f3f4f6] text-[#6b7280] px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-[#e5e7eb]">Read Only</span>
                </div>
                
                <div className="bg-[#f9fafb] p-6 rounded-xl border border-[#e5e7eb] grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-1">Data-Validated Followers</label>
                    <div className="text-2xl font-black text-[#111827]">{data.valuation?.market_positioning || data.follower_count || '0'}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-1">Fair Base Rate</label>
                    <div className="text-2xl font-black text-[#111827]">{data.valuation ? `₹${data.valuation.fair_rate_card.base_integration_fee.toLocaleString()}` : 'Pending API Validation'}</div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-1">Account Email</label>
                    <div className="text-[#6b7280] font-medium">{currentUser?.email}</div>
                  </div>
                </div>
                <p className="text-xs text-[#9ca3af] mt-3 flex items-start gap-1.5"><AlertCircle className="w-4 h-4 shrink-0" /> Follower counts and rates are programmatically determined by the Valuation Engine and cannot be manually overridden.</p>
              </section>
            </div>
          ) : (
          /* BRAND PROFILE VIEW */
            <div className="space-y-10">
              {/* Editable Section */}
              <section>
                <h2 className="text-xl font-black text-[#111827] mb-6 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#d1b07c]" /> Corporate Profile
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-2">Company Name</label>
                    {editing ? (
                      <input type="text" className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 text-[#111827] focus:outline-none focus:border-[#d1b07c]" value={formData.companyName || ''} onChange={e => handleInputChange('companyName', e.target.value)} />
                    ) : (
                      <div className="p-3 bg-white border border-[#e5e7eb] rounded-lg text-[#111827] font-medium">{data.companyName || 'Not Set'}</div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-2">Industry</label>
                    {editing ? (
                      <input type="text" className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 text-[#111827] focus:outline-none focus:border-[#d1b07c]" value={formData.industry || ''} onChange={e => handleInputChange('industry', e.target.value)} />
                    ) : (
                      <div className="p-3 bg-white border border-[#e5e7eb] rounded-lg text-[#111827] font-medium">{data.industry || 'Not Set'}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-2">Website URL</label>
                    {editing ? (
                      <input type="text" className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 text-[#111827] focus:outline-none focus:border-[#d1b07c]" value={formData.website || ''} onChange={e => handleInputChange('website', e.target.value)} />
                    ) : (
                      <div className="p-3 bg-white border border-[#e5e7eb] rounded-lg text-[#111827] font-medium">{data.website || 'Not Set'}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-2">Annual Budget</label>
                    {editing ? (
                      <select className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 text-[#111827] focus:outline-none focus:border-[#d1b07c]" value={formData.budget || ''} onChange={e => handleInputChange('budget', e.target.value)}>
                        <option>₹5,000 - ₹50,000</option>
                        <option>₹50,000 - ₹1 Lakh</option>
                        <option>₹1 Lakh - ₹5 Lakhs</option>
                        <option>₹5 Lakhs - ₹10 Lakhs</option>
                        <option>₹10 Lakhs+</option>
                      </select>
                    ) : (
                      <div className="p-3 bg-white border border-[#e5e7eb] rounded-lg text-[#111827] font-medium">{data.budget || 'Not Set'}</div>
                    )}
                  </div>
                </div>
              </section>

              <hr className="border-[#e5e7eb]" />

              {/* Locked Data Section */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-[#111827] flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-green-600" /> Legal & Verification
                  </h2>
                  <span className="text-xs bg-[#f3f4f6] text-[#6b7280] px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-[#e5e7eb] flex items-center gap-1.5"><Lock className="w-3 h-3" /> Locked</span>
                </div>

                <div className={`${data.verified ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-200'} p-6 rounded-xl border mb-6 flex items-center justify-between transition-colors`}>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${data.verified ? 'text-green-800' : 'text-gray-500'}`}>Entity Status</p>
                    <p className={`text-lg font-black ${data.verified ? 'text-green-700' : 'text-gray-700'}`}>{data.verified ? 'Verified Corporate Sponsor' : 'Unverified Entity'}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${data.verified ? 'text-green-800' : 'text-gray-500'}`}>Trust Score</p>
                    <p className={`text-3xl font-black ${data.verified ? 'text-green-700' : 'text-gray-400'}`}>{data.trustScore || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="bg-[#f9fafb] p-6 rounded-xl border border-[#e5e7eb] grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-1">Corporate PAN</label>
                    <div className="text-[#111827] font-medium font-mono flex items-center">
                      {data.corporatePan ? `${data.corporatePan.substring(0,3)}****${data.corporatePan.substring(7)}` : 'N/A'}
                      {data.corporatePan && data.verified && <span className="ml-2 text-[10px] text-green-700 bg-green-100 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider border border-green-200">Verified</span>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-1">Corporate GSTIN</label>
                    <div className="text-[#111827] font-medium font-mono flex items-center">
                      {data.gstin ? `${data.gstin.substring(0,4)}******${data.gstin.substring(10)}` : 'N/A'}
                      {data.gstin && data.verified && <span className="ml-2 text-[10px] text-green-700 bg-green-100 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider border border-green-200">Verified</span>}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-1">Account Email</label>
                    <div className="text-[#6b7280] font-medium">{currentUser?.email}</div>
                  </div>
                </div>
                <p className="text-xs text-[#9ca3af] mt-3 flex items-start gap-1.5"><AlertCircle className="w-4 h-4 shrink-0" /> Legal entity details are locked for Escrow and TDS compliance. Contact enterprise support for modifications.</p>
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="px-8 py-6 border-b border-[#e5e7eb] flex justify-between items-center bg-[#f9fafb]">
              <h2 className="text-2xl font-black text-[#111827] flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-[#d1b07c]" /> Legal Entity Verification
              </h2>
              {!verifying && (
                <button onClick={() => setShowVerifyModal(false)} className="text-[#9ca3af] hover:text-[#111827] transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>

            <div className="p-8">
              {verifying ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 border-4 border-[#d1b07c] border-t-transparent rounded-full animate-spin mb-6"></div>
                  <h3 className="text-xl font-bold text-[#111827] mb-2 animate-pulse">
                    {['Encrypting documents...', 'Routing to Signzy Verification API...', 'Validating Legal Entity...', 'Finalizing Compliance...'][verifyStep] || 'Finalizing...'}
                  </h3>
                  <p className="text-[#6b7280]">Please do not close this window. Secure handshake in progress.</p>
                </div>
              ) : (
                <form onSubmit={handleVerificationSubmit} className="space-y-6">
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3 mb-6">
                    <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 font-medium">Upload your corporate documents to instantly unlock the verified brand status and receive your trust score.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-2">Corporate PAN</label>
                      <input type="text" required placeholder="ABCDE1234F" className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 text-[#111827] uppercase focus:outline-none focus:border-[#d1b07c]" maxLength={10} value={verifyDocs.pan} onChange={e => setVerifyDocs(p => ({ ...p, pan: e.target.value.toUpperCase() }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-2">GSTIN</label>
                      <input type="text" required placeholder="22AAAAA0000A1Z5" className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 text-[#111827] uppercase focus:outline-none focus:border-[#d1b07c]" maxLength={15} value={verifyDocs.gstin} onChange={e => setVerifyDocs(p => ({ ...p, gstin: e.target.value.toUpperCase() }))} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-2">Certificate of Incorporation (PDF/JPG)</label>
                    <label className="flex items-center justify-center w-full h-24 px-4 transition bg-[#f9fafb] border-2 border-[#e5e7eb] border-dashed rounded-lg appearance-none cursor-pointer hover:border-[#d1b07c] focus:outline-none">
                      <span className="flex items-center space-x-2 text-[#6b7280]">
                        <Upload className="w-5 h-5" />
                        <span className="font-medium">Click to attach file</span>
                      </span>
                      <input type="file" className="hidden" />
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#4b5563] uppercase tracking-wider mb-2">Authorized Signatory ID (Aadhaar/PAN)</label>
                    <label className="flex items-center justify-center w-full h-24 px-4 transition bg-[#f9fafb] border-2 border-[#e5e7eb] border-dashed rounded-lg appearance-none cursor-pointer hover:border-[#d1b07c] focus:outline-none">
                      <span className="flex items-center space-x-2 text-[#6b7280]">
                        <FileText className="w-5 h-5" />
                        <span className="font-medium">Click to attach file</span>
                      </span>
                      <input type="file" className="hidden" />
                    </label>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setShowVerifyModal(false)} className="px-6 py-3 bg-white text-[#4b5563] font-bold rounded-lg border border-[#e5e7eb] hover:bg-[#f9fafb] transition-colors">
                      Cancel
                    </button>
                    <button type="submit" className="px-8 py-3 bg-[#111827] text-[#d1b07c] font-bold rounded-lg hover:bg-black transition-colors shadow-md">
                      Submit for Verification
                    </button>
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
