
import { Header } from "@/components/header";
import { IroningPricingClient } from "@/components/ironing-pricing-client";

export default function IroningPricingPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto py-24 px-4 pb-24">
        <IroningPricingClient />
      </main>
    </>
  );
}
