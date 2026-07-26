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

  // Reihenfolge ändern (Hoch/Runter in der Kategorien-Verwaltung) -
  // vertauscht mit dem Nachbarn, bestimmt die Gruppen-Reihenfolge in der
  // Hauptliste (Sortiermodus "Kategorie").
  const moveCategory = useCallback(
    (name, direction) => {
      setCategories((prev) => {
        const idx = prev.indexOf(name);
        const swapWith = direction === 'up' ? idx - 1 : idx + 1;
        if (idx < 0 || swapWith < 0 || swapWith >= prev.length) return prev;
        const next = [...prev];
        [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
        return next;
      });
    },
    [setCategories],
  );

  return { categories, setCategories, loaded, addCategory, removeCategory, moveCategory };
}
