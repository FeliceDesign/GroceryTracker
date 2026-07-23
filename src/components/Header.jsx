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
  // Platz für die oben rechts absolut positionierten Buttons freihalten.
  const pad = center ? { paddingLeft: 88, paddingRight: 88 } : { paddingRight: 96 };

  return (
    <div style={{
      background: pal.headerBg, padding: '18px 20px 16px',
      paddingTop: 'calc(18px + env(safe-area-inset-top))', transition: 'background 0.3s ease', position: 'relative',
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
        {/* Aktions-Buttons oben rechts */}
        <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
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

        <div style={{ ...pad, textAlign: center ? 'center' : 'left' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.72)', letterSpacing: '0.06em' }}>
            {title && title.trim() ? title.toUpperCase() : 'GROCERYTRACKER'}
          </div>

          <h1
            onClick={onZoneClick}
            style={{
              margin: '4px 0 0', fontSize: 26, fontWeight: 800, color: t.headerText, letterSpacing: '-0.01em',
              display: 'inline-flex', alignItems: 'center', gap: 9, maxWidth: '100%',
              cursor: onZoneClick ? 'pointer' : 'default',
            }}
          >
            <span>{zone.emoji}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{zone.label}</span>
          </h1>
          <div style={{ color: 'rgba(255,255,255,0.85)', marginTop: 3 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{totalInZone}</span>
            <span style={{ fontSize: 12, opacity: 0.85, marginLeft: 5 }}>Artikel</span>
          </div>
        </div>
      </div>
    </div>
  );
}
