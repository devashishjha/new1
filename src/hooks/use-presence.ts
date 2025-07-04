'use client';

import { useState, useEffect } from 'react';
import { rtdb } from '@/lib/firebase';
import { ref, onValue, type Unsubscribe } from 'firebase/database';

export type PresenceStatus = 'online' | 'offline';

export function usePresence(userId: string | undefined): PresenceStatus {
  const [status, setStatus] = useState<PresenceStatus>('offline');

  useEffect(() => {
    if (!userId || !rtdb) {
      setStatus('offline');
      return;
    }

    const statusRef = ref(rtdb, 'status/' + userId);
    const listener: Unsubscribe = onValue(statusRef, (snapshot) => {
      const value = snapshot.val();
      if (value?.state === 'online') {
        setStatus('online');
      } else {
        setStatus('offline');
      }
    });

    return () => {
      // Detach the listener when the component unmounts or userId changes
      listener();
    };
  }, [userId]);

  return status;
}
