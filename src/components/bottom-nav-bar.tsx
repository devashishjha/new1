
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, PlusCircle, Bookmark, User, LayoutGrid, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

const regularNavItems = [
    { href: '/service-selection', icon: LayoutGrid, label: 'Categories' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/add-property', icon: PlusCircle, label: 'Add' },
    { href: '/shortlisted', icon: Bookmark, label: 'Shortlisted' },
    { href: '/profile', icon: User, label: 'Profile' },
];

const adminNavItems = [
    { href: '/service-selection', icon: LayoutGrid, label: 'Categories' },
    { href: '/admin', icon: Users, label: 'Users' },
    { href: '/profile', icon: User, label: 'Profile' },
]

export function BottomNavBar() {
    const pathname = usePathname();
    const { isAdmin } = useAuth();

    const housingPaths = ['/reels', '/search', '/add-property', '/shortlisted', '/profile', '/view-profile', '/edit-property', '/chats', '/admin', '/service-selection'];
    const isHousingFlow = housingPaths.some(p => pathname.startsWith(p));
    
    if (!isHousingFlow) {
        return null;
    }

    const navItems = isAdmin && pathname.startsWith('/admin') ? adminNavItems : regularNavItems;
    const gridColsClass = navItems.length === 3 ? 'grid-cols-3' : 'grid-cols-5';

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm border-t border-border/20">
            <div className={`container mx-auto grid ${gridColsClass} h-16`}>
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    
                    return (
                        <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors pt-1">
                            <item.icon className={cn("h-6 w-6 transition-all", isActive ? "text-primary [filter:drop-shadow(0_0_8px_hsl(var(--primary)))]" : "")} strokeWidth={2.5} />
                            <span className={cn("text-xs mt-1 font-medium transition-colors", isActive ? "text-primary font-bold" : "")}>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
