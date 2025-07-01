
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Shield, FileText, LogOut, MessagesSquare, Loader2, Star, Handshake, Sparkles, KeyRound, ShoppingCart } from 'lucide-react';
import { BottomNavBar } from '@/components/bottom-nav-bar';
import { useToast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { UserProfile, SeekerProfile, DealerProfile, DeveloperProfile, Property } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ShortlistedPropertyCard } from '@/components/shortlisted-property-card';
import { dateToJSON } from '@/lib/utils';

type UserType = 'seeker' | 'owner' | 'dealer' | 'developer';

const DetailRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="flex items-start justify-between text-sm gap-4">
        <span className="text-muted-foreground">{label}</span>
        <div className="font-semibold text-white text-right">{value}</div>
    </div>
);


export default function ProfilePage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [userType, setUserType] = useState<UserType>('seeker');
    const [isLoading, setIsLoading] = useState(true);
    const [userProperties, setUserProperties] = useState<Property[]>([]);
    const [isPropertiesLoading, setIsPropertiesLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        };

        const setupFallbackAndNotify = (variant: 'default' | 'destructive', title: string, description: string) => {
            const fallbackProfile: UserProfile = {
                id: user.uid,
                name: user.displayName || user.email?.split('@')[0] || 'New User',
                email: user.email!,
                phone: user.phoneNumber || '',
                bio: 'Welcome to LOKALITY!',
                type: 'seeker',
                searchCriteria: 'I am looking for a new property.',
                avatar: user.photoURL || `https://placehold.co/100x100.png`
            };
            setUserProfile(fallbackProfile);
            setUserType('seeker');
            setIsLoading(false);
            toast({
                variant: variant as 'default' | 'destructive' | null | undefined,
                title,
                description,
                duration: 7000,
            });
        }
        
        if (!db) {
            console.error("Firestore not initialized.");
            setupFallbackAndNotify('destructive', 'Could Not Load Profile', 'Database is not configured.');
            return;
        }

        const userDocRef = doc(db, 'users', user.uid);
        getDoc(userDocRef).then(docSnap => {
            if (docSnap.exists()) {
                const profile = docSnap.data() as UserProfile;
                setUserProfile(profile);
                setUserType(profile.type);
                setIsLoading(false);
            } else {
                console.warn("User profile not found in Firestore. Creating a default local profile.");
                setupFallbackAndNotify('default', 'Welcome! Complete Your Profile', 'Please review your details and save them to create your profile.');
            }
        }).catch(error => {
            console.error("Error fetching user profile:", error);
            setupFallbackAndNotify('destructive', 'Could Not Load Profile', 'There was an error fetching your data. We have set up a temporary profile for you.');
        });
    }, [user, toast]);

    useEffect(() => {
        if (!userProfile || !['owner', 'dealer', 'developer'].includes(userProfile.type)) {
            setIsPropertiesLoading(false);
            return;
        }

        const fetchProperties = async () => {
            if (!db) {
                setIsPropertiesLoading(false);
                return;
            }
            setIsPropertiesLoading(true);
            try {
                const q = query(collection(db, "properties"), where("lister.id", "==", userProfile.id));
                const querySnapshot = await getDocs(q);
                const properties = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
                const serializableProperties = properties.map(p => dateToJSON(p)) as Property[];
                setUserProperties(serializableProperties);
            } catch (error) {
                console.error("Error fetching user properties:", error);
                setUserProperties([]);
            } finally {
                setIsPropertiesLoading(false);
            }
        };

        fetchProperties();
    }, [userProfile]);
    
    const handleLogout = async () => {
        if (!auth) { return; }
        await signOut(auth);
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
    };

    if (isLoading) {
        return (
             <>
                <Header />
                <main className="container mx-auto py-24 px-4 pb-24">
                    <div className="max-w-2xl mx-auto space-y-8">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold tracking-tight">Your Profile</h1>
                            <p className="text-muted-foreground mt-2">Manage your account settings and profile type.</p>
                        </div>
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-96 w-full" />
                    </div>
                </main>
                <BottomNavBar />
             </>
        )
    }

    if (!userProfile) {
        // This case should ideally not be hit if user is logged in, due to the fallback logic.
        // But it's a good safeguard.
        return (
            <>
                <Header />
                 <main className="container mx-auto py-24 px-4 pb-24">
                    <div className="max-w-2xl mx-auto text-center">
                        <Card>
                            <CardHeader>
                                <CardTitle>Error Loading Profile</CardTitle>
                                <CardDescription>We couldn't load your profile. This might be a temporary issue. Please try logging out and signing back in.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                 <Button onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /> Log Out</Button>
                            </CardContent>
                        </Card>
                    </div>
                </main>
                <BottomNavBar />
            </>
        )
    }

    return (
        <>
            <Header />
            <TooltipProvider>
                <main className="container mx-auto py-24 px-4 pb-24">
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold tracking-tight">Your Profile</h1>
                            <p className="text-muted-foreground mt-2">Manage your account settings and profile type.</p>
                        </div>
                        
                        <Card className="mb-8 border-primary/50">
                             <CardHeader className="flex flex-row items-start justify-between gap-4">
                                <div>
                                    <CardTitle>Your Active Profile</CardTitle>
                                    <CardDescription>This is your current public profile and information.</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-0">
                                <DetailRow label="Name" value={userProfile.name} />
                                <Separator/>
                                <DetailRow label="Email" value={userProfile.email} />
                                <Separator/>
                                <DetailRow label="Phone" value={userProfile.phone || 'Not provided'} />
                                <Separator/>
                                <DetailRow label="Active Role" value={<Badge variant="default" className="capitalize">{userProfile.type}</Badge>} />
                                <Separator />
                                <div className="space-y-1">
                                    <span className="text-sm text-muted-foreground">Bio</span>
                                    <p className="font-medium text-white">{userProfile.bio || 'No bio provided.'}</p>
                                </div>

                                {userProfile.type === 'seeker' && (userProfile as SeekerProfile).searchCriteria && (
                                    <>
                                        <Separator />
                                        <div className="space-y-1 pt-3">
                                            <span className="text-sm text-muted-foreground">Search Criteria</span>
                                            <p className="font-medium text-white">{(userProfile as SeekerProfile).searchCriteria}</p>
                                        </div>
                                    </>
                                )}
                                {(userProfile.type === 'dealer' || userProfile.type === 'developer') && (
                                    <>
                                        <Separator />
                                        <div className="pt-3 space-y-4">
                                            <DetailRow label="Company Name" value={(userProfile as DealerProfile | DeveloperProfile).companyName || 'Not provided'} />
                                            {(userProfile as DealerProfile | DeveloperProfile).reraId && (
                                                <>
                                                    <Separator/>
                                                    <DetailRow label="RERA ID" value={(userProfile as DealerProfile | DeveloperProfile).reraId} />
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {['owner', 'dealer', 'developer'].includes(userProfile.type) && (
                            <Card className="mb-8">
                                <CardHeader>
                                    <CardTitle>My Properties ({userProperties.length})</CardTitle>
                                    <CardDescription>The properties you have listed on LOKALITY.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isPropertiesLoading ? (
                                        <div className="flex justify-center items-center py-10">
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                        </div>
                                    ) : userProperties.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {userProperties.map(property => (
                                                <ShortlistedPropertyCard key={property.id} property={property} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 border border-dashed rounded-lg">
                                            <h3 className="text-lg font-semibold">You haven't listed any properties yet.</h3>
                                            <p className="text-muted-foreground mt-2">Ready to find a buyer or renter?</p>
                                            <Button asChild className="mt-4">
                                                <Link href="/add-property">List a Property</Link>
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                        
                        {userType === 'seeker' && (
                            <Card className="mt-8">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Star className="text-accent" /> Premium Features
                                    </CardTitle>
                                    <CardDescription>Unlock exclusive benefits to supercharge your property search.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                                        <div className="flex items-center gap-4">
                                            <Handshake className="w-6 h-6 text-primary" />
                                            <div>
                                                <h4 className="font-semibold">Expert Consultation</h4>
                                                <p className="text-sm text-muted-foreground">Get professional advice on real estate.</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg">₹500</p>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className='inline-block'>
                                                        <Button size="sm" className="mt-1" disabled>
                                                            <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                                                        </Button>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Payment gateway coming soon!</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                                        <div className="flex items-center gap-4">
                                            <Sparkles className="w-6 h-6 text-primary" />
                                            <div>
                                                <h4 className="font-semibold">AI Features</h4>
                                                <p className="text-sm text-muted-foreground">Advanced AI match analysis & insights.</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg">₹500</p>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className='inline-block'>
                                                        <Button size="sm" className="mt-1" disabled>
                                                            <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                                                        </Button>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Payment gateway coming soon!</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                                        <div className="flex items-center gap-4">
                                            <KeyRound className="w-6 h-6 text-primary" />
                                            <div>
                                                <h4 className="font-semibold">Unlock Big Bargain Properties</h4>
                                                <p className="text-sm text-muted-foreground">Access exclusive off-market deals.</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg">₹1000</p>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className='inline-block'>
                                                        <Button size="sm" className="mt-1" disabled>
                                                            <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                                                        </Button>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Payment gateway coming soon!</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="mt-8">
                            <CardContent className="p-4 space-y-2">
                                 <Link href="/chats"><Button variant="ghost" className="w-full justify-start gap-3"><MessagesSquare className="w-6 h-6" strokeWidth={2.5} /> My Chats</Button></Link>
                                <Separator />
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className='w-full'>
                                            <Button variant="ghost" className="w-full justify-start gap-3" disabled><Shield className="w-6 h-6" strokeWidth={2.5} /> Privacy Policy</Button>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Coming soon!</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Separator />
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className='w-full'>
                                            <Button variant="ghost" className="w-full justify-start gap-3" disabled><FileText className="w-6 h-6" strokeWidth={2.5}/> Terms & Conditions</Button>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Coming soon!</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Separator />
                                <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive gap-3" onClick={handleLogout}><LogOut className="w-6 h-6" strokeWidth={2.5} /> Log Out</Button>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </TooltipProvider>
            <BottomNavBar />
        </>
    );
}
