'use client';

import type { Property } from '@/lib/types';
import type { PropertyMatchScoreOutput } from '@/ai/flows/property-match-score';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { PropertyDetailsSheet } from '@/components/property-details-sheet';
import { getPropertyMatchScore } from '@/app/actions';
import Link from 'next/link';
import { 
    Bookmark, 
    MessageCircle, 
    PhoneCall, 
    Info,
    UserCircle,
    MapPin,
    BedDouble,
    Building,
    AreaChart,
    CircleDollarSign,
    Zap,
    Loader2,
} from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { useChatNavigation } from '@/hooks/use-chat-navigation';


const InfoCard = ({ icon, label, value, children }: { icon: React.ElementType, label: string, value?: string | React.ReactNode, children?: React.ReactNode }) => (
    <div className="flex-shrink-0 flex flex-col items-start justify-center rounded-xl bg-black/40 backdrop-blur-md p-3 border border-white/20 min-w-[160px] h-20">
        <div className="flex items-center gap-1.5 text-white/80">
            {React.createElement(icon, { className: 'w-4 h-4', strokeWidth: 2.5 })}
            <h4 className="text-xs font-semibold uppercase tracking-wider">{label}</h4>
        </div>
        {value && <p className="text-base font-bold mt-1 text-white truncate w-full">{value}</p>}
        {children}
    </div>
);


