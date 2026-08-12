import { useCallback } from 'react';
import { useStorage } from './useStorage.js';
import { normalizeName } from '../lib/macros.js';

// Stammdaten der Lebensmittel-Nährwerte (Store `gt-foods-v1`).
// Verknüpfung mit den Bestands-Artikeln läuft über den normalisierten Namen.
export function useFoods() {
  const [foods, setFoods, loaded] = useStorage('gt-foods-v1', []);

  const getFood = useCallback(
    (name) => {
      if (!foods) return null;
      const key = normalizeName(name);
      if (!key) return null;
      return foods.find((f) => f.key === key) || null;
    },
    [foods],
  );

  // Anlegen oder aktualisieren. `record` enthält mindestens `name`.
  const upsertFood = useCallback(
    (record) => {
      const key = normalizeName(record && record.name);
      if (!key) return;
      const clean = { ...record, key, name: (record.name || '').trim() };
      setFoods((prev) => {
        const list = prev || [];
        const idx = list.findIndex((f) => f.key === key);
        if (idx >= 0) {
          const next = [...list];
          next[idx] = { ...next[idx], ...clean };
          return next;
        }
        return [...list, clean];
      });
    },
    [setFoods],
  );

  const removeFood = useCallback(
    (key) => setFoods((prev) => (prev || []).filter((f) => f.key !== key)),
    [setFoods],
  );

  return { foods, setFoods, loaded, getFood, upsertFood, removeFood };
}
