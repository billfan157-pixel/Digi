import { useState, useEffect, useRef, useCallback } from 'react';

interface NetworkState {
  isOnline: boolean;
  wasOffline: boolean;
  isRealtimeConnected: boolean;
  checkNow: () => boolean;
}

export function useNetworkState(): NetworkState {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const channelRef = useRef<ReturnType<typeof import('@/lib/supabase').supabase.channel> | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      setTimeout(() => setWasOffline(false), 5000);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    import('@/lib/supabase').then(({ supabase }) => {
      const ch = supabase.channel('network-state');
      ch.subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });
      channelRef.current = ch;
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      import('@/lib/supabase').then(({ supabase }) => {
        if (channelRef.current) supabase.removeChannel(channelRef.current);
      });
    };
  }, []);

  const checkNow = useCallback(() => navigator.onLine, []);

  return { isOnline, wasOffline, isRealtimeConnected, checkNow };
}
