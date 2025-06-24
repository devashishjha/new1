
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseEnabled } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

function LoadingScreen() {
    return (
        <div className="h-dvh w-screen flex items-center justify-center bg-gradient-to-br from-black to-blue-950">
          <div className="w-full max-w-sm space-y-6 flex flex-col items-center">
              <h1 className="text-4xl font-black text-white tracking-tighter mx-auto">LOKALITY</h1>
              <p className="text-muted-foreground animate-pulse">Loading...</p>
          </div>
        </div>
    );
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    // If Firebase isn't configured, we are not loading and have no user.
    if (!isFirebaseEnabled || !auth) {
      setLoading(false);
      setUser(null);
      return;
    }
    // Otherwise, listen for auth state changes.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // While we wait for the initial auth state, show a loading screen.
  if (loading) {
    return <LoadingScreen />;
  }

  const isAuthPage = pathname === '/';
  const isProtectedPage = !isAuthPage;

  // If user is logged in and trying to access the auth page...
  if (user && isAuthPage) {
    // ...redirect them to the main app page. Show a loader while redirecting.
    router.replace('/reels');
    return <LoadingScreen />;
  }
  
  // If user is not logged in and trying to access a protected page...
  if (!user && isProtectedPage) {
    // ...redirect them to the auth page. Show a loader while redirecting.
    router.replace('/');
    return <LoadingScreen />;
  }
  
  // If we get here, the user is on the correct page for their auth state.
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
