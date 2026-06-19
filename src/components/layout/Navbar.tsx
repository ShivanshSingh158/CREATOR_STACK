import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

export default function Navbar() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isDarkTheme = location.pathname.includes('/deal-room');

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // If we scroll down more than 50px from top, hide it. 
      // If we scroll up, show it.
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className={`${isDarkTheme ? 'bg-[#030712] border-b border-[#1f2937]' : 'bg-matte-200 border-b-2 border-matte-900'} sticky top-0 z-50 transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <span className={`text-3xl font-display font-bold tracking-tighter group-hover:-translate-y-0.5 transition-transform ${isDarkTheme ? 'text-white' : 'text-matte-900'}`}>
                creator<span className={isDarkTheme ? 'text-[#d1b07c]' : 'text-brand-600'}>.</span>stack
              </span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-6">
            {currentUser ? (
              <>
                <Link to={`/${userRole}-dashboard`} className={`font-bold px-3 py-2 uppercase tracking-wide text-sm transition-colors ${isDarkTheme ? 'text-[#9ca3af] hover:text-white' : 'text-matte-900 hover:text-brand-600'}`}>
                  Dashboard
                </Link>
                <Link to="/messages" className={`font-bold px-3 py-2 uppercase tracking-wide text-sm transition-colors ${isDarkTheme ? 'text-[#9ca3af] hover:text-white' : 'text-matte-900 hover:text-brand-600'}`}>
                  Messages
                </Link>
                <Link to="/profile" className={`font-bold px-3 py-2 uppercase tracking-wide text-sm transition-colors ${isDarkTheme ? 'text-[#9ca3af] hover:text-white' : 'text-matte-900 hover:text-brand-600'}`}>
                  Profile
                </Link>
                <button onClick={handleLogout} className={`ml-4 px-4 py-2 font-bold uppercase tracking-wider text-sm rounded transition-colors ${isDarkTheme ? 'bg-[#1f2937] text-white hover:bg-[#374151]' : 'btn-secondary'}`}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-matte-900 font-bold hover:text-brand-600 px-3 py-2 uppercase tracking-wide text-sm transition-colors">
                  Login
                </Link>
                <Link to="/signup" className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
