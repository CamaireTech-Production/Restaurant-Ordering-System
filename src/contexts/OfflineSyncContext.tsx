import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useOfflineDB } from '../hooks/useOfflineDB';
import { fetchAndCacheAll, replayQueuedActions } from '../services/offlineSync';

interface OfflineSyncContextType {
  isOnline: boolean;
  syncing: boolean;
  syncNow: () => Promise<void>;
  lastSync: number | null;
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined);

export const OfflineSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);
  useOfflineDB();
  const syncingRef = useRef(false);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // On startup, fetch and cache all if online
  useEffect(() => {
    if (isOnline) {
      fetchAndCacheAll();
    }
  }, [isOnline]);

  // On reconnect, replay queued actions
  useEffect(() => {
    if (isOnline && !syncingRef.current) {
      syncNow();
    }
    // eslint-disable-next-line
  }, [isOnline]);

  const syncNow = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      await replayQueuedActions();
      setLastSync(Date.now());
    } finally {
      setSyncing(false);
      syncingRef.current = false;
    }
  }, []);

  return (
    <OfflineSyncContext.Provider value={{ isOnline, syncing, syncNow, lastSync }}>
      {children}
    </OfflineSyncContext.Provider>
  );
};

export function useOfflineSync() {
  const ctx = useContext(OfflineSyncContext);
  if (!ctx) throw new Error('useOfflineSync must be used within OfflineSyncProvider');
  return ctx;
}
