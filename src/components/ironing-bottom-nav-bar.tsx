
'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { LayoutGrid, History, User, PlusCircle, Package, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import { Skeleton } from './ui/skeleton';

export function IroningBottomNavBar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view');
    const { user, loading: authLoading } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }
            if (!db) {
                 setIsLoading(false);
                 return;
            }
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                setProfile(userDocSnap.data() as UserProfile);
            }
            setIsLoading(false);
        };
        if (!authLoading) {
            fetchProfile();
        }
    }, [user, authLoading]);
    
    if (isLoading || authLoading) {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm border-t border-border/20">
                <div className="container mx-auto grid grid-cols-3 h-16">
                    <Skeleton className="h-10 w-10 rounded-full self-center justify-self-center" />
                    <Skeleton className="h-10 w-10 rounded-full self-center justify-self-center" />
                    <Skeleton className="h-10 w-10 rounded-full self-center justify-self-center" />
                </div>
            </div>
        );
    }
    
    const isServiceProvider = profile?.role === 'service-provider';

    const regularNavItems = [
        { href: '/service-selection', icon: LayoutGrid, label: 'Categories' },
        { href: '/ironing', icon: PlusCircle, label: 'Place Order' },
        { href: '/ironing/profile?view=history', icon: History, label: 'History', view: 'history' },
        { href: '/ironing/profile?view=profile', icon: User, label: 'Profile', view: 'profile' },
    ];
    
    const serviceProviderNavItems = [
        { href: '/service-selection', icon: LayoutGrid, label: 'Categories' },
        { href: '/ironing/dashboard', icon: Package, label: 'Dashboard' },
        { href: '/ironing/pricing', icon: Tag, label: 'Pricing' },
        { href: '/ironing/profile?view=profile', icon: User, label: 'Profile', view: 'profile' },
    ];

    const navItems = isServiceProvider ? serviceProviderNavItems : regularNavItems;
    const gridColsClass = isServiceProvider ? 'grid-cols-4' : 'grid-cols-4';

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm border-t border-border/20">
            <div className={`container mx-auto grid ${gridColsClass} h-16`}>
                {navItems.map((item, index) => {
                    let isActive = false;
                    if (item.view) {
                         isActive = pathname.startsWith('/ironing/profile') && currentView === item.view;
                    } else {
                         isActive = pathname === item.href;
                    }
                     if (pathname === '/ironing' && item.href === '/ironing') {
                        isActive = true;
                    }
                    
                    return (
                        <Link key={`${item.href}-${index}`} href={item.href} className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors pt-1">
                            <item.icon className={cn("h-6 w-6 transition-all", isActive ? "text-primary [filter:drop-shadow(0_0_8px_hsl(var(--primary)))]" : "")} strokeWidth={2.5} />
                            <span className={cn("text-xs mt-1 font-medium transition-colors", isActive ? "text-primary font-bold" : "")}>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
