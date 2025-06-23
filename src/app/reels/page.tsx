import { ReelsClient } from '@/components/reels-client';
import { Header } from '@/components/header';
import { BottomNavBar } from '@/components/bottom-nav-bar';

export default function ReelsPage() {
  return (
    <div className="h-dvh w-screen bg-background">
      <Header />
      <ReelsClient />
      <BottomNavBar />
    </div>
  );
}
