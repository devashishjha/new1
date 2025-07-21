
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
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
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

const defaultClothesData: z.infer<typeof priceItemSchema>[] = [
    { name: 'Shirt', price: 15, category: 'men' },
    { name: 'T-Shirt', price: 10, category: 'men' },
    { name: 'Trousers', price: 20, category: 'men' },
    { name: 'Jeans', price: 20, category: 'men' },
    { name: 'Kurta', price: 25, category: 'men' },
    { name: 'Pyjama', price: 15, category: 'men' },
    { name: 'Top', price: 15, category: 'women' },
    { name: 'Saree', price: 50, category: 'women' },
    { name: 'Blouse', price: 10, category: 'women' },
    { name: 'Kurti', price: 20, category: 'women' },
    { name: 'Dress', price: 30, category: 'women' },
    { name: 'Leggings', price: 10, category: 'women' },
    { name: 'Shirt', price: 8, category: 'kids' },
    { name: 'Frock', price: 15, category: 'kids' },
    { name: 'Shorts', price: 7, category: 'kids' },
    { name: 'Pants', price: 10, category: 'kids' },
];

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
    const [isLoading, setIsLoading] = React.useState(true);
    
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

        const fetchOrInitializePrices = async () => {
             setIsLoading(true);
             if (!db) {
                toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
                setIsLoading(false);
                return;
            }

            try {
                const pricesDocRef = doc(db, 'clothes', 'defaultPrices');
                const docSnap = await getDoc(pricesDocRef);
                
                if (docSnap.exists()) {
                    const priceData = docSnap.data().items as IroningPriceItem[];
                    replace(priceData);
                } else {
                    toast({ title: 'Welcome!', description: 'Setting up your default price list.' });
                    const itemsToStore = defaultClothesData.map(({category, ...item}) => item);
                    await setDoc(pricesDocRef, { items: itemsToStore });
                    replace(defaultClothesData);
                }
            } catch (error) {
                 console.error("Could not fetch or initialize prices:", error);
                 toast({variant: 'destructive', title: 'Error', description: 'Could not load the pricing page.'});
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrInitializePrices();
    }, [replace, authLoading, user, router, toast]);

    async function onSubmit(values: PricingForm) {
        if (!user || !db) return;
        setIsSubmitting(true);
        
        try {
            const pricesDocRef = doc(db, 'clothes', 'defaultPrices');
            const itemsToStore = values.items.map(({category, ...item}) => item);
            await setDoc(pricesDocRef, { items: itemsToStore });
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

    if (isLoading || authLoading) {
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
                                                                <FormLabel htmlFor={`items.${index}.price`} className="font-medium">{fields[index].name}</FormLabel>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-muted-foreground">₹</span>
                                                                    <FormControl>
                                                                        <Input 
                                                                            type="number"
                                                                            id={`items.${index}.price`}
                                                                            name={`items.${index}.price`}
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

    