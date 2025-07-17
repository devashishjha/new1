
'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

const containerStyle = {
  width: '100vw',
  height: '100dvh'
};

const libraries: ('places')[] = ['places'];

function MapView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const address = searchParams.get('address');
  
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const [position, setPosition] = useState<google.maps.LatLngLiteral | null>(null);

  useEffect(() => {
    if (isLoaded && address) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const location = results[0].geometry.location;
          setPosition({ lat: location.lat(), lng: location.lng() });
        } else {
          console.error(`Geocode was not successful for the following reason: ${status}`);
          // Handle address not found
        }
      });
    }
  }, [isLoaded, address]);
  
  if (loadError) {
    return (
        <div className="w-screen h-dvh flex flex-col items-center justify-center text-center p-4">
            <AlertTriangle className="w-12 h-12 text-destructive" />
            <h3 className="text-xl font-semibold text-destructive mt-4">Map Loading Failed</h3>
            <p className="text-muted-foreground mt-2">
                There was an issue loading Google Maps.
            </p>
            <Button onClick={() => router.back()} className="mt-6">
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
        </div>
    );
  }

  if (!isLoaded || !position) {
    return (
      <div className="w-screen h-dvh flex flex-col items-center justify-center text-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Loading Map...</p>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-dvh">
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={position}
            zoom={15}
            options={{
                streetViewControl: true,
                mapTypeControl: false,
                fullscreenControl: false,
            }}
        >
            <MarkerF position={position} />
        </GoogleMap>
        <div className="absolute top-4 left-4 z-10">
            <Button size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
                 <span className="sr-only">Go Back</span>
            </Button>
        </div>
         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-background/80 backdrop-blur-sm p-3 rounded-lg w-11/12 max-w-md text-center">
            <p className="font-semibold text-foreground">{address}</p>
        </div>
    </div>
  );
}


export default function MapPage() {
    return (
        <Suspense fallback={<div className="w-screen h-dvh flex flex-col items-center justify-center text-center p-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="text-muted-foreground mt-4">Loading...</p></div>}>
            <MapView />
        </Suspense>
    )
}
