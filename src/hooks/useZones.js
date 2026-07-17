import { useCallback } from 'react';
import { useStorage } from './useStorage.js';
import { DEFAULT_ZONES } from '../lib/defaults.js';

// Anpassbare Lagerorte. Standard sind Kühlschrank, Gefrierschrank, Vorrat und
// Snacks; eigene lassen sich hinzufügen, bearbeiten und entfernen.
export function useZones() {
  const [zones, setZones, loaded] = useStorage('gt-zones-v1', DEFAULT_ZONES);

  const addZone = useCallback(
    ({ label, emoji, color }) => {
      const id = 'z' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      const zone = { id, label: label.trim(), emoji: emoji || '📦', color };
      setZones((prev) => [...prev, zone]);
      return id;
    },
    [setZones],
  );

  const updateZone = useCallback(
    (id, patch) => {
      setZones((prev) => prev.map((z) => (z.id === id ? { ...z, ...patch } : z)));
    },
    [setZones],
  );

  // Entfernt einen Lagerort. Der Aufrufer entscheidet über die Artikel dieses
  // Lagerorts (siehe onRemoved-Callback in App).
  const removeZone = useCallback(
    (id) => {
      setZones((prev) => (prev.length <= 1 ? prev : prev.filter((z) => z.id !== id)));
    },
    [setZones],
  );

  return { zones, setZones, loaded, addZone, updateZone, removeZone };
}