function ReelComponent({ property, userSearchCriteria }: { property: Property; userSearchCriteria: string }) {
  const [matchInfo, setMatchInfo] = useState<PropertyMatchScoreOutput | null | undefined>(undefined);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [isUIVisible, setIsUIVisible] = useState(true);
  const { toast } = useToast();
  const { navigateToChat, isNavigating: isStartingChat } = useChatNavigation();


  useEffect(() => {
    try {
      const shortlisted = JSON.parse(localStorage.getItem('shortlistedProperties') || '[]');
      setIsShortlisted(shortlisted.includes(property.id));
    } catch (error) {
      console.error("Failed to parse shortlisted properties from localStorage", error);
    }
  }, [property.id]);
  
  const handleInteraction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const toggleShortlist = () => {
    try {
      let shortlisted = JSON.parse(localStorage.getItem('shortlistedProperties') || '[]');
      const currentlyShortlisted = shortlisted.includes(property.id);
      
      if (currentlyShortlisted) {
          shortlisted = shortlisted.filter((id: string) => id !== property.id);
          toast({ title: "Removed from shortlist" });
      } else {
          shortlisted.push(property.id);
          toast({ title: "Added to shortlist" });
      }
      localStorage.setItem('shortlistedProperties', JSON.stringify(shortlisted));
      setIsShortlisted(!currentlyShortlisted);
      window.dispatchEvent(new CustomEvent('shortlist-updated'));
    } catch (error) {
      console.error("Failed to update shortlisted properties in localStorage", error);
       toast({ variant: 'destructive', title: "Error", description: "Could not update shortlist." });
    }
  };

  const openDetailsSheet = () => setIsDetailsOpen(true);
  
  const handleCall = () => {
    if (property.lister.phone) {
        window.location.href = `tel:${property.lister.phone}`;
        toast({ title: "Calling Lister", description: `Connecting you with ${property.lister.name}` });
    } else {
        toast({ variant: 'destructive', title: "No Phone Number", description: "This user has not provided a phone number." });
    }
  };
  
  const handleChat = () => {
    navigateToChat(property.lister);
  };

  const priceDisplay = property.price.type === 'rent'
    ? `₹ ${property.price.amount.toLocaleString('en-IN')}/mo`
    : formatIndianCurrency(property.price.amount);
    
  useEffect(() => {
    async function fetchScore() {
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

      try {
        const result = await getPropertyMatchScore({
          propertyDetails: propertyDetailsString,
          searchCriteria: userSearchCriteria,
        });
        setMatchInfo(result);
      } catch (error) {
        console.error("Failed to get property match score:", error);
        setMatchInfo(null);
      }
    }
    
    if (userSearchCriteria) {
      setMatchInfo(undefined);
      fetchScore();
    } else {
      setMatchInfo(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property, userSearchCriteria, priceDisplay]);


  return (
    <section 
      className="h-full w-full snap-start relative text-white overflow-hidden"
      onClick={() => setIsUIVisible(!isUIVisible)}
    >
      {property.video ? (
          <video src={property.video} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        property.image && (
          <Image 
            src={property.image} 
            alt={property.title} 
            fill
            sizes="100vw"
            priority={true}
            className="object-cover"
            data-ai-hint="apartment interior"
          />
        )
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      
      <div 
        className="absolute z-10 w-full transition-opacity duration-300"
        style={{ bottom: '5rem', opacity: isUIVisible ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">
            {/* Action Bar */}
            <div className="flex justify-around items-center rounded-full bg-black/30 p-1.5 backdrop-blur-sm border border-white/20 mb-4 max-w-sm mx-auto">
                <button onClick={(e) => handleInteraction(e, handleCall)} className="flex-1 flex flex-col items-center gap-1 p-1 rounded-full hover:bg-white/10 transition-colors">
                    <PhoneCall strokeWidth={2.5} className="h-6 w-6"/>
                </button>
                <button onClick={(e) => handleInteraction(e, toggleShortlist)} className={`flex-1 flex flex-col items-center gap-1 p-1 rounded-full hover:bg-white/10 transition-colors ${isShortlisted ? 'text-primary' : ''}`}>
                    <Bookmark strokeWidth={2.5} className="h-6 w-6" fill={isShortlisted ? 'currentColor' : 'none'}/>
                </button>
                <button onClick={(e) => handleInteraction(e, handleChat)} className="flex-1 flex flex-col items-center gap-1 p-1 rounded-full hover:bg-white/10 transition-colors" disabled={isStartingChat}>
                    {isStartingChat ? <Loader2 className="h-6 w-6 animate-spin"/> : <MessageCircle strokeWidth={2.5} className="h-6 w-6"/>}
                </button>
                <button onClick={(e) => handleInteraction(e, openDetailsSheet)} className="flex-1 flex flex-col items-center gap-1 p-1 rounded-full hover:bg-white/10 transition-colors">
                    <Info strokeWidth={2.5} className="h-6 w-6"/>
                </button>
            </div>

            {/* Horizontally Scrolling Info Cards */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <button onClick={(e) => handleInteraction(e, openDetailsSheet)} className="text-left">
                    <InfoCard icon={Zap} label="AI Match">
                    {matchInfo === undefined ? (
                        <Skeleton className="h-7 w-12 mt-1 bg-white/20" />
                    ) : matchInfo ? (
                        <p className="text-2xl font-bold mt-1 text-white truncate w-full">{matchInfo.matchScore}%</p>
                    ) : (
                        <p className="text-sm mt-1 text-white/70">N/A</p>
                    )}
                    </InfoCard>
                </button>
                <Link href={`/view-profile/${property.lister.id}`} onClick={(e) => e.stopPropagation()}>
                    <InfoCard icon={UserCircle} label="Posted By" value={property.lister.name} />
                </Link>
                <InfoCard 
                    icon={CircleDollarSign} 
                    label={`For ${property.price.type}`} 
                    value={priceDisplay} 
                />
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.location)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                    <InfoCard icon={MapPin} label="Location" value={property.location} />
                </a>
                <InfoCard icon={BedDouble} label="Config" value={property.configuration.toUpperCase()} />
                <InfoCard icon={Building} label="Type" value={<span className="capitalize">{property.propertyType}</span>} />
                <InfoCard icon={AreaChart} label="Area" value={`${property.area.superBuiltUp} sqft`} />
            </div>
        </div>
      </div>


      <PropertyDetailsSheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen} property={property} matchInfo={matchInfo} variant="reels" />
    </section>
  );
}

export const Reel = React.memo(ReelComponent);
