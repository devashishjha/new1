import { ReelsClient } from '@/components/reels-client';
import { Header } from '@/components/header';
import { BottomNavBar } from '@/components/bottom-nav-bar';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import type { Property } from '@/lib/types';
import { dateToJSON } from '@/lib/utils';


async function getProperties(): Promise<Property[]> {
  const propertiesCol = collection(db, 'properties');
  const q = query(propertiesCol, orderBy('postedOn', 'desc'));
  const snapshot = await getDocs(q);
  const properties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
  // Firestore Timestamps are not serializable, so we convert them
  return properties.map(dateToJSON) as Property[];
}


export default async function ReelsPage() {
  const properties = await getProperties();

  return (
    <div className="h-dvh w-screen bg-background">
      <Header />
      <ReelsClient initialProperties={properties} />
      <BottomNavBar />
    </div>
  );
}
