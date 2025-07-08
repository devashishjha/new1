
'use client';
import type { Property } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { formatIndianCurrency } from '@/lib/utils';
import { Info, Pencil, CheckCircle2, Trash2, Loader2, PlayCircle, PauseCircle, MoreVertical, MapPin, AlertCircle } from 'lucide-react';
import { PropertyDetailsSheet } from './property-details-sheet';
import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from './ui/badge';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';


export function ShortlistedPropertyCard({ property, onDelete, onUpdate }: { 
    property: Property, 
    onDelete?: (propertyId: string) => void,
    onUpdate?: (property: Property) => void 
}) {
    const { user } = useAuth();
    const { toast } = useToast();

    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    
    const isLister = user?.uid === property.lister.id;

    const priceDisplay = property.price.type === 'rent'
        ? `₹ ${property.price.amount.toLocaleString('en-IN')}/mo`
        : formatIndianCurrency(property.price.amount);
        
    const handleStatusChange = async (newStatus: 'available' | 'occupied' | 'on-hold') => {
        if (!user) {
            toast({ variant: 'destructive', title: "Update Failed", description: "You must be logged in to perform this action." });
            return;
        }
        if (!db) {
            toast({ variant: 'destructive', title: "Update Failed", description: "Database service not available." });
            return;
        }

        setIsUpdating(true);
        const propertyDocRef = doc(db, 'properties', property.id);

        try {
            const docSnap = await getDoc(propertyDocRef);
            if (!docSnap.exists() || docSnap.data().lister.id !== user.uid) {
                toast({ variant: 'destructive', title: "Update Failed", description: "You are not authorized to update this property." });
                setIsUpdating(false);
                return;
            }

            await updateDoc(propertyDocRef, { status: newStatus });
            toast({ title: "Status Updated", description: `Property status updated to ${newStatus}.` });
            
            if (onUpdate) {
                onUpdate({ ...property, status: newStatus });
            }

        } catch (error) {
            console.error("Error updating property status:", error);
            toast({ variant: 'destructive', title: "Update Failed", description: 'An unexpected error occurred while updating the property status.' });
        } finally {
            setIsUpdating(false);
        }
    };
        
    const handleDeleteConfirm = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: "Deletion Failed", description: "You must be logged in to perform this action." });
            return;
        }
        if (!db || !storage) {
            toast({ variant: 'destructive', title: "Deletion Failed", description: 'Database/Storage service not available.' });
            return;
        }

        setIsDeleting(true);
        const propertyDocRef = doc(db, 'properties', property.id);

        try {
            const propertyDoc = await getDoc(propertyDocRef);
            if (propertyDoc.exists()) {
                if (user.uid !== propertyDoc.data().lister.id) {
                    toast({ variant: 'destructive', title: "Deletion Failed", description: 'You are not authorized to delete this property.' });
                    setIsDeleting(false);
                    return;
                }
                const propertyData = propertyDoc.data();
                if (propertyData.video) {
                    try {
                        const videoFileRef = ref(storage, propertyData.video);
                        await deleteObject(videoFileRef);
                    } catch (storageError: any) {
                        if (storageError.code !== 'storage/object-not-found') {
                            console.warn(`Could not delete video from storage: ${storageError.code}`);
                        }
                    }
                }
            } else {
                toast({ variant: 'destructive', title: "Deletion Failed", description: 'Property not found.' });
                setIsDeleting(false);
                return;
            }
            
            await deleteDoc(propertyDocRef);
            toast({ title: "Property Deleted", description: 'Property successfully deleted.' });
            if (onDelete) {
                onDelete(property.id);
            }
        } catch (error) {
            console.error("Error deleting property:", error);
            toast({ variant: 'destructive', title: "Deletion Failed", description: 'An unexpected error occurred while deleting the property.' });
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    const StatusBadge = () => {
        if (property.status === 'available') {
            return <Badge variant="default" className="absolute top-2 left-2 z-20 bg-green-600 text-white"><PlayCircle className="w-4 h-4 mr-1" />Live</Badge>;
        }
        if (property.status === 'pending-review') {
             return <Badge variant="default" className="absolute top-2 left-2 z-20 bg-yellow-500 text-black"><AlertCircle className="w-4 h-4 mr-1" />Pending Review</Badge>;
        }
        if (property.status === 'occupied') {
             return <Badge variant="destructive" className="absolute top-2 left-2 z-20">{property.price.type === 'rent' ? 'Rented Out' : 'Sold Out'}</Badge>;
        }
        if (property.status === 'on-hold') {
            return <Badge variant="secondary" className="absolute top-2 left-2 z-20 bg-accent text-accent-foreground">On Hold</Badge>;
        }
        return null;
    }

    const handleMouseEnter = () => {
        if (videoRef.current) {
            videoRef.current.play().catch(error => console.log("Video play interrupted by user."));
        }
    };

    const handleMouseLeave = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    };


    return (
        <>
            <Card className="overflow-hidden group relative">
                <div 
                    className="aspect-square w-full relative overflow-hidden rounded-t-lg"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <StatusBadge />
                    {property.video ? (
                         <video
                            ref={videoRef}
                            src={`${property.video}#t=0.1`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            preload="metadata"
                            muted
                            loop
                            playsInline
                        />
                    ) : (
                        <Image
                            src={property.image}
                            alt={property.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            data-ai-hint="apartment exterior"
                        />
                    )}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
                </div>
                
                <CardContent className="p-4 bg-black/30">
                    <div className="space-y-2">
                         <div>
                            <p className="text-sm capitalize text-white/70">For {property.price.type}</p>
                            <p className="text-xl font-bold text-primary -mt-0.5">{priceDisplay}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold leading-tight truncate text-white" title={property.title}>
                                {property.title}
                            </h3>
                            <p className="text-sm text-white/80 truncate flex items-center gap-1.5" title={property.location}>
                                <MapPin className='w-4 h-4' /> 
                                {property.location}
                            </p>
                        </div>
                    </div>

                     <div className="w-full flex justify-between items-center pt-4 mt-4 border-t border-white/20">
                        <Button variant="outline" size="sm" onClick={() => setIsDetailsOpen(true)} className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
                            <Info className="mr-2 h-4 w-4" />
                            Details
                        </Button>
                        {isLister && (
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" disabled={isUpdating} className="h-8 w-8 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
                                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                                        <span className="sr-only">Manage Property</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuItem onClick={() => handleStatusChange('available')} disabled={isUpdating || property.status === 'available' || property.status === 'pending-review'}>
                                        <PlayCircle className="mr-2 h-4 w-4" /> Make Live
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange('occupied')} disabled={isUpdating || property.status === 'occupied'}>
                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Occupied
                                    </DropdownMenuItem>
                                     <DropdownMenuItem onClick={() => handleStatusChange('on-hold')} disabled={isUpdating || property.status === 'on-hold'}>
                                        <PauseCircle className="mr-2 h-4 w-4" /> Put on Hold
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href={`/edit-property/${property.id}`}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit Property
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem
                                                onSelect={(e) => e.preventDefault()}
                                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete Property
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete your property listing.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                                                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </CardContent>
            </Card>
            <PropertyDetailsSheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen} property={property} />
        </>
    );
}
