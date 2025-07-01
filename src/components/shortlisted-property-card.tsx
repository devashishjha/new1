
'use client';
import type { Property } from '@/lib/types';
import { Card, CardFooter, CardHeader } from '@/components/ui/card';
import Image from 'next/image';
import { formatIndianCurrency } from '@/lib/utils';
import { Pencil, Eye, Heart, Info, Check } from 'lucide-react';
import { PropertyDetailsSheet } from './property-details-sheet';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { markPropertyAsOccupiedAction } from '@/app/actions';

export function ShortlistedPropertyCard({ property }: { property: Property }) {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();
    const isOwner = user?.uid === property.lister.id;
    const [isOccupied, setIsOccupied] = useState(property.isSoldOrRented);

    const priceDisplay = property.price.type === 'rent'
        ? `₹ ${property.price.amount.toLocaleString('en-IN')}/mo`
        : formatIndianCurrency(property.price.amount);
        
    const handleMarkAsOccupied = async () => {
        const result = await markPropertyAsOccupiedAction(property.id);
        if (result.success) {
            toast({ title: "Property Updated", description: "The property has been marked as occupied." });
            setIsOccupied(true);
        } else {
            toast({ variant: 'destructive', title: "Update Failed", description: result.message });
        }
    };

    return (
        <>
            <Card className="overflow-hidden flex flex-col bg-card/80 backdrop-blur-sm border-border/20 h-full hover:ring-2 hover:ring-primary transition-all">
                <CardHeader className="p-0 relative">
                    {property.video ? (
                        <video
                            src={`${property.video}#t=0.1`} // Fetch first frame for thumbnail
                            className="w-full h-48 object-cover bg-black"
                            style={{ transform: 'none' }}
                            preload="metadata"
                            muted
                            playsInline
                        />
                    ) : (
                        <Image
                            src={property.image}
                            alt={property.title}
                            width={400}
                            height={300}
                            className="w-full h-48 object-cover"
                            data-ai-hint="apartment exterior"
                        />
                    )}
                    {isOccupied && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold animate-bounce">
                            {property.price.type === 'rent' ? 'Rented Out' : 'Sold Out'}
                        </div>
                    )}
                </CardHeader>

                <CardFooter className="p-3 bg-secondary/50 flex justify-between items-center mt-auto flex-wrap gap-2">
                    <div className='flex flex-col gap-2'>
                        <span className="text-lg font-bold text-primary">{priceDisplay}</span>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                <span>{property.videoViews?.toLocaleString() || '0'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                <span>{property.shortlistCount?.toLocaleString() || '0'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline" className="w-9 h-9" onClick={() => setIsDetailsOpen(true)}>
                            <Info className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                        </Button>
                        {isOwner && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="icon" variant="outline" className="w-9 h-9">
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Edit Property</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/edit-property/${property.id}`} className="flex items-center w-full">
                                            <Pencil className="mr-2 h-4 w-4" /> Edit Details
                                        </Link>
                                    </DropdownMenuItem>
                                    {!isOccupied && (
                                        <DropdownMenuItem onClick={handleMarkAsOccupied}>
                                            <Check className="mr-2 h-4 w-4" /> Mark as {property.price.type === 'rent' ? 'Rented Out' : 'Sold Out'}
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </CardFooter>
            </Card>
            <PropertyDetailsSheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen} property={property} />
        </>
    );
}
