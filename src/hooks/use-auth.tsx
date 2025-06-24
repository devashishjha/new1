
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

  const isAuthPage = pathname === '/';
  
  // A redirect is needed if the user is in the wrong place for their auth state.
  // e.g., a logged-in user on the login page, or a logged-out user on a protected page.
  const requiresRedirect = !loading && ((user && isAuthPage) || (!user && !isAuthPage));

  useEffect(() => {
    if (requiresRedirect) {
      if (user && isAuthPage) {
        router.replace('/reels');
      }
      if (!user && !isAuthPage) {
        router.replace('/');
      }
    }
  }, [requiresRedirect, user, isAuthPage, router]);


  // Show a loader during the initial auth check OR while a redirect is being processed.
  // This prevents rendering children and causing the infinite loop.
  if (loading || requiresRedirect) {
    return <FullScreenLoader />;
  }

  // If we get here, no loading is happening and no redirect is required.
  // The user is on the right page for their auth state, so render the app.
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
