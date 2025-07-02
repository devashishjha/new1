
'use client';

import type { Property } from '@/lib/types';
import type { PropertyMatchScoreOutput } from '@/ai/flows/property-match-score';
import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { PropertyDetailsSheet } from '@/components/property-details-sheet';
import { getPropertyMatchScore, deletePropertyAction } from '@/app/actions';
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
    IndianRupee,
    Zap,
    Loader2,
    Trash2,
    Pencil,
    Volume2,
    VolumeX,
} from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { useChatNavigation } from '@/hooks/use-chat-navigation';
import { AiMatchDialog } from './ai-match-dialog';
import { useAuth } from '@/hooks/use-auth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from './ui/button';


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


function ReelComponent({ property, userSearchCriteria, onDelete }: { property: Property; userSearchCriteria: string; onDelete?: (propertyId: string) => void }) {
  const [matchInfo, setMatchInfo] = useState<PropertyMatchScoreOutput | null | undefined>(undefined);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAiMatchDialogOpen, setIsAiMatchDialogOpen] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showMuteIndicator, setShowMuteIndicator] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { toast } = useToast();
  const { navigateToChat, isNavigating: isStartingChat } = useChatNavigation();
  const { user } = useAuth();
  const reelRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const isLister = user?.uid === property.lister.id;

  // Observer to detect when the reel is in view and trigger AI fetch
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Fetch only once when it becomes visible
        }
      },
      { threshold: 0.5 } // Trigger when 50% of the element is visible
    );

    const currentRef = reelRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

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
        This is a ${property.configuration} ${property.propertyType} for ${property.price.type} at ${property.societyName ? `${property.societyName}, ` : ''}${property.location}.
        Price: ${priceDisplay}.
        Area: ${property.area.superBuiltUp} sqft.
        Floor: ${property.floorNo} of ${property.totalFloors}.
        Main door facing: ${property.mainDoorDirection}.
        Parking: ${property.parking.has4Wheeler ? 'Car' : 'No Car'}, ${property.parking.has2Wheeler ? 'Bike' : 'No Bike'}.
        Key Amenities: ${amenitiesList || 'None listed'}.
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
    
    // Fetch score when the component is visible and criteria are available
    if (userSearchCriteria && isVisible && matchInfo === undefined) {
      fetchScore();
    } else if (!userSearchCriteria) {
      setMatchInfo(null);
    }
  }, [userSearchCriteria, isVisible, matchInfo, property, priceDisplay]);


  useEffect(() => {
    try {
      const shortlisted = JSON.parse(localStorage.getItem('shortlistedProperties') || '[]');
      setIsShortlisted(shortlisted.includes(property.id));
    } catch (error) {
      console.error("Failed to parse shortlisted properties from localStorage", error);
    }
  }, [property.id]);
  
  const handleInteraction = (e: React.MouseEvent | React.TouchEvent, action: () => void) => {
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
      window.dispatchEvent(new CustomEvent('shortlist-updated'));
    } catch (error) {
      console.error("Failed to update shortlisted properties in localStorage", error);
       toast({ variant: 'destructive', title: "Error", description: "Could not update shortlist." });
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    const result = await deletePropertyAction(property.id);
    if (result.success) {
        toast({ title: "Property Deleted", description: result.message });
        onDelete(property.id);
        setIsDeleteDialogOpen(false);
    } else {
        toast({ variant: 'destructive', title: "Deletion Failed", description: result.message });
    }
    setIsDeleting(false);
  };

  const openDetailsSheet = () => setIsDetailsOpen(true);
  const openAiMatchDialog = () => setIsAiMatchDialogOpen(true);
  
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
  
  const handleVideoTap = () => {
    if (videoRef.current) {
        const newMutedState = !videoRef.current.muted;
        videoRef.current.muted = newMutedState;
        setIsMuted(newMutedState);
        setShowMuteIndicator(true);
        setTimeout(() => setShowMuteIndicator(false), 1000);
    }
  };

  const handlePressStart = () => {
    isLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }, 200); // 200ms threshold for a hold
  };

  const handlePressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
    
    if (isLongPress.current) {
      if (videoRef.current) {
        videoRef.current.play();
      }
    } else {
      // This was a tap, not a hold.
      handleVideoTap();
    }
  };
  
  // This is to handle the case where the user holds down, then moves the cursor off the reel before releasing.
  const handleMouseLeave = () => {
      if (pressTimer.current) {
          clearTimeout(pressTimer.current);
      }
      if (isLongPress.current) {
          if (videoRef.current) {
              videoRef.current.play();
          }
      }
  };

  return (
    <section 
      ref={reelRef}
      className="h-full w-full snap-start relative text-white overflow-hidden"
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    >
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none transition-opacity duration-300" style={{ opacity: showMuteIndicator ? 1 : 0 }}>
            <div className="bg-black/50 p-4 rounded-full">
                {isMuted ? <VolumeX className="h-10 w-10 text-white" /> : <Volume2 className="h-10 w-10 text-white" />}
            </div>
      </div>
      {property.video ? (
          <video 
            ref={videoRef}
            src={property.video} 
            autoPlay 
            muted 
            loop 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover transform-gpu" 
          />
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
        className="absolute z-10 w-full"
        style={{ bottom: '5rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">
             {/* Action Bar */}
            <div className="flex justify-around items-center rounded-full bg-black/30 p-1.5 backdrop-blur-sm border border-white/20 mb-4 max-w-sm mx-auto">
                <button onClick={(e) => handleInteraction(e, handleCall)} onMouseUp={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()} className="flex-1 flex flex-col items-center gap-1 p-1 rounded-full hover:bg-white/10 transition-colors">
                    <PhoneCall strokeWidth={2.5} className="h-6 w-6"/>
                </button>
                <button onClick={(e) => handleInteraction(e, toggleShortlist)} onMouseUp={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()} className={`flex-1 flex flex-col items-center gap-1 p-1 rounded-full hover:bg-white/10 transition-colors ${isShortlisted ? 'text-primary' : ''}`}>
                    <Bookmark strokeWidth={2.5} className="h-6 w-6" fill={isShortlisted ? 'currentColor' : 'none'}/>
                </button>
                <button onClick={(e) => handleInteraction(e, handleChat)} onMouseUp={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()} className="flex-1 flex flex-col items-center gap-1 p-1 rounded-full hover:bg-white/10 transition-colors" disabled={isStartingChat}>
                    {isStartingChat ? <Loader2 className="h-6 w-6 animate-spin"/> : <MessageCircle strokeWidth={2.5} className="h-6 w-6"/>}
                </button>
                <button onClick={(e) => handleInteraction(e, openDetailsSheet)} onMouseUp={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()} className="flex-1 flex flex-col items-center gap-1 p-1 rounded-full hover:bg-white/10 transition-colors">
                    <Info strokeWidth={2.5} className="h-6 w-6"/>
                </button>
                {isLister && onDelete && (
                  <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                      <AlertDialogTrigger asChild>
                           <button onClick={(e) => e.stopPropagation()} onMouseUp={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()} className="flex-1 flex flex-col items-center gap-1 p-1 rounded-full hover:bg-destructive/80 transition-colors text-destructive">
                              <Trash2 strokeWidth={2.5} className="h-6 w-6"/>
                          </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete this property listing.
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
                )}
                 {isLister && (
                    <Button asChild size="icon" variant="ghost" className="flex-1 h-auto p-1 rounded-full hover:bg-white/10 text-white">
                        <Link href={`/edit-property/${property.id}`} onClick={(e) => e.stopPropagation()} onMouseUp={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
                            <Pencil strokeWidth={2.5} className="h-6 w-6"/>
                        </Link>
                    </Button>
                )}
            </div>

            {/* Horizontally Scrolling Info Cards */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <button onClick={(e) => handleInteraction(e, openAiMatchDialog)} onMouseUp={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()} className="text-left">
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
                <Link href={`/view-profile/${property.lister.id}`} onClick={(e) => e.stopPropagation()} onMouseUp={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
                    <InfoCard icon={UserCircle} label="Posted By" value={property.lister.name} />
                </Link>
                <InfoCard 
                    icon={IndianRupee} 
                    label={`For ${property.price.type}`} 
                    value={priceDisplay} 
                />
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.location)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} onMouseUp={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
                    <InfoCard icon={MapPin} label="Location" value={property.location} />
                </a>
                <InfoCard icon={BedDouble} label="Config" value={property.configuration.toUpperCase()} />
                <InfoCard icon={Building} label="Type" value={<span className="capitalize">{property.propertyType}</span>} />
                <InfoCard icon={AreaChart} label="Area" value={`${property.area.superBuiltUp} sqft`} />
            </div>
        </div>
      </div>


      <AiMatchDialog open={isAiMatchDialogOpen} onOpenChange={setIsAiMatchDialogOpen} matchInfo={matchInfo} />
      <PropertyDetailsSheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen} property={property} variant="reels" />
    </section>
  );
}

export const Reel = ReelComponent;

    
