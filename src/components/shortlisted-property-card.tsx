
'use client';
import type { Property } from '@/lib/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { formatIndianCurrency } from '@/lib/utils';
import { Info, Pencil, CheckCircle2, Trash2, Loader2, PlayCircle, PauseCircle, MoreVertical, MapPin } from 'lucide-react';
import { PropertyDetailsSheet } from './property-details-sheet';
import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { updatePropertyStatusAction, deletePropertyAction } from '@/app/actions';
import { Badge } from './ui/badge';


export function ShortlistedPropertyCard({ property, onDelete }: { property: Property, onDelete?: (propertyId: string) => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    
    const isLister = user?.uid === property.lister.id;
    const currentStatus = property.status;

    const priceDisplay = property.price.type === 'rent'
        ? `₹ ${property.price.amount.toLocaleString('en-IN')}/mo`
        : formatIndianCurrency(property.price.amount);
        
    const handleStatusChange = async (newStatus: 'available' | 'occupied' | 'on-hold') => {
        setIsUpdating(true);
        const result = await updatePropertyStatusAction(property.id, newStatus);
        if (result.success) {
            toast({ title: "Status Updated", description: result.message });
            router.refresh();
        } else {
            toast({ variant: 'destructive', title: "Update Failed", description: result.message });
        }
        setIsUpdating(false);
    };
        
    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        const result = await deletePropertyAction(property.id);
        if (result.success) {
            toast({ title: "Property Deleted", description: result.message });
            if (onDelete) {
                onDelete(property.id);
            }
        } else {
            toast({ variant: 'destructive', title: "Deletion Failed", description: result.message });
        }
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
    };

    const StatusBadge = () => {
        if (currentStatus === 'occupied') {
             return <Badge variant="destructive" className="absolute top-2 left-2 z-20">{property.price.type === 'rent' ? 'Rented Out' : 'Sold Out'}</Badge>;
        }
        if (currentStatus === 'on-hold') {
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
            <Card 
                className="overflow-hidden flex flex-col bg-transparent border-border/20 hover:ring-2 hover:ring-primary transition-all duration-300 group"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className="aspect-[4/5] w-full relative overflow-hidden bg-black">
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
                </div>
                
                <div className="relative">
                    <div className="absolute inset-0 z-0">
                        <Image
                            src={property.image}
                            alt=""
                            fill
                            sizes="50vw"
                            className="object-cover w-full h-full filter blur-xl scale-125"
                            aria-hidden="true"
                        />
                         <div className="absolute inset-0 bg-black/70" aria-hidden="true" />
                    </div>
                    <div className="relative z-10 flex flex-col flex-grow text-white">
                        <CardContent className="p-4 flex-grow space-y-2">
                            <div>
                                <p className="text-xs text-white/70 capitalize">For {property.price.type}</p>
                                <p className="text-xl font-bold text-primary -mt-1">{priceDisplay}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-white leading-tight truncate" title={property.title}>{property.title}</p>
                                <p className="text-xs text-white/70 truncate flex items-center gap-1.5" title={property.location}>
                                    <MapPin className='w-3 h-3' /> 
                                    {property.location}
                                </p>
                            </div>
                        </CardContent>

                        <CardFooter className="p-3 bg-transparent border-t border-white/20">
                             <div className="w-full flex justify-between items-center">
                                <Button variant="outline" size="sm" onClick={() => setIsDetailsOpen(true)} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                                    <Info className="mr-2 h-4 w-4" />
                                    Details
                                </Button>
                                {isLister ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" disabled={isUpdating} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                <MoreVertical className="mr-2 h-4 w-4" />
                                                Manage
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            <DropdownMenuItem onClick={() => handleStatusChange('available')} disabled={isUpdating || currentStatus === 'available'}>
                                                <PlayCircle className="mr-2 h-4 w-4" /> Make Live
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleStatusChange('occupied')} disabled={isUpdating || currentStatus === 'occupied'}>
                                                <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Occupied
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleStatusChange('on-hold')} disabled={isUpdating || currentStatus === 'on-hold'}>
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
                                ) : null}
                            </div>
                        </CardFooter>
                    </div>
                </div>
            </Card>
            <PropertyDetailsSheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen} property={property} />
        </>
    );
}
