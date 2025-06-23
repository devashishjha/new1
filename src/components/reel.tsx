'use client';

import type { Property, UserProfile } from '@/lib/types';
import type { PropertyMatchScoreOutput } from '@/ai/flows/property-match-score';
import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, where } from 'firebase/firestore';


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


export function Reel({ property, userSearchCriteria }: { property: Property; userSearchCriteria: string }) {
  const [matchInfo, setMatchInfo] = useState<PropertyMatchScoreOutput | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [isUIVisible, setIsUIVisible] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();


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
    console.log("Call action triggered");
    toast({ title: "Calling Lister", description: `Connecting you with ${property.lister.name}` });
  };
  
  const handleChat = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: "Not Logged In", description: "You need to be logged in to start a chat." });
        return;
    }

    const targetUser = property.lister;
    if (user.uid === targetUser.id) {
         toast({ variant: 'destructive', title: "Cannot Chat", description: "You cannot start a chat with yourself." });
        return;
    }

    try {
        const chatsRef = collection(db, 'chats');
        const q = query(chatsRef, where('participantIds', 'array-contains', user.uid));
        const querySnapshot = await getDocs(q);
        
        let existingChatId: string | null = null;
        querySnapshot.forEach(doc => {
            const chat = doc.data();
            if (chat.participantIds.includes(targetUser.id)) {
                existingChatId = doc.id;
            }
        });

        if (existingChatId) {
            router.push(`/chats/${existingChatId}`);
        } else {
            const currentUserDocSnap = await getDoc(doc(db, 'users', user.uid));
            if (!currentUserDocSnap.exists()) {
                throw new Error("Could not find current user's profile.");
            }
            const currentUserProfile = currentUserDocSnap.data() as UserProfile;

            const newChatRef = await addDoc(chatsRef, {
                participantIds: [user.uid, targetUser.id],
                participants: {
                    [user.uid]: {
                        name: currentUserProfile.name,
                        avatar: 'https://placehold.co/100x100.png' // Placeholder
                    },
                    [targetUser.id]: {
                        name: targetUser.name,
                        avatar: 'https://placehold.co/100x100.png' // Placeholder
                    }
                },
                messages: [],
                lastMessage: {
                    text: 'Chat started.',
                    timestamp: serverTimestamp(),
                    senderId: user.uid,
                },
                unreadCount: 0,
            });
            router.push(`/chats/${newChatRef.id}`);
        }
    } catch (error) {
        console.error("Error starting chat:", error);
        toast({ variant: 'destructive', title: "Error", description: "Could not start the chat. Please try again." });
    }
  };

  useEffect(() => {
    async function fetchScore() {
      const propertyDetailsString = `
        Title: ${property.title}, 
        Type: ${property.propertyType} (${property.configuration}),
        Location: ${property.location},
        Society: ${property.societyName},
        Price: ${formatIndianCurrency(property.price.amount)} (${property.price.type}),
        Area: ${property.area.superBuiltUp} sqft super built-up, ${property.area.carpet} sqft carpet,
        Floor: ${property.floorNo} of ${property.totalFloors},
        Features: Main door facing ${property.mainDoorDirection}, ${property.openSides} open sides, ${property.features.housesOnSameFloor} houses on the same floor.
        Parking: 4-wheeler - ${property.parking.has4Wheeler ? 'Yes' : 'No'}, 2-wheeler - ${property.parking.has2Wheeler ? 'Yes' : 'No'}.
        Amenities: Balcony - ${property.hasBalcony ? 'Yes' : 'No'}, Lift - ${property.amenities.hasLift ? 'Yes' : 'No'}, Clubhouse - ${property.amenities.hasClubhouse ? 'Yes' : 'No'}, Children's Play Area - ${property.amenities.hasChildrenPlayArea ? 'Yes' : 'No'}, Gas Pipeline - ${property.amenities.hasGasPipeline ? 'Yes' : 'No'}, Sunlight enters - ${property.features.sunlightEntersHome ? 'Yes' : 'No'} (${property.amenities.sunlightPercentage}%).
        Charges: Maintenance - ${formatIndianCurrency(property.charges.maintenancePerMonth)}, Security Deposit - ${formatIndianCurrency(property.charges.securityDeposit)}, Brokerage - ${formatIndianCurrency(property.charges.brokerage)}, Move-in Charges - ${formatIndianCurrency(property.charges.moveInCharges)}.
      `;

      try {
        const result = await getPropertyMatchScore({
          propertyDetails: propertyDetailsString,
          searchCriteria: userSearchCriteria,
        });
        setMatchInfo(result);
      } catch (error) {
        console.error("Failed to get property match score:", error);
      }
    }
    fetchScore();
  }, [property, userSearchCriteria]);

  const priceDisplay = property.price.type === 'rent'
    ? `₹ ${property.price.amount.toLocaleString('en-IN')}/mo`
    : formatIndianCurrency(property.price.amount);

  return (
    <section 
      className="h-full w-full snap-start relative text-white overflow-hidden"
      onClick={() => setIsUIVisible(!isUIVisible)}
    >
      {property.video ? (
          <video src={property.video} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        property.image && (
          <img src={property.image} alt={property.title} data-ai-hint="apartment interior" className="absolute inset-0 w-full h-full object-cover" />
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
                <button onClick={(e) => handleInteraction(e, handleChat)} className="flex-1 flex flex-col items-center gap-1 p-1 rounded-full hover:bg-white/10 transition-colors">
                    <MessageCircle strokeWidth={2.5} className="h-6 w-6"/>
                </button>
                <button onClick={(e) => handleInteraction(e, openDetailsSheet)} className="flex-1 flex flex-col items-center gap-1 p-1 rounded-full hover:bg-white/10 transition-colors">
                    <Info strokeWidth={2.5} className="h-6 w-6"/>
                </button>
            </div>

            {/* Horizontally Scrolling Info Cards */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <InfoCard icon={Zap} label="AI Match">
                  {matchInfo ? (
                    <p className="text-2xl font-bold mt-1 text-white truncate w-full">{matchInfo.matchScore}%</p>
                  ) : (
                    <Skeleton className="h-7 w-12 mt-1 bg-white/20" />
                  )}
                </InfoCard>
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
