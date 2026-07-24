import { ShoppingCart, Settings, Plus } from 'lucide-react';
import { zonePalette } from '../lib/colors.js';
import { tr } from '../lib/i18n.js';
import { CountBadge } from './CountBadge.jsx';

export function Header({
  zone, dark, t, lang = 'de', totalInZone, shoppingCount, showShoppingCount = true, align = 'left', title,
  onShopping, onSettings, onAdd, onZoneClick, showShoppingButton = true, showSettingsButton = true, showAddButton = false,
}) {
  const pal = zonePalette(zone.color, dark);
  const center = align === 'center';
  const iconBtn = {
    background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 12,
    width: 44, height: 44, color: t.headerText, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0,
  };
  const buttonCount = (showShoppingButton ? 1 : 0) + (showSettingsButton ? 1 : 0) + (showAddButton ? 1 : 0);
  // Breite der Buttons-Gruppe – im „zentriert"-Modus als Gegengewicht links,
  // damit der Zonenname wirklich mittig sitzt statt vom Buttons-Platz nach
  // links verschoben zu wirken. Passt sich an, wenn Buttons nach unten
  // verschoben wurden und im Header gar nicht mehr auftauchen.
  const buttonsWidth = buttonCount > 0 ? buttonCount * 44 + (buttonCount - 1) * 8 : 0;

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
          {title && title.trim() ? title.toUpperCase() : tr(lang, 'app.defaultTitle')}
        </div>

        {/* Zonenname + Aktions-Buttons in einer Zeile, damit sie auf gleicher Höhe sitzen. */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 4, justifyContent: center ? 'center' : 'flex-start' }}>
          {center && buttonsWidth > 0 && <div style={{ width: buttonsWidth, flexShrink: 0 }} aria-hidden="true" />}
          <h1
            onClick={onZoneClick}
            style={{
              margin: 0, fontSize: 26, fontWeight: 800, color: t.headerText, letterSpacing: '-0.01em',
              display: 'inline-flex', alignItems: 'center', minWidth: 0, position: 'relative',
              flex: center ? '0 1 auto' : '1 1 auto',
              cursor: onZoneClick ? 'pointer' : 'default',
            }}
          >
            {/* Im zentrierten Modus per absolute Positionierung links vom Text
                platziert, damit nur der Text die Center-Berechnung bestimmt -
                sonst wirkt der Text durch das Emoji-Gewicht nach rechts verschoben. */}
            <span style={center ? { position: 'absolute', right: '100%', marginRight: 9, flexShrink: 0 } : { marginRight: 9, flexShrink: 0 }}>
              {zone.emoji}
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{zone.label}</span>
          </h1>

          {buttonCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8, flexShrink: 0 }}>
              {showShoppingButton && (
                <button onClick={onShopping} style={iconBtn} aria-label={`${tr(lang, 'app.shoppingAria')}${shoppingCount > 0 ? ` (${shoppingCount})` : ''}`}>
                  <ShoppingCart size={20} strokeWidth={2.2} />
                  <CountBadge count={shoppingCount} show={showShoppingCount} badgeBg={t.headerText} badgeFg={pal.headerBg} holeBorder={pal.headerBg} />
                </button>
              )}
              {showSettingsButton && (
                <button onClick={onSettings} style={iconBtn} aria-label={tr(lang, 'app.settingsAria')}>
                  <Settings size={20} strokeWidth={2.2} />
                </button>
              )}
              {showAddButton && (
                <button onClick={onAdd} style={iconBtn} aria-label={tr(lang, 'app.addAria')}>
                  <Plus size={22} strokeWidth={2.4} />
                </button>
              )}
            </div>
          )}
        </div>

        <div style={{ color: 'rgba(255,255,255,0.85)', marginTop: 3, textAlign: center ? 'center' : 'left' }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{totalInZone}</span>
          <span style={{ fontSize: 12, opacity: 0.85, marginLeft: 5 }}>{tr(lang, 'common.items')}</span>
        </div>
      </div>
    </div>
  );
}
