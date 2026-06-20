import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  userRole: 'creator' | 'brand' | null;
  profileCompleted: boolean;
  userProfile: any;
  loading: boolean;
  logout: () => Promise<void>;
  /** Call this after completing onboarding to instantly refresh context without waiting for Firestore snapshot */
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'creator' | 'brand' | null>(null);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileRefreshToken, setProfileRefreshToken] = useState(0);

  const logout = () => firebaseSignOut(auth);

  // Call this from onboarding to trigger a re-read immediately
  const refreshProfile = useCallback(() => {
    setProfileRefreshToken((t) => t + 1);
  }, []);

  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    const authUnsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);

      // Tear down any previous profile listener
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (user) {
        // Use onSnapshot so profile updates (profileCompleted, role) propagate instantly
        profileUnsub = onSnapshot(
          doc(db, 'users', user.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              // Role is ONLY set from Firestore — prevents cross-role access
              setUserRole((data.role as 'creator' | 'brand') || null);
              setProfileCompleted(!!data.profileCompleted);
              setUserProfile(data);
            } else {
              // New Google sign-in with no Firestore doc — needs signup
              setUserRole(null);
              setProfileCompleted(false);
              setUserProfile(null);
            }
            setLoading(false);
          },
          (err) => {
            console.error('Profile snapshot error:', err);
            setUserRole(null);
            setProfileCompleted(false);
            setUserProfile(null);
            setLoading(false);
          },
        );
      } else {
        setUserRole(null);
        setProfileCompleted(false);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      if (profileUnsub) profileUnsub();
    };
  }, [profileRefreshToken]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userRole,
        profileCompleted,
        userProfile,
        loading,
        logout,
        refreshProfile,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
