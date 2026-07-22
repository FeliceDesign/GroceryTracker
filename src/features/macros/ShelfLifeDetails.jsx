import { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, Snowflake, AlertTriangle } from 'lucide-react';
import {
  shelfLifeInfo, openedDaysFor, storageLabel, storageMismatch,
} from '../../lib/openedShelfLife.js';

// Ausklappbare Begründung zur Haltbarkeit nach dem Öffnen: Tage, empfohlene
// Lagerung, Begründung und ggf. ein Hinweis, wenn der Lagerort widerspricht.
export function ShelfLifeDetails({ name, food, zone, t, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const days = openedDaysFor(name, food);
  const info = shelfLifeInfo(name);
  const override = !!(food && food.openedDays != null && food.openedDays !== '');
  const storage = info ? info.storage : null;
  const mismatch = storage ? storageMismatch(storage, zone) : null;

  if (days == null && !info) {
    return (
      <div style={{ fontSize: 12.5, color: t.textFaint, lineHeight: 1.4 }}>
        Kein Automatik-Wert für diesen Namen – es zählt nur das MHD.
      </div>
    );
  }

  return (
    <div style={{ border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '11px 12px',
          background: t.cardAlt, border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <Clock size={16} color={t.textMuted} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: t.text }}>
            Haltbar nach dem Öffnen: {days != null ? `${days} ${days === 1 ? 'Tag' : 'Tage'}` : '—'}
          </span>
          <span style={{ display: 'block', fontSize: 11.5, color: t.textFaint, marginTop: 1 }}>
            {override ? 'eigener Wert' : (info ? info.label : 'Automatik')}{storage ? ` · ${storageLabel(storage)}` : ''}
          </span>
        </span>
        {mismatch && <AlertTriangle size={16} color={t.warning} />}
        {open ? <ChevronDown size={18} color={t.textFaint} /> : <ChevronRight size={18} color={t.textFaint} />}
      </button>

      {open && (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {storage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: t.textMuted }}>
              <Snowflake size={14} /> Empfohlene Lagerung: <b style={{ color: t.text }}>{storageLabel(storage)}</b>
            </div>
          )}
          {info && (
            <div style={{ fontSize: 12.5, color: t.textMuted, lineHeight: 1.5 }}>{info.reason}</div>
          )}
          {override && (
            <div style={{ fontSize: 12, color: t.textFaint, lineHeight: 1.4 }}>
              Für dieses Lebensmittel ist ein eigener Wert hinterlegt (überschreibt die Automatik).
            </div>
          )}
          {mismatch && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, lineHeight: 1.45,
              color: t.warning, background: t.warningBg, borderRadius: 10, padding: '9px 11px',
            }}>
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {mismatch}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
