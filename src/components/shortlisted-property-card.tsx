
import type { Property } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { formatIndianCurrency } from '@/lib/utils';
import { BedDouble, MapPin, Pencil, Video } from 'lucide-react';
import { PropertyDetailsSheet } from './property-details-sheet';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';
import Link from 'next/link';

export function ShortlistedPropertyCard({ property }: { property: Property }) {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const { user } = useAuth();
    const isOwner = user?.uid === property.lister.id;

    const priceDisplay = property.price.type === 'rent'
        ? `₹ ${property.price.amount.toLocaleString('en-IN')}/mo`
        : formatIndianCurrency(property.price.amount);
        
    return (
        <>
            <Card className="overflow-hidden flex flex-col bg-card/80 backdrop-blur-sm border-border/20 h-full hover:ring-2 hover:ring-primary transition-all">
                <button onClick={() => setIsDetailsOpen(true)} className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-primary rounded-t-lg">
                    <CardHeader className="p-0 relative">
                        {property.video ? (
                            <>
                                <video
                                    src={`${property.video}#t=0.1`} // Fetch first frame for thumbnail
                                    className="w-full h-48 object-cover bg-black"
                                    preload="metadata"
                                    muted
                                    playsInline
                                />
                                <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full backdrop-blur-sm">
                                    <Video className="w-5 h-5 text-white" />
                                </div>
                            </>
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
                    </CardHeader>
                    <CardContent className="p-4 flex-grow">
                        <CardTitle className="text-lg leading-tight mb-2 text-white">{property.title}</CardTitle>
                        <div 
                            className="flex items-center gap-2 text-sm text-muted-foreground mb-4"
                        >
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{property.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <BedDouble className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-white">{property.configuration.toUpperCase()}</span>
                        </div>
                    </CardContent>
                </button>
                <CardFooter className="p-4 bg-secondary/50 flex justify-between items-center mt-auto">
                    <span className="text-xl font-bold text-primary">{priceDisplay}</span>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">{property.propertyType}</Badge>
                        {isOwner && (
                             <Button asChild size="icon" variant="outline">
                                <Link href={`/edit-property/${property.id}`}>
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Edit Property</span>
                                </Link>
                            </Button>
                        )}
                    </div>
                </CardFooter>
            </Card>
            <PropertyDetailsSheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen} property={property} />
        </>
    );
}
