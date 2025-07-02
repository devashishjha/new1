
'use client';

import React, { useRef, useCallback, useEffect } from 'react';
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
  const autocompleteInstance = useRef<google.maps.places.Autocomplete | null>(null);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  useEffect(() => {
    if (isLoaded && inputRef.current) {
      const options = {
        types: ['geocode'],
        componentRestrictions: { country: 'in' }, // Restrict to India
      };
      
      autocompleteInstance.current = new window.google.maps.places.Autocomplete(inputRef.current, options);
      
      autocompleteInstance.current.addListener('place_changed', () => {
        const place = autocompleteInstance.current?.getPlace();
        if (place?.formatted_address) {
          onChange(place.formatted_address);
        }
      });
    }

    return () => {
      if (autocompleteInstance.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteInstance.current);
      }
    };
  }, [isLoaded, onChange]);

  const inputProps = {
    value: value,
    onChange: handleInputChange,
    placeholder: placeholder,
    ref: inputRef,
  };
  
  if (loadError) {
      console.error("Google Maps API failed to load: ", loadError)
      return <Input {...inputProps} placeholder={placeholder ? `${placeholder} (Maps error)` : "Location (Maps error)"} />
  }

  if (!isLoaded) {
    return (
      <Input
        {...inputProps}
        placeholder={placeholder ? `${placeholder} (Loading Maps...)` : "Loading Maps..."}
        disabled
      />
    );
  }

  return (
    <Input {...inputProps} />
  );
}
