
'use client';

import React, { useRef } from 'react';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
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

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const InputComponent = isTextarea ? Textarea : Input;

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onUnmount = () => {
    autocompleteRef.current = null;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      onChange(place.formatted_address || '');
    } else {
      console.log('Autocomplete is not loaded yet!');
    }
  };

  const inputProps = {
    value: value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    placeholder: placeholder,
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
    <Autocomplete
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
      onUnmount={onUnmount}
      options={{
        types: ['geocode'],
        componentRestrictions: { country: 'in' }, // Restrict to India
      }}
    >
      <InputComponent {...inputProps} />
    </Autocomplete>
  );
}
