
import { useState, useEffect, useCallback, useRef } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);
  const storedValueRef = useRef<T>(storedValue);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Update ref whenever storedValue changes
  useEffect(() => {
    storedValueRef.current = storedValue;
  }, [storedValue]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const channelName = `vistaran_sync_${key}`;
    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    const handleBroadcast = (event: MessageEvent) => {
      if (event.data && event.data.type === 'UPDATE') {
        try {
          const newValue = JSON.parse(event.data.value);
          setStoredValue(newValue);
        } catch (error) {
          console.error(`Error parsing broadcast for ${key}`, error);
        }
      }
    };

    channel.onmessage = handleBroadcast;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          setStoredValue(JSON.parse(event.newValue));
        } catch (error) {
          console.error(`Error parsing storage sync for ${key}`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      channel.close();
      window.removeEventListener('storage', handleStorageChange);
      channelRef.current = null;
    };
  }, [key]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValueRef.current) : value;
      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        const jsonValue = JSON.stringify(valueToStore);
        window.localStorage.setItem(key, jsonValue);
        
        if (channelRef.current) {
          channelRef.current.postMessage({ type: 'UPDATE', value: jsonValue });
        }
      }
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;
