
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
    if (!isFirebaseEnabled || !auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAuthPage = pathname === '/';

  // While the initial auth state is being determined, show a full-screen loader.
  // This prevents any "flicker" or rendering of incorrect pages.
  if (loading) {
    return <FullScreenLoader />;
  }

  const userIsLoggedIn = !!user;

  // If user is NOT logged in and trying to access a protected page, redirect to login.
  if (!userIsLoggedIn && !isAuthPage) {
    router.replace('/');
    // Return the loader to prevent rendering the page content while redirecting.
    return <FullScreenLoader />;
  }

  // If user IS logged in and trying to access the login page, redirect to the app's main page.
  if (userIsLoggedIn && isAuthPage) {
    router.replace('/reels');
    // Return the loader to prevent rendering the auth form while redirecting.
    return <FullScreenLoader />;
  }

  // If none of the above conditions are met, it's safe to render the requested page.
  // (e.g., user is logged in and on a protected page, or not logged in and on the login page).
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

    