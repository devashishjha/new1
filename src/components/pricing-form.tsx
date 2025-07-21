
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import type { IroningPriceItem } from '@/lib/types';

const priceItemSchema = z.object({
  name: z.string(),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  category: z.string(),
});

const pricingSchema = z.object({
  items: z.array(priceItemSchema),
});

type PricingFormValues = z.infer<typeof pricingSchema>;

export default function PricingForm({ initialValues }: { initialValues: { items: IroningPriceItem[] } }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<PricingFormValues>({
        resolver: zodResolver(pricingSchema),
        defaultValues: initialValues,
    });

    const { fields } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const categories = React.useMemo(() => {
        return fields.reduce((acc, field) => {
            if (!acc.includes(field.category)) acc.push(field.category);
            return acc;
        }, [] as string[]);
    }, [fields]);

    async function onSubmit(values: PricingFormValues) {
        setIsSubmitting(true);
        try {
            if (!db) throw new Error("Database not initialized.");
            const pricesDocRef = doc(db, 'clothes', 'defaultPrices');
            await setDoc(pricesDocRef, values);
            toast({ title: "Prices Updated", description: "The new prices are now live for all customers." });
        } catch (error) {
            console.error("Error updating prices:", error);
            toast({ variant: "destructive", title: "Update Failed", description: "Could not save the new prices." });
        } finally {
            setIsSubmitting(false);
        }
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
                                                                <FormLabel htmlFor={`items.${index}.price`} className="font-medium">{field.name}</FormLabel>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-muted-foreground">₹</span>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="number"
                                                                            id={`items.${index}.price`}
                                                                            {...priceField}
                                                                            className="w-24 h-9"
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
    )
}
