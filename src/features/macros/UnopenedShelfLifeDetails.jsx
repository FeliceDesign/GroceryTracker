import { useState } from 'react';
import { ChevronDown, ChevronRight, PackageCheck } from 'lucide-react';
import { unopenedInfo } from '../../lib/unopenedShelfLife.js';
import { tr } from '../../lib/i18n.js';

// Rundet Tage für die Anzeige auf eine lesbare Einheit (Tage/Monate/Jahre).
function formatExtraDays(days, lang) {
  if (days >= 365) { const n = Math.round(days / 365); return `${n} ${tr(lang, n === 1 ? 'common.year' : 'common.years')}`; }
  if (days >= 30) { const n = Math.round(days / 30); return `${n} ${tr(lang, n === 1 ? 'common.month' : 'common.months')}`; }
  return `${days} ${tr(lang, days === 1 ? 'common.day' : 'common.days')}`;
}

// Ausklappbare Begründung zur Haltbarkeit ungeöffnet über das gedruckte MHD
// hinaus. Rendert nichts, wenn es keinen Regel-Treffer gibt (u.a. bei rohem
// Fleisch/Fisch/Geflügel absichtlich so – siehe lib/unopenedShelfLife.js).
export function UnopenedShelfLifeDetails({ name, t, lang = 'de', defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const info = unopenedInfo(name);

  if (!info) {
    return (
      <div style={{ fontSize: 12.5, color: t.textFaint, lineHeight: 1.4 }}>
        {tr(lang, 'unopenedShelfLife.detailNone')}
      </div>
    );
  }

  const reason = lang === 'en' && info.reason_en ? info.reason_en : info.reason;
  const label = lang === 'en' && info.label_en ? info.label_en : info.label;

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
            {info.extraDays > 0 ? tr(lang, 'unopenedShelfLife.stillGood', { n: formatExtraDays(info.extraDays, lang) }) : tr(lang, 'unopenedShelfLife.useSafety')}
          </span>
          <span style={{ display: 'block', fontSize: 11.5, color: t.textFaint, marginTop: 1 }}>
            {label} · {tr(lang, 'unopenedShelfLife.onlyUnopened')}
          </span>
        </span>
        {open ? <ChevronDown size={18} color={t.textFaint} /> : <ChevronRight size={18} color={t.textFaint} />}
      </button>

      {open && (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12.5, color: t.textMuted, lineHeight: 1.5 }}>{reason}</div>
        </div>
      )}
    </div>
  );
}
