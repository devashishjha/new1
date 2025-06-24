
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

function FullScreenLoader() {
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
    // This handles the production environment before env vars are set, preventing crashes.
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

  useEffect(() => {
    // Don't run redirect logic until authentication state is resolved.
    if (loading) {
      return;
    }

    const isAuthPage = pathname === '/';

    // If user is logged in but on the auth page, redirect to the main app.
    if (user && isAuthPage) {
      router.replace('/reels');
    }
    
    // If user is not logged in but is trying to access a protected page, redirect to the auth page.
    if (!user && !isAuthPage) {
      router.replace('/');
    }
  }, [user, loading, pathname, router]);

  const isAuthPage = pathname === '/';
  
  // Determine if we should show the loader or the page content.
  // Show the loader if:
  // 1. We are still waiting for the initial auth state.
  // 2. A redirect is about to happen (e.g., logged-in user on auth page).
  const inRedirectState = (!loading && user && isAuthPage) || (!loading && !user && !isAuthPage);

  if (loading || inRedirectState) {
    return <FullScreenLoader />;
  }

  // If we are on the correct page for the user's auth state, render the children.
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
