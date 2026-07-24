import { useState } from 'react';
import { ChevronDown, ChevronRight, Snowflake } from 'lucide-react';
import { frozenInfo } from '../../lib/frozenShelfLife.js';

// Ausklappbare Begründung zur Haltbarkeit tiefgefroren: Monate (oder „nicht
// empfohlen"), Vorbereitungstipp, Begründung. Kein Lagerort-Abgleich nötig –
// die Tiefkühltruhe ist immer -18 °C, unabhängig vom aktuellen Lagerort.
export function FrozenShelfLifeDetails({ name, t, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const info = frozenInfo(name);

  if (!info) {
    return (
      <div style={{ fontSize: 12.5, color: t.textFaint, lineHeight: 1.4 }}>
        Kein Automatik-Wert für diesen Namen – Richtwert individuell einschätzen.
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
        <Snowflake size={16} color={t.textMuted} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: t.text }}>
            {info.notRecommended ? 'Einfrieren nicht empfohlen' : `Tiefgefroren haltbar: ${info.months} ${info.months === 1 ? 'Monat' : 'Monate'}`}
          </span>
          <span style={{ display: 'block', fontSize: 11.5, color: t.textFaint, marginTop: 1 }}>
            {info.label} · Richtwert für Qualität, keine Sicherheitsfrist
          </span>
        </span>
        {open ? <ChevronDown size={18} color={t.textFaint} /> : <ChevronRight size={18} color={t.textFaint} />}
      </button>

      {open && (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12.5, color: t.textMuted, lineHeight: 1.5 }}>{info.reason}</div>
          {info.prep && (
            <div style={{ fontSize: 12.5, color: t.textMuted, lineHeight: 1.5 }}>
              <b style={{ color: t.text }}>Vorbereitung: </b>{info.prep}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
