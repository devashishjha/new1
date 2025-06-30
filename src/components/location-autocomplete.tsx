
'use client';

import React, { useRef, useCallback, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  isTextarea?: boolean;
  placeholder?: string;
}

const libraries: ('places')[] = ['places'];

export function LocationAutocomplete({ value, onChange, isTextarea, placeholder }: LocationAutocompleteProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  console.log("Google Maps API Key:", process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY); // Added for debugging

  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const autocompleteInstance = useRef<google.maps.places.Autocomplete | null>(null);

  const InputComponent = isTextarea ? Textarea : Input;

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  useEffect(() => {
    let listener: google.maps.MapsEventListener | null = null;

    if (isLoaded && inputRef.current) {
      // Clean up any existing instance and listener before creating a new one
      if (autocompleteInstance.current) {
        if (listener) {
          window.google.maps.event.removeListener(listener);
        }
        autocompleteInstance.current = null;
      }

      const options = {
        types: ['geocode'],
        componentRestrictions: { country: 'in' }, // Restrict to India
      };
      
      // Initialize the Autocomplete instance with the current input DOM element
      autocompleteInstance.current = new window.google.maps.places.Autocomplete(inputRef.current, options);

      // Add listener for place changes
      listener = autocompleteInstance.current.addListener('place_changed', () => {
        if (autocompleteInstance.current !== null) {
          const place = autocompleteInstance.current.getPlace();
          onChange(place.formatted_address || '');
        }
      });
    }

    // Cleanup function for this effect
    return () => {
      if (listener) {
        window.google.maps.event.removeListener(listener);
      }
      autocompleteInstance.current = null; // Ensure instance is nulled on cleanup
    };
  }, [isLoaded, onChange, inputRef.current]); // Crucial: inputRef.current in dependencies

  const inputProps = {
    value: value,
    onChange: handleInputChange,
    placeholder: placeholder,
    ref: inputRef, // Pass the ref directly to the InputComponent
  };
  
  if (loadError) {
      console.error("Google Maps API failed to load: ", loadError)
      return <InputComponent {...inputProps} placeholder={placeholder ? `${placeholder} (Maps error)` : "Location (Maps error)"} />
  }

  if (!isLoaded) {
    return (
      <InputComponent
        {...inputProps}
        placeholder={placeholder ? `${placeholder} (Loading Maps...)` : "Loading Maps..."}
        disabled
      />
    );
  }

  return (
    <InputComponent {...inputProps} />
  );
}
