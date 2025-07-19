'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { IroningOrder, IroningProfile } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Phone, Home, Shirt } from 'lucide-react';
import { dateToJSON, formatIndianCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

export function IroningProfileClient() {
    const { user, loading: authLoading } = useAuth();
    const [profile, setProfile] = useState<IroningProfile | null>(null);
    const [orders, setOrders] = useState<IroningOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log("IroningProfileClient useEffect: authLoading=", authLoading, "user=", user ? user.uid : "null");
        if (authLoading) return;
        if (!user) {
            setIsLoading(false);
            console.log("IroningProfileClient: No user found, stopping fetch.");
            return;
        }

        const fetchData = async () => {
            if (!db) {
                console.error("IroningProfileClient: Firebase Firestore (db) is not initialized.");
                return;
            };
            setIsLoading(true);
            console.log("IroningProfileClient: Attempting to fetch ironing profile and orders.");
            
            try {
                // Fetch Profile
                const profileDocRef = doc(db, 'ironingProfiles', user.uid);
                console.log("IroningProfileClient: Fetching ironing profile for user ID:", user.uid);
                const profileSnap = await getDoc(profileDocRef);
                if (profileSnap.exists()) {
                    setProfile(profileSnap.data() as IroningProfile);
                    console.log("IroningProfileClient: Ironing profile fetched.", profileSnap.data());
                } else {
                    console.warn("IroningProfileClient: Ironing profile not found for user ID:", user.uid);
                }
                
                // Fetch Orders
                console.log("IroningProfileClient: Fetching ironing orders for user ID:", user.uid);
                const ordersQuery = query(
                    collection(db, 'ironingOrders'), 
                    where("userId", "==", user.uid),
                    orderBy("placedAt", "desc")
                );
                const ordersSnap = await getDocs(ordersQuery);
                const fetchedOrders = ordersSnap.docs.map(d => dateToJSON({ id: d.id, ...d.data() }) as IroningOrder);
                setOrders(fetchedOrders);
                console.log("IroningProfileClient: Ironing orders fetched:", fetchedOrders.length);
            } catch (error) {
                console.error("IroningProfileClient: Error fetching data:", error);
            }
            setIsLoading(false);
            console.log("IroningProfileClient: Finished fetching data. isLoading set to false.");
        };
        fetchData();
    }, [user, authLoading]);

    if (isLoading || authLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    if (!user) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Please Log In</CardTitle>
                    <CardDescription>You need to be logged in to view your profile.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Order History</CardTitle>
                </CardHeader>
                <CardContent>
                    {orders.length > 0 ? (
                        <div className="space-y-6">
                            {orders.map(order => (
                                <div key={order.id} className="p-4 rounded-lg border">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <p className="font-semibold text-lg">{formatIndianCurrency(order.totalCost)}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(order.placedAt as string), 'PPP')}
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className="capitalize">{order.status}</Badge>
                                    </div>
                                    <Separator />
                                    <div className="mt-4 space-y-2">
                                        {order.items.map((item, index) => (
                                           <div key={index} className="flex justify-between items-center text-sm">
                                               <p>{item.quantity} x {item.name}</p>
                                               <p>{formatIndianCurrency(item.quantity * item.price)}</p>
                                           </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 border border-dashed rounded-lg">
                            <Shirt className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="text-lg font-semibold mt-4">No Orders Yet</h3>
                            <p className="text-muted-foreground mt-2">You haven't placed any ironing orders.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
