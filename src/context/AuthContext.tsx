import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, User } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { ApiService } from '../services/api.ts';
import { UserProfile } from '../types.ts';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  token: string | null;
  loading: boolean;
  isDemo: boolean;
  loginWithGoogle: () => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    // Check if there is a cached demo token in sessionStorage
    const savedDemoToken = sessionStorage.getItem('hiretrack_demo_token');
    const savedDemoUser = sessionStorage.getItem('hiretrack_demo_user');

    if (savedDemoToken && savedDemoUser) {
      try {
        const parsed = JSON.parse(savedDemoUser);
        setToken(savedDemoToken);
        ApiService.setToken(savedDemoToken);
        setUser(parsed);
        setIsDemo(true);
        setLoading(false);
        return;
      } catch (e) {
        sessionStorage.removeItem('hiretrack_demo_token');
        sessionStorage.removeItem('hiretrack_demo_user');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          setToken(idToken);
          ApiService.setToken(idToken);
          setFirebaseUser(fbUser);
          setIsDemo(false);

          // Sync with backend Cloud SQL
          const res = await ApiService.syncUser(fbUser.displayName || undefined);
          setUser(res.user || { uid: fbUser.uid, email: fbUser.email, name: fbUser.displayName });
        } catch (err: any) {
          console.error('Error syncing auth state:', err);
          setError(err.message || 'Failed to authenticate');
        } finally {
          setLoading(false);
        }
      } else {
        // If not in demo mode, clear state
        if (!sessionStorage.getItem('hiretrack_demo_token')) {
          setToken(null);
          ApiService.setToken(null);
          setUser(null);
          setFirebaseUser(null);
          setIsDemo(false);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      // Clean up demo mode if active
      sessionStorage.removeItem('hiretrack_demo_token');
      sessionStorage.removeItem('hiretrack_demo_user');

      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      setToken(idToken);
      ApiService.setToken(idToken);
      setFirebaseUser(result.user);
      setIsDemo(false);

      const syncRes = await ApiService.syncUser(result.user.displayName || undefined);
      setUser(syncRes.user || { uid: result.user.uid, email: result.user.email, name: result.user.displayName });
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      setError(err.message || 'Google Sign In failed');
    } finally {
      setLoading(false);
    }
  };

  const loginDemo = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await ApiService.demoLogin();
      setToken(res.token);
      ApiService.setToken(res.token);
      setUser(res.user);
      setIsDemo(true);
      setFirebaseUser(null);

      sessionStorage.setItem('hiretrack_demo_token', res.token);
      sessionStorage.setItem('hiretrack_demo_user', JSON.stringify(res.user));
    } catch (err: any) {
      console.error('Demo login error:', err);
      setError('Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      sessionStorage.removeItem('hiretrack_demo_token');
      sessionStorage.removeItem('hiretrack_demo_user');
      if (auth.currentUser) {
        await fbSignOut(auth);
      }
      setToken(null);
      ApiService.setToken(null);
      setUser(null);
      setFirebaseUser(null);
      setIsDemo(false);
    } catch (err: any) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        token,
        loading,
        isDemo,
        loginWithGoogle,
        loginDemo,
        logout,
        error,
        clearError: () => setError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
