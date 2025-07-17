
'use client';

import { useState, useEffect } from 'react';
import type { Property, UserProfile, SeekerProfile } from '@/lib/types';
import { Reel } from '@/components/reel';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import { dateToJSON } from '@/lib/utils';

function ReelSkeleton() {
    return (
        <div className="h-full w-full snap-start relative flex flex-col justify-end p-4">
            <Skeleton className="absolute inset-0 w-full h-full bg-secondary" />
            <div className="relative z-10 space-y-4" style={{ marginBottom: '5rem' }}>
                 <div className="flex justify-around items-center rounded-full bg-black/30 p-1.5 backdrop-blur-sm border border-white/20 mb-4 max-w-sm mx-auto">
                    <Skeleton className="h-8 w-8 rounded-full bg-muted/50" />
                    <Skeleton className="h-8 w-8 rounded-full bg-muted/50" />
                    <Skeleton className="h-8 w-8 rounded-full bg-muted/50" />
                    <Skeleton className="h-8 w-8 rounded-full bg-muted/50" />
                </div>
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    <Skeleton className="h-20 w-40 rounded-xl bg-muted/50" />
                    <Skeleton className="h-20 w-40 rounded-xl bg-muted/50" />
                    <Skeleton className="h-20 w-40 rounded-xl bg-muted/50" />
                </div>
            </div>
        </div>
    )
}

export function ReelsClient() {
    const { user, loading: authLoading } = useAuth();
    const [properties, setProperties] = useState<Property[]>([]);
    const [userSearchCriteria, setUserSearchCriteria] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        let unsubscribe = () => {};

        const setupListeners = async () => {
            setIsLoading(true);

            const defaultSearchCriteria = "A great property with good amenities in a nice neighborhood.";

            if (!db) {
                console.warn("Firebase is not configured. App will not load properties.");
                setProperties([]);
                setUserSearchCriteria(defaultSearchCriteria);
                setIsLoading(false);
                return;
            }
            
            try {
                if (user) {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data() as UserProfile;
                        if (userData.type === 'seeker' && (userData as SeekerProfile).searchCriteria) {
                            setUserSearchCriteria((userData as SeekerProfile).searchCriteria);
                        } else {
                            setUserSearchCriteria(defaultSearchCriteria);
                        }
                    } else {
                        setUserSearchCriteria(defaultSearchCriteria);
                    }
                } else {
                    setUserSearchCriteria(defaultSearchCriteria);
                }

                const propertiesCol = collection(db, 'properties');
                // Querying without the 'where' clause to avoid needing a composite index.
                // Filtering will happen on the client.
                const q = query(propertiesCol, orderBy('postedOn', 'desc'));
                
                unsubscribe = onSnapshot(q, (snapshot) => {
                    const allProperties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
                    const availableProperties = allProperties.filter(p => p.status === 'available');
                    
                    setProperties(availableProperties.map(p => dateToJSON(p)) as Property[]);
                    setIsLoading(false);
                }, (error) => {
                    console.error("Error fetching real-time properties:", error);
                    setProperties([]);
                    setIsLoading(false);
                });

            } catch (error) {
                console.error("Error setting up data listeners:", error);
                setProperties([]);
                setIsLoading(false);
            }
        };
        
        setupListeners();
        
        // Cleanup subscription on component unmount
        return () => unsubscribe();
    }, [user, authLoading]);


    const handleDeleteProperty = (propertyId: string) => {
        setProperties(prev => prev.filter(p => p.id !== propertyId));
    };

    if (isLoading || authLoading) {
        return (
             <main className="h-full w-full overflow-hidden">
                <ReelSkeleton />
            </main>
        )
    }

    return (
        <main className="h-full w-full overflow-y-auto snap-y snap-mandatory scroll-smooth">
            {properties.length > 0 ? (
                properties.map((property) => (
                    <Reel key={property.id} property={property} userSearchCriteria={userSearchCriteria} onDelete={handleDeleteProperty} />
                ))
            ) : (
                 <div className="h-full w-full snap-start relative flex flex-col justify-center items-center p-4 text-center">
                    <h2 className="text-2xl font-bold">No Properties Found</h2>
                    <p className="text-muted-foreground mt-2">Check back later or be the first to add a property!</p>
                </div>
            )}
        </main>
    )
}
