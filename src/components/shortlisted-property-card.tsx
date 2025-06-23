import type { Property } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { formatIndianCurrency } from '@/lib/utils';
import { BedDouble, MapPin } from 'lucide-react';
import Link from 'next/link';

export function ShortlistedPropertyCard({ property }: { property: Property }) {
    const priceDisplay = property.price.type === 'rent'
        ? `₹ ${property.price.amount.toLocaleString('en-IN')}/mo`
        : formatIndianCurrency(property.price.amount);

    return (
        <Link href={`/view-profile/${property.lister.id}`} className="block hover:ring-2 hover:ring-primary rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary">
            <Card className="overflow-hidden flex flex-col bg-card/80 backdrop-blur-sm border-border/20 h-full">
                <CardHeader className="p-0 relative">
                    <Image
                        src={property.image}
                        alt={property.title}
                        width={400}
                        height={300}
                        className="w-full h-48 object-cover"
                        data-ai-hint="apartment exterior"
                    />
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
                <CardFooter className="p-4 bg-secondary/50 flex justify-between items-center mt-auto">
                    <span className="text-xl font-bold text-primary">{priceDisplay}</span>
                    <Badge variant="secondary" className="capitalize">{property.propertyType}</Badge>
                </CardFooter>
            </Card>
        </Link>
    );
}
