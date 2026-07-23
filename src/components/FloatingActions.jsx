import { Plus } from 'lucide-react';
import { zonePalette } from '../lib/colors.js';

const ADD_SIZE = 60;
const ADD_BOTTOM = 22;
const EXTRA_SIZE = 48;
const GAP = 14;

// +-Button (immer unten rechts, Ankerpunkt) plus optionale weitere Buttons
// (Einkaufsliste/Einstellungen), die sich in fester Reihenfolge darüber
// stapeln, wenn der Nutzer sie in den Einstellungen nach unten verschoben
// hat. `extras` ist von unten nach oben sortiert (am nächsten am +-Button
// zuerst).
export function FloatingActions({ zone, dark, t, onAdd, extras = [] }) {
  const pal = zonePalette(zone.color, dark);

  return (
    <>
      {extras.map((ex, i) => (
        <button
          key={ex.key}
          onClick={ex.onClick}
          aria-label={ex.ariaLabel}
          style={{
            position: 'fixed',
            right: 26,
            bottom: `calc(${ADD_BOTTOM + ADD_SIZE + GAP + i * (EXTRA_SIZE + GAP)}px + env(safe-area-inset-bottom))`,
            width: EXTRA_SIZE, height: EXTRA_SIZE, borderRadius: '50%', border: 'none',
            background: pal.headerBg, color: t.headerText,
            boxShadow: '0 4px 14px rgba(0,0,0,0.26)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 30,
          }}
        >
          {ex.icon}
          {ex.badge}
        </button>
      ))}

      <button
        onClick={onAdd}
        aria-label="Neuen Artikel hinzufügen"
        style={{
          position: 'fixed',
          right: 20,
          bottom: `calc(${ADD_BOTTOM}px + env(safe-area-inset-bottom))`,
          width: ADD_SIZE, height: ADD_SIZE, borderRadius: '50%', border: 'none',
          background: pal.headerBg, color: t.headerText,
          boxShadow: '0 6px 18px rgba(0,0,0,0.28)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 30,
        }}
      >
        <Plus size={28} strokeWidth={2.6} />
      </button>
    </>
  );
}
