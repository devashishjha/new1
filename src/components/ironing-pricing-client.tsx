
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import type { IroningPriceItem } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { useRouter } from 'next/navigation';

const priceItemSchema = z.object({
  name: z.string(),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  category: z.string(),
});

const pricingSchema = z.object({
  items: z.array(priceItemSchema),
});

type PricingForm = z.infer<typeof pricingSchema>;

const clothesData: Record<string, IroningPriceItem[]> = {
    men: [ { name: 'Shirt', price: 15 }, { name: 'T-Shirt', price: 10 }, { name: 'Trousers', price: 20 }, { name: 'Jeans', price: 20 }, { name: 'Kurta', price: 25 }, { name: 'Pyjama', price: 15 } ],
    women: [ { name: 'Top', price: 15 }, { name: 'Saree', price: 50 }, { name: 'Blouse', price: 10 }, { name: 'Kurti', price: 20 }, { name: 'Dress', price: 30 }, { name: 'Leggings', price: 10 } ],
    kids: [ { name: 'Shirt', price: 8 }, { name: 'Frock', price: 15 }, { name: 'Shorts', price: 7 }, { name: 'Pants', price: 10 } ],
};

function PricingSkeleton() {
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                     <Skeleton className="h-12 w-full" />
                     <Skeleton className="h-12 w-full" />
                     <Skeleton className="h-12 w-full" />
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-12 w-full" />
                </CardFooter>
            </Card>
        </div>
    )
}

export function IroningPricingClient() {
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    const form = useForm<PricingForm>({
        defaultValues: { items: [] },
    });

    const { fields, replace } = useFieldArray({
        control: form.control,
        name: "items",
    });

    React.useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/ironing');
            return;
        }

        const fetchPrices = async () => {
             if (!db) {
                console.warn("Firestore not available.");
                return;
            }

            try {
                const clothesRef = collection(db, 'clothes');
                const snapshot = await getDocs(clothesRef);
                
                let dbPrices: z.infer<typeof priceItemSchema>[] = [];

                if (snapshot.empty) {
                    toast({ title: 'Welcome!', description: 'Setting up your default price list.' });
                    const batch = writeBatch(db);
                    Object.entries(clothesData).forEach(([category, items]) => {
                        const docRef = doc(db, 'clothes', category);
                        batch.set(docRef, { items });
                        items.forEach(item => {
                            dbPrices.push({ ...item, category });
                        });
                    });
                    await batch.commit();
                } else {
                    snapshot.forEach(doc => {
                        const category = doc.id;
                        const categoryItems = doc.data().items as IroningPriceItem[];
                        categoryItems.forEach(item => {
                            dbPrices.push({ ...item, category });
                        });
                    });
                }
                
                replace(dbPrices);

            } catch (error) {
                 console.error("Could not fetch or initialize prices:", error);
                 toast({variant: 'destructive', title: 'Error', description: 'Could not load the pricing page.'});
            }
        };

        fetchPrices();
    }, [replace, authLoading, user, router, toast]);

    async function onSubmit(values: PricingForm) {
        if (!user || !db) return;
        setIsSubmitting(true);
        
        try {
            const batch = writeBatch(db);
            const categorizedItems: Record<string, IroningPriceItem[]> = {};

            values.items.forEach(item => {
                if (!categorizedItems[item.category]) {
                    categorizedItems[item.category] = [];
                }
                categorizedItems[item.category].push({
                    name: item.name,
                    price: item.price,
                });
            });

            for (const category in categorizedItems) {
                const docRef = doc(db, 'clothes', category);
                batch.set(docRef, { items: categorizedItems[category] });
            }

            await batch.commit();
            toast({ title: "Prices Updated", description: "The new prices are now live for all customers." });
        } catch (error) {
            console.error("Error updating prices:", error);
            toast({ variant: "destructive", title: "Update Failed", description: "Could not save the new prices." });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const categories = React.useMemo(() => {
        return fields.reduce((acc, field) => {
            if (!acc.includes(field.category)) {
                acc.push(field.category);
            }
            return acc;
        }, [] as string[]);
    }, [fields]);

    if (fields.length === 0 || authLoading) {
        return <PricingSkeleton />;
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Ironing Prices</CardTitle>
                        <CardDescription>
                            Set the price for each item. Changes will be reflected for customers in real-time.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Accordion type="multiple" className="w-full" defaultValue={categories}>
                            {categories.map(category => (
                                <AccordionItem value={category} key={category}>
                                    <AccordionTrigger className="text-lg font-semibold capitalize">{category}</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-4 pt-2">
                                            {fields.map((field, index) => (
                                                field.category === category && (
                                                    <FormField
                                                        key={field.id}
                                                        control={form.control}
                                                        name={`items.${index}.price`}
                                                        render={({ field: priceField }) => (
                                                             <FormItem className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                                                                <FormLabel className="font-medium">{fields[index].name}</FormLabel>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-muted-foreground">₹</span>
                                                                    <FormControl>
                                                                        <Input 
                                                                            type="number"
                                                                            className="w-24 h-9"
                                                                            {...priceField}
                                                                        />
                                                                    </FormControl>
                                                                </div>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                )
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save All Prices'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    );
}
