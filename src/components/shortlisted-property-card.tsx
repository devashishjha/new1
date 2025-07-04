
'use client';
import type { Property } from '@/lib/types';
import { Card, CardFooter, CardHeader } from '@/components/ui/card';
import Image from 'next/image';
import { formatIndianCurrency } from '@/lib/utils';
import { Eye, Heart, Info, Pencil, CheckCircle2 } from 'lucide-react';
import { PropertyDetailsSheet } from './property-details-sheet';
import { useState } from 'react';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { markPropertyAsOccupiedAction } from '@/app/actions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';


export function ShortlistedPropertyCard({ property }: { property: Property }) {
    const { user } = useAuth();
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const isLister = user?.uid === property.lister.id;
    const isOccupied = property.isSoldOrRented;

    const priceDisplay = property.price.type === 'rent'
        ? `₹ ${property.price.amount.toLocaleString('en-IN')}/mo`
        : formatIndianCurrency(property.price.amount);
        
    const handleMarkAsOccupied = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent dropdown from closing immediately
        const result = await markPropertyAsOccupiedAction(property.id);
        if (result.success) {
            toast({ title: "Property Status Updated", description: result.message });
            router.refresh();
        } else {
            toast({ variant: 'destructive', title: "Update Failed", description: result.message });
        }
    };
        
    return (
        <>
            <Card className="overflow-hidden flex flex-col bg-card/80 backdrop-blur-sm border-border/20 h-full hover:ring-2 hover:ring-primary transition-all">
                <CardHeader className="p-0 relative overflow-hidden">
                    {property.video ? (
                        <div className="w-full h-48 rotate-180">
                            <video
                                src={`${property.video}#t=0.1`} // Fetch first frame for thumbnail
                                className="w-full h-full object-cover bg-black"
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
                            height={300}
                            className="w-full h-48 object-cover"
                            data-ai-hint="apartment exterior"
                        />
                    )}
                    {isOccupied && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                            <div className="bg-destructive text-destructive-foreground px-3 py-1 rounded-md text-sm font-bold">
                                {property.price.type === 'rent' ? 'Rented Out' : 'Sold Out'}
                            </div>
                        </div>
                    )}
                </CardHeader>

                <CardFooter className="p-3 bg-secondary/50 flex justify-between items-center mt-auto">
                    <div>
                        <p className="text-lg font-bold text-primary">{priceDisplay}</p>
                        <p className="text-xs text-muted-foreground capitalize -mt-1">For {property.price.type}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Eye className="w-4 h-4" />
                            <span className="text-xs">{property.videoViews?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Heart className="w-4 h-4" />
                            <span className="text-xs">{property.shortlistCount?.toLocaleString() || '0'}</span>
                        </div>
                        
                        {isLister ? (
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="icon" variant="outline" className="w-8 h-8">
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Options</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
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
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={handleMarkAsOccupied} className="text-amber-500 focus:text-amber-600">
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                Mark as Occupied
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button size="icon" variant="outline" className="w-8 h-8" onClick={() => setIsDetailsOpen(true)}>
                                <Info className="h-4 w-4" />
                                <span className="sr-only">View Details</span>
                            </Button>
                        )}
                    </div>
                </CardFooter>
            </Card>
            <PropertyDetailsSheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen} property={property} />
        </>
    );
}

    
