import { zonePalette } from '../lib/colors.js';
import { tr } from '../lib/i18n.js';

// Auswahl des Lagerorts als Chip-Reihe (Formulare). Passt sich an beliebig
// viele Lagerorte an (umbruch- und scrollfähig).
export function ZonePicker({ zones, value, onChange, t, dark, lang = 'de', label }) {
  return (
    <div>
      {label && (
        <div style={{
          fontSize: 12, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase',
          letterSpacing: '0.04em', marginBottom: 8,
        }}>
          {label}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {zones.map((z) => {
          const active = value === z.id;
          const pal = zonePalette(z.color, dark);
          return (
            <button
              key={z.id}
              type="button"
              onClick={() => onChange(z.id)}
              aria-label={tr(lang, 'zonePicker.locationAria', { label: z.label })}
              style={{
                flex: '1 1 0', minWidth: 80, maxWidth: 130,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '10px 6px', borderRadius: 12, cursor: 'pointer',
                border: active ? `2px solid ${pal.headerBg}` : `2px solid transparent`,
                background: active ? pal.accentBg : t.cardAlt,
              }}
            >
              <span style={{ fontSize: 18 }}>{z.emoji}</span>
              <span style={{
                fontSize: 11, fontWeight: 700, color: active ? pal.accent : t.pillInactiveText,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
              }}>
                {z.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
