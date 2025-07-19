
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { IroningOrder, IroningOrderItem, IroningOrderStatus, UserProfile } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, serverTimestamp, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Package, User, Phone, Home, Calendar as CalendarIcon, Edit, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

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
            await updateDoc(orderRef, { estimatedDelivery: date });
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
    };
    
    const nextStatus = nextStatusMap[order.status];

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Order #{order.orderId}</CardTitle>
                        <CardDescription>{format(new Date(order.placedAt as string), 'PPP p')}</CardDescription>
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
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {order.estimatedDelivery ? format(new Date(order.estimatedDelivery as string), 'PPP') : 'Set Delivery Date'}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={order.estimatedDelivery ? new Date(order.estimatedDelivery as string) : undefined} onSelect={handleDateChange} initialFocus />
                    </PopoverContent>
                </Popover>

                {nextStatus && (
                     <Button onClick={() => handleStatusChange(nextStatus)} disabled={isUpdating} className="w-full">
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Mark as {nextStatus.replace('-', ' ')}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

export function IroningDashboardClient() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<IroningOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

     useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
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

    if (isLoading || authLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Order Dashboard</h1>
            <p className="text-muted-foreground mb-8">Manage all incoming ironing orders.</p>

            <div className="space-y-6">
                {orders.length > 0 ? (
                    orders.map(order => <OrderCard key={order.id} order={order} />)
                ) : (
                    <Card>
                        <CardHeader className="text-center">
                            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                            <CardTitle>No Orders Yet</CardTitle>
                            <CardDescription>As new orders are placed, they will appear here.</CardDescription>
                        </CardHeader>
                    </Card>
                )}
            </div>
        </div>
    );
}
