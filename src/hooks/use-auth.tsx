
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
    // This effect only handles setting the user and loading state
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

  // Determine if we are ready to make a decision.
  // This is true only when the initial auth check is complete.
  const canMakeRedirectDecision = !loading;

  let shouldRedirect = false;
  let redirectPath = '';

  if (canMakeRedirectDecision) {
    const userIsLoggedIn = !!user;

    // Scenario 1: User is logged OUT but trying to access a protected page.
    if (!userIsLoggedIn && isProtectedPage) {
      shouldRedirect = true;
      redirectPath = '/';
    }
    
    // Scenario 2: User is logged IN but is on the auth page.
    if (userIsLoggedIn && isAuthPage) {
      shouldRedirect = true;
      redirectPath = '/reels';
    }
  }

  useEffect(() => {
    // This effect handles the actual redirection.
    // It only runs when a redirect is needed and the path is set.
    if (shouldRedirect && redirectPath) {
      router.replace(redirectPath);
    }
  }, [shouldRedirect, redirectPath, router]);


  // If we are still waiting for the initial auth check, or if we have
  // determined that a redirect is necessary, show the loader.
  // This prevents flashing the wrong page content before the redirect happens.
  if (loading || shouldRedirect) {
    return <FullScreenLoader />;
  }

  // If everything is stable and no redirect is needed, provide the context
  // and render the children.
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

    