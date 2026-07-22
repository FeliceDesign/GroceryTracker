import { ShoppingCart, Settings } from 'lucide-react';
import { zonePalette } from '../lib/colors.js';

export function Header({ zone, dark, t, totalInZone, shoppingCount, showShoppingCount = true, onShopping, onSettings }) {
  const pal = zonePalette(zone.color, dark);
  const iconBtn = {
    background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 12,
    width: 44, height: 44, color: t.headerText, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0,
  };

  return (
    <div style={{
      background: pal.headerBg, padding: '18px 20px 16px',
      paddingTop: 'calc(18px + env(safe-area-inset-top))', transition: 'background 0.3s ease',
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.72)', letterSpacing: '0.06em' }}>
          GROCERYTRACKER
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 4 }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{
              margin: 0, fontSize: 26, fontWeight: 800, color: t.headerText, letterSpacing: '-0.01em',
              display: 'flex', alignItems: 'center', gap: 9, whiteSpace: 'nowrap',
            }}>
              <span>{zone.emoji}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{zone.label}</span>
            </h1>
            <div style={{ color: 'rgba(255,255,255,0.85)', marginTop: 3 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{totalInZone}</span>
              <span style={{ fontSize: 12, opacity: 0.85, marginLeft: 5 }}>
                {totalInZone === 1 ? 'Artikel' : 'Artikel'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
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
      </div>
    </div>
  );
}
