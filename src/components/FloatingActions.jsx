import { zonePalette } from '../lib/colors.js';

const BASE_BOTTOM = 22;
const GAP = 14;
const CENTER_OFFSET = 50; // horizontaler Mittelpunkt aller Buttons, von rechts gemessen

// Schwebende Buttons unten rechts, entweder als vertikaler Stapel (Default)
// oder als horizontale Reihe (`layout="row"`). `items` ist vom Anker weg
// sortiert – jeder Eintrag: { key, size, primary, onClick, ariaLabel, icon,
// badge, extraHandlers, holdProgress }. Welche Buttons hier überhaupt landen
// (Add, Einkaufsliste, Einstellungen) und in welcher Reihenfolge, entscheidet
// der Aufrufer anhand der Nutzer-Einstellungen. Der erste Eintrag (i.d.R.
// Add) sitzt in beiden Layouts an derselben Position/Größe - im Stapel wächst
// von dort aus die `bottom`-Achse nach oben, in der Reihe die `right`-Achse
// nach links. `extraHandlers`/`holdProgress` sind optional (z.B. für
// Long-Press auf den Add-Button, siehe useLongPress).
const NO_ITEMS = [];

export function FloatingActions({ zone, dark, t, items = NO_ITEMS, layout = 'stack' }) {
  const pal = zonePalette(zone.color, dark);
  const isRow = layout === 'row';
  let bottom = BASE_BOTTOM;
  let right = CENTER_OFFSET - (items[0] ? items[0].size / 2 : 0);

  return (
    <>
      {items.map((it) => {
        const itemBottom = isRow ? BASE_BOTTOM : bottom;
        const itemRight = isRow ? right : CENTER_OFFSET - it.size / 2;
        const el = (
          <button
            key={it.key}
            onClick={it.onClick}
            aria-label={it.ariaLabel}
            {...(it.extraHandlers || {})}
            style={{
              position: 'fixed',
              right: itemRight,
              bottom: `calc(${itemBottom}px + env(safe-area-inset-bottom))`,
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
        if (isRow) right += it.size + GAP; else bottom += it.size + GAP;
        return el;
      })}
    </>
  );
}
