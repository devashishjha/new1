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
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Using a ref for the callback is a good practice to avoid re-running the effect
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Effect to set up the Autocomplete once the map is loaded
  useEffect(() => {
    if (isLoaded && searchInputRef.current && !autocompleteRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
            componentRestrictions: { country: 'in' },
            fields: ["formatted_address", "geometry.location"],
        });
        autocompleteRef.current = autocomplete;
        
        const listener = autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry?.location) {
                const location = place.geometry.location;
                const pos = { lat: location.lat(), lng: location.lng() };
                setMarkerPosition(pos);
                setMapCenter(pos);
            }
             if (place.formatted_address) {
                onChangeRef.current(place.formatted_address);
            }
        });
        
        return () => {
             if (autocompleteRef.current) {
                window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
            }
        }
    }
  }, [isLoaded]);

  // Effect to geocode initial address to set marker in edit mode
  useEffect(() => {
    if (isLoaded && value && !markerPosition) {
        const geocoder = new window.google.maps.Geocoder();
        setIsGeocoding(true);
        geocoder.geocode({ address: value }, (results, status) => {
            setIsGeocoding(false);
            if (status === 'OK' && results?.[0]) {
                const location = results[0].geometry.location;
                const pos = { lat: location.lat(), lng: location.lng() };
                setMarkerPosition(pos);
                setMapCenter(pos);
            }
        });
    }
  }, [isLoaded, value, markerPosition]);


  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setMarkerPosition(newPos);
      
      const geocoder = new window.google.maps.Geocoder();
      setIsGeocoding(true);
      geocoder.geocode({ location: newPos }, (results, status) => {
        setIsGeocoding(false);
        if (status === 'OK' && results?.[0]) {
          onChangeRef.current(results[0].formatted_address);
          if (searchInputRef.current) {
              searchInputRef.current.value = results[0].formatted_address;
          }
        } else {
            console.error('Geocoder failed due to: ' + status);
        }
      });
    }
  };

  const onMapLoad = useCallback((map: google.maps.Map) => {
    // Optional: You can do something with the map instance here
  }, []);

  if (loadError) {
    return (
        <div className="w-full h-auto bg-muted/30 rounded-lg flex flex-col items-center justify-center text-center p-4 border border-destructive space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive" />
            <h3 className="text-xl font-semibold text-destructive">Map Loading Failed</h3>
            <p className="text-muted-foreground">
                There was an issue loading Google Maps. Please ensure the API key is correct and all required APIs are enabled.
            </p>
            {/* Fallback to simple input */}
             <div className='w-full text-left space-y-2'>
                <label htmlFor="location-fallback" className="block text-sm font-medium text-foreground">Location (Manual Entry)</label>
                <Input
                    id="location-fallback"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Enter location manually"
                />
            </div>
        </div>
    );
  }

  if (!isLoaded) {
    return <Skeleton className="w-full h-[460px]" />;
  }

  return (
    <div className='space-y-4'>
        <div>
            <label htmlFor="location-search" className="block text-sm font-medium text-foreground mb-2">Search for a location</label>
            <Input 
                id="location-search"
                ref={searchInputRef} 
                placeholder="Search for an area, street, or landmark..."
                // Use defaultValue to prevent React from overwriting Google's manipulations
                defaultValue={value}
                onChange={(e) => {
                  // This allows manual typing to still update the form state,
                  // even though Autocomplete will take over on selection.
                  onChange(e.target.value);
                }}
            />
        </div>
        <div className="relative">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={mapCenter}
                zoom={markerPosition ? 15 : 10}
                onLoad={onMapLoad}
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
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm text-foreground text-sm font-medium px-4 py-2 rounded-full flex items-center gap-2 z-10">
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
                className="bg-muted/50 cursor-default"
            />
        </div>
    </div>
  );
}
