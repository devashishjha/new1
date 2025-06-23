'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Shield, FileText, LogOut, MessagesSquare, Loader2 } from 'lucide-react';
import { BottomNavBar } from '@/components/bottom-nav-bar';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserProfile, SeekerProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

type UserType = 'seeker' | 'owner' | 'dealer' | 'developer';

const baseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "Phone number must be at least 10 digits."),
  bio: z.string().max(200, "Bio can be up to 200 characters.").optional(),
});

const seekerSchema = baseSchema.extend({
  searchCriteria: z.string().min(10, "Please describe what you're looking for."),
});

const dealerSchema = baseSchema.extend({
  companyName: z.string().min(2, "Company name is required."),
  reraId: z.string().optional(),
});

const developerSchema = baseSchema.extend({
  companyName: z.string().min(2, "Company name is required."),
  reraId: z.string().min(5, "A valid RERA ID is required."),
});

const formSchemas = {
  seeker: seekerSchema,
  owner: baseSchema,
  dealer: dealerSchema,
  developer: developerSchema,
};

function ProfileForm({ userProfile, userType, onProfileUpdate }: { userProfile: UserProfile, userType: UserType, onProfileUpdate: (profile: UserProfile) => void }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchemas[userType]),
    values: { // Use `values` to pre-fill the form and react to changes
      name: userProfile.name || '',
      email: userProfile.email || '',
      phone: userProfile.phone || '',
      bio: userProfile.bio || '',
      searchCriteria: userProfile.type === 'seeker' ? userProfile.searchCriteria : '',
      companyName: (userProfile.type === 'dealer' || userProfile.type === 'developer') ? userProfile.companyName : '',
      reraId: (userProfile.type === 'dealer' || userProfile.type === 'developer') ? userProfile.reraId : '',
    },
  });

  async function onSubmit(values: any) {
    if (!user) return;
    setIsSaving(true);
    
    const updatedProfileData: UserProfile = {
        ...userProfile,
        ...values,
        type: userType, // Make sure the type is correctly set
    };
    
    try {
        await setDoc(doc(db, 'users', user.uid), updatedProfileData, { merge: true });
        onProfileUpdate(updatedProfileData); // Notify parent component of the update
        toast({
            title: "Profile Saved!",
            description: `Your ${userType} profile has been updated.`,
        });
    } catch(error) {
        console.error("Error saving profile: ", error);
        toast({
            variant: 'destructive',
            title: "Save Failed",
            description: "An error occurred while saving your profile.",
        });
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField name="name" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem> )}/>
        <FormField name="email" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} disabled /></FormControl><FormMessage /></FormItem> )}/>
        <FormField name="phone" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" placeholder="+91 12345 67890" {...field} /></FormControl><FormMessage /></FormItem> )}/>
        <FormField name="bio" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Short Bio</FormLabel><FormControl><Textarea placeholder="Tell us a little about yourself" {...field} /></FormControl><FormMessage /></FormItem> )}/>
        
        {userType === 'seeker' && (
          <FormField name="searchCriteria" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Your Search Criteria</FormLabel><FormControl><Textarea rows={4} placeholder="e.g., Looking for a 3BHK apartment in a quiet neighborhood..." {...field} /></FormControl><FormMessage /></FormItem> )}/>
        )}

        {(userType === 'dealer' || userType === 'developer') && (
          <FormField name="companyName" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input placeholder="Real Estate Inc." {...field} /></FormControl><FormMessage /></FormItem> )}/>
        )}

        {(userType === 'dealer' || userType === 'developer') && (
          <FormField name="reraId" control={form.control} render={({ field }) => ( <FormItem><FormLabel>RERA ID {userType === 'dealer' && '(Optional)'}</FormLabel><FormControl><Input placeholder="PRM/KA/RERA/..." {...field} /></FormControl><FormMessage /></FormItem> )}/>
        )}
        
        <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? 'Saving...' : 'Save Profile'}
        </Button>
      </form>
    </Form>
  );
}


