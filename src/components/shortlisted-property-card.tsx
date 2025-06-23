import type { Property, PropertyMatchScoreOutput, SeekerProfile, UserProfile } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { formatIndianCurrency } from '@/lib/utils';
import { BedDouble, MapPin } from 'lucide-react';
import { PropertyDetailsSheet } from './property-details-sheet';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getPropertyMatchScore } from '@/app/actions';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';


export function ShortlistedPropertyCard({ property }: { property: Property }) {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    // Use `undefined` for loading state, `null` for error/no-score, and the object for success
    const [matchInfo, setMatchInfo] = useState<PropertyMatchScoreOutput | null | undefined>(undefined);
    const [isFetchingScore, setIsFetchingScore] = useState(false);
    const { user } = useAuth();

    const priceDisplay = property.price.type === 'rent'
        ? `₹ ${property.price.amount.toLocaleString('en-IN')}/mo`
        : formatIndianCurrency(property.price.amount);
        
    const handleOpenChange = async (open: boolean) => {
        setIsDetailsOpen(open);
        // Fetch score only when opening the sheet and if it hasn't been fetched yet.
        if (open && matchInfo === undefined && !isFetchingScore) {
            setIsFetchingScore(true);
            try {
                // Default criteria for logged-out users or non-seekers.
                let searchCriteria = "A great property with good amenities in a nice neighborhood.";
                if (user) {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data() as UserProfile;
                        if (userData.type === 'seeker' && (userData as SeekerProfile).searchCriteria) {
                            searchCriteria = (userData as SeekerProfile).searchCriteria;
                        }
                    }
                }
                
                const amenitiesList = [
                    property.hasBalcony && 'Balcony',
                    property.amenities.hasLift && 'Lift',
                    property.amenities.hasClubhouse && 'Clubhouse',
                    property.amenities.hasChildrenPlayArea && "Children's Play Area",
                    property.amenities.hasGasPipeline && 'Gas Pipeline',
                ].filter(Boolean).join(', ');

                const propertyDetailsString = `
                    This is a ${property.configuration} ${property.propertyType} for ${property.price.type} at ${property.societyName}, ${property.location}.
                    Price: ${priceDisplay}.
                    Area: ${property.area.superBuiltUp} sqft.
                    Floor: ${property.floorNo} of ${property.totalFloors}.
                    Main door facing: ${property.mainDoorDirection}.
                    Parking: ${property.parking.has4Wheeler ? 'Car' : 'No Car'}, ${property.parking.has2Wheeler ? 'Bike' : 'No Bike'}.
                    Key Amenities: ${amenitiesList || 'None listed'}.
                    Description: ${property.description}
                `;

                const result = await getPropertyMatchScore({
                  propertyDetails: propertyDetailsString,
                  searchCriteria: searchCriteria,
                });
                setMatchInfo(result);

            } catch (error) {
                console.error("Failed to get property match score:", error);
                setMatchInfo(null); // Set to null on error
            } finally {
                setIsFetchingScore(false);
            }
        }
    };

    return (
        <>
            <Card className="overflow-hidden flex flex-col bg-card/80 backdrop-blur-sm border-border/20 h-full hover:ring-2 hover:ring-primary transition-all">
                <button onClick={() => handleOpenChange(true)} className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-primary rounded-t-lg">
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
                </button>
                <CardFooter className="p-4 bg-secondary/50 flex justify-between items-center mt-auto">
                    <span className="text-xl font-bold text-primary">{priceDisplay}</span>
                    <Badge variant="secondary" className="capitalize">{property.propertyType}</Badge>
                </CardFooter>
            </Card>
            <PropertyDetailsSheet open={isDetailsOpen} onOpenChange={handleOpenChange} property={property} matchInfo={matchInfo} />
        </>
    );
}
