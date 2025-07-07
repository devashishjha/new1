
'use client';
import type { Property } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import Image from 'next/image';
import { formatIndianCurrency } from '@/lib/utils';
import { Eye, Heart, Info, Pencil, CheckCircle2, Trash2, Loader2 } from 'lucide-react';
import { PropertyDetailsSheet } from './property-details-sheet';
import { useState } from 'react';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';


export function ShortlistedPropertyCard({ property, onDelete }: { property: Property, onDelete?: (propertyId: string) => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const isLister = user?.uid === property.lister.id;
    const isOccupied = property.isSoldOrRented;

    const priceDisplay = property.price.type === 'rent'
        ? `₹ ${property.price.amount.toLocaleString('en-IN')}/mo`
        : formatIndianCurrency(property.price.amount);
        
    const handleMarkAsOccupied = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user || !db) return;
        
        setIsUpdating(true);
        const propertyDocRef = doc(db, 'properties', property.id);
        
        try {
            const propertyDoc = await getDoc(propertyDocRef);
            if (!propertyDoc.exists() || propertyDoc.data().lister.id !== user.uid) {
                toast({ variant: 'destructive', title: "Authorization Failed", description: "You do not have permission to modify this property." });
                setIsUpdating(false);
                return;
            }
            
            await updateDoc(propertyDocRef, { isSoldOrRented: true });
            toast({ title: "Property Status Updated", description: "The property has been marked as occupied." });
            router.refresh();
        } catch (error) {
            console.error("Error updating property status:", error);
            toast({ variant: 'destructive', title: "Update Failed", description: "An unexpected error occurred." });
        } finally {
            setIsUpdating(false);
        }
    };
        
    const handleDeleteConfirm = async () => {
        if (!user || !db || !storage) return;

        setIsDeleting(true);
        const propertyDocRef = doc(db, 'properties', property.id);
        
        try {
            const propertyDoc = await getDoc(propertyDocRef);
            if (!propertyDoc.exists() || propertyDoc.data().lister.id !== user.uid) {
                toast({ variant: 'destructive', title: "Authorization Failed", description: "You do not have permission to delete this property." });
                setIsDeleting(false);
                return;
            }

            const propertyData = propertyDoc.data();
            
            // Delete video from storage if it exists
            if (propertyData.video) {
                try {
                    const videoRef = ref(storage, propertyData.video);
                    await deleteObject(videoRef);
                } catch (storageError: any) {
                    if (storageError.code !== 'storage/object-not-found') {
                        console.warn(`Could not delete video from storage: ${storageError.code}`);
                    }
                }
            }
    
            await deleteDoc(propertyDocRef);
            toast({ title: "Property Deleted", description: "The property has been successfully deleted." });
            if (onDelete) {
                onDelete(property.id);
            }
            setIsDeleteDialogOpen(false);

        } catch (error) {
            console.error("Error deleting property:", error);
            toast({ variant: 'destructive', title: "Deletion Failed", description: "An unexpected error occurred." });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Card className="overflow-hidden flex flex-col bg-card/80 backdrop-blur-sm border-border/20 h-full hover:ring-2 hover:ring-primary transition-all">
                <CardHeader className="p-0 relative group overflow-hidden">
                    <div className='aspect-[4/5] w-full'>
                        {property.video ? (
                             <div className="w-full h-full bg-black">
                                <video
                                    src={`${property.video}#t=0.1`} // Fetch first frame for thumbnail
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    preload="metadata"
                                    muted
                                    playsInline
                                />
                            </div>
                        ) : (
                            <Image
                                src={property.image}
                                alt={property.title}
                                width={400}
                                height={500}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                data-ai-hint="apartment exterior"
                            />
                        )}
                    </div>
                    {isOccupied && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                            <div className="bg-destructive text-destructive-foreground px-3 py-1 rounded-md text-sm font-bold">
                                {property.price.type === 'rent' ? 'Rented Out' : 'Sold Out'}
                            </div>
                        </div>
                    )}
                </CardHeader>
                
                 <CardContent className="p-4 flex-grow flex flex-col">
                    <h3 className="font-bold text-lg leading-tight truncate" title={property.title}>{property.title}</h3>
                    <p className="text-sm text-muted-foreground truncate" title={property.location}>{property.location}</p>
                </CardContent>

                <CardFooter className="p-3 bg-secondary/20 flex flex-col items-start gap-3 mt-auto">
                   <div className="w-full flex justify-between items-center">
                        <div>
                            <p className="text-xs text-muted-foreground capitalize">For {property.price.type}</p>
                            <p className="text-lg font-bold text-primary -mt-1">{priceDisplay}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Eye className="w-4 h-4" />
                                <span className="text-xs">{property.videoViews?.toLocaleString() || '0'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Heart className="w-4 h-4" />
                                <span className="text-xs">{property.shortlistCount?.toLocaleString() || '0'}</span>
                            </div>
                        </div>
                   </div>

                    <div className="w-full">
                        {isLister ? (
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full" disabled={isUpdating}>
                                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Manage Listing
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuItem onClick={() => setIsDetailsOpen(true)}>
                                        <Info className="mr-2 h-4 w-4" />
                                        View Details
                                    </DropdownMenuItem>
                                     <DropdownMenuItem asChild>
                                        <Link href={`/edit-property/${property.id}`}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit Property
                                        </Link>
                                    </DropdownMenuItem>
                                    {!isOccupied && (
                                        <DropdownMenuItem onClick={handleMarkAsOccupied} disabled={isUpdating}>
                                            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                            Mark as Occupied
                                        </DropdownMenuItem>
                                    )}
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
                        ) : (
                            <Button variant="outline" className="w-full" onClick={() => setIsDetailsOpen(true)}>
                                <Info className="mr-2 h-4 w-4" />
                                View Details
                            </Button>
                        )}
                    </div>
                </CardFooter>
            </Card>
            <PropertyDetailsSheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen} property={property} />
        </>
    );
}
