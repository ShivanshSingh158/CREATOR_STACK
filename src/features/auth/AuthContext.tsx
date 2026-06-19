import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';

interface AuthContextType {
  currentUser: User | null;
  userRole: 'creator' | 'brand' | null;
  profileCompleted: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'creator' | 'brand' | null>(null);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const logout = () => firebaseSignOut(auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const docSnap = await getDoc(doc(db, 'users', user.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Role is ONLY set from Firestore — no fallback, no localStorage
            // This prevents a brand Gmail from getting creator access or vice versa
            setUserRole((data.role as 'creator' | 'brand') || null);
            setProfileCompleted(!!data.profileCompleted);
          } else {
            // Brand-new Google sign-in with no Firestore doc yet
            // They must go through signup/onboarding to get a role
            setUserRole(null);
            setProfileCompleted(false);
          }
        } catch (e) {
          console.error('Error fetching user profile:', e);
          setUserRole(null);
          setProfileCompleted(false);
        }
      } else {
        setUserRole(null);
        setProfileCompleted(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userRole, profileCompleted, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