export default function ProfilePage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [userType, setUserType] = useState<UserType>('seeker');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            getDoc(userDocRef).then(docSnap => {
                if (docSnap.exists()) {
                    const profile = docSnap.data() as UserProfile;
                    setUserProfile(profile);
                    setUserType(profile.type);
                } else {
                    // Create a default profile if one doesn't exist
                    const defaultProfile: SeekerProfile = {
                        id: user.uid,
                        name: user.displayName || 'New User',
                        email: user.email || '',
                        phone: user.phoneNumber || '',
                        bio: 'Welcome to LOKALITY!',
                        type: 'seeker',
                        searchCriteria: 'I am looking for a new property.'
                    };
                    setDoc(userDocRef, defaultProfile).then(() => {
                        setUserProfile(defaultProfile);
                        setUserType('seeker');
                    });
                }
                setIsLoading(false);
            }).catch(error => {
                console.error("Error fetching user profile:", error);
                setIsLoading(false);
                toast({ variant: 'destructive', title: "Error", description: "Could not load your profile." });
            });
        }
    }, [user, toast]);
    
    const handleProfileUpdate = (updatedProfile: UserProfile) => {
        setUserProfile(updatedProfile);
        setUserType(updatedProfile.type);
    };

    const handleTypeChange = (newType: UserType) => {
        if (!userProfile) return;
        
        const baseProfile = {
            id: userProfile.id,
            name: userProfile.name,
            email: userProfile.email,
            phone: userProfile.phone,
            bio: userProfile.bio,
        };

        let newProfile: UserProfile;

        switch (newType) {
            case 'seeker':
                newProfile = { ...baseProfile, type: 'seeker', searchCriteria: (userProfile as SeekerProfile).searchCriteria || '' };
                break;
            case 'owner':
                newProfile = { ...baseProfile, type: 'owner' };
                break;
            case 'dealer':
                newProfile = { ...baseProfile, type: 'dealer', companyName: (userProfile as any).companyName || '', reraId: (userProfile as any).reraId || '' };
                break;
            case 'developer':
                newProfile = { ...baseProfile, type: 'developer', companyName: (userProfile as any).companyName || '', reraId: (userProfile as any).reraId || '' };
                break;
            default:
                newProfile = userProfile;
        }

        setUserProfile(newProfile);
        setUserType(newType);
    };

    const handleLogout = async () => {
        await signOut(auth);
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
    };

    if (isLoading || !userProfile) {
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

    return (
        <>
            <Header />
            <main className="container mx-auto py-24 px-4 pb-24">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold tracking-tight">Your Profile</h1>
                        <p className="text-muted-foreground mt-2">Manage your account settings and profile type.</p>
                    </div>

                    <Card className="mb-8">
                        <CardHeader><CardTitle>Select Your Profile Type</CardTitle><CardDescription>Choose the profile that best describes you.</CardDescription></CardHeader>
                        <CardContent>
                            <RadioGroup value={userType} onValueChange={(v) => handleTypeChange(v as UserType)} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {['seeker', 'owner', 'dealer', 'developer'].map(type => (
                                    <div key={type}>
                                        <RadioGroupItem value={type} id={type} className="peer sr-only" />
                                        <Label htmlFor={type} className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary capitalize cursor-pointer">
                                            {type}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Edit <span className="capitalize text-primary">{userType}</span> Profile</CardTitle>
                            <CardDescription>Fill in your details below.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ProfileForm userProfile={userProfile} userType={userType} onProfileUpdate={handleProfileUpdate} />
                        </CardContent>
                    </Card>

                    <Card className="mt-8">
                        <CardContent className="p-4 space-y-2">
                             <Link href="/chats"><Button variant="ghost" className="w-full justify-start gap-3"><MessagesSquare className="w-6 h-6" strokeWidth={2.5} /> My Chats</Button></Link>
                            <Separator />
                             <Link href="#"><Button variant="ghost" className="w-full justify-start gap-3"><Shield className="w-6 h-6" strokeWidth={2.5} /> Privacy Policy</Button></Link>
                            <Separator />
                             <Link href="#"><Button variant="ghost" className="w-full justify-start gap-3"><FileText className="w-6 h-6" strokeWidth={2.5}/> Terms & Conditions</Button></Link>
                            <Separator />
                            <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive gap-3" onClick={handleLogout}><LogOut className="w-6 h-6" strokeWidth={2.5} /> Log Out</Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
            <BottomNavBar />
        </>
    );
}
