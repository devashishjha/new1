
import { Header } from "@/components/header";
import { IroningDashboardClient } from "@/components/ironing-dashboard-client";
import { Suspense } from "react";

function DashboardPageContent() {
    return (
        <>
            <Header />
            <main className="container mx-auto py-24 px-4 pb-24">
                <IroningDashboardClient />
            </main>
        </>
    );
}

export const dynamic = 'force-dynamic';

export default function IroningDashboardPage() {
    return (
        <Suspense fallback={<div>Loading dashboard...</div>}>
            <DashboardPageContent />
        </Suspense>
    );
}
