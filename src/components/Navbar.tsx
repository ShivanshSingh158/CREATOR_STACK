import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-matte-200 border-b-2 border-matte-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <span className="text-3xl font-display font-bold text-matte-900 tracking-tighter group-hover:-translate-y-0.5 transition-transform">
                creator<span className="text-brand-600">.</span>stack
              </span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-6">
            {currentUser ? (
              <>
                <Link to={`/${userRole}-dashboard`} className="text-matte-900 font-bold hover:text-brand-600 px-3 py-2 uppercase tracking-wide text-sm transition-colors">
                  Dashboard
                </Link>
                <Link to="/profile" className="text-matte-900 font-bold hover:text-brand-600 px-3 py-2 uppercase tracking-wide text-sm transition-colors">
                  Profile
                </Link>
                <button onClick={handleLogout} className="btn-secondary ml-4">
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
