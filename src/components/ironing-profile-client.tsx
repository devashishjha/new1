
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { IroningOrder, IroningProfile, UserProfile } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Mail, Phone, Home, Shirt, User as UserIcon, LogOut } from 'lucide-react';
import { dateToJSON, formatIndianCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { useSearchParams } from 'next/navigation';
import { Button } from './ui/button';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export function IroningProfileClient() {
    const { user, loading: authLoading } = useAuth();
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view') || 'profile';
    const { toast } = useToast();

    const [profile, setProfile] = useState<IroningProfile | null>(null);
    const [orders, setOrders] = useState<IroningOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (authLoading || !user) {
            setIsLoading(false);
            return;
        }

        let unsubscribeFromOrders = () => {};

        const fetchData = async () => {
            if (!db) return;
            setIsLoading(true);
            
            try {
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                const userName = userDocSnap.exists() ? (userDocSnap.data() as UserProfile).name : user.displayName;

                const profileDocRef = doc(db, 'ironingProfiles', user.uid);
                const profileSnap = await getDoc(profileDocRef);
                if (profileSnap.exists()) {
                    setProfile({ name: userName, ...profileSnap.data() } as IroningProfile);
                } else {
                    setProfile({ name: userName, email: user.email });
                }
                
                const ordersQuery = query(
                    collection(db, 'ironingOrders'), 
                    where("userId", "==", user.uid),
                    orderBy("placedAt", "desc")
                );
                
                unsubscribeFromOrders = onSnapshot(ordersQuery, (snapshot) => {
                    const fetchedOrders = snapshot.docs.map(d => dateToJSON({ id: d.id, ...d.data() }) as IroningOrder);
                    setOrders(fetchedOrders);
                    setIsLoading(false);
                }, (error) => {
                    console.error("Error fetching real-time orders:", error);
                    setIsLoading(false);
                });

            } catch (error) {
                console.error("Error fetching initial data:", error);
                setIsLoading(false);
            }
        };

        fetchData();

        return () => unsubscribeFromOrders();
    }, [user, authLoading]);

    const handleLogout = async () => {
        if (!auth) { return; }
        await signOut(auth);
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
    };

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
                    <CardDescription>You need to be logged in to view this page.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <div className="w-full space-y-8">
            {currentView === 'profile' && (
                 <>
                    <h1 className="text-4xl font-bold tracking-tight mb-8">Your Profile</h1>
                    {profile ? (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Your Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <UserIcon className="w-5 h-5 text-primary" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Name</p>
                                            <p className="font-semibold">{profile.name || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Mail className="w-5 h-5 text-primary" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Email</p>
                                            <p className="font-semibold">{profile.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Phone className="w-5 h-5 text-primary" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Mobile Number</p>
                                            <p className="font-semibold">{profile.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                    {profile.address && (
                                        <div className="flex items-center gap-4 pt-4 border-t">
                                            <Home className="w-5 h-5 text-primary" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Saved Address</p>
                                                <p className="font-semibold">{`${profile.address.flatNo}, Floor ${profile.address.floorNo}, Block ${profile.address.block}, ${profile.address.apartmentName}`}</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                             <CardFooter>
                                <Button variant="destructive" className="w-full" onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" /> Log Out
                                </Button>
                            </CardFooter>
                        </div>
                    ) : (
                        <Card>
                            <CardHeader><CardTitle>No Profile Data</CardTitle></CardHeader>
                            <CardContent><p>We couldn't find your profile details.</p></CardContent>
                        </Card>
                    )}
                 </>
            )}
            
            {currentView === 'history' && (
                <>
                    <h1 className="text-4xl font-bold tracking-tight mb-8">Order History</h1>
                    <Card>
                        <CardContent className="pt-6">
                            {orders.length > 0 ? (
                                <div className="space-y-6">
                                    {orders.map(order => (
                                        <div key={order.id} className="p-4 rounded-lg border">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="font-semibold text-lg">{formatIndianCurrency(order.totalCost)}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {format(new Date(order.placedAt as string), 'PPP')}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground/80 font-mono mt-1">
                                                        Order ID: {order.orderId}
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
                </>
            )}
        </div>
    )
}
