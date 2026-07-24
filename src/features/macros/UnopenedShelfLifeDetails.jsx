import { useState } from 'react';
import { ChevronDown, ChevronRight, PackageCheck } from 'lucide-react';
import { unopenedInfo } from '../../lib/unopenedShelfLife.js';

// Rundet Tage für die Anzeige auf eine lesbare Einheit (Tage/Monate/Jahre).
function formatExtraDays(days) {
  if (days >= 365) return `${Math.round(days / 365)} ${Math.round(days / 365) === 1 ? 'Jahr' : 'Jahre'}`;
  if (days >= 30) return `${Math.round(days / 30)} ${Math.round(days / 30) === 1 ? 'Monat' : 'Monate'}`;
  return `${days} ${days === 1 ? 'Tag' : 'Tage'}`;
}

// Ausklappbare Begründung zur Haltbarkeit ungeöffnet über das gedruckte MHD
// hinaus. Rendert nichts, wenn es keinen Regel-Treffer gibt (u.a. bei rohem
// Fleisch/Fisch/Geflügel absichtlich so – siehe lib/unopenedShelfLife.js).
export function UnopenedShelfLifeDetails({ name, t, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const info = unopenedInfo(name);

  if (!info) {
    return (
      <div style={{ fontSize: 12.5, color: t.textFaint, lineHeight: 1.4 }}>
        Kein Automatik-Wert für diesen Namen – es zählt nur das gedruckte MHD.
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
        <PackageCheck size={16} color={t.textMuted} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: t.text }}>
            {info.extraDays > 0 ? `Ungeöffnet noch ca. ${formatExtraDays(info.extraDays)} über MHD gut` : 'Nach MHD sicherheitshalber nicht mehr verzehren'}
          </span>
          <span style={{ display: 'block', fontSize: 11.5, color: t.textFaint, marginTop: 1 }}>
            {info.label} · gilt nur ungeöffnet
          </span>
        </span>
        {open ? <ChevronDown size={18} color={t.textFaint} /> : <ChevronRight size={18} color={t.textFaint} />}
      </button>

      {open && (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12.5, color: t.textMuted, lineHeight: 1.5 }}>{info.reason}</div>
        </div>
      )}
    </div>
  );
}
