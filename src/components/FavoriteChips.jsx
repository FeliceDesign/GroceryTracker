import { ChevronDown, ChevronRight } from 'lucide-react';
import { zonePalette } from '../lib/colors.js';
import { tr } from '../lib/i18n.js';

// Favoriten-Schnellzugriff für die Einkaufsliste: Favorit antippen setzt ihn
// auf die Liste. Rendert nichts, wenn keine Favoriten vorhanden sind.
// Label-Zeile ist per Chevron ein-/ausklappbar (Zustand wird vom Aufrufer
// verwaltet/persistiert). Untereinander statt horizontal scrollend, damit
// auch längere Namen ungekürzt lesbar sind.
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 1 }}>
            {favorites.map((f) => {
              const zone = zones.find((z) => z.id === f.zone);
              const pal = zonePalette(zone ? zone.color : null, dark);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onTap(f)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: pal.accentBg, color: pal.accent, fontWeight: 700, fontSize: 13.5,
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
