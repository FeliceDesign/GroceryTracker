import { ShoppingCart, Settings } from 'lucide-react';
import { zonePalette } from '../lib/colors.js';

export function Header({ zone, dark, t, totalInZone, shoppingCount, showShoppingCount = true, align = 'left', title, onShopping, onSettings, onZoneClick }) {
  const pal = zonePalette(zone.color, dark);
  const center = align === 'center';
  const iconBtn = {
    background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 12,
    width: 44, height: 44, color: t.headerText, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0,
  };
  // Breite der Buttons-Gruppe (44 + 44 + 8 Gap) – im „zentriert"-Modus als
  // Gegengewicht links, damit der Zonenname wirklich mittig sitzt statt vom
  // Buttons-Platz nach links verschoben zu wirken.
  const buttonsWidth = 96;

  return (
    <div style={{
      background: pal.headerBg, padding: '18px 20px 16px',
      paddingTop: 'calc(18px + env(safe-area-inset-top))', transition: 'background 0.3s ease',
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{
          fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.72)', letterSpacing: '0.06em',
          textAlign: center ? 'center' : 'left',
        }}>
          {title && title.trim() ? title.toUpperCase() : 'GROCERYTRACKER'}
        </div>

        {/* Zonenname + Aktions-Buttons in einer Zeile, damit sie auf gleicher Höhe sitzen. */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 4, justifyContent: center ? 'center' : 'flex-start' }}>
          {center && <div style={{ width: buttonsWidth, flexShrink: 0 }} aria-hidden="true" />}
          <h1
            onClick={onZoneClick}
            style={{
              margin: 0, fontSize: 26, fontWeight: 800, color: t.headerText, letterSpacing: '-0.01em',
              display: 'inline-flex', alignItems: 'center', gap: 9, minWidth: 0,
              flex: center ? '0 1 auto' : '1 1 auto',
              cursor: onZoneClick ? 'pointer' : 'default',
            }}
          >
            <span>{zone.emoji}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{zone.label}</span>
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8, flexShrink: 0 }}>
            <button onClick={onShopping} style={iconBtn} aria-label={`Einkaufsliste öffnen${shoppingCount > 0 ? ` (${shoppingCount})` : ''}`}>
              <ShoppingCart size={20} strokeWidth={2.2} />
              {shoppingCount > 0 && (
                showShoppingCount ? (
                  <span style={{
                    position: 'absolute', top: -4, right: -4, minWidth: 19, height: 19,
                    borderRadius: 10, background: t.headerText, color: pal.headerBg,
                    fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', padding: '0 5px', boxSizing: 'border-box',
                  }}>
                    {shoppingCount}
                  </span>
                ) : (
                  <span style={{
                    position: 'absolute', top: -2, right: -2, width: 11, height: 11,
                    borderRadius: '50%', background: t.headerText,
                    border: `2px solid ${pal.headerBg}`, boxSizing: 'border-box',
                  }} />
                )
              )}
            </button>
            <button onClick={onSettings} style={iconBtn} aria-label="Einstellungen öffnen">
              <Settings size={20} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <div style={{ color: 'rgba(255,255,255,0.85)', marginTop: 3, textAlign: center ? 'center' : 'left' }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{totalInZone}</span>
          <span style={{ fontSize: 12, opacity: 0.85, marginLeft: 5 }}>Artikel</span>
        </div>
      </div>
    </div>
  );
}
