
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseEnabled, rtdb, db } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';


type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
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
  const [isAdmin, setIsAdmin] = useState(false);
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
      setIsAdmin(false); // Reset on auth change
      
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
        
        // Admin Role Assignment & Check Logic
        const ADMIN_EMAIL = "jha.devashish@gmail.com"; 
        
        if (db) {
            const userDocRef = doc(db, 'users', currentUser.uid);
            try {
                const docSnap = await getDoc(userDocRef);
                let currentRole;

                if (docSnap.exists()) {
                    const profile = docSnap.data() as UserProfile;
                    currentRole = profile.role;
                    
                    // Auto-assign admin role if email matches and not already admin
                    if (currentUser.email === ADMIN_EMAIL && currentRole !== 'admin') {
                        await updateDoc(userDocRef, { role: 'admin' });
                        currentRole = 'admin'; // Assume success
                        console.log(`Admin role successfully granted to ${currentUser.email}.`);
                    }
                } else if (currentUser.email === ADMIN_EMAIL) {
                    // This handles first-time login for the admin user
                    const newAdminProfile: UserProfile = {
                        id: currentUser.uid,
                        name: currentUser.displayName || 'Admin',
                        email: currentUser.email,
                        phone: '',
                        type: 'owner',
                        role: 'admin'
                    };
                    await setDoc(userDocRef, newAdminProfile);
                    currentRole = 'admin';
                    console.log(`Admin profile created and role granted for ${currentUser.email}.`);
                }

                if (currentRole === 'admin') {
                    setIsAdmin(true);
                }

            } catch (error) {
                console.error("Error with admin role check/assignment:", error);
            }
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAuthPage = pathname === '/';
  const isProtectedPage = !isAuthPage;
  const userIsLoggedIn = !!user;

  useEffect(() => {
    if (loading) return;

    if (userIsLoggedIn) {
        if (isAuthPage) {
            // Logged in user is on the login page, redirect them to the main app page.
            router.replace('/reels');
        }
    } else {
        // Not logged in, but trying to access a protected page.
        if (isProtectedPage) {
            router.replace('/');
        }
    }

  }, [loading, userIsLoggedIn, isAuthPage, isProtectedPage, isAdmin, router]);


  // Show a loader while authentication is in progress or a redirect is pending.
  const shouldShowLoader = loading || (userIsLoggedIn && isAuthPage) || (!userIsLoggedIn && isProtectedPage);

  if (shouldShowLoader) {
    return <FullScreenLoader />;
  }
  
  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
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
