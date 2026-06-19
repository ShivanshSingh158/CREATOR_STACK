import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './features/auth/LoginPage';
import SignupPage from './features/auth/SignupPage';

// Authenticated Pages
import CreatorDashboard from './features/creator/CreatorDashboard';
import BrandDashboard from './features/brand/BrandDashboard';
import CreateCampaign from './features/campaign/CreateCampaign';
import CampaignManage from './features/brand/CampaignManage';
import DigitalDealRoom from './features/deal-room/DigitalDealRoom';
import MessageDashboard from './features/messaging/MessageDashboard';
import CreatorOnboarding from './features/onboarding/CreatorOnboarding';
import BrandOnboarding from './features/onboarding/BrandOnboarding';
import ProfilePage from './features/creator/ProfilePage';
import MatchmakingEngine from './features/campaign/MatchmakingEngine';
import CreatorProfileDetail from './features/creator/CreatorProfileDetail';

// Layouts
import Navbar from './components/layout/Navbar';

// Protected Route Wrapper
const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: 'creator' | 'brand' }) => {
  const { currentUser, userRole } = useAuth();
  
  if (!currentUser) return <Navigate to="/login" />;
  if (role && userRole !== role) return <Navigate to="/" />; // Redirect if wrong role
  
  return <>{children}</>;
};

function AppRoutes() {
  const { currentUser, userRole } = useAuth();

  return (
    <div className="min-h-screen bg-matte-200 flex flex-col font-sans">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={currentUser ? (userRole ? <Navigate to={`/${userRole}-dashboard`} /> : <div className="flex items-center justify-center min-h-[80vh]"><p>Loading profile...</p></div>) : <LandingPage />} />
          <Route path="/login" element={currentUser ? (userRole ? <Navigate to={`/${userRole}-dashboard`} /> : <div className="flex items-center justify-center min-h-[80vh]"><p>Loading profile...</p></div>) : <LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/onboarding/creator" element={<CreatorOnboarding />} />
          <Route path="/onboarding/brand" element={<BrandOnboarding />} />

          {/* Creator Routes */}
          <Route path="/creator-dashboard" element={<ProtectedRoute role="creator"><CreatorDashboard /></ProtectedRoute>} />
          
          {/* Brand Routes */}
          <Route path="/brand-dashboard" element={<ProtectedRoute role="brand"><BrandDashboard /></ProtectedRoute>} />
          <Route path="/create-campaign" element={currentUser && userRole === 'brand' ? <CreateCampaign /> : <Navigate to="/login" />} />
          <Route path="/campaign/:id" element={currentUser && userRole === 'brand' ? <CampaignManage /> : <Navigate to="/login" />} />
          <Route path="/deal-room/:campaignId/:creatorId" element={currentUser && userRole === 'brand' ? <DigitalDealRoom /> : <Navigate to="/login" />} />
          <Route path="/matchmaking" element={currentUser && userRole === 'brand' ? <MatchmakingEngine /> : <Navigate to="/login" />} />
          <Route path="/creator/:id" element={currentUser && userRole === 'brand' ? <CreatorProfileDetail /> : <Navigate to="/login" />} />

          {/* Shared Routes */}
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessageDashboard /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
