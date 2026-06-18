import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface AuthContextType {
  currentUser: User | null;
  userRole: 'creator' | 'brand' | null;
  loading: boolean;
  logout: () => Promise<void>;
  // For local mock during dev/hackathon if Firebase isn't configured yet
  mockLogin: (role: 'creator' | 'brand') => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'creator' | 'brand' | null>(null);
  const [loading, setLoading] = useState(true);

  // Hackathon fallback
  const mockLogin = (role: 'creator' | 'brand') => {
    setCurrentUser({ uid: 'mock-user-123', email: 'demo@creatorstack.com', displayName: 'Demo User' } as User);
    setUserRole(role);
  };

  const logout = () => {
    if (auth.app.options.apiKey === "YOUR_API_KEY") {
      setCurrentUser(null);
      setUserRole(null);
      return Promise.resolve();
    }
    return firebaseSignOut(auth);
  };

  useEffect(() => {
    if (auth.app.options.apiKey === "YOUR_API_KEY") {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch role from Firestore
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserRole(docSnap.data().role as 'creator' | 'brand');
          } else {
            const savedRole = localStorage.getItem('intendedRole') as 'creator' | 'brand' | null;
            setUserRole(savedRole || 'creator'); // Fallback to intended role
          }
        } catch (e) {
          console.error("Error fetching user role", e);
          const savedRole = localStorage.getItem('intendedRole') as 'creator' | 'brand' | null;
          setUserRole(savedRole || 'creator'); // Fallback to intended role to bypass Firestore rule errors
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userRole, loading, logout, mockLogin }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
