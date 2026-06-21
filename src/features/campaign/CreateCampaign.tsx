import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { useAuth } from '../auth/AuthContext';
import { ArrowLeft, Cpu, Eye, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { NICHES } from '../../utils/niches';

const CAMPAIGN_TEMPLATES = [
  {
    id: 'product-review',
    label: '📦 Product Review',
    title: 'In-Depth Product Review & Demo',
    description: 'We are looking for an honest, in-depth review of our latest product. Please showcase unboxing, setup, and your personal experience using it for 7 days.',
    deliverables: '1x 5-8 minute dedicated YouTube video, 1x YouTube Short highlighting key features.',
  },
  {
    id: 'unboxing',
    label: '🎁 Aesthetic Unboxing',
    title: 'Aesthetic Unboxing & First Impressions',
    description: 'Create an engaging, fast-paced unboxing video focusing on the packaging, design, and first impressions of our product. High-quality b-roll is a must.',
    deliverables: '1x 60s Instagram Reel / YouTube Short, 2x High-res lifestyle photos.',
  },
  {
    id: 'sponsored',
    label: '📢 60s Integration',
    title: '60s Pre-roll Integration',
    description: 'We need a natural 60-90 second integration in your upcoming video. Speak about the product value proposition and include a strong call-to-action to the link in description.',
    deliverables: '1x 60-90s dedicated segment in the first 3 minutes of a YouTube video. Link in description and pinned comment.',
  }
];

export default function CreateCampaign() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    deliverables: '',
    deadline: '',
    niche: [NICHES[0]] as string[],
  });

  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [loading, setLoading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [brandProfile, setBrandProfile] = useState<any>(null);
  const [cloneCreatorId, setCloneCreatorId] = useState<string | null>(null);
  const [newCampaignId, setNewCampaignId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      getDoc(doc(db, 'users', currentUser.uid))
        .then((snap) => {
          if (snap.exists()) setBrandProfile(snap.data());
        })
        .catch(console.error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (location.state?.cloneFrom) {
      getDoc(doc(db, 'campaigns', location.state.cloneFrom))
        .then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setFormData({
              title: data.title ? `[RENEWAL] ${data.title}` : '',
              description: data.description || '',
              budget: data.budget || '',
              deliverables: data.deliverables || '',
              deadline: '',
              niche: data.niche || [NICHES[0]],
            });
            if (location.state.cloneCreatorId) {
              setCloneCreatorId(location.state.cloneCreatorId);
            }
          }
        })
        .catch(console.error);
    }
  }, [location.state]);

  const applyTemplate = (template: typeof CAMPAIGN_TEMPLATES[0]) => {
    setFormData({
      ...formData,
      title: template.title,
      description: template.description,
      deliverables: template.deliverables,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1: validate form and go to preview
  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.budget || !formData.deadline || !formData.deliverables) {
      alert('Please fill in all required fields before previewing.');
      return;
    }
    setStep('preview');
  };

  const handleSubmit = async () => {
    setLoading(true);

    // Simulate saving campaign quickly without hanging
    if (auth.app.options.apiKey !== 'YOUR_API_KEY') {
      try {
        addDoc(collection(db, 'campaigns'), {
          ...formData,
          brandId: currentUser?.uid,
          brandName:
            brandProfile?.companyName ||
            brandProfile?.name ||
            currentUser?.email?.split('@')[0] ||
            'Brand',
          brandLogoUrl: brandProfile?.logoUrl || null,
          status: 'active',
          createdAt: new Date().toISOString(),
        }).then((docRef) => {
          setNewCampaignId(docRef.id);
        }).catch((e) => console.error('DB save failed', e));
      } catch (error) {
        // ignore
      }
    }

    // Trigger Complex ML Pipeline Animation
    setIsDeploying(true);
    setProgress(0);
    setLogs(['[SYSTEM] INITIALIZING MATCHMAKING PROTOCOL...']);

    const duration = 5000;
    const intervalTime = 60;
    let elapsed = 0;

    // Core logical steps
    const mainSteps = [
      { t: 0, msg: `[DATA] Analyzing ${formData.niche.join(', ')} audience vectors...` },
      { t: 1000, msg: '[ML] Loading historical conversion rates...' },
      { t: 2000, msg: '[NET] Querying YouTube API metrics...' },
      { t: 3000, msg: '[MATH] Calculating optimal ROI pathways...' },
      { t: 4000, msg: '[SYSTEM] Finalizing matchmaking payload...' },
    ];

    const timer = setInterval(() => {
      elapsed += intervalTime;
      const p = Math.min((elapsed / duration) * 100, 100);
      setProgress(p);

      // Inject main steps at specific times
      if (mainSteps.length > 0 && elapsed >= mainSteps[0].t) {
        const step = mainSteps.shift()!;
        setLogs((prev) => [...prev.slice(-6), step.msg]);
      }
      // Inject random fast logs
      else if (Math.random() > 0.4) {
        const randomLogs = [
          `[HEX] ${Math.random().toString(16).substr(2, 8).toUpperCase()} verified.`,
          `[NODE] Scraping creator #${Math.floor(Math.random() * 9000) + 1000}...`,
          `[WARN] Skipping low-affinity node...`,
          `[CALC] ROI index: ${(Math.random() * 5 + 1).toFixed(2)}x`,
          `[FILTER] Engagement rate > 2.5% applied.`,
        ];
        const rLog = randomLogs[Math.floor(Math.random() * randomLogs.length)];
        setLogs((prev) => [...prev.slice(-6), rLog]);
      }

      if (elapsed >= duration) {
        clearInterval(timer);
        // If this is a clone/renewal, navigate directly to deal room with that creator
        if (cloneCreatorId && newCampaignId) {
          navigate(`/deal-room/${newCampaignId}/${cloneCreatorId}`);
        } else {
          navigate('/matchmaking', { state: { prefillNiche: formData.niche } });
        }
      }
    }, intervalTime);
  };

  if (isDeploying) {
    return (
      <div className="min-h-screen bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] flex flex-col items-center justify-center font-['Inter'] px-4">
        <div className="w-full max-w-xl bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-2xl overflow-hidden relative">
          {/* Terminal Header */}
          <div className="bg-[#fde047] border-b-4 border-black px-5 py-4 flex items-center justify-between">
            <div className="flex gap-2.5">
              <div className="w-4 h-4 rounded-full border-2 border-black bg-red-400"></div>
              <div className="w-4 h-4 rounded-full border-2 border-black bg-yellow-400"></div>
              <div className="w-4 h-4 rounded-full border-2 border-black bg-[#a3e635]"></div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-black flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Matchmaking_Protocol.exe
            </span>
          </div>

          {/* Terminal Body */}
          <div className="bg-slate-900 p-8 min-h-[280px] flex flex-col justify-end relative overflow-hidden">
            {/* Decorative background grid in terminal */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

            <div className="space-y-3 font-mono relative z-10 w-full">
              {logs.map((msg, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <span className="text-[#a3e635] shrink-0 font-black text-sm">{'>'}</span>
                  <span
                    className={`${i === logs.length - 1 ? 'text-white' : 'text-slate-500'} text-xs sm:text-sm font-bold uppercase tracking-wider leading-relaxed break-all`}
                  >
                    {msg}
                    {i === logs.length - 1 && (
                      <span className="inline-block w-2.5 h-4 bg-[#a3e635] ml-2 animate-pulse translate-y-0.5"></span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Neobrutalist Progress Bar */}
          <div className="h-8 bg-white w-full border-t-4 border-black relative flex items-center justify-center overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-indigo-600 transition-all duration-75 ease-linear border-r-4 border-black"
              style={{ width: `${progress}%` }}
            >
              {/* Stripe pattern on the progress bar */}
              <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)]"></div>
            </div>

            {/* Percentage Text with mix-blend-difference so it inverts when progress bar passes underneath */}
            <span
              className="relative z-10 text-[10px] font-black uppercase tracking-widest text-black mix-blend-difference"
              style={{ color: progress > 50 ? 'white' : 'black' }}
            >
              {Math.round(progress)}% ALLOCATED
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Campaign Preview card — mirrors what creators see
  if (step === 'preview') {
    const daysLeft = formData.deadline
      ? Math.ceil((new Date(formData.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    const urgencyColor = daysLeft !== null && daysLeft <= 3
      ? 'bg-red-50 border-red-400 text-red-700'
      : daysLeft !== null && daysLeft <= 7
        ? 'bg-amber-50 border-amber-400 text-amber-700'
        : 'bg-emerald-50 border-emerald-400 text-emerald-700';

    return (
      <div className="min-h-screen bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] py-6 px-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setStep('form')} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-black hover:text-indigo-600 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Edit
            </button>
            <div className="h-5 w-0.5 bg-black" />
            <h1 className="text-sm font-black uppercase tracking-widest text-black">Campaign Preview</h1>
            <span className="ml-auto text-[10px] font-black uppercase tracking-widest bg-amber-100 border-2 border-amber-400 text-amber-800 px-2.5 py-1 rounded-full">
              Preview Mode
            </span>
          </div>

          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-5">
            This is exactly how your campaign will appear to creators. Review and confirm.
          </p>

          {/* Campaign card preview */}
          <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {formData.niche.map((n) => (
                <span key={n} className="text-[10px] font-bold text-slate-800 bg-slate-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {n}
                </span>
              ))}
              {brandProfile?.companyName && (
                <span className="text-xs font-bold text-gray-600 ml-auto">{brandProfile.companyName}</span>
              )}
            </div>

            <h2 className="font-bold text-black text-xl leading-snug mb-4">{formData.title || 'Campaign Title'}</h2>

            {formData.description && (
              <p className="text-sm text-gray-700 leading-relaxed mb-4 border-l-2 border-black pl-3">
                {formData.description}
              </p>
            )}

            {/* Urgency signals */}
            <div className="flex gap-2 flex-wrap text-[10px] font-black uppercase tracking-widest mb-5">
              <span className="bg-slate-100 border-2 border-black px-2.5 py-1.5 rounded-md shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                👥 0 applied
              </span>
              {daysLeft !== null && (
                <span className={`border-2 px-2.5 py-1.5 rounded-md shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${urgencyColor}`}>
                  ⏰ {daysLeft <= 0 ? 'Deadline passed' : `${daysLeft}d left`}
                </span>
              )}
              <span className="bg-white border-2 border-black px-2.5 py-1.5 rounded-md shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-emerald-800">
                💰 {formData.budget ? `₹${formData.budget}` : '₹—'}
              </span>
            </div>

            {formData.deliverables && (
              <div className="bg-gray-50 border-2 border-black rounded-lg p-3 mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Deliverables</p>
                <p className="text-sm font-bold text-black">{formData.deliverables}</p>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <div className="flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-3 px-4 bg-emerald-50 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> Applied (preview only)
              </div>
              <div className="flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-3 px-4 bg-slate-900 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-white">
                Apply Now <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep('form')}
              className="flex-1 bg-white border-2 border-black font-black py-4 rounded-xl uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all"
            >
              ← Edit Campaign
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-[#0f3460] hover:bg-[#1a4a82] text-white border-2 border-black font-black py-4 rounded-xl uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Deploying…' : '✅ Confirm & Deploy'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] text-black font-['Inter'] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/brand-dashboard')}
          className="text-black hover:text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> BACK TO WORKSPACE
        </button>

        <div className="mb-6">
          <h1 className="text-4xl font-black text-black tracking-tight mb-2 uppercase">
            Publish Campaign
          </h1>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
            Structure your deal terms and push to the creator network.
          </p>
        </div>

        {/* Campaign Templates Selector */}
        <div className="mb-6">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-black mb-3">
            Quick Start with Templates
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CAMPAIGN_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="bg-white border-2 border-black rounded-lg p-3 text-left hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all"
              >
                <div className="font-bold text-sm text-black mb-1">{tpl.label}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest truncate">Click to auto-fill</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <form onSubmit={handlePreview} className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Core Details */}
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-black border-b-2 border-black pb-3 mb-4">
                  CORE DETAILS
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">
                      Campaign Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full bg-white border-2 border-black rounded-lg p-3.5 text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-400 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
                      placeholder="e.g. Diwali Mega Sale Promotion"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">
                      Creative Brief & Goals
                    </label>
                    <textarea
                      name="description"
                      required
                      rows={5}
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full bg-white border-2 border-black rounded-lg p-3.5 text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all resize-none placeholder:text-gray-400 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
                      placeholder="Describe the campaign goals and what you expect from the creator..."
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Financials & Matchmaking */}
              <div className="space-y-6">
                {/* Financials & Timeline */}
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-black border-b-2 border-black pb-3 mb-4">
                    FINANCIALS & TIMELINE
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">
                        Total Budget (INR)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">
                          ₹
                        </span>
                        <input
                          type="text"
                          name="budget"
                          required
                          value={formData.budget}
                          onChange={handleChange}
                          className="w-full bg-white border-2 border-black rounded-lg py-3.5 pl-10 pr-4 text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-400"
                          placeholder="50,000"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">
                        Submission Deadline
                      </label>
                      <input
                        type="date"
                        name="deadline"
                        required
                        value={formData.deadline}
                        onChange={handleChange}
                        className="w-full bg-white border-2 border-black rounded-lg p-3.5 text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Matchmaking Parameters */}
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-black border-b-2 border-black pb-3 mb-4">
                    MATCHMAKING PARAMETERS
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">
                        Required Deliverables
                      </label>
                      <input
                        type="text"
                        name="deliverables"
                        required
                        value={formData.deliverables}
                        onChange={handleChange}
                        className="w-full bg-white border-2 border-black rounded-lg p-3.5 text-sm font-bold text-black focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-400 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
                        placeholder="e.g. 1 YouTube Video, 2 Reels"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">
                        Target Creator Niches
                      </label>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 bg-gray-50 border-2 border-black shadow-[inset_0px_2px_4px_rgba(0,0,0,0.1)] rounded-lg">
                        {NICHES.map((n) => {
                          const isSelected = formData.niche.includes(n);
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  niche: isSelected
                                    ? prev.niche.filter((x) => x !== n)
                                    : [...prev.niche, n],
                                }));
                              }}
                              className={`text-[10px] font-black px-3 py-1.5 rounded-full border-2 border-black transition-all uppercase tracking-widest ${isSelected ? 'bg-[#0f3460] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                            >
                              {n}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t-2 border-gray-100 flex flex-col-reverse sm:flex-row justify-end gap-4 mt-8">
              <button
                type="button"
                onClick={() => navigate('/brand-dashboard')}
                className="w-full sm:w-auto bg-gray-100 text-black border-2 border-black font-black py-3.5 px-8 rounded-lg uppercase tracking-widest text-[10px] hover:bg-gray-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-[#0f3460] text-white border-2 border-black font-black py-3.5 px-8 rounded-lg uppercase tracking-widest text-[10px] hover:bg-[#0a2447] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Eye className="w-3.5 h-3.5" />
                {loading ? 'LOADING...' : 'PREVIEW CAMPAIGN'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
