import { useCallback } from 'react';
import { useStorage } from './useStorage.js';
import { DEFAULT_CATEGORIES } from '../lib/defaults.js';

// Anpassbare Kategorien. Neue Kategorien können direkt im Erfassungs-Formular
// ergänzt werden. „Sonstiges" bleibt als Fallback immer vorhanden.
export function useCategories() {
  const [categories, setCategories, loaded] = useStorage('gt-categories-v1', DEFAULT_CATEGORIES);

  const addCategory = useCallback(
    (raw) => {
      const name = (raw || '').trim();
      if (!name) return null;
      let created = name;
      setCategories((prev) => {
        const exists = prev.find((c) => c.toLowerCase() === name.toLowerCase());
        if (exists) {
          created = exists;
          return prev;
        }
        return [...prev, name];
      });
      return created;
    },
    [setCategories],
  );

  const removeCategory = useCallback(
    (name) => {
      if (name === 'Sonstiges') return;
      setCategories((prev) => prev.filter((c) => c !== name));
    },
    [setCategories],
  );

  return { categories, setCategories, loaded, addCategory, removeCategory };
}
