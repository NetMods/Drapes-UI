import { useState, useEffect, Dispatch, SetStateAction } from 'react';

function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T extends any[] ? T[number] : T) => void, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') return initialValue;
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }, [key, storedValue]);

  const toggleValue = (value: T extends any[] ? T[number] : T) => {
    setStoredValue(prev => {
      if (Array.isArray(prev)) {
        const index = prev.findIndex(item =>
          JSON.stringify(item) === JSON.stringify(value)
        );
        if (index > -1) {
          return prev.filter((_, i) => i !== index) as T;
        } else {
          return [...prev, value] as T;
        }
      } else {
        if (JSON.stringify(prev) === JSON.stringify(value)) {
          return initialValue;
        } else {
          return value as T;
        }
      }
    });
  };

  return [storedValue, toggleValue, setStoredValue];
}

export default useLocalStorage;
