'use client';
import { Header } from '@/components/header';
import { BottomNavBar } from '@/components/bottom-nav-bar';
import { ShortlistedClient } from '@/components/shortlisted-client';

export const dynamic = 'force-dynamic';

export default function ShortlistedPage() {
    return (
        <>
            <Header />
            <main className="container mx-auto py-24 px-4 pb-24">
                <ShortlistedClient />
            </main>
            <BottomNavBar />
        </>
    );
}
