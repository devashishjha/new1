'use client';
import { useState, useEffect } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { AddPropertyForm } from "@/components/add-property-form";
import { BottomNavBar } from "@/components/bottom-nav-bar";
import { Header } from "@/components/header";
import { db } from '@/lib/firebase';
import type { Property } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

function EditPropertySkeleton() {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight mb-2"><Skeleton className="h-10 w-64 bg-muted" /></h1>
            <p className="text-muted-foreground mb-8"><Skeleton className="h-6 w-96 bg-muted" /></p>
            <div className="space-y-8">
                <Skeleton className="h-40 w-full bg-muted" />
                <Skeleton className="h-96 w-full bg-muted" />
                <Skeleton className="h-40 w-full bg-muted" />
            </div>
        </div>
    )
}

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
      if (!propertyId || authLoading) return;

      const fetchProperty = async () => {
          setIsLoading(true);
          const docRef = doc(db, 'properties', propertyId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
              const data = { id: docSnap.id, ...docSnap.data() } as Property;
              // Security check: only the lister can edit
              if (!user || user.uid !== data.lister.id) {
                  router.push('/reels'); // Redirect if not authorized
                  return;
              }
              setProperty(data);
          } else {
              notFound();
          }
          setIsLoading(false);
      }

      fetchProperty();

  }, [propertyId, user, authLoading, router]);

  if (isLoading || authLoading) {
      return (
          <>
              <Header />
              <main className="container mx-auto py-24 px-4 pb-24">
                  <EditPropertySkeleton />
              </main>
              <BottomNavBar />
          </>
      )
  }

  if (!property) {
      // This will be caught by notFound() in useEffect, but as a safeguard
      return notFound();
  }

  return (
    <>
      <Header />
      <main className="container mx-auto py-24 px-4 pb-24">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Edit Your Property</h1>
            <p className="text-muted-foreground mb-8">Update the details below for your property listing.</p>
            <AddPropertyForm mode="edit" property={property} />
        </div>
      </main>
      <BottomNavBar />
    </>
  );
}
