
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
    // This effect runs once on mount to set up the auth listener.
    if (!isFirebaseEnabled || !auth) {
      setLoading(false);
      setUser(null);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // This effect handles redirection after the initial auth check is complete.
    if (loading) {
      return; // Do nothing while initial auth state is being determined.
    }

    const isAuthPage = pathname === '/';

    // If a logged-in user is on the auth page, redirect them to the app.
    if (user && isAuthPage) {
      router.replace('/reels');
    }
    
    // If a logged-out user tries to access a protected page, redirect them to the auth page.
    if (!user && !isAuthPage) {
      router.replace('/');
    }
  }, [user, loading, pathname, router]);

  const isAuthPage = pathname === '/';
  
  // This logic determines if the user is on the correct type of page for their auth state.
  // A redirect might be in progress if this is false.
  const isCorrectPage = (user && !isAuthPage) || (!user && isAuthPage);

  // Show a loader during the initial check or while a redirect is pending.
  // This prevents rendering the wrong page and causing the redirect loop.
  if (loading || !isCorrectPage) {
    return <FullScreenLoader />;
  }

  // If we've passed all checks, the user is on the right page. Render the app.
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
