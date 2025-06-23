
'use client';

import React, { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import type { UserProfile, Property, SeekerProfile } from '@/lib/types';
import { Header } from '@/components/header';
import { BottomNavBar } from '@/components/bottom-nav-bar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AtSign, Building, ChevronsRight, Phone, User, Clock, Loader2 } from 'lucide-react';
import { ShortlistedPropertyCard } from '@/components/shortlisted-property-card';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { dateToJSON } from '@/lib/utils';
import { ChatButton } from '@/components/chat-button';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { dummyProperties } from '@/lib/dummy-data';

const DetailItem = ({ label, value, icon }: { label: string, value: React.ReactNode, icon?: React.ElementType }) => (
  <div className="flex items-start gap-4">
    {icon && <div className="flex-shrink-0 w-8 text-center"><div className="p-2 bg-secondary rounded-full inline-block">{React.createElement(icon, { className: 'w-5 h-5 text-primary' })}</div></div>}
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  </div>
);

export function ViewProfileClient() {
  const params = useParams();
  const userId = params.id as string;
  const { loading: authLoading } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId || authLoading) {
        return;
    };

    const fetchData = async () => {
      setIsLoading(true);
      
      // Attempt to fetch user from Firestore
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
        // If not in Firestore, fall back to dummy data
        const dummyLister = dummyProperties.find(p => p.lister.id === userId)?.lister;
        
        if (dummyLister) {
          let userProfile: UserProfile;
          const baseProfile = {
            id: dummyLister.id,
            name: dummyLister.name,
            email: `${dummyLister.name.toLowerCase().replace(' ', '.')}@example.com`,
            phone: dummyLister.phone,
            bio: `A passionate ${dummyLister.type} helping people find their dream homes.`,
            avatar: dummyLister.avatar,
          };

          switch(dummyLister.type) {
            case 'owner':
              userProfile = { ...baseProfile, type: 'owner' };
              break;
            case 'dealer':
              userProfile = { ...baseProfile, type: 'dealer', companyName: `${dummyLister.name}'s Realty` };
              break;
            case 'developer':
              userProfile = { ...baseProfile, type: 'developer', companyName: `${dummyLister.name} Corp`, reraId: 'DUMMY/RERA/12345' };
              break;
            default:
              // This case should not be hit with current data, but it's a good safeguard
              setProfile(null);
              setIsLoading(false);
              return;
          }
          
          setProfile(userProfile);
          
          const propertiesByDummyLister = dummyProperties.filter(p => p.lister.id === userId);
          setUserProperties(propertiesByDummyLister.map(p => dateToJSON(p)) as Property[]);
        } else {
          // Not in Firestore or dummy data
          setProfile(null);
        }
      }
      setIsLoading(false);
    };

    fetchData().catch(error => {
        console.error("Error fetching profile data: ", error);
        setIsLoading(false);
        setProfile(null);
    });
  }, [userId, authLoading]);

  // This check runs after loading is complete
  if (!isLoading && !profile) {
    notFound();
  }

  if (isLoading || authLoading) {
    return (
      <>
        <Header />
        <main className="container mx-auto py-24 px-4 pb-24">
           <div className="max-w-4xl mx-auto">
              <Skeleton className="h-10 w-48 mb-4" />
              <Card>
                <CardHeader className="text-center">
                  <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
                  <Skeleton className="h-8 w-48 mx-auto" />
                  <Skeleton className="h-6 w-24 mx-auto mt-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                   <Skeleton className="h-5 w-3/4 mx-auto" />
                   <div className="space-y-6 pt-4 border-t">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                   </div>
                </CardContent>
                <CardFooter className="p-4 border-t bg-secondary/20">
                  <Skeleton className="h-12 w-full" />
                </CardFooter>
              </Card>
           </div>
        </main>
        <BottomNavBar />
      </>
    )
  }
  
  // This will only render if profile is not null.
  return (
    <>
      <Header />
      <main className="container mx-auto py-24 px-4 pb-24">
        <div className="max-w-4xl mx-auto">
          <Link href="/reels">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reels
            </Button>
          </Link>
          
          <Card>
            <CardHeader className="text-center">
              <div className="w-24 h-24 bg-secondary rounded-full mx-auto flex items-center justify-center mb-4 overflow-hidden">
                  {profile.avatar ? (
                      <Image src={profile.avatar} alt={profile.name} width={96} height={96} className="object-cover w-full h-full" data-ai-hint="person portrait" />
                  ) : (
                      <User className="w-12 h-12 text-primary" />
                  )}
              </div>
              <CardTitle className="text-3xl">{profile.name}</CardTitle>
              <CardDescription>
                <Badge variant="outline" className="capitalize text-lg py-1 px-3 mt-2">{profile.type}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-center text-muted-foreground italic px-4">&quot;{profile.bio}&quot;</p>
                <div className="space-y-6 pt-4 border-t">
                    <DetailItem label="Email" value={profile.email} icon={AtSign} />
                    <DetailItem label="Phone" value={profile.phone || 'Not provided'} icon={Phone} />
                    {(profile.type === 'dealer' || profile.type === 'developer') && profile.companyName && <DetailItem label="Company Name" value={profile.companyName} icon={Building} />}
                    {(profile.type === 'dealer' || profile.type === 'developer') && profile.reraId && <DetailItem label="RERA ID" value={profile.reraId} icon={ChevronsRight} />}
                </div>
                {profile.type === 'seeker' && (profile as SeekerProfile).searchCriteria && (
                    <div className="space-y-2 pt-4 border-t">
                        <h3 className="text-sm text-muted-foreground">Search Criteria</h3>
                        <p className="font-mono text-sm bg-secondary p-4 rounded-md">{(profile as SeekerProfile).searchCriteria}</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-4 border-t bg-secondary/20">
                <ChatButton targetUser={profile} />
            </CardFooter>
          </Card>

          {(profile.type === 'owner' || profile.type === 'developer' || profile.type === 'dealer') && (
              <Card className="mt-8">
                  <CardHeader><CardTitle>Properties Posted ({userProperties.length})</CardTitle></CardHeader>
                  <CardContent>
                      {userProperties.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {userProperties.map(property => (
                                  <ShortlistedPropertyCard key={property.id} property={property} />
                              ))}
                          </div>
                      ) : (
                          <p className="text-muted-foreground text-center py-4">This user has not posted any properties yet.</p>
                      )}
                  </CardContent>
              </Card>
          )}

          {profile.type === 'seeker' && profile.searchHistory && profile.searchHistory.length > 0 && (
              <Card className="mt-8">
                  <CardHeader><CardTitle>Recent Searches</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                      {profile.searchHistory.slice(0, 5).map((search, index) => (
                          <div key={index} className="flex items-center gap-3 text-muted-foreground p-3 bg-secondary rounded-md">
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
    </>
  );
}
