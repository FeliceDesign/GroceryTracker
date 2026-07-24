import { Plus, Minus, Trash2 } from 'lucide-react';
import { zonePalette } from '../lib/colors.js';
import { daysUntil, expiryLevel, levelColor, levelBg, mhdLabel } from '../lib/date.js';
import { openedUntil } from '../lib/openedShelfLife.js';
import { btnCircle } from '../lib/styles.js';
import { tr } from '../lib/i18n.js';

// Eine Artikelzeile. `zone` ist das aufgelöste Lagerort-Objekt (oder undefined,
// falls der Lagerort inzwischen entfernt wurde – dann neutraler Fallback).
// `openedShelfDays` = aufgelöste Haltbarkeit nach dem Öffnen (oder null).
// `warnColors` optional: { soon, critical, expired } – eigene Farben aus den Einstellungen.
export function ItemRow({
  item, zone, t, dark, lang = 'de', yellowDays = 3, orangeDays = 1, warnColors = {}, openedShelfDays = null,
  justChanged, onEdit, onChangeQty, onRemove, showZoneBadge, isLast, showWarnDot = true,
}) {
  const pal = zonePalette(zone ? zone.color : t.textMuted, dark);
  const days = daysUntil(item.mhd); // gedrucktes MHD
  const mhdLevel = expiryLevel(days, yellowDays, orangeDays);
  const mhdColor = levelColor(mhdLevel, t, warnColors);
  const mhdBg = levelBg(mhdLevel, t, warnColors);
  const mhdWarn = mhdLevel === 'expired' || mhdLevel === 'critical' || mhdLevel === 'soon';

  // Rest-Haltbarkeit nach dem Öffnen
  const openUntil = openedUntil(item, openedShelfDays);
  const openDays = openUntil ? daysUntil(openUntil) : null;
  const openLevel = openDays != null ? expiryLevel(openDays, yellowDays, orangeDays) : null;
  const openColor = openLevel ? levelColor(openLevel, t, warnColors) : levelColor('soon', t, warnColors);
  const openBg = openLevel ? levelBg(openLevel, t, warnColors) : levelBg('soon', t, warnColors);
  const remLabel = openDays == null ? '' : openDays < 0 ? tr(lang, 'common.overdue', { n: Math.abs(openDays) }) : openDays === 0 ? tr(lang, 'common.today') : openDays === 1 ? tr(lang, 'common.tomorrow') : tr(lang, 'common.remainingDays', { n: openDays });

  // Warn-Punkt vor dem Namen richtet sich nach dem frühesten (effektiven) Datum.
  const effDays = [days, openDays].filter((d) => d != null);
  const level = effDays.length ? expiryLevel(Math.min(...effDays), yellowDays, orangeDays) : null;
  const warn = level === 'expired' || level === 'critical' || level === 'soon';
  const wColor = levelColor(level, t, warnColors);

  // In der Zeile nur die dringendere der beiden Fristen zeigen statt beide
  // nebeneinander – bei bekannten Werten gewinnt die kürzere, sonst bleibt
  // die jeweils einzig bekannte übrig.
  let showMhdBadge = !!item.mhd;
  let showOpenedBadge = !!item.opened;
  if (item.mhd && item.opened) {
    if (openDays != null) {
      if (openDays < days) showMhdBadge = false; else showOpenedBadge = false;
    } else {
      showOpenedBadge = false;
    }
  }

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '13px 14px',
        borderBottom: !isLast ? `1px solid ${t.border}` : 'none',
        background: justChanged === item.id ? pal.accentBg : 'transparent',
        transition: 'background 0.3s ease',
      }}
    >
      <div onClick={() => onEdit(item)} style={{ cursor: 'pointer', minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
          {warn && showWarnDot && (
            <span style={{ flexShrink: 0, width: 8, height: 8, borderRadius: '50%', background: wColor, marginTop: 6 }} aria-hidden="true" />
          )}
          <span style={{ fontSize: 15, color: t.text, fontWeight: 500, overflowWrap: 'anywhere', lineHeight: 1.3 }}>{item.name}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' }}>
          {showZoneBadge && zone && (
            <span style={{ fontSize: 10.5, fontWeight: 700, color: pal.accent }}>
              {zone.emoji} {zone.label}
            </span>
          )}
          {showMhdBadge && (
            <span style={{
              fontSize: 11, fontWeight: 700, color: mhdColor,
              background: mhdWarn ? mhdBg : 'transparent',
              padding: '1px 7px', borderRadius: 6,
            }}>
              {tr(lang, 'itemRow.mhdPrefix')} {mhdLabel(days, lang)}
            </span>
          )}
          {/* „geöffnet"-Badge – nur sichtbar, wenn im Bearbeiten-Menü aktiviert;
              zeigt die Rest-Haltbarkeit nach dem Öffnen, wenn bekannt. */}
          {showOpenedBadge && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700,
              color: openColor,
              background: openBg,
              padding: '1px 7px', borderRadius: 6,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: openColor }} aria-hidden="true" />
              {openDays != null ? tr(lang, 'itemRow.openedWith', { rem: remLabel }) : tr(lang, 'itemRow.opened')}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={() => onChangeQty(item.id, -1)} style={btnCircle(t.cardAlt, t.pillInactiveText)} aria-label={tr(lang, 'itemRow.decreaseAria', { name: item.name })}>
          <Minus size={14} strokeWidth={2.5} />
        </button>
        <span
          onClick={() => (item.unit !== 'stk' ? onEdit(item) : null)}
          style={{
            minWidth: item.unit === 'stk' ? 20 : 46, textAlign: 'center',
            fontSize: 14, fontWeight: 700, color: pal.accent,
            cursor: item.unit !== 'stk' ? 'pointer' : 'default',
          }}
        >
          {item.unit === 'stk' ? `${item.qty}x` : `${item.qty}${item.unit}`}
        </span>
        <button onClick={() => onChangeQty(item.id, 1)} style={btnCircle(pal.accentBg, pal.accent)} aria-label={tr(lang, 'itemRow.increaseAria', { name: item.name })}>
          <Plus size={14} strokeWidth={2.5} />
        </button>
        <button onClick={() => onRemove(item.id)} style={{ ...btnCircle('transparent', t.danger), marginLeft: 2 }} aria-label={tr(lang, 'itemRow.removeAria', { name: item.name })}>
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
