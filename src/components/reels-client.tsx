'use client';

import { useState, useEffect } from 'react';
import type { Property, UserProfile } from '@/lib/types';
import { Reel } from '@/components/reel';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import { dateToJSON } from '@/lib/utils';

function ReelSkeleton() {
    return (
        <div className="h-full w-full snap-start relative flex flex-col justify-end p-4">
            <Skeleton className="absolute inset-0 w-full h-full" />
            <div className="relative z-10 space-y-4">
                 <div className="flex justify-around items-center rounded-full bg-black/30 p-1.5 backdrop-blur-sm border border-white/20 mb-4 max-w-sm mx-auto">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    <Skeleton className="h-20 w-40 rounded-xl" />
                    <Skeleton className="h-20 w-40 rounded-xl" />
                    <Skeleton className="h-20 w-40 rounded-xl" />
                </div>
            </div>
        </div>
    )
}

export function ReelsClient() {
    const { user } = useAuth();
    const [properties, setProperties] = useState<Property[]>([]);
    const [userSearchCriteria, setUserSearchCriteria] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // This effect should only run when the `user` object is available.
        // `useAuth` hook ensures this component doesn't render until auth state is resolved.
        if (user) {
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    // Fetch user criteria
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data() as UserProfile;
                        if (userData.type === 'seeker' && userData.searchCriteria) {
                            setUserSearchCriteria(userData.searchCriteria);
                        }
                    }

                    // Fetch properties
                    const propertiesCol = collection(db, 'properties');
                    const q = query(propertiesCol, orderBy('postedOn', 'desc'));
                    const snapshot = await getDocs(q);
                    const fetchedProperties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
                    setProperties(fetchedProperties.map(p => dateToJSON(p)) as Property[]);
                } catch (error) {
                    console.error("Error fetching data:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [user]); // The dependency is only on `user`.

    if (isLoading) {
        return (
             <main className="h-full w-full overflow-hidden">
                <ReelSkeleton />
            </main>
        )
    }

    return (
        <main className="h-full w-full overflow-y-auto snap-y snap-mandatory scroll-smooth">
            {properties.map((property) => (
                <Reel key={property.id} property={property} userSearchCriteria={userSearchCriteria} />
            ))}
        </main>
    )
}
