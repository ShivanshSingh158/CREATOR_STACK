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
import EditCampaign from './features/campaign/EditCampaign';
import CampaignManage from './features/brand/CampaignManage';
import DigitalDealRoom from './features/deal-room/DigitalDealRoom';
import CreatorDealRoom from './features/deal-room/CreatorDealRoom';
import MessageDashboard from './features/messaging/MessageDashboard';
import CreatorOnboarding from './features/onboarding/CreatorOnboarding';
import BrandOnboarding from './features/onboarding/BrandOnboarding';
import ProfilePage from './features/creator/ProfilePage';
import MatchmakingEngine from './features/campaign/MatchmakingEngine';
import CreatorProfileDetail from './features/creator/CreatorProfileDetail';

// Layouts
import Navbar from './components/layout/Navbar';

/**
 * ProtectedRoute: blocks unauthenticated users.
 * If the user has a role but hasn't completed onboarding, forces them to onboarding first.
 * If role is specified, rejects users with the wrong role.
 */
const ProtectedRoute = ({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: 'creator' | 'brand';
}) => {
  const { currentUser, userRole, profileCompleted } = useAuth();

  // Not logged in at all
  if (!currentUser) return <Navigate to="/login" replace />;

  // Logged in but no role yet — needs to finish signup
  if (!userRole) return <Navigate to="/signup" replace />;

  // Logged in, has a role, but profile not completed → force onboarding
  if (!profileCompleted) return <Navigate to={`/onboarding/${userRole}`} replace />;

  // Has a role but it's the wrong one for this route
  if (role && userRole !== role) return <Navigate to={`/${userRole}-dashboard`} replace />;

  return <>{children}</>;
};

function AppRoutes() {
  const { currentUser, userRole, profileCompleted } = useAuth();

  /**
   * After a Google sign-in, if the user has no role yet, send them to signup.
   * If they're fully onboarded, go directly to their dashboard.
   * If they have a role but haven't onboarded, go to onboarding.
   */
  const getHomeRedirect = () => {
    if (!currentUser) return <LandingPage />;
    if (!userRole) return <Navigate to="/signup" replace />;
    if (!profileCompleted) return <Navigate to={`/onboarding/${userRole}`} replace />;
    return <Navigate to={`/${userRole}-dashboard`} replace />;
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Routes>
          {/* Root — smart redirect */}
          <Route path="/" element={getHomeRedirect()} />

          {/* Auth */}
          <Route path="/login" element={
            currentUser && userRole && profileCompleted
              ? <Navigate to={`/${userRole}-dashboard`} replace />
              : <LoginPage />
          } />
          <Route path="/signup" element={
            currentUser && userRole && profileCompleted
              ? <Navigate to={`/${userRole}-dashboard`} replace />
              : <SignupPage />
          } />

          {/* Onboarding — accessible before profileCompleted */}
          <Route path="/onboarding/creator" element={
            currentUser ? <CreatorOnboarding /> : <Navigate to="/signup" replace />
          } />
          <Route path="/onboarding/brand" element={
            currentUser ? <BrandOnboarding /> : <Navigate to="/signup" replace />
          } />

          {/* Creator Routes — gated by role + profileCompleted */}
          <Route path="/creator-dashboard" element={
            <ProtectedRoute role="creator"><CreatorDashboard /></ProtectedRoute>
          } />
          <Route path="/creator-deal-room/:campaignId" element={
            <ProtectedRoute role="creator"><CreatorDealRoom /></ProtectedRoute>
          } />

          {/* Brand Routes */}
          <Route path="/brand-dashboard" element={
            <ProtectedRoute role="brand"><BrandDashboard /></ProtectedRoute>
          } />
          <Route path="/create-campaign" element={
            <ProtectedRoute role="brand"><CreateCampaign /></ProtectedRoute>
          } />
          <Route path="/edit-campaign/:id" element={
            <ProtectedRoute role="brand"><EditCampaign /></ProtectedRoute>
          } />
          <Route path="/campaign/:id" element={
            <ProtectedRoute role="brand"><CampaignManage /></ProtectedRoute>
          } />
          <Route path="/deal-room/:campaignId/:creatorId" element={
            <ProtectedRoute role="brand"><DigitalDealRoom /></ProtectedRoute>
          } />
          <Route path="/matchmaking" element={
            <ProtectedRoute role="brand"><MatchmakingEngine /></ProtectedRoute>
          } />
          <Route path="/creator/:id" element={
            <ProtectedRoute role="brand"><CreatorProfileDetail /></ProtectedRoute>
          } />

          {/* Shared Routes */}
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessageDashboard /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
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
