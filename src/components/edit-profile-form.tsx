
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db, storage, auth } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/lib/types';
import { Loader2 } from 'lucide-react';


const profileSchema = z.object({
  avatar: z.any().optional(),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  reraId: z.string().optional(),
});

export function EditProfileForm({ profile }: { profile: UserProfile }) {
    const { toast } = useToast();
    const { user } = useAuth();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: profile.name || '',
            phone: profile.phone || '',
            companyName: (profile.type === 'dealer' || profile.type === 'developer') ? profile.companyName || '' : '',
            reraId: (profile.type === 'developer') ? profile.reraId || '' : '',
        },
    });

    async function onSubmit(values: z.infer<typeof profileSchema>) {
        if (!user || !db || !storage || !auth) {
            toast({ variant: 'destructive', title: "Error", description: "Could not update profile. System not ready." });
            return;
        }

        setIsSubmitting(true);

        try {
            const dataToUpdate: Partial<UserProfile> & { name?: string, avatar?: string } = {
                name: values.name,
                phone: values.phone,
            };
            
            const avatarFile = values.avatar?.[0];
            if (avatarFile) {
                toast({ title: "Uploading Photo..." });
                const storageRef = ref(storage, `avatars/${user.uid}/${avatarFile.name}`);
                const uploadResult = await uploadBytes(storageRef, avatarFile);
                dataToUpdate.avatar = await getDownloadURL(uploadResult.ref);
            }

            if (profile.type === 'dealer' || profile.type === 'developer') {
                dataToUpdate.companyName = values.companyName;
            }
            if (profile.type === 'developer') {
                dataToUpdate.reraId = values.reraId;
            }

            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, dataToUpdate);

            if (auth.currentUser && (dataToUpdate.name || dataToUpdate.avatar)) {
                await updateProfile(auth.currentUser, {
                    displayName: dataToUpdate.name,
                    photoURL: dataToUpdate.avatar || auth.currentUser.photoURL,
                });
            }

            toast({
                title: "Profile Updated!",
                description: "Your information has been successfully saved.",
            });
            router.push('/profile');
            router.refresh(); // Force a refresh to show new avatar

        } catch (error) {
            console.error("Error updating profile:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "There was an error saving your profile. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Picture</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="avatar"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Upload a new photo</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => field.onChange(e.target.files)}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        A new photo will replace your existing one.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Your full name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                        <Input type="tel" placeholder="Your phone number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {(profile.type === 'dealer' || profile.type === 'developer') && (
                     <Card>
                        <CardHeader>
                            <CardTitle>Professional Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="companyName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Your company or agency name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {profile.type === 'developer' && (
                                <FormField
                                    control={form.control}
                                    name="reraId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>RERA ID</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Your RERA registration ID" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </CardContent>
                    </Card>
                )}


                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Changes'}
                </Button>
            </form>
        </Form>
    );
}
