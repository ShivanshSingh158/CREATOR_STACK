import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const { currentUser } = useAuth();

  return (
    <div className="bg-matte-200">
      {/* Hero Section */}
      <div className="relative pt-24 pb-32 overflow-hidden bg-grid-pattern border-b-2 border-matte-900">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          
          <div className="badge bg-accent-neon text-matte-900 mb-8 shadow-brutal-sm transform -rotate-2">
            Beta Access Open
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-[1.1] uppercase">
            <span className="block text-matte-900">Where brands</span>
            <span className="block text-brand-600 drop-shadow-[4px_4px_0px_#121212]">meet creators.</span>
          </h1>
          
          <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-matte-800 mb-12 font-medium">
            The anti-boring platform to manage your campaigns, applications, and payouts securely. No fluff, just authentic collaborations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center w-full max-w-md mx-auto sm:max-w-none">
            {currentUser ? (
              <Link to="/creator-dashboard" className="btn-primary text-lg w-full sm:w-auto">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/signup" className="btn-primary text-lg w-full sm:w-auto">
                  Start Creating
                </Link>
                <Link to="/login" className="btn-secondary text-lg w-full sm:w-auto">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-brand-50 border-b-2 border-matte-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-matte-900">
              Why creator<span className="text-brand-600">.</span>stack?
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card bg-white hover:-rotate-1 transition-transform group">
              <div className="w-16 h-16 bg-accent-neon border-2 border-matte-900 rounded-2xl shadow-brutal-sm flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-matte-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
              <h3 className="text-2xl font-black text-matte-900 uppercase tracking-wide mb-4">For Creators</h3>
              <p className="text-lg text-matte-800 font-medium">Discover top brands, apply to high-paying campaigns, and manage all your deliverables in one chaotic-free dashboard.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="card bg-brand-600 text-white hover:rotate-1 transition-transform group">
              <div className="w-16 h-16 bg-white border-2 border-matte-900 rounded-2xl shadow-brutal-sm flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-wide mb-4">For Brands</h3>
              <p className="text-lg text-brand-50 font-medium">Launch campaigns effortlessly, receive applications from verified creators, and track your true ROI.</p>
            </div>
            
            {/* Feature 3 */}
            <div className="card bg-matte-900 text-white hover:-rotate-1 transition-transform group">
              <div className="w-16 h-16 bg-brand-500 border-2 border-matte-900 rounded-2xl shadow-brutal-sm flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-wide mb-4">Trusted Escrow</h3>
              <p className="text-lg text-gray-300 font-medium">Secure transactions, transparent metrics, and authentic partnerships built on algorithmic trust.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-matte-900 text-white py-12 border-t-2 border-matte-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <span className="text-3xl font-display font-bold tracking-tighter mb-4 md:mb-0">
            creator<span className="text-brand-500">.</span>stack
          </span>
          <p className="text-gray-400 font-medium">© 2026. Made for the next generation.</p>
        </div>
      </footer>
    </div>
  );
}
