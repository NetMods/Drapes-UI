import { useState, useEffect } from 'react';

type StorageValue<T> = T | T[];

function useLocalStorage<T>(
  key: string,
  initialValue: StorageValue<T>
): [StorageValue<T>, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<StorageValue<T>>(() => {
    if (typeof window === undefined) return initialValue

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  // Update localStorage whenever storedValue changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }, [key, storedValue]);

  const toggleValue = (value: T) => {
    setStoredValue(prev => {
      if (Array.isArray(prev)) {
        const index = prev.findIndex(item =>
          JSON.stringify(item) === JSON.stringify(value)
        );

        if (index > -1) {
          // Remove if exists
          return prev.filter((_, i) => i !== index);
        } else {
          // Add if doesn't exist
          return [...prev, value];
        }
      }
      else {
        if (JSON.stringify(prev) === JSON.stringify(value)) {
          return Array.isArray(initialValue) ? [] : initialValue;
        } else {
          return value;
        }
      }
    });
  };

  return [storedValue, toggleValue];
}

export default useLocalStorage;
