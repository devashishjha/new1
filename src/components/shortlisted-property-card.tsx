
'use client';
import type { Property } from '@/lib/types';
import { Card, CardFooter, CardHeader } from '@/components/ui/card';
import Image from 'next/image';
import { formatIndianCurrency } from '@/lib/utils';
import { Eye, Heart, Info } from 'lucide-react';
import { PropertyDetailsSheet } from './property-details-sheet';
import { useState } from 'react';
import { Button } from './ui/button';

export function ShortlistedPropertyCard({ property }: { property: Property }) {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const isOccupied = property.isSoldOrRented;

    const priceDisplay = property.price.type === 'rent'
        ? `₹ ${property.price.amount.toLocaleString('en-IN')}/mo`
        : formatIndianCurrency(property.price.amount);
        
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

                <CardFooter className="p-3 bg-secondary/50 flex justify-between items-center mt-auto">
                    <span className="text-lg font-bold text-primary">{priceDisplay}</span>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Eye className="w-4 h-4" />
                            <span>{property.videoViews?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Heart className="w-4 h-4" />
                            <span>{property.shortlistCount?.toLocaleString() || '0'}</span>
                        </div>
                        <Button size="icon" variant="outline" className="w-8 h-8" onClick={() => setIsDetailsOpen(true)}>
                            <Info className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                        </Button>
                    </div>
                </CardFooter>
            </Card>
            <PropertyDetailsSheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen} property={property} />
        </>
    );
}
