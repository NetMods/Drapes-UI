import { useState, useEffect } from 'react';

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch (error) {
      console.error(`Cannot read localStorage key "${key}":`, error);
    }
  }, [key]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Cannot write localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
    } catch (error) {
      console.error(`Cannot set localStorage key "${key}":`, error);
    }
  };

  const addToArray = (newItem: unknown) => {
    if (Array.isArray(storedValue)) {
      setValue((prev) => [...(prev as unknown[]), newItem] as T);
    }
  };

  const removeFromArray = (itemToRemove: unknown) => {
    if (Array.isArray(storedValue)) {
      setValue((prev) => (prev as unknown[]).filter((item) => item !== itemToRemove) as T);
    }
  };

  const toggleInArray = (item: unknown) => {
    if (Array.isArray(storedValue)) {
      setValue((prev) => {
        const arr = prev as unknown[];
        return arr.includes(item)
          ? (arr.filter((i) => i !== item) as T)
          : ([...arr, item] as T);
      });
    }
  };

  return {
    value: storedValue,
    setValue,
    addToArray,
    removeFromArray,
    toggleInArray,
  };
};
