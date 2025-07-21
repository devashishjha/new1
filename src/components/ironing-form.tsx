
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, doc, getDoc, runTransaction, setDoc } from 'firebase/firestore';
import { Loader2, Plus, Minus, CheckCircle2 } from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils';
import type { UserProfile, IroningPriceItem } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

const clothesItemSchema = z.object({
  name: z.string(),
  price: z.number(),
  quantity: z.number().min(0).default(0),
  category: z.string(),
});

const ironingOrderSchema = z.object({
  items: z.array(clothesItemSchema),
  apartmentName: z.string().min(1, 'Apartment name is required'),
  block: z.string().min(1, 'Block is required'),
  floorNo: z.string().min(1, 'Floor number is required'),
  flatNo: z.string().min(1, 'Flat number is required'),
});

type IroningOrder = z.infer<typeof ironingOrderSchema>;

const defaultClothesData: z.infer<typeof clothesItemSchema>[] = [
    { name: 'Shirt', price: 15, quantity: 0, category: 'men' },
    { name: 'T-Shirt', price: 10, quantity: 0, category: 'men' },
    { name: 'Trousers', price: 20, quantity: 0, category: 'men' },
    { name: 'Jeans', price: 20, quantity: 0, category: 'men' },
    { name: 'Kurta', price: 25, quantity: 0, category: 'men' },
    { name: 'Pyjama', price: 15, quantity: 0, category: 'men' },
    { name: 'Top', price: 15, quantity: 0, category: 'women' },
    { name: 'Saree', price: 50, quantity: 0, category: 'women' },
    { name: 'Blouse', price: 10, quantity: 0, category: 'women' },
    { name: 'Kurti', price: 20, quantity: 0, category: 'women' },
    { name: 'Dress', price: 30, quantity: 0, category: 'women' },
    { name: 'Leggings', price: 10, quantity: 0, category: 'women' },
    { name: 'Shirt', price: 8, quantity: 0, category: 'kids' },
    { name: 'Frock', price: 15, quantity: 0, category: 'kids' },
    { name: 'Shorts', price: 7, quantity: 0, category: 'kids' },
    { name: 'Pants', price: 10, quantity: 0, category: 'kids' },
];

function FormSkeleton() {
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
                <CardContent className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i}>
                             <Skeleton className="h-10 w-full mb-2" />
                        </div>
                    ))}
                </CardContent>
            </Card>
             <Card className="sticky bottom-20 z-10">
                <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                <CardContent>
                     <Skeleton className="h-6 w-full" />
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-12 w-full" />
                </CardFooter>
            </Card>
        </div>
    )
}

