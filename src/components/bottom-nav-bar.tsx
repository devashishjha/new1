
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, PlusCircle, Bookmark, User, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const IroningIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M16.7 12.3c.3-.3.5-.7.5-1.1s-.2-.8-.5-1.1c-.6-.6-1.5-.6-2.1 0l-4.2 4.2c-.6.6-.6 1.5 0 2.1.3.3.7.5 1.1.5s.8-.2 1.1-.5l4.2-4.2z"/><path d="m22 2-1.5 1.5"/><path d="M20 7h2"/><path d="M22 12h-2"/><path d="M15.5 15.5 14 14"/><path d="M12 22v-2"/><path d="M7 20l1.5-1.5"/><path d="M2 22h2"/><path d="M2 12h2"/><path d="M7 7.5 5.5 9"/><path d="m15 2-3 3-2.5 2.5-4 4-2.5 2.5-3 3"/><path d="m9 15 6-6"/>
    </svg>
);


const navItems = [
    { href: '/reels', icon: Home, label: 'Home' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/add-property', icon: PlusCircle, label: 'Add' },
    { href: '/ironing', icon: IroningIcon, label: 'Ironing' },
    { href: '/shortlisted', icon: Bookmark, label: 'Shortlisted' },
    { href: '/profile', icon: User, label: 'Profile' },
];

export function BottomNavBar() {
    const pathname = usePathname();

    const housingPaths = ['/reels', '/search', '/add-property', '/shortlisted'];
    const isHousingActive = housingPaths.some(p => pathname.startsWith(p));
    const isIroningActive = pathname.startsWith('/ironing');

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm border-t border-border/20">
            <div className="container mx-auto grid grid-cols-6 h-16">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    
                    // Special handling for Home icon to be active for all housing related paths
                    if (item.href === '/reels' && isHousingActive) {
                         return (
                            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors pt-1">
                                <item.icon className={cn("h-6 w-6 transition-all", "text-primary [filter:drop-shadow(0_0_8px_hsl(var(--primary)))]")} strokeWidth={2.5} />
                                <span className={cn("text-xs mt-1 font-medium transition-colors", "text-primary font-bold")}>{item.label}</span>
                            </Link>
                        );
                    }
                    
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
