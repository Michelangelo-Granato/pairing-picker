import { useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        if (item) {
          const parsedItem = JSON.parse(item);
          // If the value is meant to be a Set, convert it back from array
          if (initialValue instanceof Set) {
            // Ensure parsedItem is an array before creating a Set
            if (Array.isArray(parsedItem)) {
              return new Set(parsedItem) as T;
            }
            // If not an array, clear invalid data and return initial value
            window.localStorage.removeItem(key);
            return initialValue;
          }
          return parsedItem;
        }
      }
      return initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      // Clear potentially corrupted data
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        // If the value is a Set, convert it to array before storing
        const valueToStringify = valueToStore instanceof Set ? 
          Array.from(valueToStore) : 
          valueToStore;
        window.localStorage.setItem(key, JSON.stringify(valueToStringify));
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
} 