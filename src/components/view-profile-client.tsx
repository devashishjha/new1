
'use client';

import React, { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import type { UserProfile, Property, SeekerProfile, DeveloperProfile, DealerProfile } from '@/lib/types';
import { Header } from '@/components/header';
import { BottomNavBar } from '@/components/bottom-nav-bar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building, ChevronsRight, Phone, User, Clock, Loader2, Mail, MessagesSquare } from 'lucide-react';
import { ShortlistedPropertyCard } from '@/components/shortlisted-property-card';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { dateToJSON } from '@/lib/utils';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useChatNavigation } from '@/hooks/use-chat-navigation';
import { PresenceDot } from './presence-dot';

const DetailItem = ({ label, value, icon }: { label: string, value: React.ReactNode, icon?: React.ElementType }) => (
  <div className="flex items-start gap-4">
    {icon && <div className="flex-shrink-0 w-8 text-center"><div className="p-2 bg-secondary rounded-full inline-block">{React.createElement(icon, { className: 'w-5 h-5 text-primary' })}</div></div>}
    <div>
      <p className="text-sm text-white/70">{label}</p>
      <p className="font-semibold text-white">{value}</p>
    </div>
  </div>
);

export function ViewProfileClient() {
  const params = useParams();
  const userId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { navigateToChat, isNavigating: isStartingChat } = useChatNavigation();

  useEffect(() => {
    if (!userId || authLoading) {
        return;
    };

    const fetchData = async () => {
      setIsLoading(true);

      const handleFallback = () => {
        setProfile(null);
        setUserProperties([]);
      };

      if (!db) {
        handleFallback();
        setIsLoading(false);
        return;
      }
      
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userProfile = { id: userDocSnap.id, ...userDocSnap.data() } as UserProfile;
        setProfile(userProfile);
        
        if (['owner', 'developer', 'dealer'].includes(userProfile.type)) {
          const q = query(collection(db, "properties"), where("lister.id", "==", userId));
          const querySnapshot = await getDocs(q);
          const properties = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
          setUserProperties(properties.map(p => dateToJSON(p)) as Property[]);
        }
      } else {
        handleFallback();
      }
      setIsLoading(false);
    };

    fetchData().catch(error => {
        console.error("Error fetching profile data: ", error);
        setIsLoading(false);
        setProfile(null);
    });
  }, [userId, authLoading]);

  const handleUpdateProperty = (updatedProperty: Property) => {
    setUserProperties(prev => prev.map(p => p.id === updatedProperty.id ? updatedProperty : p));
  };

  const handleDeleteProperty = (propertyId: string) => {
      setUserProperties(prev => prev.filter(p => p.id !== propertyId));
  };

  // This check runs after loading is complete
  if (!isLoading && !profile) {
    notFound();
  }

  const isLoggedInUser = user?.uid === userId;
  
  if (isLoading || authLoading) {
    return (
      <>
        <Header />
        <main className="container mx-auto py-24 px-4 pb-24">
           <div className="max-w-4xl mx-auto">
              <Skeleton className="h-10 w-48 mb-4 bg-white/20" />
              <Card>
                <CardHeader className="text-center">
                  <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4 bg-white/20" />
                  <Skeleton className="h-8 w-48 mx-auto bg-white/20" />
                  <Skeleton className="h-6 w-24 mx-auto mt-2 bg-white/20" />
                </CardHeader>
                <CardContent className="space-y-6">
                   <Skeleton className="h-5 w-3/4 mx-auto bg-white/20" />
                   <div className="space-y-6 pt-4 border-t border-white/10">
                      <Skeleton className="h-12 w-full bg-white/20" />
                      <Skeleton className="h-12 w-full bg-white/20" />
                   </div>
                </CardContent>
                <CardFooter className="p-4 border-t border-white/10 bg-black/20">
                  <Skeleton className="h-12 w-full bg-white/20" />
                </CardFooter>
              </Card>
           </div>
        </main>
        <BottomNavBar />
      </>
    )
  }
  
  if (!profile) {
    return (
      <>
        <Header />
        <main className="container mx-auto py-24 px-4 pb-24 flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
        <BottomNavBar />
      </>
    )
  }

  return (
    <>
      <TooltipProvider>
        <Header />
        <main className="container mx-auto py-24 px-4 pb-24">
          <div className="max-w-4xl mx-auto">
            <Link href={isLoggedInUser ? "/profile" : "/reels"}>
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to {isLoggedInUser ? "Your Profile" : "Reels"}
              </Button>
            </Link>
            
            <Card>
              <CardHeader className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                    <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center overflow-hidden border-2 border-primary">
                        {profile.avatar ? (
                            <Image src={profile.avatar} alt={profile.name} width={96} height={96} className="object-cover w-full h-full" data-ai-hint="person portrait" />
                        ) : (
                            <User className="w-12 h-12 text-primary" />
                        )}
                    </div>
                    <div className="absolute bottom-0 right-0">
                        <PresenceDot userId={profile.id} />
                    </div>
                </div>

                <CardTitle className="text-3xl">{profile.name}</CardTitle>
                <CardDescription>
                  <Badge variant="default" className="capitalize text-lg py-1 px-3 mt-2">{profile.type}</Badge>
                </CardDescription>

                {!isLoggedInUser && (
                  <div className="flex items-center justify-center gap-4 pt-4">
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <a href={`mailto:${profile.email}`}>
                                  <Button variant="outline" size="icon">
                                      <Mail className="h-5 w-5" />
                                      <span className="sr-only">Email</span>
                                  </Button>
                              </a>
                          </TooltipTrigger>
                          <TooltipContent><p>{profile.email}</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              {profile.phone ? (
                                  <a href={`tel:${profile.phone}`}>
                                      <Button variant="outline" size="icon">
                                          <Phone className="h-5 w-5" />
                                          <span className="sr-only">Call</span>
                                      </Button>
                                  </a>
                              ) : (
                                  <Button variant="outline" size="icon" disabled>
                                      <Phone className="h-5 w-5" />
                                      <span className="sr-only">Call</span>
                                  </Button>
                              )}
                          </TooltipTrigger>
                          <TooltipContent>
                              {profile.phone ? <p>{profile.phone}</p> : <p>No phone number provided.</p>}
                          </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={() => navigateToChat(profile)} disabled={isStartingChat}>
                                  {isStartingChat ? <Loader2 className="animate-spin" /> : <MessagesSquare className="h-5 w-5" />}
                                  <span className="sr-only">Chat</span>
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Start a chat</p></TooltipContent>
                      </Tooltip>
                  </div>
                )}

              </CardHeader>
              <CardContent className="space-y-6">
                  <div className="space-y-6 pt-4 border-t border-white/10">
                      {(profile.type === 'dealer' || profile.type === 'developer') && (profile as DealerProfile).companyName && <DetailItem label="Company Name" value={(profile as DealerProfile).companyName} icon={Building} />}
                      {(profile.type === 'dealer' || profile.type === 'developer') && (profile as DeveloperProfile).reraId && <DetailItem label="RERA ID" value={(profile as DeveloperProfile).reraId} icon={ChevronsRight} />}
                  </div>
                  {profile.type === 'seeker' && (profile as SeekerProfile).searchCriteria && (
                      <div className="space-y-2 pt-4 border-t border-white/10">
                          <h3 className="text-sm text-white/70">Search Criteria</h3>
                          <p className="font-mono text-sm bg-secondary p-4 rounded-md text-secondary-foreground">{(profile as SeekerProfile).searchCriteria}</p>
                      </div>
                  )}
              </CardContent>
            </Card>

            {(profile.type === 'owner' || profile.type === 'developer' || profile.type === 'dealer') && (
                <Card className="mt-8">
                    <CardHeader><CardTitle>Properties Posted ({userProperties.length})</CardTitle></CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-4"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>
                        ) : userProperties.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {userProperties.map(property => (
                                    <ShortlistedPropertyCard 
                                        key={property.id} 
                                        property={property}
                                        onUpdate={handleUpdateProperty}
                                        onDelete={handleDeleteProperty}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-white/70 text-center py-4">This user has not posted any properties yet.</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {profile.type === 'seeker' && profile.searchHistory && profile.searchHistory.length > 0 && (
                <Card className="mt-8">
                    <CardHeader><CardTitle>Recent Searches</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {profile.searchHistory.slice(0, 5).map((search, index) => (
                            <div key={index} className="flex items-center gap-3 text-white/70 p-3 bg-secondary rounded-md">
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                <span>{search}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
          </div>
        </main>
        <BottomNavBar />
      </TooltipProvider>
    </>
  );
}
