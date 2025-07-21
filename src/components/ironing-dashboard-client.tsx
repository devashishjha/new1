
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { IroningOrder, IroningOrderItem, IroningOrderStatus, UserProfile } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, serverTimestamp, getDoc, writeBatch, getDocs, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Package, User, Phone, Home, Calendar as CalendarIcon, Edit, Check, Tag, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

const clothesData: Record<string, { name: string; price: number }[]> = {
    men: [ { name: 'Shirt', price: 15 }, { name: 'T-Shirt', price: 10 }, { name: 'Trousers', price: 20 }, { name: 'Jeans', price: 20 }, { name: 'Kurta', price: 25 }, { name: 'Pyjama', price: 15 } ],
    women: [ { name: 'Top', price: 15 }, { name: 'Saree', price: 50 }, { name: 'Blouse', price: 10 }, { name: 'Kurti', price: 20 }, { name: 'Dress', price: 30 }, { name: 'Leggings', price: 10 } ],
    kids: [ { name: 'Shirt', price: 8 }, { name: 'Frock', price: 15 }, { name: 'Shorts', price: 7 }, { name: 'Pants', price: 10 } ],
};

function PriceManagementCard() {
    const { toast } = useToast();
    const [prices, setPrices] = useState<Record<string, IroningOrderItem[]>>(Object.keys(clothesData).reduce((acc, key) => ({...acc, [key]: []}), {}));
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchPrices = async () => {
            if (!db) return;
            setIsLoading(true);
            try {
                const clothesRef = collection(db, 'clothes');
                const snapshot = await getDocs(clothesRef);

                if (snapshot.empty) {
                    const batch = writeBatch(db);
                    Object.entries(clothesData).forEach(([category, items]) => {
                        const docRef = doc(db, 'clothes', category);
                        batch.set(docRef, { items });
                    });
                    await batch.commit();
                    setPrices(clothesData);
                    toast({ title: "Price list initialized", description: "Default prices have been set." });
                } else {
                    const fetchedPrices: Record<string, IroningOrderItem[]> = {};
                    snapshot.forEach(doc => {
                        fetchedPrices[doc.id] = doc.data().items;
                    });
                    setPrices(fetchedPrices);
                }
            } catch (error) {
                console.error("Error fetching prices:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch price list.' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchPrices();
    }, [toast]);
    
    const handlePriceChange = (category: string, index: number, newPrice: number) => {
        setPrices(prev => {
            const updatedItems = [...prev[category]];
            updatedItems[index] = { ...updatedItems[index], price: newPrice };
            return { ...prev, [category]: updatedItems };
        });
    };

    const handleSavePrices = async () => {
        if (!db) return;
        setIsSaving(true);
        try {
            const batch = writeBatch(db);
            Object.entries(prices).forEach(([category, items]) => {
                const docRef = doc(db, 'clothes', category);
                batch.update(docRef, { items });
            });
            await batch.commit();
            toast({ title: "Prices Updated", description: "The master price list has been saved." });
        } catch (error) {
            console.error("Error saving prices:", error);
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not update prices.' });
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return <Card><CardHeader><CardTitle>Loading Price List...</CardTitle></CardHeader><CardContent><Loader2 className="animate-spin" /></CardContent></Card>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Tag className="text-primary"/> Manage Pricing</CardTitle>
                <CardDescription>Set the default price for each item. This will apply to all new orders.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="multiple" className="w-full" defaultValue={['men', 'women', 'kids']}>
                    {Object.entries(prices).map(([category, items]) => (
                        <AccordionItem value={category} key={category}>
                            <AccordionTrigger className="text-lg font-semibold capitalize">{category}</AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-2 pt-2">
                                    {items.map((item, index) => (
                                        <div key={item.name} className="flex justify-between items-center text-sm p-2 rounded-lg bg-secondary/30">
                                            <p>{item.name}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground">₹</span>
                                                <Input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={e => handlePriceChange(category, index, Number(e.target.value))}
                                                    className="h-8 w-20"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSavePrices} disabled={isSaving} className="w-full">
                    {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2" />}
                    Save All Prices
                </Button>
            </CardFooter>
        </Card>
    )
}

function OrderItemEditor({ item, onPriceChange }: { item: IroningOrderItem, onPriceChange: (newPrice: number) => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const [price, setPrice] = useState(item.price);

    const handleSave = () => {
        onPriceChange(price);
        setIsEditing(false);
    };

    return (
        <div className="flex justify-between items-center text-sm py-1">
            <p>{item.quantity} x {item.name}</p>
            <div className="flex items-center gap-2">
                {isEditing ? (
                    <>
                        <Input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="h-8 w-20" />
                        <Button size="icon" className="h-8 w-8" onClick={handleSave}><Check className="h-4 w-4" /></Button>
                    </>
                ) : (
                    <>
                        <p>₹{item.price}</p>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4" /></Button>
                    </>
                )}
            </div>
        </div>
    );
}


function OrderCard({ order }: { order: IroningOrder }) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusChange = async (newStatus: IroningOrderStatus) => {
        if (!user || !db) return;
        setIsUpdating(true);
        try {
            const orderRef = doc(db, 'ironingOrders', order.id);
            await updateDoc(orderRef, {
                status: newStatus,
                statusHistory: arrayUnion({
                    status: newStatus,
                    timestamp: serverTimestamp(),
                    updatedBy: user.uid,
                }),
            });
            toast({ title: 'Status Updated', description: `Order #${order.orderId} is now ${newStatus}.` });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Update Failed' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDateChange = async (date: Date | undefined) => {
        if (!date || !user || !db) return;
        setIsUpdating(true);
        try {
            const orderRef = doc(db, 'ironingOrders', order.id);
            await updateDoc(orderRef, { estimatedDelivery: Timestamp.fromDate(date) });
            toast({ title: 'Delivery Date Set' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Update Failed' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleItemPriceChange = async (itemIndex: number, newPrice: number) => {
        if (!user || !db) return;
        const updatedItems = [...order.items];
        updatedItems[itemIndex].price = newPrice;
        
        const newTotalCost = updatedItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
        
        try {
            const orderRef = doc(db, 'ironingOrders', order.id);
            await updateDoc(orderRef, { items: updatedItems, totalCost: newTotalCost });
            toast({ title: 'Price Updated' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Update Failed' });
        }
    }

    const nextStatusMap: Record<IroningOrderStatus, IroningOrderStatus | null> = {
        placed: 'picked-up',
        'picked-up': 'processing',
        processing: 'out-for-delivery',
        'out-for-delivery': 'completed',
        completed: null,
        cancelled: null,
    };
    
    const nextStatus = nextStatusMap[order.status];
    
    const placedAtDate = order.placedAt instanceof Timestamp ? order.placedAt.toDate() : new Date(order.placedAt as string);
    const deliveryDate = order.estimatedDelivery instanceof Timestamp ? order.estimatedDelivery.toDate() : order.estimatedDelivery ? new Date(order.estimatedDelivery as string) : undefined;


    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Order #{order.orderId}</CardTitle>
                        <CardDescription>{format(placedAtDate, 'PPP p')}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="capitalize">{order.status}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 rounded-lg border bg-secondary/30 space-y-2">
                    <div className="flex items-center gap-2"><User className="w-4 h-4 text-primary" /> <span>{order.userName}</span></div>
                    <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> <span>{order.userPhone}</span></div>
                    <div className="flex items-center gap-2"><Home className="w-4 h-4 text-primary" /> <span>{`${order.address.flatNo}, ${order.address.block}, ${order.address.apartmentName}`}</span></div>
                </div>
                <Separator />
                <div>
                    <h4 className="font-semibold mb-2">Items ({order.totalItems})</h4>
                    <div className="space-y-1">
                        {order.items.map((item, index) => (
                           <OrderItemEditor key={index} item={item} onPriceChange={(newPrice) => handleItemPriceChange(index, newPrice)} />
                        ))}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex-col sm:flex-row gap-2">
                {order.status !== 'cancelled' && (
                    <>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {deliveryDate ? format(deliveryDate, 'PPP') : 'Set Delivery Date'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={deliveryDate} onSelect={handleDateChange} initialFocus />
                            </PopoverContent>
                        </Popover>

                        {nextStatus ? (
                             <Button onClick={() => handleStatusChange(nextStatus)} disabled={isUpdating} className="w-full">
                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Mark as {nextStatus.replace('-', ' ')}
                            </Button>
                        ) : order.status !== 'completed' && (
                            <Button variant="destructive" onClick={() => handleStatusChange('cancelled')} disabled={isUpdating} className="w-full">
                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel Order
                            </Button>
                        )}
                    </>
                )}
            </CardFooter>
        </Card>
    );
}

const statusFilters: {label: string, value: IroningOrderStatus[]}[] = [
    { label: 'New', value: ['placed'] },
    { label: 'In Progress', value: ['picked-up', 'processing', 'out-for-delivery']},
    { label: 'Completed', value: ['completed'] },
    { label: 'Cancelled', value: ['cancelled'] },
];

export function IroningDashboardClient() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<IroningOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('New');

     useEffect(() => {
        if (!authLoading && !user) {
            router.push('/ironing');
            return;
        }

        const fetchUserProfile = async () => {
            if (user && db) {
                const userDocRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists() && docSnap.data().role !== 'service-provider') {
                   router.push('/ironing'); // Redirect non-service providers
                }
            }
        };

        if(!authLoading && user) {
            fetchUserProfile();
        }
    }, [user, authLoading, router]);


    useEffect(() => {
        if (!db) return;
        
        const q = query(collection(db, "ironingOrders"), orderBy("placedAt", "desc"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as IroningOrder));
            setOrders(fetchedOrders);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching orders:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredOrders = useMemo(() => {
        const selectedStatus = statusFilters.find(f => f.label === activeFilter)?.value;
        if (!selectedStatus) return orders;
        return orders.filter(order => selectedStatus.includes(order.status));
    }, [orders, activeFilter]);

    if (isLoading || authLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Service Provider Dashboard</h1>
            <p className="text-muted-foreground mb-8">Manage pricing and all incoming ironing orders.</p>

            <Tabs defaultValue="orders" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="orders">Live Orders</TabsTrigger>
                    <TabsTrigger value="pricing">Manage Pricing</TabsTrigger>
                </TabsList>
                <TabsContent value="orders" className="mt-6">
                    <div className="flex flex-wrap gap-2 mb-6">
                        {statusFilters.map(filter => (
                             <Button 
                                key={filter.label}
                                variant={activeFilter === filter.label ? 'default' : 'outline'}
                                onClick={() => setActiveFilter(filter.label)}
                            >
                                {filter.label}
                            </Button>
                        ))}
                    </div>
                     <div className="space-y-6">
                        {filteredOrders.length > 0 ? (
                            filteredOrders.map(order => <OrderCard key={order.id} order={order} />)
                        ) : (
                            <Card>
                                <CardHeader className="text-center">
                                    <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <CardTitle>No Orders Found</CardTitle>
                                    <CardDescription>There are no orders with the status "{activeFilter}".</CardDescription>
                                </CardHeader>
                            </Card>
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="pricing" className="mt-6">
                    <PriceManagementCard />
                </TabsContent>
            </Tabs>
        </div>
    );
}
