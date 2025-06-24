
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
  const isProtected = !isAuthPage;

  // Determine if a redirect is necessary AFTER loading is complete.
  const needsRedirect = !loading && ((!user && isProtected) || (user && isAuthPage));

  useEffect(() => {
    // This effect handles the actual redirection.
    // It only runs when `needsRedirect` becomes true.
    if (needsRedirect) {
      if (!user && isProtected) {
        router.replace('/');
      } else if (user && isAuthPage) {
        router.replace('/reels');
      }
    }
  }, [needsRedirect, user, isProtected, isAuthPage, router]);


  // If we are loading, or if we are about to redirect, show the loader.
  // This prevents flashing the wrong page content.
  if (loading || needsRedirect) {
    return <FullScreenLoader />;
  }

  // If everything is stable, provide the context and render the children.
  return (
    <AuthContext.Provider value={{ user, loading: false }}>
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
