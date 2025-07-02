'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { Skeleton } from './ui/skeleton';
import { Loader2, AlertTriangle } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem'
};

// Default center to Bengaluru, India
const defaultCenter = {
  lat: 12.9716,
  lng: 77.5946
};

const libraries: ('places')[] = ['places'];

interface MapLocationPickerProps {
  value: string;
  onChange: (address: string) => void;
}

export function MapLocationPicker({ value, onChange }: MapLocationPickerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;

    // We only set up the search box once the map has loaded.
    if (isLoaded && searchInputRef.current) {
      const searchBox = new window.google.maps.places.SearchBox(searchInputRef.current);
      searchBoxRef.current = searchBox;

      map.addListener('bounds_changed', () => {
        searchBox.setBounds(map.getBounds() as google.maps.LatLngBounds);
      });

      searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();
        if (places && places.length > 0 && places[0].geometry) {
            const location = places[0].geometry.location!;
            const pos = { lat: location.lat(), lng: location.lng() };
            setMarkerPosition(pos);
            setMapCenter(pos);
            if(places[0].formatted_address) {
                onChange(places[0].formatted_address);
            }
        }
      });
    }
  }, [isLoaded, onChange]);

  const onUnmount = useCallback(() => {
    // Clean up listeners when the component unmounts
    if (searchBoxRef.current) {
        window.google.maps.event.clearInstanceListeners(searchBoxRef.current);
    }
    if (mapRef.current) {
        window.google.maps.event.clearInstanceListeners(mapRef.current);
    }
    mapRef.current = null;
  }, []);
  
  // Geocode initial address to set marker in edit mode
  useEffect(() => {
    if (isLoaded && value && !markerPosition) {
        const geocoder = new window.google.maps.Geocoder();
        setIsGeocoding(true);
        geocoder.geocode({ address: value }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
                const location = results[0].geometry.location;
                const pos = { lat: location.lat(), lng: location.lng() };
                setMarkerPosition(pos);
                setMapCenter(pos);
            }
            setIsGeocoding(false);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, value]);


  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setMarkerPosition(newPos);
      
      const geocoder = new window.google.maps.Geocoder();
      setIsGeocoding(true);
      geocoder.geocode({ location: newPos }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          onChange(results[0].formatted_address);
        } else {
            console.error('Geocoder failed due to: ' + status);
        }
        setIsGeocoding(false);
      });
    }
  };

  if (loadError) {
    return (
        <div className="w-full h-[400px] bg-muted/30 rounded-lg flex flex-col items-center justify-center text-center p-4 border border-destructive">
            <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
            <h3 className="text-xl font-semibold text-destructive">Oops! Something went wrong.</h3>
            <p className="text-muted-foreground mt-2">
                This page didn't load Google Maps correctly.
            </p>
            <div className="text-xs text-left bg-destructive/10 p-3 mt-4 rounded-md font-mono text-destructive/80 max-w-full overflow-auto">
                <p className="font-bold">Troubleshooting for Developers:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Ensure the <code className='font-semibold'>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> secret is set correctly.</li>
                    <li>Verify the "Maps JavaScript API" & "Places API" are enabled in your Google Cloud project.</li>
                    <li>Check for billing issues or API key restrictions (e.g., HTTP referrers).</li>
                </ul>
            </div>
        </div>
    );
  }

  if (!isLoaded) {
    return <Skeleton className="w-full h-[400px]" />;
  }

  return (
    <div className='space-y-4'>
        <div>
            <label htmlFor="location-search" className="block text-sm font-medium text-foreground mb-2">Search for a location to place the pin</label>
            <Input 
                id="location-search"
                ref={searchInputRef} 
                placeholder="Search for an area, street, or landmark..."
            />
        </div>
        <div className="relative">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={mapCenter}
                zoom={markerPosition ? 15 : 10}
                onLoad={onMapLoad}
                onUnmount={onUnmount}
                options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                }}
            >
                {markerPosition && (
                    <MarkerF
                        position={markerPosition}
                        draggable={true}
                        onDragEnd={handleMarkerDragEnd}
                    />
                )}
            </GoogleMap>
            {isGeocoding && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm text-foreground text-sm font-medium px-4 py-2 rounded-full flex items-center gap-2">
                    <Loader2 className='w-4 h-4 animate-spin' />
                    Fetching address...
                </div>
            )}
        </div>
         <div>
            <label htmlFor="selected-address" className="block text-sm font-medium text-foreground mb-2">Selected Property Address</label>
            <Input
                id="selected-address"
                readOnly
                value={value}
                placeholder="Drag the pin on the map to select a location."
            />
        </div>
    </div>
  );
}
