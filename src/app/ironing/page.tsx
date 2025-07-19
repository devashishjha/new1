
import { IroningForm } from "@/components/ironing-form";
import { Header } from "@/components/header";

export default function IroningPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto py-24 px-4 pb-24">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight mb-8">Ironing Service</h1>
            <IroningForm />
        </div>
      </main>
    </>
  );
}
