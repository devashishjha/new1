'use client';

import { useState, useEffect } from 'react';
import type { Property, UserProfile } from '@/lib/types';
import { Reel } from '@/components/reel';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function ReelsClient({ initialProperties }: { initialProperties: Property[]}) {
    const { user } = useAuth();
    const [userSearchCriteria, setUserSearchCriteria] = useState<string>('');

    useEffect(() => {
        if (user) {
            const fetchSeekerCriteria = async () => {
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data() as UserProfile;
                    if (userData.type === 'seeker' && userData.searchCriteria) {
                        setUserSearchCriteria(userData.searchCriteria);
                    } else {
                        setUserSearchCriteria("I want a 3BHK in a good neighborhood.");
                    }
                } else {
                     setUserSearchCriteria("I want a 3BHK in a good neighborhood.");
                }
            };
            fetchSeekerCriteria();
        }
    }, [user]);

    if (!userSearchCriteria) {
        // You can render a loading state here
        return null;
    }

    return (
        <main className="h-full w-full overflow-y-auto snap-y snap-mandatory scroll-smooth">
            {initialProperties.map((property) => (
                <Reel key={property.id} property={property} userSearchCriteria={userSearchCriteria} />
            ))}
        </main>
    )
}
