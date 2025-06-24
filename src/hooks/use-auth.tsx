
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
    // This effect only handles setting the user and loading state.
    // It runs once on mount.
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

  const isAuthPage = pathname === '/';
  const isProtectedPage = !isAuthPage;

  // If we are still waiting for the initial auth check, show a loader.
  // This is the first gate to prevent any rendering before we know the user's status.
  if (loading) {
    return <FullScreenLoader />;
  }

  // At this point, `loading` is false. We know the user's auth status.
  const userIsLoggedIn = !!user;

  // Scenario 1: User is logged OUT but trying to access a protected page.
  // We need to redirect them to the login page.
  if (!userIsLoggedIn && isProtectedPage) {
    router.replace('/');
    // Show a loader while the redirect is in progress.
    return <FullScreenLoader />;
  }
  
  // Scenario 2: User is logged IN but is on the auth page.
  // We need to redirect them to the main app content.
  if (userIsLoggedIn && isAuthPage) {
    router.replace('/reels');
    // Show a loader while the redirect is in progress.
    return <FullScreenLoader />;
  }

  // If neither of the above conditions are met, the user is in the correct state
  // for the page they are on (e.g., logged in on a protected page, or logged out
  // on the auth page). We can safely render the children.
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
