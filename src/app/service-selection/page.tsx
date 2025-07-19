
'use client';

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight, Home, Shield } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";
import { useAuth } from "@/hooks/use-auth";

export default function ServiceSelectionPage() {
    const { isAdmin } = useAuth();

    return (
        <>
            <Header />
            <main className="flex min-h-screen flex-col items-center justify-center p-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold tracking-tight">Choose a Service</h1>
                    <p className="text-muted-foreground mt-2">Select which service you'd like to use today.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
                    <Link href="/reels" className="group">
                        <Card className="hover:border-primary transition-all hover:scale-105 transform-gpu">
                            <CardHeader className="p-8">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <Home className="w-12 h-12 text-primary mb-4" />
                                        <CardTitle className="text-2xl">Housing</CardTitle>
                                        <CardDescription>Find your next home.</CardDescription>
                                    </div>
                                    <ArrowRight className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                    <Link href="/ironing" className="group">
                        <Card className="hover:border-primary transition-all hover:scale-105 transform-gpu">
                            <CardHeader className="p-8">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mb-4"><path d="M16.7 12.3c.3-.3.5-.7.5-1.1s-.2-.8-.5-1.1c-.6-.6-1.5-.6-2.1 0l-4.2 4.2c-.6.6-.6 1.5 0 2.1.3.3.7.5 1.1.5s.8-.2 1.1-.5l4.2-4.2z"/><path d="m22 2-1.5 1.5"/><path d="M20 7h2"/><path d="M22 12h-2"/><path d="M15.5 15.5 14 14"/><path d="M12 22v-2"/><path d="M7 20l1.5-1.5"/><path d="M2 22h2"/><path d="M2 12h2"/><path d="M7 7.5 5.5 9"/><path d="m15 2-3 3-2.5 2.5-4 4-2.5 2.5-3 3"/><path d="m9 15 6-6"/></svg>
                                        <CardTitle className="text-2xl">Ironing</CardTitle>
                                        <CardDescription>Get your clothes professionally ironed.</CardDescription>
                                    </div>
                                     <ArrowRight className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                    {isAdmin && (
                        <Link href="/admin" className="group">
                            <Card className="hover:border-accent transition-all hover:scale-105 transform-gpu bg-accent/10 border-accent/30">
                                <CardHeader className="p-8">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <Shield className="w-12 h-12 text-accent mb-4" />
                                            <CardTitle className="text-2xl">Admin Panel</CardTitle>
                                            <CardDescription>Manage users and content.</CardDescription>
                                        </div>
                                        <ArrowRight className="w-8 h-8 text-muted-foreground group-hover:text-accent transition-colors" />
                                    </div>
                                </CardHeader>
                            </Card>
                        </Link>
                    )}
                </div>
            </main>
        </>
    );
}
