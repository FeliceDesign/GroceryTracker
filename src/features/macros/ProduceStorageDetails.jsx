import { useState } from 'react';
import { ChevronDown, ChevronRight, Sprout, AlertTriangle } from 'lucide-react';
import { produceRule, ethyleneLabel } from '../../lib/produceStorage.js';
import { storageLabel, storageMismatch } from '../../lib/openedShelfLife.js';
import { tr } from '../../lib/i18n.js';

// Aufklappbare Lagerhinweise für Obst & Gemüse: kühlen ja/nein, Ethylen-
// Verhalten, Verpackung. Rendert nichts, wenn es keinen Regel-Treffer gibt
// (kein generischer Fallback-Text nötig – das ist reine Zusatzinfo für
// Obst/Gemüse, kein universelles Feld wie beim MHD).
export function ProduceStorageDetails({ name, zone, t, lang = 'de', defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const rule = produceRule(name);
  if (!rule) return null;

  const mismatch = storageMismatch(rule.storage, zone, lang);
  const reason = lang === 'en' && rule.reason_en ? rule.reason_en : rule.reason;
  const packaging = lang === 'en' && rule.packaging_en ? rule.packaging_en : rule.packaging;

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
        <Sprout size={16} color={t.textMuted} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: t.text }}>
            {tr(lang, 'produce.storage', { value: storageLabel(rule.storage, lang) })}
          </span>
          <span style={{ display: 'block', fontSize: 11.5, color: t.textFaint, marginTop: 1 }}>
            {tr(lang, 'produce.ethyleneShort', { produces: ethyleneLabel(rule.ethyleneProduces, lang), sensitive: ethyleneLabel(rule.ethyleneSensitive, lang) })}
          </span>
        </span>
        {mismatch && <AlertTriangle size={16} color={t.warning} />}
        {open ? <ChevronDown size={18} color={t.textFaint} /> : <ChevronRight size={18} color={t.textFaint} />}
      </button>

      {open && (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12.5, color: t.textMuted, lineHeight: 1.5 }}>{reason}</div>
          <div style={{ fontSize: 12.5, color: t.textMuted, lineHeight: 1.5 }}>
            <b style={{ color: t.text }}>{tr(lang, 'produce.packaging')} </b>{packaging}
          </div>
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
