import { zonePalette } from '../lib/colors.js';

const BASE_BOTTOM = 22;
const GAP = 14;
const CENTER_OFFSET = 50; // horizontaler Mittelpunkt aller Buttons, von rechts gemessen

// Stapel schwebender Buttons unten rechts. `items` ist von unten (Anker)
// nach oben sortiert – jeder Eintrag: { key, size, primary, onClick,
// ariaLabel, icon, badge, extraHandlers, holdProgress }. Welche Buttons hier
// überhaupt landen (Add, Einkaufsliste, Einstellungen) und in welcher
// Reihenfolge, entscheidet der Aufrufer anhand der Nutzer-Einstellungen;
// diese Komponente kümmert sich nur ums Stapeln, ohne eine Position für
// „Add" fest anzunehmen. `extraHandlers`/`holdProgress` sind optional (z.B.
// für Long-Press auf den Add-Button, siehe useLongPress).
export function FloatingActions({ zone, dark, t, items = [] }) {
  const pal = zonePalette(zone.color, dark);
  let bottom = BASE_BOTTOM;

  return (
    <>
      {items.map((it) => {
        const el = (
          <button
            key={it.key}
            onClick={it.onClick}
            aria-label={it.ariaLabel}
            {...(it.extraHandlers || {})}
            style={{
              position: 'fixed',
              right: CENTER_OFFSET - it.size / 2,
              bottom: `calc(${bottom}px + env(safe-area-inset-bottom))`,
              width: it.size, height: it.size, borderRadius: '50%', border: 'none',
              background: pal.headerBg, color: t.headerText,
              boxShadow: it.primary ? '0 6px 18px rgba(0,0,0,0.28)' : '0 4px 14px rgba(0,0,0,0.26)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 30, touchAction: 'none',
            }}
          >
            {it.holdProgress > 0 && (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none',
                  background: `conic-gradient(rgba(255,255,255,0.55) ${it.holdProgress * 360}deg, transparent 0deg)`,
                }}
              />
            )}
            {it.icon}
            {it.badge}
          </button>
        );
        bottom += it.size + GAP;
        return el;
      })}
    </>
  );
}
