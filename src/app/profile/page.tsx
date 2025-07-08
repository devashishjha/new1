
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Shield, FileText, LogOut, MessagesSquare, Loader2, Star, Handshake, Sparkles, KeyRound, ShoppingCart, Pencil, User as UserIcon, MoreVertical, ListVideo, Phone, Mail, Building2, CheckCircle2 } from 'lucide-react';
import { BottomNavBar } from '@/components/bottom-nav-bar';
import { useToast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { UserProfile, Property } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ShortlistedPropertyCard } from '@/components/shortlisted-property-card';
import { dateToJSON } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PresenceDot } from '@/components/presence-dot';


export default function ProfilePage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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
                type: 'seeker',
                searchCriteria: 'I am looking for a new property.',
                avatar: user.photoURL || ''
            };
            setUserProfile(fallbackProfile);
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

    const handleDeleteProperty = (propertyId: string) => {
        setUserProperties(prevProperties => prevProperties.filter(p => p.id !== propertyId));
    };

    const handleUpdateProperty = (updatedProperty: Property) => {
        setUserProperties(prevProperties => 
            prevProperties.map(p => 
                p.id === updatedProperty.id ? updatedProperty : p
            )
        );
    };

    if (isLoading) {
        return (
             <>
                <Header />
                <main className="container mx-auto py-24 px-4 pb-24">
                    <div className="max-w-2xl mx-auto space-y-8">
                        <div className="flex flex-col items-center text-center mb-12">
                            <Skeleton className="h-32 w-32 rounded-full mb-4" />
                            <Skeleton className="h-10 w-48 mb-2" />
                            <Skeleton className="h-5 w-64" />
                        </div>
                        <Skeleton className="h-96 w-full" />
                    </div>
                </main>
                <BottomNavBar />
             </>
        )
    }

    if (!userProfile) {
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

    const occupiedCount = userProperties.filter(p => p.status === 'occupied').length;

    return (
        <>
            <Header />
            <TooltipProvider>
                <main className="container mx-auto py-24 px-4 pb-24">
                    <div className="max-w-2xl mx-auto relative">

                        <div className="absolute top-0 right-0 z-50">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-5 w-5" />
                                        <span className="sr-only">Open menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DropdownMenuItem disabled>
                                                <Shield className="mr-2 h-4 w-4" /> Privacy Policy
                                            </DropdownMenuItem>
                                        </TooltipTrigger>
                                        <TooltipContent side="left"><p>Coming soon!</p></TooltipContent>
                                    </Tooltip>
                                     <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DropdownMenuItem disabled>
                                                <FileText className="mr-2 h-4 w-4" /> Terms & Conditions
                                            </DropdownMenuItem>
                                        </TooltipTrigger>
                                        <TooltipContent side="left"><p>Coming soon!</p></TooltipContent>
                                    </Tooltip>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                        <LogOut className="mr-2 h-4 w-4" /> Log Out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        
                        <div className="flex flex-col items-center text-center mb-12">
                            <div className="relative mb-4">
                                <Avatar className="h-32 w-32 border-4 border-primary/50">
                                    <AvatarImage src={userProfile.avatar} alt={userProfile.name} data-ai-hint="person portrait" />
                                    <AvatarFallback className="text-4xl">
                                        {userProfile.avatar ? userProfile.name.charAt(0) : <UserIcon className="w-16 h-16 text-muted-foreground" />}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-2 right-8">
                                    <PresenceDot userId={userProfile.id} />
                                </div>
                                <Button asChild variant="outline" size="icon" className="absolute bottom-0 right-0 rounded-full bg-background">
                                    <Link href="/profile/edit">
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Edit Profile</span>
                                    </Link>
                                </Button>
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight">{userProfile.name}</h1>
                            
                            <div className="flex items-center justify-center gap-4 mt-4">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <a href={`mailto:${userProfile.email}`}>
                                            <Button variant="outline" size="icon">
                                                <Mail className="h-5 w-5" />
                                                <span className="sr-only">Email</span>
                                            </Button>
                                        </a>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{userProfile.email}</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        {userProfile.phone ? (
                                            <a href={`tel:${userProfile.phone}`}>
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
                                        {userProfile.phone ? <p>{userProfile.phone}</p> : <p>No phone number provided.</p>}
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link href="/chats">
                                            <Button variant="outline" size="icon">
                                                <MessagesSquare className="h-5 w-5" />
                                                <span className="sr-only">Chat</span>
                                            </Button>
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Start a chat</p></TooltipContent>
                                </Tooltip>
                            </div>

                            <Badge variant="secondary" className="capitalize mt-6">{userProfile.type}</Badge>
                        </div>

                        {['owner', 'dealer', 'developer'].includes(userProfile.type) && (
                            <div className="mb-8 grid grid-cols-3 gap-4">
                                <Card className="p-4 text-center flex flex-col items-center justify-center">
                                    <Building2 className="w-8 h-8 text-primary mb-2" />
                                    <p className="text-2xl font-bold">{userProperties.length}</p>
                                    <p className="text-sm text-muted-foreground">Listings</p>
                                </Card>
                                <Card className="p-4 text-center flex flex-col items-center justify-center">
                                    <CheckCircle2 className="w-8 h-8 text-primary mb-2" />
                                    <p className="text-2xl font-bold">{occupiedCount}</p>
                                    <p className="text-sm text-muted-foreground">Occupied</p>
                                </Card>
                                <Card className="p-4 text-center flex flex-col items-center justify-center">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="cursor-pointer">
                                                <Star className="w-8 h-8 text-accent mb-2 mx-auto" />
                                                <p className="text-2xl font-bold">4.5</p>
                                                <p className="text-sm text-muted-foreground">Rating</p>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Rating feature coming soon!</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </Card>
                            </div>
                        )}

                        {['owner', 'dealer', 'developer'].includes(userProfile.type) && (
                            <Card className="mb-8">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ListVideo className="w-6 h-6 text-primary" />
                                        <span className="text-lg">My Listings ({userProperties.length})</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {isPropertiesLoading ? (
                                        <div className="flex justify-center items-center py-10">
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                        </div>
                                    ) : userProperties.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {userProperties.map(property => (
                                                <ShortlistedPropertyCard
                                                    key={property.id}
                                                    property={property}
                                                    onDelete={handleDeleteProperty}
                                                    onUpdate={handleUpdateProperty}
                                                />
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
                        
                        {userProfile.type === 'seeker' && (
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
                    </div>
                </main>
            </TooltipProvider>
            <BottomNavBar />
        </>
    );
}
