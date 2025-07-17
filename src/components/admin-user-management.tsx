
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { collection, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, ShieldCheck, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from './ui/badge';
import { useAuth } from '@/hooks/use-auth';

function UserRow({ profile }: { profile: UserProfile }) {
    const { toast } = useToast();
    const { user: adminUser } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Prevent admin from changing their own role to avoid lockout
    const isSelf = adminUser?.uid === profile.id;

    const handleRoleChange = async () => {
        if (isSelf) {
            toast({ variant: 'destructive', title: 'Action Not Allowed', description: 'You cannot change your own role.' });
            return;
        }

        setIsProcessing(true);
        if (!db) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
            setIsProcessing(false);
            return;
        }
        
        const userDocRef = doc(db, 'users', profile.id);
        const newRole = profile.role === 'admin' ? null : 'admin';

        try {
            await updateDoc(userDocRef, { role: newRole });
            toast({ title: 'Success', description: `${profile.name}'s role has been updated.` });
        } catch (error) {
            console.error("Error updating role:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update user role.' });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <TableRow>
            <TableCell>
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={profile.avatar} alt={profile.name} />
                        <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium">{profile.name}</p>
                        <p className="text-xs text-muted-foreground">{profile.id}</p>
                    </div>
                </div>
            </TableCell>
            <TableCell>{profile.email}</TableCell>
            <TableCell className="text-center">
                <Badge variant="secondary" className="capitalize">{profile.type}</Badge>
            </TableCell>
            <TableCell className="text-right">
                <Button 
                    size="sm" 
                    variant={profile.role === 'admin' ? 'destructive' : 'outline'}
                    onClick={handleRoleChange}
                    disabled={isProcessing || isSelf}
                >
                    {isProcessing ? <Loader2 className="animate-spin" /> : (
                        profile.role === 'admin' 
                            ? <><ShieldCheck className="mr-2" /> Revoke Admin</>
                            : <><Shield className="mr-2" /> Grant Admin</>
                    )}
                </Button>
            </TableCell>
        </TableRow>
    );
}


export function AdminUserManagement() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!db) {
            setIsLoading(false);
            return;
        }
        
        const q = collection(db, "users");
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[];
            setUsers(userList);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching users:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch user list.' });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Grant or revoke admin privileges for users.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                     <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                ) : users.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-center">Type</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(user => <UserRow key={user.id} profile={user} />)}
                        </TableBody>
                    </Table>
                ) : (
                     <div className="text-center py-20 border border-dashed rounded-lg mt-10">
                        <h2 className="text-xl font-semibold">No Users Found</h2>
                        <p className="text-muted-foreground mt-2">The user list is currently empty.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
