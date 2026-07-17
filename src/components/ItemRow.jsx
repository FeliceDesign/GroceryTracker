import { Plus, Minus, Trash2 } from 'lucide-react';
import { zonePalette } from '../lib/colors.js';
import { daysUntil, mhdColor, mhdLabel } from '../lib/date.js';
import { btnCircle } from '../lib/styles.js';

// Eine Artikelzeile. `zone` ist das aufgelöste Lagerort-Objekt (oder undefined,
// falls der Lagerort inzwischen entfernt wurde – dann neutraler Fallback).
export function ItemRow({ item, zone, t, dark, justChanged, onEdit, onChangeQty, onRemove, showZoneBadge, isLast }) {
  const pal = zonePalette(zone ? zone.color : t.textMuted, dark);
  const days = daysUntil(item.mhd);

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
        <div style={{ fontSize: 15, color: t.text, fontWeight: 500 }}>{item.name}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 1, flexWrap: 'wrap' }}>
          {showZoneBadge && zone && (
            <span style={{ fontSize: 10.5, fontWeight: 700, color: pal.accent }}>
              {zone.emoji} {zone.label}
            </span>
          )}
          {item.mhd && (
            <span style={{ fontSize: 11, fontWeight: 600, color: mhdColor(days, t) }}>
              MHD {mhdLabel(days)}
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
