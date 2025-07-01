
'use client';
import { EditProfileForm } from '@/components/edit-profile-form';
import { Header } from '@/components/header';
import { BottomNavBar } from '@/components/bottom-nav-bar';
import { useAuth } from '@/hooks/use-auth';
import type { UserProfile } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

function EditProfileSkeleton() {
    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight mb-2"><Skeleton className="h-10 w-64 bg-muted" /></h1>
            <p className="text-muted-foreground mb-8"><Skeleton className="h-6 w-96 bg-muted" /></p>
            <div className="space-y-8">
                <Skeleton className="h-40 w-full bg-muted" />
                <Skeleton className="h-40 w-full bg-muted" />
            </div>
        </div>
    )
}

export default function EditProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      if (authLoading) return;
      if (!user) {
        router.push('/');
        return;
      }
      
      const fetchUserProfile = async () => {
          setIsLoading(true);
          if (!db) {
            // Handle DB not initialized
            setIsLoading(false);
            return;
          }
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
              setUserProfile(docSnap.data() as UserProfile);
          } else {
              // Handle case where profile doesn't exist, maybe redirect or show error
              router.push('/profile');
          }
          setIsLoading(false);
      }

      fetchUserProfile();

    }, [user, authLoading, router]);

    if (isLoading || authLoading) {
        return (
             <>
                <Header />
                <main className="container mx-auto py-24 px-4 pb-24">
                    <EditProfileSkeleton />
                </main>
                <BottomNavBar />
            </>
        )
    }

    if (!userProfile) {
        // This can happen if the profile fetch fails or doesn't exist.
        // Redirecting or showing an error message might be appropriate here.
        return (
            <>
                <Header />
                <main className="container mx-auto py-24 px-4 pb-24">
                   <p>Could not load user profile.</p>
                </main>
                <BottomNavBar />
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="container mx-auto py-24 px-4 pb-24">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Edit Your Profile</h1>
                    <p className="text-muted-foreground mb-8">Update your personal and professional information.</p>
                    <EditProfileForm profile={userProfile} />
                </div>
            </main>
            <BottomNavBar />
        </>
    )
}
