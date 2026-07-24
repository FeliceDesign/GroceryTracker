import { zonePalette } from '../lib/colors.js';

// Lagerort-Tabs. Horizontal scrollbar, damit auch viele eigene Lagerorte
// Platz finden.
export function ZoneTabs({ zones, activeZone, countFor, onSelect, t, dark }) {
  return (
    <div
      style={{
        maxWidth: 480, margin: '0 auto', padding: '8px 14px 10px',
        display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none',
      }}
    >
      {zones.map((z) => {
        const active = z.id === activeZone;
        const pal = zonePalette(z.color, dark);
        return (
          <button
            key={z.id}
            onClick={() => onSelect(z.id)}
            style={{
              flex: '1 1 0', minWidth: 76, maxWidth: 120,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '9px 10px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: active ? t.card : 'transparent',
              boxShadow: active ? t.shadow : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: 18 }}>{z.emoji}</span>
            <span style={{
              fontSize: 10.5, fontWeight: 700, color: active ? pal.accent : t.textFaint,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
            }}>
              {z.label}
            </span>
            <span style={{ fontSize: 9, color: active ? pal.accent : t.textFaint, fontWeight: 600 }}>
              {countFor(z.id)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
