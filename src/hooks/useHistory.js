import { useCallback, useMemo } from 'react';
import { useStorage } from './useStorage.js';

// Wie viele Einträge maximal aufgehoben werden - reicht für "kürzlich",
// wächst sonst unbegrenzt. Über die Einstellungen (Verhalten) anpassbar,
// deshalb als Parameter statt Konstante.
const DEFAULT_MAX_ENTRIES = 50;

const byNewestFirst = (a, b) => b.consumedAt - a.consumedAt;

// Speicher-Invariante: immer neueste zuerst, begrenzt auf `maxEntries`.
// `groupHistory()` in der HistorySheet setzt diese Reihenfolge voraus - ohne
// sie landen nachgetragene oder umdatierte Einträge an der falschen Stelle
// und dieselbe Tages-Gruppe kann mehrfach auftauchen. Das Kürzen erst nach
// dem Sortieren, damit wirklich die ältesten Einträge herausfallen und nicht
// die zuletzt eingefügten.
const normalize = (list, maxEntries) => [...list].sort(byNewestFirst).slice(0, maxEntries);

// Verlauf von Bestandsänderungen mit Makrodaten (Store `gt-consumed-v1` -
// Name bewusst beibehalten, um bestehende gespeicherte Historien nicht zu
// verlieren; nur die UI/Funktion heißt jetzt "Historie"). Zwei Kategorien:
// `action: 'added'` (neu in den Bestand gekommen) und `action: 'consumed'`
// (verbraucht/aufgebraucht/Makros kopiert) - Grundlage für die Makro-
// Schnellauswahl. Jeder Eintrag speichert einen Snapshot der Stammdaten
// zum Zeitpunkt der Aktion, damit er auch erhalten bleibt, falls die
// Stammdaten später geändert/gelöscht werden.
export function useHistory(maxEntries = DEFAULT_MAX_ENTRIES) {
  const [raw, setRaw, loaded] = useStorage('gt-consumed-v1', []);

  const history = useMemo(
    () => (raw || [])
      // Ältere Einträge ohne `action`-Feld (vor der Zwei-Kategorien-Historie)
      // waren ausnahmslos Verbrauchs-Einträge.
      .map((h) => (h.action ? h : { ...h, action: 'consumed' }))
      // Defensiv auch beim Lesen sortieren: bereits gespeicherte Historien
      // können aus einer Version stammen, die die Reihenfolge noch nicht
      // garantiert hat.
      .sort(byNewestFirst),
    [raw],
  );

  const addHistory = useCallback(
    (food, action, qty, unit, consumedAt) => {
      if (!food) return;
      setRaw((prev) => {
        const id = 'cs' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const entry = { id, food, action, consumedAt: consumedAt ?? Date.now(), qty: qty ?? null, unit: unit ?? null };
        return normalize([entry, ...(prev || [])], maxEntries);
      });
    },
    [setRaw, maxEntries],
  );

  // Einzelnen (z.B. versehentlich geloggten) Eintrag wieder entfernen.
  const removeHistory = useCallback(
    (id) => setRaw((prev) => (prev || []).filter((c) => c.id !== id)),
    [setRaw],
  );

  // Einzelne Felder eines bestehenden Eintrags nachträglich korrigieren
  // (Menge/Einheit, Name, Aktion, Zeitpunkt). Neu sortieren, weil ein
  // geänderter `consumedAt` die Reihenfolge verschiebt.
  const updateHistory = useCallback(
    (id, patch) => setRaw((prev) => normalize(
      (prev || []).map((c) => (c.id === id ? { ...c, ...patch } : c)),
      maxEntries,
    )),
    [setRaw, maxEntries],
  );

  // Zuvor entfernte Einträge wiederherstellen (Rückgängig nach Löschen) -
  // unverändert (gleiche id), einsortiert nach ihrem eigenen Zeitpunkt.
  const restoreHistory = useCallback(
    (entries) => setRaw((prev) => normalize([...entries, ...(prev || [])], maxEntries)),
    [setRaw, maxEntries],
  );

  // Komplette Historie ersetzen (Backup-Import) - im Unterschied zu
  // restoreHistory keine Ergänzung des bestehenden Stands, sondern Ersatz.
  const replaceHistory = useCallback(
    (entries) => setRaw(normalize(Array.isArray(entries) ? entries : [], maxEntries)),
    [setRaw, maxEntries],
  );

  return { history, loaded, addHistory, removeHistory, updateHistory, restoreHistory, replaceHistory };
}
