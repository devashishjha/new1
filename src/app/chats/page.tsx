'use client';
import { Header } from '@/components/header';
import { BottomNavBar } from '@/components/bottom-nav-bar';
import { ChatsListClient } from '@/components/chats-list-client';

export const dynamic = 'force-dynamic';

export default function ChatsPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto py-24 px-4 pb-24">
        <ChatsListClient />
      </main>
      <BottomNavBar />
    </>
  );
}
