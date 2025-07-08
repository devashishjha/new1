
'use client';
import type { Property } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import Image from 'next/image';
import { formatIndianCurrency } from '@/lib/utils';
import { Eye, Heart, Info, Pencil, CheckCircle2, Trash2, Loader2, PlayCircle, PauseCircle, Check, MoreVertical, MapPin, Building, Home } from 'lucide-react';
import { PropertyDetailsSheet } from './property-details-sheet';
import { useState } from 'react';
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
             return <Badge variant="destructive" className="absolute top-2 left-2 z-10">{property.price.type === 'rent' ? 'Rented Out' : 'Sold Out'}</Badge>;
        }
        if (currentStatus === 'on-hold') {
            return <Badge variant="secondary" className="absolute top-2 left-2 z-10 bg-accent text-accent-foreground">On Hold</Badge>;
        }
        return null;
    }

    return (
        <>
            <Card className="overflow-hidden flex flex-col bg-card/80 backdrop-blur-sm border-border/20 h-full hover:ring-2 hover:ring-primary transition-all">
                <CardHeader className="p-0 relative group overflow-hidden">
                    <StatusBadge />
                    <div className='aspect-[4/5] w-full bg-black'>
                        {property.video ? (
                             <video
                                src={`${property.video}#t=0.1`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                preload="metadata"
                                muted
                                playsInline
                            />
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
                </CardHeader>
                
                <CardContent className="p-4 flex-grow flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground capitalize">For {property.price.type}</p>
                    <p className="text-xl font-bold text-primary -mt-1">{priceDisplay}</p>
                    <p className="text-sm font-semibold text-white leading-tight truncate" title={property.title}>{property.title}</p>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5" title={property.location}>
                        <MapPin className='w-3 h-3' /> 
                        {property.location}
                    </p>
                </CardContent>

                <CardFooter className="p-3 bg-secondary/20 mt-auto">
                    <div className="w-full">
                        {isLister ? (
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full" disabled={isUpdating}>
                                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <MoreVertical className="mr-2 h-4 w-4" />
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
                                    <DropdownMenuSeparator />
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
