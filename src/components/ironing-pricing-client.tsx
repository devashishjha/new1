
'use client';

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PricingForm from "@/components/pricing-form"; 
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import type { IroningPriceItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const defaultClothesData: IroningPriceItem[] = [
    { id: 'men_shirt', name: 'Shirt', price: 15, category: 'men' },
    { id: 'men_tshirt', name: 'T-Shirt', price: 10, category: 'men' },
    { id: 'men_trousers', name: 'Trousers', price: 20, category: 'men' },
    { id: 'men_jeans', name: 'Jeans', price: 20, category: 'men' },
    { id: 'men_kurta', name: 'Kurta', price: 25, category: 'men' },
    { id: 'men_pyjama', name: 'Pyjama', price: 15, category: 'men' },
    { id: 'women_top', name: 'Top', price: 15, category: 'women' },
    { id: 'women_saree', name: 'Saree', price: 50, category: 'women' },
    { id: 'women_blouse', name: 'Blouse', price: 10, category: 'women' },
    { id: 'women_kurti', name: 'Kurti', price: 20, category: 'women' },
    { id: 'women_dress', name: 'Dress', price: 30, category: 'women' },
    { id: 'women_leggings', name: 'Leggings', price: 10, category: 'women' },
    { id: 'kids_shirt', name: 'Shirt', price: 8, category: 'kids' },
    { id: 'kids_frock', name: 'Frock', price: 15, category: 'kids' },
    { id: 'kids_shorts', name: 'Shorts', price: 7, category: 'kids' },
    { id: 'kids_pants', name: 'Pants', price: 10, category: 'kids' },
];


export default function IroningPricingClient() {
  const [initialValues, setInitialValues] = useState<{items: IroningPriceItem[]} | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        router.push('/ironing');
        return;
    }

    const fetchPrices = async () => {
      if (!db) {
          toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
          setLoading(false);
          return;
      }
      try {
        const docRef = doc(db, "clothes", "defaultPrices");
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          setInitialValues(snapshot.data() as {items: IroningPriceItem[]});
        } else {
          toast({ title: 'Welcome!', description: 'Setting up your default price list.' });
          const defaultData = { items: defaultClothesData };
          await setDoc(docRef, defaultData);
          setInitialValues(defaultData);
        }
      } catch (error) {
        console.error("Error fetching prices:", error);
        toast({variant: 'destructive', title: 'Error', description: 'Could not fetch price list.'});
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, [user, authLoading, router, toast]);

  if (loading || authLoading) {
    return (
        <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4">Loading pricing editor...</p>
        </div>
    );
  }

  if (!initialValues) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="py-20 text-center text-destructive">⚠️ Could not fetch price list. Please check console for errors and reload.</p>
            </CardContent>
        </Card>
    );
  }

  return <PricingForm initialValues={initialValues} />;
}
