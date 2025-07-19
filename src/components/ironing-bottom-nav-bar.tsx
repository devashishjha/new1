
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, History, User, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function IroningBottomNavBar() {
    const pathname = usePathname();

    const navItems = [
        { href: '/service-selection', icon: LayoutGrid, label: 'Categories' },
        { href: '/ironing', icon: PlusCircle, label: 'Place Order' },
        { href: '/ironing/profile', icon: History, label: 'History' },
        { href: '/ironing/profile', icon: User, label: 'Profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm border-t border-border/20">
            <div className="container mx-auto grid grid-cols-4 h-16">
                {navItems.map((item, index) => {
                    // Special handling for profile page to highlight both History and Profile icons
                    const isActive = item.label === 'History' || item.label === 'Profile'
                        ? pathname.startsWith(item.href)
                        : pathname === item.href;
                    
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
