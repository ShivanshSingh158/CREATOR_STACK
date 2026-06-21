import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { LayoutDashboard, MessageSquare, User, LogOut, ChevronDown, Wallet, Search } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function Navbar() {
  const { currentUser, userRole, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDealRoom = location.pathname.includes('/deal-room');
  const isOnboarding = location.pathname.includes('/onboarding');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const seedSpecific = async () => {
      const stored = localStorage.getItem('seeded_specific_creators');
      if (stored) return;

      try {
        const res = await fetch('/specific_creators.json');
        if (!res.ok) return;
        const creators = await res.json();

        let count = 0;

        for (const c of creators) {
          const { id, ...data } = c;
          await setDoc(doc(db, 'users', id), data, { merge: true });
          await setDoc(doc(db, 'creators', id), data, { merge: true });
          count++;
        }

        localStorage.setItem('seeded_specific_creators', 'true');
      } catch (e) {
        console.error('Seeding failed', e);
      }
    };
    seedSpecific();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  useEffect(() => {
    const seedDb = async () => {
      const stored = localStorage.getItem('seeded_100_creators');
      if (stored) return;

      try {
        const res = await fetch('/creators_data.json');
        if (!res.ok) return;
        const creators = await res.json();

        let count = 0;

        for (const c of creators) {
          const { id, ...data } = c;

          await setDoc(doc(db, 'users', id), data, { merge: true });
          await setDoc(doc(db, 'creators', id), data, { merge: true });
          count++;
        }

        localStorage.setItem('seeded_100_creators', 'true');
      } catch (e) {
        console.error('Seeding failed', e);
      }
    };
    seedDb();
  }, []);

  // Hide completely on deal room only
  if (isDealRoom) return null;

  if (isOnboarding) {
    return (
      <nav
        className="sticky top-0 z-50 bg-white border-b-2 border-black shadow-sm"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <div className="w-full px-4 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <div className="inline-flex items-center gap-2 border-2 border-black px-3 py-1 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <img src="/logo.svg" alt="Logo" className="w-5 h-5 object-contain" />
              <span className="text-xl font-black text-[#111827] tracking-tight">
                creator<span className="text-[#8b5cf6]">.</span>stack
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-white text-red-600 font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </nav>
    );
  }

  const displayName =
    userProfile?.youtubeData?.channelName ||
    userProfile?.name ||
    userProfile?.companyName ||
    currentUser?.email?.split('@')[0] ||
    'User';
  const displayAvatar =
    userProfile?.youtubeData?.thumbnailUrl || userProfile?.channelThumbnail || userProfile?.logoUrl;
  const initials = displayName.charAt(0).toUpperCase();
  const displayEmail = currentUser?.email || '';

  return (
    <nav
      className="sticky top-0 z-50 bg-white border-b-2 border-black shadow-sm"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Edge-to-edge layout instead of max-w-7xl */}
      <div className="w-full px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 border-2 border-black px-3 py-1 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <img src="/logo.svg" alt="Logo" className="w-5 h-5 object-contain" />
            <span className="text-xl font-black text-[#111827] tracking-tight">
              creator<span className="text-[#8b5cf6]">.</span>stack
            </span>
          </Link>

          {/* Nav Links + User */}
          {currentUser ? (
            <>
              <div className="hidden md:flex items-center gap-3">
              <Link
                to={`/${userRole}-dashboard`}
                className={`flex items-center gap-2 px-4 py-2 border-2 border-black text-xs font-black uppercase tracking-wider transition-all ${location.pathname.includes('dashboard') ? 'bg-[#111827] text-white shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] translate-y-0.5' : 'bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'}`}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>

              {userRole === 'creator' && (
                <Link
                  to="/campaigns"
                  className={`flex items-center gap-2 px-4 py-2 border-2 border-black text-xs font-black uppercase tracking-wider transition-all ${location.pathname === '/campaigns' ? 'bg-[#111827] text-white shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] translate-y-0.5' : 'bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'}`}
                >
                  <Search className="w-4 h-4" /> Marketplace
                </Link>
              )}

              <Link
                to="/messages"
                className={`flex items-center gap-2 px-4 py-2 border-2 border-black text-xs font-black uppercase tracking-wider transition-all ${location.pathname === '/messages' ? 'bg-[#111827] text-white shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] translate-y-0.5' : 'bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'}`}
              >
                <MessageSquare className="w-4 h-4" /> Messages
              </Link>

              <Link
                to="/wallet"
                className={`flex items-center gap-2 px-4 py-2 border-2 border-black text-xs font-black uppercase tracking-wider transition-all ${location.pathname === '/wallet' ? 'bg-[#111827] text-white shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] translate-y-0.5' : 'bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'}`}
              >
                <Wallet className="w-4 h-4" /> {userRole === 'brand' ? 'Wallet' : 'Earnings'}
              </Link>

              {/* User Dropdown */}
              <div className="relative ml-2" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-3 pl-2 pr-4 py-1.5 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <div className="w-8 h-8 bg-[#8b5cf6] border-2 border-black text-black flex items-center justify-center text-sm font-black uppercase overflow-hidden rounded-full">
                    {displayAvatar ? (
                      <img
                        src={displayAvatar}
                        alt={displayName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-black text-black uppercase leading-none mb-1 truncate max-w-[120px]">
                      {displayName}
                    </p>
                    <p className="text-[10px] font-bold text-[#6b7280] leading-none">
                      {userRole === 'brand' ? 'Brand' : 'Creator'}
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-black transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b-2 border-black bg-[#fde047]">
                      <p className="text-xs font-black text-black truncate">{displayName}</p>
                      <p className="text-[10px] font-bold text-gray-700 truncate mt-0.5">
                        {displayEmail}
                      </p>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider mt-1.5 inline-block px-2 py-0.5 border-2 border-black ${userRole === 'brand' ? 'bg-[#93c5fd] text-black' : 'bg-[#fca5a5] text-black'}`}
                      >
                        {userRole}
                      </span>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wide text-black hover:bg-[#a7f3d0] border-b-2 border-black transition-colors"
                    >
                      <User className="w-4 h-4 text-black" /> My Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wide text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Bottom Tab Bar */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t-2 border-black flex justify-around items-center h-16 z-50">
              <Link
                to={`/${userRole}-dashboard`}
                className={`flex flex-col items-center justify-center w-full h-full ${location.pathname.includes('dashboard') ? 'text-black' : 'text-gray-400 hover:text-black'}`}
              >
                <LayoutDashboard className="w-5 h-5 mb-1" />
                <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
              </Link>
              {userRole === 'creator' ? (
                <Link
                  to="/campaigns"
                  className={`flex flex-col items-center justify-center w-full h-full ${location.pathname === '/campaigns' ? 'text-black' : 'text-gray-400 hover:text-black'}`}
                >
                  <Search className="w-5 h-5 mb-1" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Market</span>
                </Link>
              ) : (
                <Link
                  to="/matchmaking"
                  className={`flex flex-col items-center justify-center w-full h-full ${location.pathname === '/matchmaking' ? 'text-black' : 'text-gray-400 hover:text-black'}`}
                >
                  <div className="w-5 h-5 mb-1 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center rounded-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Search className="w-3 h-3" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest">Match</span>
                </Link>
              )}
              <Link
                to="/messages"
                className={`flex flex-col items-center justify-center w-full h-full relative ${location.pathname === '/messages' ? 'text-black' : 'text-gray-400 hover:text-black'}`}
              >
                <MessageSquare className="w-5 h-5 mb-1" />
                <span className="text-[9px] font-black uppercase tracking-widest">Chat</span>
              </Link>
              <Link
                to="/profile"
                className={`flex flex-col items-center justify-center w-full h-full ${location.pathname === '/profile' ? 'text-black' : 'text-gray-400 hover:text-black'}`}
              >
                <User className="w-5 h-5 mb-1" />
                <span className="text-[9px] font-black uppercase tracking-widest">Profile</span>
              </Link>
            </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="btn-secondary text-sm">
                Sign in
              </Link>
              <Link to="/signup" className="btn-primary text-sm">
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
