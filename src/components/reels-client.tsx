'use client';

import { useState, useEffect } from 'react';
import type { Property, UserProfile, SeekerProfile } from '@/lib/types';
import { Reel } from '@/components/reel';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from './ui/skeleton';
import { dateToJSON } from '@/lib/utils';
import { dummyProperties } from '@/lib/dummy-data';

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
        if (authLoading) return; // Wait for authentication to resolve

        let unsubscribe = () => {};

        const setupListeners = async () => {
            setIsLoading(true);

            // If Firebase is not configured, fall back to dummy data immediately.
            if (!db) {
                console.warn("Firebase is not configured. Falling back to dummy data.");
                setProperties(dummyProperties.map(p => dateToJSON(p)).filter(p => p.status === 'available') as Property[]);
                setUserSearchCriteria("A great property with good amenities in a nice neighborhood.");
                setIsLoading(false);
                return;
            }
            
            try {
                // The default criteria for non-seekers or logged-out users.
                const defaultSearchCriteria = "A great property with good amenities in a nice neighborhood.";

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

                // Set up real-time listener for available properties
                const propertiesCol = collection(db, 'properties');
                const q = query(propertiesCol, where("status", "==", "available"), orderBy('postedOn', 'desc'));
                
                unsubscribe = onSnapshot(q, (snapshot) => {
                    let fetchedProperties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));

                    // If Firestore returns no properties, use dummy data as a fallback.
                    if (fetchedProperties.length === 0) {
                        fetchedProperties = dummyProperties.filter(p => p.status === 'available');
                    }
                    
                    setProperties(fetchedProperties.map(p => dateToJSON(p)) as Property[]);
                    setIsLoading(false);
                }, (error) => {
                    console.error("Error fetching real-time properties:", error);
                    // Fallback to dummy data on error as well
                    setProperties(dummyProperties.filter(p => p.status === 'available').map(p => dateToJSON(p)) as Property[]);
                    setIsLoading(false);
                });

            } catch (error) {
                console.error("Error setting up data listeners:", error);
                setProperties(dummyProperties.filter(p => p.status === 'available').map(p => dateToJSON(p)) as Property[]);
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
