
'use client';

import { useEffect } from 'react';

export function EnvDebugger() {
  useEffect(() => {
    // This will only run on the client side in the browser.
    console.groupCollapsed('%c[Lokal Reels] Environment Variable Check', 'color: #FF9933; font-weight: bold;');
    console.log('This check shows the values your application receives at runtime.');
    console.log('If any are "undefined" or incorrect, the app will be in offline mode.');
    
    const keysToCheck = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
    ];

    let allKeysPresent = true;
    keysToCheck.forEach(key => {
      const value = process.env[key];
      if (value) {
        console.log(`✅ ${key}: "${value}"`);
      } else {
        console.error(`❌ ${key}: undefined`);
        allKeysPresent = false;
      }
    });

    if (allKeysPresent) {
        console.log('%cAll required Firebase keys are present.', 'color: #29ABE2;');
    } else {
        console.error('%cOne or more required Firebase keys are missing. Please verify their names and values in Google Secret Manager and redeploy.', 'color: #FF0000;');
    }

    console.groupEnd();
  }, []);

  return null; // This component renders nothing to the UI.
}
