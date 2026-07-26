import { useCallback } from 'react';
import { useStorage } from './useStorage.js';

// Häufig gekaufte Artikel als Schnellzugriff-Vorlage (Name, Lagerort,
// Kategorie, Einheit, Standard-Menge). Entstehen über den Stern im
// Detail-Sheet (Menge dabei fest auf 1) oder gesammelt aus dem Bestand
// (übernimmt dessen aktuelle Menge) - Menge/Einheit lassen sich danach in
// der Verwaltung anpassen, kein eigenes Anlegen-Formular.
export function useFavorites() {
  const [favorites, setFavorites, loaded] = useStorage('gt-favorites-v1', []);

  const isFavorite = useCallback(
    (name) => favorites.some((f) => f.name.toLowerCase() === (name || '').toLowerCase()),
    [favorites],
  );

  const addFavorite = useCallback(
    ({ name, zone, category, unit, qty = 1 }) => {
      const trimmed = (name || '').trim();
      if (!trimmed) return;
      setFavorites((prev) => {
        if (prev.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) return prev;
        const id = 'fav' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        return [...prev, { id, name: trimmed, zone, category, unit, qty }];
      });
    },
    [setFavorites],
  );

  const updateFavorite = useCallback(
    (id, patch) => setFavorites((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f))),
    [setFavorites],
  );

  const removeFavorite = useCallback(
    (id) => setFavorites((prev) => prev.filter((f) => f.id !== id)),
    [setFavorites],
  );

  const removeFavoriteByName = useCallback(
    (name) => setFavorites((prev) => prev.filter((f) => f.name.toLowerCase() !== (name || '').toLowerCase())),
    [setFavorites],
  );

  const clearFavorites = useCallback(() => setFavorites([]), [setFavorites]);

  // Für Undo nach "Alle löschen" - stellt den übergebenen Stand wieder her.
  const restoreFavorites = useCallback((list) => setFavorites(list), [setFavorites]);

  return { favorites, loaded, isFavorite, addFavorite, updateFavorite, removeFavorite, removeFavoriteByName, clearFavorites, restoreFavorites };
}
