
'use client';

import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import type { Property } from '@/lib/types';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { dateToJSON } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';

function AdminPropertyCard({ property }: { property: Property }) {
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAction = async (action: 'approve' | 'reject') => {
        setIsProcessing(true);
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
            setIsProcessing(false);
            return;
        }

        const propertyDocRef = doc(db, 'properties', property.id);

        try {
            if (action === 'approve') {
                await updateDoc(propertyDocRef, { status: 'available' });
                toast({ title: 'Approved', description: 'Property has been made live.' });
            } else { // reject
                const docSnap = await getDoc(propertyDocRef);
                if (docSnap.exists() && docSnap.data().video && storage) {
                     try {
                        const videoFileRef = ref(storage, docSnap.data().video);
                        await deleteObject(videoFileRef);
                    } catch (storageError: any) {
                        if (storageError.code !== 'storage/object-not-found') {
                            console.warn(`Could not delete video from storage: ${storageError.code}`);
                        }
                    }
                }
                await deleteDoc(propertyDocRef);
                toast({ title: 'Rejected', description: 'Property has been deleted.' });
            }
        } catch (error) {
            console.error(`Error ${action}ing property:`, error);
            toast({ variant: 'destructive', title: 'Error', description: `Could not ${action} property.` });
            setIsProcessing(false);
        }
        // The realtime listener will remove this component from the UI, so no need to set isProcessing to false.
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{property.title}</CardTitle>
                <CardDescription>{property.location}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {property.video && (
                    <video
                        src={property.video}
                        controls
                        muted
                        className="w-full rounded-md aspect-video bg-black rotate-180"
                    />
                )}
                <div className="flex items-center gap-2 pt-4 border-t">
                    <Avatar>
                        <AvatarImage src={property.lister.avatar} />
                        <AvatarFallback>{property.lister.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{property.lister.name}</p>
                         <Link href={`/view-profile/${property.lister.id}`} passHref>
                            <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground">{property.lister.id}</Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="destructive" onClick={() => handleAction('reject')} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="animate-spin" /> : <XCircle className="mr-2" />}
                    Reject
                </Button>
                <Button onClick={() => handleAction('approve')} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="animate-spin" /> : <CheckCircle className="mr-2" />}
                    Approve
                </Button>
            </CardFooter>
        </Card>
    )
}

export function AdminReviewClient() {
    const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!db) {
            setIsLoading(false);
            return;
        }
        
        const q = query(collection(db, "properties"), where("status", "==", "pending-review"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const properties = snapshot.docs.map(doc => dateToJSON({ id: doc.id, ...doc.data() })) as Property[];
            setPendingProperties(properties);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching pending properties:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch properties for review.' });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);
    
    return (
        <main className="container mx-auto py-24 px-4 pb-24">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold tracking-tight mb-2">Video Review Queue</h1>
                <p className="text-muted-foreground mb-8">Review and approve or reject new property video submissions. ({pendingProperties.length})</p>

                {isLoading ? (
                     <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                ) : pendingProperties.length > 0 ? (
                    <div className="space-y-6">
                        {pendingProperties.map(prop => (
                            <AdminPropertyCard 
                                key={prop.id} 
                                property={prop}
                            />
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-20 border border-dashed rounded-lg mt-10">
                        <h2 className="text-xl font-semibold">Queue is Empty</h2>
                        <p className="text-muted-foreground mt-2">There are no new videos to review at this time.</p>
                    </div>
                )}
            </div>
        </main>
    )
}

    