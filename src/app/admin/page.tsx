
'use client';

import { AdminReviewClient } from '@/components/admin-review-client';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/header';
import { BottomNavBar } from '@/components/bottom-nav-bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPage() {
    const { user, loading: authLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setIsCheckingAuth(false);
            setIsAdmin(false);
            return;
        }

        const checkAdminStatus = async () => {
            if (!db) {
                setIsAdmin(false);
                setIsCheckingAuth(false);
                return;
            }
            const userDocRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                const profile = docSnap.data() as UserProfile;
                if (profile.role === 'admin') {
                    setIsAdmin(true);
                }
            }
            setIsCheckingAuth(false);
        };
        checkAdminStatus();

    }, [user, authLoading]);

    if (isCheckingAuth || authLoading) {
        return (
            <div className="flex flex-col h-dvh items-center justify-center bg-gradient-to-br from-black to-blue-950 text-white">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Verifying access...</p>
            </div>
        );
    }
    
    if (!isAdmin) {
        return (
             <>
                <Header />
                <main className="container mx-auto py-24 px-4 pb-24 flex items-center justify-center">
                    <Card className="max-w-md w-full">
                        <CardHeader>
                            <CardTitle>Access Denied</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>You do not have permission to view this page.</p>
                        </CardContent>
                    </Card>
                </main>
                <BottomNavBar />
            </>
        )
    }

    return (
        <>
            <Header />
            <AdminReviewClient />
            <BottomNavBar />
        </>
    );
}
