import { ChevronDown, ChevronRight } from 'lucide-react';
import { zonePalette } from '../lib/colors.js';
import { tr } from '../lib/i18n.js';

// Schnellzugriff-Chips für gemerkte Favoriten (Stern im Detail-Sheet).
// Wird an zwei Stellen mit unterschiedlichem onTap eingebunden: Hauptliste
// (direkt in den Bestand) und Einkaufsliste-Sheet (auf die Liste setzen).
// Rendert nichts, wenn keine Favoriten vorhanden sind. Label-Zeile ist per
// Chevron ein-/ausklappbar (Zustand wird vom Aufrufer verwaltet/persistiert).
export function FavoriteChips({ favorites, zones, dark, t, lang = 'de', onTap, label, collapsed = false, onToggleCollapse }) {
  if (!favorites || favorites.length === 0) return null;
  return (
    <div>
      {label && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          aria-label={collapsed ? tr(lang, 'favorites.expandAria') : tr(lang, 'favorites.collapseAria')}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, width: '100%',
            background: 'none', border: 'none', padding: 0, marginBottom: 6, cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {label}
          </span>
          {collapsed ? <ChevronRight size={13} color={t.textFaint} /> : <ChevronDown size={13} color={t.textFaint} />}
        </button>
      )}
      <div style={{ display: 'grid', gridTemplateRows: collapsed ? '0fr' : '1fr', transition: 'grid-template-rows 0.2s ease' }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 1 }}>
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
      </div>
    </div>
  );
}
