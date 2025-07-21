
'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, ShieldCheck, User, Search, UserX, Shirt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { Input } from './ui/input';

function UserResultCard({ profile, onUpdate }: { profile: UserProfile, onUpdate: (updatedProfile: UserProfile) => void }) {
    const { toast } = useToast();
    const { user: adminUser } = useAuth();
    const [isProcessingAdmin, setIsProcessingAdmin] = useState(false);
    const [isProcessingServiceProvider, setIsProcessingServiceProvider] = useState(false);
    
    const isSelf = adminUser?.uid === profile.id;

    const handleRoleChange = async (roleToToggle: 'admin' | 'service-provider') => {
        if (roleToToggle === 'admin' && isSelf) {
            toast({ variant: 'destructive', title: 'Action Not Allowed', description: 'You cannot change your own admin role.' });
            return;
        }

        if (roleToToggle === 'admin') setIsProcessingAdmin(true);
        if (roleToToggle === 'service-provider') setIsProcessingServiceProvider(true);
        
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
            if (roleToToggle === 'admin') setIsProcessingAdmin(false);
            if (roleToToggle === 'service-provider') setIsProcessingServiceProvider(false);
            return;
        }
        
        const userDocRef = doc(db, 'users', profile.id);
        const newRole = profile.role === roleToToggle ? undefined : roleToToggle;

        try {
            await updateDoc(userDocRef, { role: newRole });
            const updatedProfile = { ...profile, role: newRole };
            onUpdate(updatedProfile);
            toast({ title: 'Success', description: `${profile.name}'s role has been updated.` });
        } catch (error) {
            console.error("Error updating role:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update user role.' });
        } finally {
            if (roleToToggle === 'admin') setIsProcessingAdmin(false);
            if (roleToToggle === 'service-provider') setIsProcessingServiceProvider(false);
        }
    };

    return (
        <div className="border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                 <Avatar className="h-12 w-12">
                    <AvatarImage src={profile.avatar} alt={profile.name} />
                    <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{profile.name}</p>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{profile.type}</p>
                </div>
            </div>
             <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                 <Button 
                    size="sm" 
                    variant={profile.role === 'admin' ? 'destructive' : 'outline'}
                    onClick={() => handleRoleChange('admin')}
                    disabled={isProcessingAdmin || isProcessingServiceProvider || isSelf}
                    className="w-full"
                >
                    {isProcessingAdmin ? <Loader2 className="animate-spin" /> : (
                        profile.role === 'admin' 
                            ? <><ShieldCheck className="mr-2" /> Revoke Admin</>
                            : <><Shield className="mr-2" /> Grant Admin</>
                    )}
                </Button>
                <Button 
                    size="sm" 
                    variant={profile.role === 'service-provider' ? 'default' : 'outline'}
                    onClick={() => handleRoleChange('service-provider')}
                    disabled={isProcessingAdmin || isProcessingServiceProvider || profile.role === 'service-provider'}
                    className="w-full"
                >
                    {isProcessingServiceProvider ? <Loader2 className="animate-spin" /> : (
                        profile.role === 'service-provider' 
                            ? <><Shirt className="mr-2" /> Service Provider</>
                            : <><Shirt className="mr-2" /> Grant Service Provider</>
                    )}
                </Button>
             </div>
        </div>
    );
}

export function AdminUserManagement() {
    const [searchEmail, setSearchEmail] = useState('');
    const [searchedUser, setSearchedUser] = useState<UserProfile | null | 'not-found'>(null);
    const [isSearching, setIsSearching] = useState(false);
    const { toast } = useToast();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchEmail.trim()) {
            toast({ variant: 'destructive', title: 'Email required', description: 'Please enter an email to search.' });
            return;
        }

        setIsSearching(true);
        setSearchedUser(null);

        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
            setIsSearching(false);
            return;
        }

        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", searchEmail.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setSearchedUser('not-found');
            } else {
                const userDoc = querySnapshot.docs[0];
                setSearchedUser({ id: userDoc.id, ...userDoc.data() } as UserProfile);
            }
        } catch (error) {
            console.error("Error searching for user:", error);
            toast({ variant: 'destructive', title: 'Search Failed', description: 'An error occurred while searching.' });
            setSearchedUser(null);
        } finally {
            setIsSearching(false);
        }
    };
    
    const handleProfileUpdate = (updatedProfile: UserProfile) => {
        setSearchedUser(updatedProfile);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Grant or revoke user roles by searching for their email.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSearch} className="flex items-center gap-2 mb-6">
                    <Input
                        type="email"
                        placeholder="Enter user's email address"
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        disabled={isSearching}
                        className="bg-background"
                    />
                    <Button type="submit" disabled={isSearching}>
                        {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
                    </Button>
                </form>

                {isSearching && (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-4 text-muted-foreground">Searching...</p>
                    </div>
                )}
                
                {searchedUser === 'not-found' && (
                    <div className="text-center py-10 border border-dashed rounded-lg">
                        <UserX className="mx-auto h-10 w-10 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">User Not Found</h3>
                        <p className="mt-1 text-sm text-muted-foreground">No user exists with the email: {searchEmail}</p>
                    </div>
                )}

                {searchedUser && searchedUser !== 'not-found' && (
                    <UserResultCard profile={searchedUser} onUpdate={handleProfileUpdate} />
                )}

            </CardContent>
        </Card>
    );
}
