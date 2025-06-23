import { AddPropertyForm } from "@/components/add-property-form";
import { BottomNavBar } from "@/components/bottom-nav-bar";
import { Header } from "@/components/header";

export default function AddPropertyPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto py-24 px-4 pb-24">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Add Your Property</h1>
            <p className="text-muted-foreground mb-8">Fill out the details below to list your property on LOKALITY.</p>
            <AddPropertyForm />
        </div>
      </main>
      <BottomNavBar />
    </>
  );
}
