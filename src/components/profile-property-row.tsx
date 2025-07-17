
'use client';
import type { Property } from '@/lib/types';
import Image from 'next/image';
import { formatIndianCurrency } from '@/lib/utils';
import { Info, Pencil, CheckCircle2, Trash2, Loader2, PlayCircle, PauseCircle, MoreVertical, MapPin, AlertCircle, BedDouble, AreaChart } from 'lucide-react';
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

export function ProfilePropertyRow({ property, onDelete, onUpdate }: { 
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
        if (!user || !isLister) return;
        if (!db) {
            toast({ variant: 'destructive', title: "Update Failed", description: "Database service not available." });
            return;
        }

        setIsUpdating(true);
        const propertyDocRef = doc(db, 'properties', property.id);

        try {
            await updateDoc(propertyDocRef, { status: newStatus });
            toast({ title: "Status Updated", description: `Property status updated to ${newStatus}.` });
            if (onUpdate) {
                onUpdate({ ...property, status: newStatus });
            }
        } catch (error) {
            console.error("Error updating property status:", error);
            toast({ variant: 'destructive', title: "Update Failed", description: 'An unexpected error occurred.' });
        } finally {
            setIsUpdating(false);
        }
    };
        
    const handleDeleteConfirm = async () => {
        if (!user || !isLister) return;
        if (!db || !storage) {
            toast({ variant: 'destructive', title: "Deletion Failed", description: 'Database/Storage service not available.' });
            return;
        }

        setIsDeleting(true);
        const propertyDocRef = doc(db, 'properties', property.id);

        try {
            const docSnap = await getDoc(propertyDocRef);
            if (docSnap.exists()) {
                const propertyData = docSnap.data();
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
            }
            
            await deleteDoc(propertyDocRef);
            toast({ title: "Property Deleted" });
            if (onDelete) onDelete(property.id);

        } catch (error) {
            console.error("Error deleting property:", error);
            toast({ variant: 'destructive', title: "Deletion Failed", description: 'An unexpected error occurred.' });
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    const StatusBadge = () => {
        if (property.status === 'available') {
            return <Badge variant="default" className="bg-green-600 text-white"><PlayCircle className="w-3 h-3 mr-1" />Live</Badge>;
        }
        if (property.status === 'pending-review') {
             return <Badge variant="default" className="bg-yellow-500 text-black"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>;
        }
        if (property.status === 'occupied') {
             return <Badge variant="destructive">{property.price.type === 'rent' ? 'Rented' : 'Sold'}</Badge>;
        }
        if (property.status === 'on-hold') {
            return <Badge variant="secondary" className="bg-accent text-accent-foreground">On Hold</Badge>;
        }
        return null;
    }

    const handleMouseEnter = () => {
        if (videoRef.current) {
            videoRef.current.play().catch(error => {});
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
            <div className="flex flex-col md:flex-row gap-4 border rounded-lg p-4 transition-colors hover:bg-secondary/50">
                <div 
                    className="w-full md:w-1/3 aspect-video md:aspect-square relative overflow-hidden rounded-md flex-shrink-0"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {property.video ? (
                         <div className="w-full h-full">
                             <video
                                ref={videoRef}
                                src={`${property.video}#t=0.1`}
                                className="w-full h-full object-cover"
                                preload="metadata"
                                muted
                                loop
                                playsInline
                            />
                        </div>
                    ) : (
                        <Image
                            src={property.image}
                            alt={property.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="w-full h-full object-cover"
                            data-ai-hint="apartment exterior"
                        />
                    )}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                </div>
                
                <div className="flex-grow flex flex-col">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-xl leading-tight text-card-foreground">{property.title}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5"><MapPin className='w-4 h-4' /> {property.location}</p>
                        </div>
                        <StatusBadge />
                    </div>

                    <div className="grid grid-cols-2 gap-4 my-4">
                        <div className="flex items-center gap-2 text-sm">
                            <BedDouble className="w-5 h-5 text-primary" />
                            <span>{property.configuration.toUpperCase()}</span>
                        </div>
                         <div className="flex items-center gap-2 text-sm">
                            <AreaChart className="w-5 h-5 text-primary" />
                            <span>{property.area.superBuiltUp} sqft</span>
                        </div>
                    </div>
                    
                    <div className="mt-auto flex justify-between items-center pt-4 border-t">
                        <div className="text-left">
                            <p className="text-sm capitalize text-muted-foreground">For {property.price.type}</p>
                            <p className="text-xl font-bold text-primary -mt-0.5">{priceDisplay}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsDetailsOpen(true)}>
                                <Info className="mr-2 h-4 w-4" />Details
                            </Button>
                            {isLister && (
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" disabled={isUpdating} className="h-8 w-8">
                                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                                            <span className="sr-only">Manage</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleStatusChange('available')} disabled={isUpdating || property.status === 'available' || property.status === 'pending-review'}>
                                            <PlayCircle className="mr-2 h-4 w-4" />Make Live
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange('occupied')} disabled={isUpdating || property.status === 'occupied'}>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />Mark as {property.price.type === 'rent' ? 'Rented' : 'Sold'}
                                        </DropdownMenuItem>
                                         <DropdownMenuItem onClick={() => handleStatusChange('on-hold')} disabled={isUpdating || property.status === 'on-hold'}>
                                            <PauseCircle className="mr-2 h-4 w-4" />Put on Hold
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href={`/edit-property/${property.id}`}><Pencil className="mr-2 h-4 w-4" />Edit</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" />Delete
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>This will permanently delete this property.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                                                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <PropertyDetailsSheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen} property={property} />
        </>
    );
}
