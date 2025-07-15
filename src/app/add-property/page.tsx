import { AddPropertyForm } from "@/components/add-property-form";
import { BottomNavBar } from "@/components/bottom-nav-bar";
import { Header } from "@/components/header";

export default function AddPropertyPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto py-24 px-4 pb-24">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight mb-8">Add Your Property</h1>
            <AddPropertyForm />
        </div>
      </main>
      <BottomNavBar />
    </>
  );
}
