'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, PlusCircle, Bookmark, User, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/reels', icon: Home, label: 'Home' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/add-property', icon: PlusCircle, label: 'Add' },
    { href: '/shortlisted', icon: Bookmark, label: 'Shortlisted' },
    { href: '/profile', icon: User, label: 'Profile' },
];

export function BottomNavBar() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-sm border-t border-border/20">
            <div className="container mx-auto grid grid-cols-5 h-16">
                {navItems.map((item) => {
                    const isActive = item.href === '/reels' 
                        ? pathname === item.href 
                        : pathname.startsWith(item.href);
                    return (
                        <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors pt-1">
                            <item.icon className={cn("h-6 w-6", isActive ? "text-primary" : "")} strokeWidth={2.5} />
                            <span className={cn("text-xs mt-1 font-medium", isActive ? "text-primary font-bold" : "")}>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
