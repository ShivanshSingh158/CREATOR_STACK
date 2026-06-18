import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// Authenticated Pages
import CreatorDashboard from './pages/CreatorDashboard';
import BrandDashboard from './pages/BrandDashboard';
import CreateCampaign from './pages/CreateCampaign';
import CampaignDetails from './pages/CampaignDetails';
import CreatorOnboarding from './pages/CreatorOnboarding';
import BrandOnboarding from './pages/BrandOnboarding';
import ProfilePage from './pages/ProfilePage';

// Layouts
import Navbar from './components/Navbar';

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
          <Route path="/create-campaign" element={<ProtectedRoute role="brand"><CreateCampaign /></ProtectedRoute>} />

          {/* Shared Routes */}
          <Route path="/campaign/:id" element={<ProtectedRoute><CampaignDetails /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
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
