'use client';

import type { Property } from '@/lib/types';
import { Reel } from '@/components/reel';

export function ReelsView({ initialProperties, userSearchCriteria }: { initialProperties: Property[], userSearchCriteria: string }) {
    return (
        <main className="h-full w-full overflow-y-auto snap-y snap-mandatory scroll-smooth">
            {initialProperties.map((property) => (
                <Reel key={property.id} property={property} userSearchCriteria={userSearchCriteria} />
            ))}
        </main>
    )
}
