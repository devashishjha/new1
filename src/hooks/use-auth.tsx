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
    if (!isFirebaseEnabled || !auth) {
      setUser(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
      // Don't run redirect logic until authentication is resolved
      if (loading) return;

      const isAuthPage = pathname === '/';
      const isProtectedPage = !isAuthPage;

      // If user is not logged in and is trying to access a protected page, redirect to login
      if (!user && isProtectedPage) {
          router.push('/');
      }
      // If user is logged in and is on the login page, redirect to reels
      if (user && isAuthPage) {
          router.push('/reels');
      }
  }, [user, loading, pathname, router]);

  // Initial loading state while we wait for Firebase auth to resolve.
  if (loading) {
    return <LoadingScreen />;
  }

  const isAuthPage = pathname === '/';
  
  // If user is logged in but on the auth page, show loader while redirecting to prevent content flash.
  if (user && isAuthPage) {
      return <LoadingScreen />;
  }

  // If user is not logged in but on a protected page, show loader while redirecting.
  if (!user && !isAuthPage) {
      return <LoadingScreen />;
  }
  
  // If we are here, it means we are on the correct page for the current auth state, so we can render the content.
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
