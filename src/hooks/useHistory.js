import { useCallback } from 'react';
import { useStorage } from './useStorage.js';

// Wie viele Einträge maximal aufgehoben werden - reicht für "kürzlich",
// wächst sonst unbegrenzt. Über die Einstellungen (Verhalten) anpassbar,
// deshalb als Parameter statt Konstante.
const DEFAULT_MAX_ENTRIES = 50;

// Verlauf von Bestandsänderungen mit Makrodaten (Store `gt-consumed-v1` -
// Name bewusst beibehalten, um bestehende gespeicherte Historien nicht zu
// verlieren; nur die UI/Funktion heißt jetzt "Historie"). Zwei Kategorien:
// `action: 'added'` (neu in den Bestand gekommen) und `action: 'consumed'`
// (verzehrt/aufgebraucht/Makros kopiert) - Grundlage für die Makro-
// Schnellauswahl. Jeder Eintrag speichert einen Snapshot der Stammdaten
// zum Zeitpunkt der Aktion, damit er auch erhalten bleibt, falls die
// Stammdaten später geändert/gelöscht werden.
export function useHistory(maxEntries = DEFAULT_MAX_ENTRIES) {
  const [raw, setRaw, loaded] = useStorage('gt-consumed-v1', []);
  // Ältere Einträge ohne `action`-Feld (vor der Zwei-Kategorien-Historie)
  // waren ausnahmslos Verzehr-Einträge.
  const history = (raw || []).map((h) => (h.action ? h : { ...h, action: 'consumed' }));

  const addHistory = useCallback(
    (food, action, qty, unit, consumedAt) => {
      if (!food) return;
      setRaw((prev) => {
        const id = 'cs' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        return [{ id, food, action, consumedAt: consumedAt ?? Date.now(), qty: qty ?? null, unit: unit ?? null }, ...(prev || [])].slice(0, maxEntries);
      });
    },
    [setRaw, maxEntries],
  );

  // Einzelnen (z.B. versehentlich geloggten) Eintrag wieder entfernen.
  const removeHistory = useCallback(
    (id) => setRaw((prev) => (prev || []).filter((c) => c.id !== id)),
    [setRaw],
  );

  // Einzelnes Feld eines bestehenden Eintrags nachträglich korrigieren
  // (z.B. eine falsch erfasste Menge).
  const updateHistory = useCallback(
    (id, patch) => setRaw((prev) => (prev || []).map((c) => (c.id === id ? { ...c, ...patch } : c))),
    [setRaw],
  );

  // Zuvor entfernte Einträge wiederherstellen (Rückgängig nach Löschen) -
  // fügt sie unverändert (gleiche id) wieder vorne ein.
  const restoreHistory = useCallback(
    (entries) => setRaw((prev) => [...entries, ...(prev || [])].slice(0, maxEntries)),
    [setRaw, maxEntries],
  );

  return { history, loaded, addHistory, removeHistory, updateHistory, restoreHistory };
}
