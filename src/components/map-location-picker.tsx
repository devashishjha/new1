
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { Skeleton } from './ui/skeleton';
import { Loader2 } from 'lucide-react';

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

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
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

  // Setup search box
  useEffect(() => {
    if (isLoaded && mapRef.current && searchInputRef.current) {
        const searchBox = new window.google.maps.places.SearchBox(searchInputRef.current);
        
        const listener = searchBox.addListener('places_changed', () => {
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
        
        return () => {
            window.google.maps.event.removeListener(listener);
        }
    }
  }, [isLoaded, onChange]);


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
    return <div>Error loading maps. Please check the API key and configuration.</div>;
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
