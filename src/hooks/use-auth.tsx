
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseEnabled, rtdb, db } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';


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
      console.log("Firebase not enabled or auth not initialized in AuthProvider.");
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      console.log("Auth State Changed: Current User =", currentUser ? currentUser.uid : "No user", "Email:", currentUser ? currentUser.email : "N/A");
      
      if (currentUser) {
        // Presence Logic
        if (rtdb) {
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
        
        // Admin Role Assignment Logic
        // This check runs on login to automatically grant admin rights to the specified user.
        const ADMIN_EMAIL = "jha.devashish@gmail.com"; 
        
        if (db && currentUser.email === ADMIN_EMAIL) {
            const userDocRef = doc(db, 'users', currentUser.uid);
            try {
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    const profile = docSnap.data() as UserProfile;
                    if (profile.role !== 'admin') {
                        await updateDoc(userDocRef, { role: 'admin' });
                        console.log(`Admin role successfully granted to ${currentUser.email}.`);
                    }
                }
            } catch (error) {
                console.error("Error granting admin role:", error);
            }
        }
      }

      setLoading(false);
      console.log("Auth Loading state set to false. Current user:", currentUser ? currentUser.uid : "null");
    });

    return () => unsubscribe();
  }, []);

  const isAuthPage = pathname === '/';
  const isServiceSelectionPage = pathname === '/service-selection';
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
      router.replace('/service-selection');
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
