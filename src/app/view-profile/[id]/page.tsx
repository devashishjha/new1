import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { UserProfile, Property } from '@/lib/types';
import { Header } from '@/components/header';
import { BottomNavBar } from '@/components/bottom-nav-bar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AtSign, Building, ChevronsRight, Phone, User, Clock, MessageCircle } from 'lucide-react';
import { ShortlistedPropertyCard } from '@/components/shortlisted-property-card';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { dateToJSON } from '@/lib/utils';
import { ChatButton } from '@/components/chat-button';


const DetailItem = ({ label, value, icon }: { label: string, value: React.ReactNode, icon?: React.ElementType }) => (
  <div className="flex items-start gap-4">
    {icon && <div className="flex-shrink-0 w-8 text-center"><div className="p-2 bg-secondary rounded-full inline-block">{React.createElement(icon, { className: 'w-5 h-5 text-primary' })}</div></div>}
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  </div>
);

async function getUserProfile(id: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as UserProfile;
}

async function getUserProperties(userId: string): Promise<Property[]> {
    const q = query(collection(db, "properties"), where("lister.id", "==", userId));
    const querySnapshot = await getDocs(q);
    const properties = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
    return properties.map(p => dateToJSON(p)) as Property[];
}


export default async function ViewProfilePage({ params }: { params: { id: string } }) {
  const user = await getUserProfile(params.id);

  if (!user) {
    notFound();
  }
  
  const userProperties = (user.type === 'owner' || user.type === 'developer' || user.type === 'dealer')
    ? await getUserProperties(user.id)
    : [];

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
              <div className="w-24 h-24 bg-secondary rounded-full mx-auto flex items-center justify-center mb-4">
                  <User className="w-12 h-12 text-primary" />
              </div>
              <CardTitle className="text-3xl">{user.name}</CardTitle>
              <CardDescription>
                <Badge variant="outline" className="capitalize text-lg py-1 px-3 mt-2">{user.type}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-center text-muted-foreground italic px-4">&quot;{user.bio}&quot;</p>
                <div className="space-y-6 pt-4 border-t">
                    <DetailItem label="Email" value={user.email} icon={AtSign} />
                    <DetailItem label="Phone" value={user.phone} icon={Phone} />
                    {(user.type === 'dealer' || user.type === 'developer') && user.companyName && <DetailItem label="Company Name" value={user.companyName} icon={Building} />}
                    {(user.type === 'dealer' || user.type === 'developer') && user.reraId && <DetailItem label="RERA ID" value={user.reraId} icon={ChevronsRight} />}
                </div>
                {user.type === 'seeker' && user.searchCriteria && (
                    <div className="space-y-2 pt-4 border-t">
                        <h3 className="text-sm text-muted-foreground">Search Criteria</h3>
                        <p className="font-mono text-sm bg-secondary p-4 rounded-md">{user.searchCriteria}</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-4 border-t bg-secondary/20">
                <ChatButton targetUser={user} />
            </CardFooter>
          </Card>

          {(user.type === 'owner' || user.type === 'developer' || user.type === 'dealer') && (
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

          {user.type === 'seeker' && user.searchHistory && user.searchHistory.length > 0 && (
              <Card className="mt-8">
                  <CardHeader><CardTitle>Recent Searches</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                      {user.searchHistory.slice(0, 5).map((search, index) => (
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
