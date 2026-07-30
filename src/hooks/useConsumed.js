import { useCallback } from 'react';
import { useStorage } from './useStorage.js';

// Wie viele Einträge maximal aufgehoben werden - reicht für "kürzlich",
// wächst sonst unbegrenzt.
const MAX_ENTRIES = 50;

// Verlauf aufgebrauchter Artikel mit Makrodaten (Store `gt-consumed-v1`) -
// Grundlage für die Makro-Schnellauswahl (mehrere kürzlich verzehrte
// Artikel markieren, Makros nacheinander kopieren). Jeder Eintrag speichert
// einen Snapshot der Stammdaten zum Entfernen-Zeitpunkt, damit er auch
// erhalten bleibt, falls die Stammdaten später geändert/gelöscht werden.
export function useConsumed() {
  const [consumed, setConsumed, loaded] = useStorage('gt-consumed-v1', []);

  const addConsumed = useCallback(
    (food) => {
      if (!food) return;
      setConsumed((prev) => {
        const id = 'cs' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        return [{ id, food, consumedAt: Date.now() }, ...(prev || [])].slice(0, MAX_ENTRIES);
      });
    },
    [setConsumed],
  );

  // Einzelnen (z.B. versehentlich geloggten) Eintrag wieder entfernen.
  const removeConsumed = useCallback(
    (id) => setConsumed((prev) => (prev || []).filter((c) => c.id !== id)),
    [setConsumed],
  );

  return { consumed, loaded, addConsumed, removeConsumed };
}
