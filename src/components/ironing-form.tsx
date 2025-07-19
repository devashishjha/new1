
'use client';

import * as React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Loader2, Plus, Trash2, Minus } from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils';


const clothesItemSchema = z.object({
  name: z.string(),
  price: z.number(),
  quantity: z.number().min(0).default(0),
});

const ironingOrderSchema = z.object({
  mens: z.array(clothesItemSchema),
  womens: z.array(clothesItemSchema),
  kids: z.array(clothesItemSchema),
});

type IroningOrder = z.infer<typeof ironingOrderSchema>;

const clothesData = {
    mens: [
        { name: 'Shirt', price: 15 },
        { name: 'T-Shirt', price: 10 },
        { name: 'Trousers', price: 20 },
        { name: 'Jeans', price: 20 },
        { name: 'Kurta', price: 25 },
        { name: 'Pyjama', price: 15 },
    ],
    womens: [
        { name: 'Top', price: 15 },
        { name: 'Saree', price: 50 },
        { name: 'Blouse', price: 10 },
        { name: 'Kurti', price: 20 },
        { name: 'Dress', price: 30 },
        { name: 'Leggings', price: 10 },
    ],
    kids: [
        { name: 'Shirt', price: 8 },
        { name: 'Frock', price: 15 },
        { name: 'Shorts', price: 7 },
        { name: 'Pants', price: 10 },
    ],
};

function ClothesCategory({ category, control, fields, update }: { 
    category: 'mens' | 'womens' | 'kids';
    control: any;
    fields: any[];
    update: (index: number, value: any) => void;
}) {
    
    const handleQuantityChange = (index: number, change: 1 | -1) => {
        const currentQuantity = fields[index].quantity;
        const newQuantity = Math.max(0, currentQuantity + change);
        update(index, { ...fields[index], quantity: newQuantity });
    };

    return (
        <Card>
            <CardHeader><CardTitle className="capitalize">{category}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                        <div>
                            <p className="font-medium">{field.name}</p>
                            <p className="text-sm text-muted-foreground">{formatIndianCurrency(field.price)} / item</p>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button type="button" size="icon" variant="outline" onClick={() => handleQuantityChange(index, -1)} disabled={field.quantity === 0}>
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-bold text-lg w-10 text-center">{field.quantity}</span>
                            <Button type="button" size="icon" variant="outline" onClick={() => handleQuantityChange(index, 1)}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

export function IroningForm() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<IroningOrder>({
        resolver: zodResolver(ironingOrderSchema),
        defaultValues: {
            mens: clothesData.mens.map(item => ({ ...item, quantity: 0 })),
            womens: clothesData.womens.map(item => ({ ...item, quantity: 0 })),
            kids: clothesData.kids.map(item => ({ ...item, quantity: 0 })),
        },
    });

    const { fields: mensFields, update: updateMens } = useFieldArray({ control: form.control, name: "mens" });
    const { fields: womensFields, update: updateWomens } = useFieldArray({ control: form.control, name: "womens" });
    const { fields: kidsFields, update: updateKids } = useFieldArray({ control: form.control, name: "kids" });
    
    const watchedValues = form.watch();

    const totalCost = React.useMemo(() => {
        const mensCost = watchedValues.mens.reduce((acc, item) => acc + item.quantity * item.price, 0);
        const womensCost = watchedValues.womens.reduce((acc, item) => acc + item.quantity * item.price, 0);
        const kidsCost = watchedValues.kids.reduce((acc, item) => acc + item.quantity * item.price, 0);
        return mensCost + womensCost + kidsCost;
    }, [watchedValues]);

    const totalItems = React.useMemo(() => {
        const mensItems = watchedValues.mens.reduce((acc, item) => acc + item.quantity, 0);
        const womensItems = watchedValues.womens.reduce((acc, item) => acc + item.quantity, 0);
        const kidsItems = watchedValues.kids.reduce((acc, item) => acc + item.quantity, 0);
        return mensItems + womensItems + kidsItems;
    }, [watchedValues]);

    async function onSubmit(values: IroningOrder) {
        if (!user) {
            toast({ variant: 'destructive', title: "Not Authenticated", description: "You must be logged in to place an order." });
            return;
        }

        if (!db) {
            toast({ variant: 'destructive', title: "Service Unavailable", description: "Cannot submit order. Please ensure Firebase is configured." });
            return;
        }
        
        if (totalItems === 0) {
            toast({ variant: 'destructive', title: "Empty Order", description: "Please add at least one item to your order." });
            return;
        }

        setIsSubmitting(true);

        try {
            const orderItems = [
                ...values.mens,
                ...values.womens,
                ...values.kids
            ].filter(item => item.quantity > 0);

            await addDoc(collection(db, "ironingOrders"), {
                userId: user.uid,
                userEmail: user.email,
                items: orderItems,
                totalCost,
                totalItems,
                status: 'placed',
                placedAt: serverTimestamp()
            });

            toast({
                title: "Order Placed!",
                description: `Your order for ${totalItems} items has been successfully placed.`,
            });
            form.reset();

        } catch (error) {
            console.error("Error placing order:", error);
            toast({ variant: "destructive", title: "Order Failed", description: "There was an error placing your order." });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <ClothesCategory category="mens" control={form.control} fields={mensFields} update={updateMens} />
                <ClothesCategory category="womens" control={form.control} fields={womensFields} update={updateWomens} />
                <ClothesCategory category="kids" control={form.control} fields={kidsFields} update={updateKids} />
                
                <Card className="sticky bottom-20 z-10">
                    <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-between items-center text-lg">
                        <div>
                            <p>Total Items: <span className="font-bold">{totalItems}</span></p>
                        </div>
                        <div>
                           <p>Total Cost: <span className="font-bold text-primary">{formatIndianCurrency(totalCost)}</span></p>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || totalItems === 0}>
                            {isSubmitting ? <><Loader2 className="animate-spin mr-2" /> Placing Order...</> : 'Place Order'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    );
}
