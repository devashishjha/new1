
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
import { AdminUserManagement } from '@/components/admin-user-management';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const { user, loading: authLoading, isAdmin } = useAuth();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading) {
            setIsCheckingAuth(false);
            if (!isAdmin) {
                router.replace('/reels');
            }
        }
    }, [authLoading, isAdmin, router]);

    if (isCheckingAuth || authLoading) {
        return (
            <div className="flex flex-col h-dvh items-center justify-center text-white">
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
                            <p>You do not have permission to view this page. Redirecting...</p>
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
            <div className="container mx-auto py-24 px-4 pb-24 space-y-12">
                <AdminReviewClient />
                <AdminUserManagement />
            </div>
            <BottomNavBar />
        </>
    );
}
