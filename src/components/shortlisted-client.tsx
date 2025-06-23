'use client';

import { useEffect, useState, useCallback } from 'react';
import { ShortlistedPropertyCard } from '@/components/shortlisted-property-card';
import type { Property } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { dateToJSON } from '@/lib/utils';

const CardSkeleton = () => (
    <div className="space-y-2">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
    </div>
)

export function ShortlistedClient() {
    const [shortlisted, setShortlisted] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const updateShortlistedProperties = useCallback(async () => {
        setIsLoading(true);
        const shortlistedIds: string[] = JSON.parse(localStorage.getItem('shortlistedProperties') || '[]');
        
        if (shortlistedIds.length === 0) {
            setShortlisted([]);
            setIsLoading(false);
            return;
        }

        try {
            // Firestore 'in' query is limited to 30 elements. 
            // For larger lists, you'd fetch documents one by one or batch them.
            const propertiesRef = collection(db, 'properties');
            const q = query(propertiesRef, where('__name__', 'in', shortlistedIds));
            const querySnapshot = await getDocs(q);
            const properties = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
            
            const serializedProperties = properties.map(p => dateToJSON(p)) as Property[];
            setShortlisted(serializedProperties);
        } catch (error) {
            console.error("Error fetching shortlisted properties:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        updateShortlistedProperties();
        window.addEventListener('shortlist-updated', updateShortlistedProperties);
        return () => {
            window.removeEventListener('shortlist-updated', updateShortlistedProperties);
        };
    }, [updateShortlistedProperties]);

    return (
        <>
            <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">Shortlisted Properties</h1>
            <p className="text-muted-foreground mb-8">Properties you have saved for later viewing.</p>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                       <CardSkeleton key={i} />
                    ))}
                </div>
            ) : shortlisted.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {shortlisted.map(property => (
                        <ShortlistedPropertyCard key={property.id} property={property} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 border border-dashed rounded-lg mt-10">
                    <h2 className="text-xl font-semibold text-white">No Shortlisted Properties</h2>
                    <p className="text-muted-foreground mt-2">You haven't shortlisted any properties yet. Start exploring!</p>
                </div>
            )}
        </>
    );
}
