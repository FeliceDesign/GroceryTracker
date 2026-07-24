import { useCallback } from 'react';
import { useStorage } from './useStorage.js';

// Häufig gekaufte Artikel als Schnellzugriff-Vorlage (Name, Lagerort,
// Kategorie, Einheit). Menge wird bewusst nicht gespeichert - beim
// Hinzufügen immer mit 1 vorbelegt. Entstehen nur über den Stern im
// Detail-Sheet (kein eigenes Anlegen-Formular).
export function useFavorites() {
  const [favorites, setFavorites, loaded] = useStorage('gt-favorites-v1', []);

  const isFavorite = useCallback(
    (name) => favorites.some((f) => f.name.toLowerCase() === (name || '').toLowerCase()),
    [favorites],
  );

  const addFavorite = useCallback(
    ({ name, zone, category, unit }) => {
      const trimmed = (name || '').trim();
      if (!trimmed) return;
      setFavorites((prev) => {
        if (prev.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) return prev;
        const id = 'fav' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        return [...prev, { id, name: trimmed, zone, category, unit }];
      });
    },
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

  return { favorites, loaded, isFavorite, addFavorite, removeFavorite, removeFavoriteByName };
}
