import { IroningBottomNavBar } from "@/components/ironing-bottom-nav-bar";
import { Suspense } from "react";

export default function IroningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Suspense fallback={<div className="fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-sm border-t border-border/20" />}>
        <IroningBottomNavBar />
      </Suspense>
    </>
  );
}
