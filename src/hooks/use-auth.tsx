
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseEnabled, rtdb } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';

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
      
      if (currentUser && rtdb) {
        const uid = currentUser.uid;
        const userStatusDatabaseRef = ref(rtdb, '/status/' + uid);
        const connectedRef = ref(rtdb, '.info/connected');

        onValue(connectedRef, (snap) => {
            if (snap.val() === true) {
                const conStatus = { state: 'online', last_changed: serverTimestamp() };
                set(userStatusDatabaseRef, conStatus);

                onDisconnect(userStatusDatabaseRef).set({ state: 'offline', last_changed: serverTimestamp() });
            }
        });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAuthPage = pathname === '/';
  const userIsLoggedIn = !!user;

  useEffect(() => {
    // Don't run redirect logic until the initial auth state is resolved.
    if (loading) {
      return;
    }

    // If user is NOT logged in and is trying to access a protected page, redirect to login.
    if (!userIsLoggedIn && !isAuthPage) {
      router.replace('/');
    }

    // If user IS logged in and is trying to access the login page, redirect to the app's main page.
    if (userIsLoggedIn && isAuthPage) {
      router.replace('/reels');
    }
  }, [loading, userIsLoggedIn, isAuthPage, router]);


  // Determine if we should show a loader.
  // We show a loader if:
  // 1. We are still waiting for the initial auth state to be determined.
  // 2. A redirect is needed and about to happen (to prevent a flash of incorrect content).
  const shouldShowLoader = loading || (!userIsLoggedIn && !isAuthPage) || (userIsLoggedIn && isAuthPage);
  
  if (shouldShowLoader) {
    return <FullScreenLoader />;
  }

  // If no loader is needed, it's safe to render the children.
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
