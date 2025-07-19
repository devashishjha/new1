import { IroningBottomNavBar } from "@/components/ironing-bottom-nav-bar";

export default function IroningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <IroningBottomNavBar />
    </>
  );
}
