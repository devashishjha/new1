'use client';
import { SearchClient } from '@/components/search-client';
import { Header } from '@/components/header';
import { BottomNavBar } from '@/components/bottom-nav-bar';

export const dynamic = 'force-dynamic';

export default function SearchPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto py-24 px-4 pb-24">
        <SearchClient />
      </main>
      <BottomNavBar />
    </>
  );
}
