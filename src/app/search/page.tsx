import { SearchClient } from '@/components/search-client';
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
  return properties.map(dateToJSON) as Property[];
}


export default async function SearchPage() {
  const properties = await getProperties();

  return (
    <>
      <Header />
      <main className="container mx-auto py-24 px-4 pb-24">
        <SearchClient initialProperties={properties} />
      </main>
      <BottomNavBar />
    </>
  );
}
