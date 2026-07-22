import { Plus, Minus, Trash2 } from 'lucide-react';
import { zonePalette } from '../lib/colors.js';
import { daysUntil, expiryLevel, levelColor, mhdLabel } from '../lib/date.js';
import { openedUntil } from '../lib/openedShelfLife.js';
import { btnCircle } from '../lib/styles.js';

// Eine Artikelzeile. `zone` ist das aufgelöste Lagerort-Objekt (oder undefined,
// falls der Lagerort inzwischen entfernt wurde – dann neutraler Fallback).
// `openedShelfDays` = aufgelöste Haltbarkeit nach dem Öffnen (oder null).
export function ItemRow({ item, zone, t, dark, yellowDays = 3, openedShelfDays = null, justChanged, onEdit, onChangeQty, onRemove, showZoneBadge, isLast }) {
  const pal = zonePalette(zone ? zone.color : t.textMuted, dark);
  const days = daysUntil(item.mhd); // gedrucktes MHD
  const mhdLevel = expiryLevel(days, yellowDays);
  const mhdColor = levelColor(mhdLevel, t);
  const mhdBg = mhdLevel === 'expired' ? t.dangerBg : t.warningBg;
  const mhdWarn = mhdLevel === 'expired' || mhdLevel === 'soon';

  // Rest-Haltbarkeit nach dem Öffnen
  const openUntil = openedUntil(item, openedShelfDays);
  const openDays = openUntil ? daysUntil(openUntil) : null;
  const openLevel = openDays != null ? expiryLevel(openDays, yellowDays) : null;
  const openColor = openLevel ? levelColor(openLevel, t) : t.warning;
  const openBg = openLevel === 'expired' ? t.dangerBg : t.warningBg;
  const remLabel = openDays == null ? '' : openDays < 0 ? `${Math.abs(openDays)}T überfällig` : openDays === 0 ? 'heute' : openDays === 1 ? 'morgen' : `noch ${openDays}T`;

  // Warn-Punkt vor dem Namen richtet sich nach dem frühesten (effektiven) Datum.
  const effDays = [days, openDays].filter((d) => d != null);
  const level = effDays.length ? expiryLevel(Math.min(...effDays), yellowDays) : null;
  const warn = level === 'expired' || level === 'soon';
  const wColor = levelColor(level, t);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {warn && (
            <span style={{ flexShrink: 0, width: 8, height: 8, borderRadius: '50%', background: wColor }} aria-hidden="true" />
          )}
          <span style={{ fontSize: 15, color: t.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2, flexWrap: 'wrap', paddingLeft: warn ? 15 : 0 }}>
          {showZoneBadge && zone && (
            <span style={{ fontSize: 10.5, fontWeight: 700, color: pal.accent }}>
              {zone.emoji} {zone.label}
            </span>
          )}
          {item.mhd && (
            <span style={{
              fontSize: 11, fontWeight: 700, color: mhdColor,
              background: mhdWarn ? mhdBg : 'transparent',
              padding: mhdWarn ? '1px 7px' : 0, borderRadius: 6,
            }}>
              MHD {mhdLabel(days)}
            </span>
          )}
          {/* „geöffnet"-Badge – nur sichtbar, wenn im Bearbeiten-Menü aktiviert;
              zeigt die Rest-Haltbarkeit nach dem Öffnen, wenn bekannt. */}
          {item.opened && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700,
              color: openDays != null ? openColor : t.warning,
              background: openDays != null ? openBg : t.warningBg,
              padding: '1px 7px', borderRadius: 6,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: openDays != null ? openColor : t.warning }} aria-hidden="true" />
              {openDays != null ? `geöffnet · ${remLabel}` : 'geöffnet'}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={() => onChangeQty(item.id, -1)} style={btnCircle(t.cardAlt, t.pillInactiveText)} aria-label={`${item.name} Menge verringern`}>
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
        <button onClick={() => onChangeQty(item.id, 1)} style={btnCircle(pal.accentBg, pal.accent)} aria-label={`${item.name} Menge erhöhen`}>
          <Plus size={14} strokeWidth={2.5} />
        </button>
        <button onClick={() => onRemove(item.id)} style={{ ...btnCircle('transparent', t.danger), marginLeft: 2 }} aria-label={`${item.name} entfernen`}>
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
