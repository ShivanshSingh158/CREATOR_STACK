import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { LayoutDashboard, MessageSquare, User, LogOut, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDealRoom = location.pathname.includes('/deal-room');

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

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/');
  };

  // Don't show navbar on deal room (it has its own nav)
  if (isDealRoom) return null;

  const initials = currentUser?.email?.charAt(0)?.toUpperCase() || '?';
  const displayEmail = currentUser?.email || '';

  return (
    <nav
      className="sticky top-0 z-50 bg-white border-b border-[#e5e7eb] shadow-sm"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-[#111827] tracking-tight">
            creator<span className="text-[#d1b07c]">.</span>stack
          </Link>

          {/* Nav Links + User */}
          {currentUser ? (
            <div className="flex items-center gap-1">
              <Link
                to={`/${userRole}-dashboard`}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname.includes('dashboard') ? 'bg-[#f3f4f6] text-[#111827]' : 'text-[#6b7280] hover:text-[#111827] hover:bg-[#f9fafb]'}`}
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              <Link
                to="/messages"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/messages' ? 'bg-[#f3f4f6] text-[#111827]' : 'text-[#6b7280] hover:text-[#111827] hover:bg-[#f9fafb]'}`}
              >
                <MessageSquare className="w-4 h-4" /> Messages
              </Link>

              {/* User Dropdown */}
              <div className="relative ml-2" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(v => !v)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-[#e5e7eb] hover:bg-[#f9fafb] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[#111827] text-white flex items-center justify-center text-xs font-bold">
                    {initials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-[#111827] leading-none">
                      {userRole === 'brand' ? 'Brand' : 'Creator'}
                    </p>
                    <p className="text-[10px] text-[#9ca3af] leading-none mt-0.5 max-w-[100px] truncate">{displayEmail}</p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#9ca3af] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-52 bg-white border border-[#e5e7eb] rounded-xl shadow-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#f3f4f6]">
                      <p className="text-xs font-semibold text-[#374151] truncate">{displayEmail}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 inline-block px-1.5 py-0.5 rounded ${userRole === 'brand' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                        {userRole}
                      </span>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#f9fafb] transition-colors"
                    >
                      <User className="w-4 h-4 text-[#9ca3af]" /> My Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-[#f3f4f6]"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-semibold text-[#374151] hover:text-[#111827] transition-colors">
                Sign in
              </Link>
              <Link to="/signup" className="text-sm font-semibold text-white bg-[#111827] px-4 py-2 rounded-xl hover:bg-black transition-colors">
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
