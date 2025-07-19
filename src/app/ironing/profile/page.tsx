'use client';
import { Header } from '@/components/header';
import { IroningProfileClient } from '@/components/ironing-profile-client';

export const dynamic = 'force-dynamic';

export default function IroningProfilePage() {
    return (
        <>
            <Header />
            <main className="container mx-auto py-24 px-4 pb-24">
                <IroningProfileClient />
            </main>
        </>
    );
}