export function IroningForm() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [step, setStep] = React.useState(1); // 1: items, 2: address, 3: payment, 4: success
    const [isLoadingPrices, setIsLoadingPrices] = React.useState(true);
    
    const form = useForm<IroningOrder>({
        resolver: zodResolver(ironingOrderSchema),
        defaultValues: {
            items: [],
            apartmentName: '', block: '', floorNo: '', flatNo: ''
        },
    });

    const { fields: itemsFields, update: updateItems, replace } = useFieldArray({ control: form.control, name: "items" });
    
    React.useEffect(() => {
        const fetchOrInitializePrices = async () => {
            setIsLoadingPrices(true);
            
            if (!db) {
                console.warn("Firestore not available. Using default prices.");
                replace(defaultClothesData);
                setIsLoadingPrices(false);
                return;
            }

            try {
                const pricesDocRef = doc(db, 'clothes', 'defaultPrices');
                const docSnap = await getDoc(pricesDocRef);
                
                if (docSnap.exists()) {
                    const priceData = docSnap.data().items as IroningPriceItem[];
                    const itemsWithQuantity = priceData.map(item => ({ ...item, quantity: 0 }));
                    replace(itemsWithQuantity);
                } else {
                    console.log("No price list found, creating one with default data.");
                    await setDoc(pricesDocRef, { items: defaultClothesData.map(({quantity, category, ...item}) => item) });
                    replace(defaultClothesData);
                }
            } catch (error) {
                 console.error("Could not fetch or initialize price list, falling back to local defaults:", error);
                 replace(defaultClothesData);
                 toast({variant: 'destructive', title: 'Error', description: 'Could not fetch latest price list.'});
            } finally {
                setIsLoadingPrices(false);
            }
        };

        fetchOrInitializePrices();
    }, [replace, toast]);


    const watchedValues = form.watch();
    const categories = React.useMemo(() => {
        return itemsFields.reduce((acc, field) => {
            if (!acc.includes(field.category)) {
                acc.push(field.category);
            }
            return acc;
        }, [] as string[]);
    }, [itemsFields]);


    const totalCost = React.useMemo(() => {
        return watchedValues.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
    }, [watchedValues]);

    const totalItems = React.useMemo(() => {
        return watchedValues.items.reduce((acc, item) => acc + item.quantity, 0);
    }, [watchedValues]);

    const handleNextStep = async () => {
        if (step === 1) {
            if (totalItems === 0) {
                toast({ variant: 'destructive', title: "Empty Order", description: "Please add at least one item." });
                return;
            }
            setStep(2);
        } else if (step === 2) {
            const result = await form.trigger(['apartmentName', 'block', 'floorNo', 'flatNo']);
            if (result) {
                setStep(3);
            }
        }
    };

    async function onSubmit(values: IroningOrder) {
        if (!user || !db) return;
        setIsSubmitting(true);
        try {
            await runTransaction(db, async (transaction) => {
                const counterRef = doc(db, 'counters', 'ironingOrders');
                const counterDoc = await transaction.get(counterRef);

                let newOrderId = 1;
                if (counterDoc.exists()) {
                    newOrderId = counterDoc.data().currentId + 1;
                }
                
                transaction.set(counterRef, { currentId: newOrderId }, { merge: true });
                
                const orderItems = values.items.filter(item => item.quantity > 0).map(({category, ...item}) => item);
                const newOrderRef = doc(collection(db, "ironingOrders"));
                
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await transaction.get(userDocRef);
                const userProfile = userDocSnap.data() as UserProfile | undefined;

                transaction.set(newOrderRef, {
                    orderId: newOrderId,
                    userId: user.uid, userEmail: user.email,
                    userName: userProfile?.name || 'N/A',
                    userPhone: userProfile?.phone || 'N/A',
                    items: orderItems,
                    totalCost, totalItems, status: 'placed', placedAt: serverTimestamp(),
                    address: { apartmentName: values.apartmentName, block: values.block, floorNo: values.floorNo, flatNo: values.flatNo }
                });

                const ironingProfileDocRef = doc(db, 'ironingProfiles', user.uid);
                transaction.set(ironingProfileDocRef, {
                    email: user.email, phone: user.phoneNumber, 
                    address: { apartmentName: values.apartmentName, block: values.block, floorNo: values.floorNo, flatNo: values.flatNo }
                }, { merge: true });
            });
            
            setStep(4);

        } catch (error) {
            console.error("Error placing order:", error);
            toast({ variant: "destructive", title: "Order Failed", description: "There was an error placing your order." });
        } finally {
            setIsSubmitting(false);
        }
    }


    if (isLoadingPrices) {
        return <FormSkeleton />;
    }

    if (step === 4) {
        return (
            <Card className="text-center p-8">
                <CardHeader>
                    <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
                    <CardTitle className="text-3xl mt-4">Order Placed Successfully!</CardTitle>
                    <CardDescription>Your clothes are in good hands. We'll be in touch shortly.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button size="lg" onClick={() => { setStep(1); form.reset(); }}>Place Another Order</Button>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {step === 1 && (
                     <Card>
                        <CardHeader><CardTitle className="capitalize">Select Items</CardTitle></CardHeader>
                        <CardContent>
                           <Accordion type="multiple" className="w-full" defaultValue={['men']}>
                                {categories.map(category => (
                                    <AccordionItem value={category} key={category}>
                                        <AccordionTrigger className="text-lg font-semibold capitalize">{category}</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="space-y-2 pt-2">
                                            {itemsFields.map((field, index) => (
                                                field.category === category && (
                                                    <div key={field.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                                                        <div>
                                                            <p className="font-medium">{field.name}</p>
                                                            <p className="text-sm text-muted-foreground">{formatIndianCurrency(field.price)} / item</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button type="button" size="icon" variant="outline" onClick={() => { const q = Math.max(0, field.quantity-1); updateItems(index, {...field, quantity: q}) }} disabled={field.quantity === 0}><Minus className="h-4 w-4" /></Button>
                                                            <span className="font-bold text-lg w-10 text-center">{field.quantity}</span>
                                                            <Button type="button" size="icon" variant="outline" onClick={() => { const q = field.quantity+1; updateItems(index, {...field, quantity: q}) }}><Plus className="h-4 w-4" /></Button>
                                                        </div>
                                                    </div>
                                                )
                                            ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                )}
                
                {step === 2 && (
                    <Card>
                        <CardHeader><CardTitle>Delivery Address</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <FormField control={form.control} name="apartmentName" render={({ field }) => ( <FormItem><FormLabel>Apartment Name</FormLabel><FormControl><Input placeholder="e.g. Prestige Shantiniketan" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                            <div className="grid grid-cols-3 gap-4">
                                <FormField control={form.control} name="block" render={({ field }) => ( <FormItem><FormLabel>Block</FormLabel><FormControl><Input placeholder="e.g. A" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                <FormField control={form.control} name="floorNo" render={({ field }) => ( <FormItem><FormLabel>Floor</FormLabel><FormControl><Input type="number" placeholder="e.g. 12" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                <FormField control={form.control} name="flatNo" render={({ field }) => ( <FormItem><FormLabel>Flat No.</FormLabel><FormControl><Input type="number" placeholder="e.g. 1201" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                            </div>
                        </CardContent>
                    </Card>
                )}
                
                {step === 3 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Confirm Order</CardTitle>
                            <CardDescription>Please review your order and address before placing.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold">Delivery to:</h4>
                                <p>{watchedValues.flatNo}, Floor {watchedValues.floorNo}, Block {watchedValues.block}</p>
                                <p>{watchedValues.apartmentName}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold">Payment Method:</h4>
                                <p>Cash on Delivery</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
                
                <Card className="sticky bottom-20 z-10">
                    <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
                    <CardContent className="flex justify-between items-center text-lg">
                        <p>Total Items: <span className="font-bold">{totalItems}</span></p>
                        <p>Total Cost: <span className="font-bold text-primary">{formatIndianCurrency(totalCost)}</span></p>
                    </CardContent>
                    <CardFooter>
                        {step === 1 && <Button type="button" size="lg" className="w-full" onClick={handleNextStep} disabled={totalItems === 0}>Check Out</Button>}
                        {step === 2 && <Button type="button" size="lg" className="w-full" onClick={handleNextStep}>Next</Button>}
                        {step === 3 && <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin mr-2" /> Placing Order...</> : 'Place Order'}</Button>}
                    </CardFooter>
                </Card>
            </form>
        </Form>
    );
}

    