'use client';
import { ReelsClient } from '@/components/reels-client';
import { Header } from '@/components/header';
import { BottomNavBar } from '@/components/bottom-nav-bar';

export const dynamic = 'force-dynamic';

export default function ReelsPage() {
  return (
    <div className="h-dvh w-screen">
      <Header />
      <ReelsClient />
      <BottomNavBar />
    </div>
  );
}
