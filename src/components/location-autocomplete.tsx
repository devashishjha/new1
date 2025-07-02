'use client';

import React, { useRef, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const libraries: ('places')[] = ['places'];

export function LocationAutocomplete({ value, onChange, placeholder }: LocationAutocompleteProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  
  // Using a ref for the callback is a good practice to avoid re-running the effect
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (isLoaded && inputRef.current) {
      const options = {
        types: ['geocode'],
        componentRestrictions: { country: 'in' },
      };
      
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, options);
      
      const listener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place?.formatted_address) {
          onChangeRef.current(place.formatted_address);
        }
      });
      
      return () => {
          // Clean up the listener when the component unmounts
          window.google.maps.event.removeListener(listener);
      }
    }
  }, [isLoaded]);

  if (loadError) {
      console.error("Google Maps API failed to load: ", loadError)
      // Fallback to a regular controlled input on error
      return <Input onChange={(e) => onChange(e.target.value)} value={value} placeholder={placeholder ? `${placeholder} (Maps error)` : "Location (Maps error)"} />
  }

  if (!isLoaded) {
    return (
      <Input
        value={value}
        placeholder={placeholder ? `${placeholder} (Loading Maps...)` : "Loading Maps..."}
        disabled
      />
    );
  }

  // Using `defaultValue` makes the input "uncontrolled" from React's perspective after the initial render.
  // This allows the Google Maps script to manage the input's value without React overwriting it on every render.
  // We still provide an `onChange` to update the form state as the user types.
  return (
    <Input
      ref={inputRef}
      defaultValue={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}
