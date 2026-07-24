import { zonePalette } from '../lib/colors.js';

// Schnellzugriff-Chips für gemerkte Favoriten (Stern im Detail-Sheet).
// Wird an zwei Stellen mit unterschiedlichem onTap eingebunden: Hauptliste
// (direkt in den Bestand) und Einkaufsliste-Sheet (auf die Liste setzen).
// Rendert nichts, wenn keine Favoriten vorhanden sind.
export function FavoriteChips({ favorites, zones, dark, t, onTap, label }) {
  if (!favorites || favorites.length === 0) return null;
  return (
    <div>
      {label && (
        <div style={{ fontSize: 11, fontWeight: 700, color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
          {label}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {favorites.map((f) => {
          const zone = zones.find((z) => z.id === f.zone);
          const pal = zonePalette(zone ? zone.color : null, dark);
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onTap(f)}
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: pal.accentBg, color: pal.accent, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
              }}
            >
              {zone && <span>{zone.emoji}</span>} {f.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
