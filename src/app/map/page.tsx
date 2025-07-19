
'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleMap, useJsApiLoader, MarkerF, StreetViewPanorama } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, Home } from 'lucide-react';
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
  const [streetViewAvailable, setStreetViewAvailable] = useState(false);
  const [isCheckingStreetView, setIsCheckingStreetView] = useState(true);

  useEffect(() => {
    if (isLoaded && address) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const location = results[0].geometry.location;
          const pos = { lat: location.lat(), lng: location.lng() };
          setPosition(pos);

          const streetViewService = new window.google.maps.StreetViewService();
          streetViewService.getPanorama({ location: pos, radius: 50 }, (data, status) => {
            if (status === 'OK') {
              setStreetViewAvailable(true);
            } else {
              setStreetViewAvailable(false);
            }
            setIsCheckingStreetView(false);
          });
        } else {
          console.error(`Geocode was not successful for the following reason: ${status}`);
          setIsCheckingStreetView(false);
        }
      });
    }
  }, [isLoaded, address]);
  
  const goBack = () => router.back();

  if (loadError) {
    return (
        <div className="w-screen h-dvh flex flex-col items-center justify-center text-center p-4">
            <AlertTriangle className="w-12 h-12 text-destructive" />
            <h3 className="text-xl font-semibold text-destructive mt-4">Map Loading Failed</h3>
            <p className="text-muted-foreground mt-2">
                There was an issue loading Google Maps.
            </p>
            <Button onClick={goBack} className="mt-6">
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
        </div>
    );
  }

  if (!isLoaded || isCheckingStreetView) {
    return (
      <div className="w-screen h-dvh flex flex-col items-center justify-center text-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Finding Location...</p>
      </div>
    );
  }
  
  if (!position) {
    return (
       <div className="w-screen h-dvh flex flex-col items-center justify-center text-center p-4">
          <AlertTriangle className="w-12 h-12 text-destructive" />
          <h3 className="text-xl font-semibold text-destructive mt-4">Location Not Found</h3>
          <p className="text-muted-foreground mt-2">
              We couldn't find the address you were looking for.
          </p>
          <Button onClick={goBack} className="mt-6">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
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
              streetViewControl: streetViewAvailable,
              mapTypeControl: false,
              fullscreenControl: false,
          }}
      >
          {<MarkerF position={position} />}
          {streetViewAvailable && (
            <StreetViewPanorama
              options={{
                addressControl: true,
                enableCloseButton: false,
              }}
            />
          )}
      </GoogleMap>

      <div className="absolute top-4 left-4 z-10">
          <Button size="icon" onClick={goBack}>
              <ArrowLeft className="h-5 w-5" />
               <span className="sr-only">Go Back</span>
          </Button>
      </div>

       <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-background/80 backdrop-blur-sm p-3 rounded-lg w-11/12 max-w-md text-center">
          <p className="font-semibold text-foreground">{address}</p>
          {!streetViewAvailable && <p className="text-xs text-muted-foreground mt-1">Street View not available for this location.</p>}
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
