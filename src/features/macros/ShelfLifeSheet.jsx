import { useMemo, useState } from 'react';
import { Search, Snowflake, Home, ThermometerSun } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { OPENED_SHELF_RULES, storageLabel } from '../../lib/openedShelfLife.js';
import { UNOPENED_SHELF_RULES } from '../../lib/unopenedShelfLife.js';
import { FROZEN_SHELF_RULES } from '../../lib/frozenShelfLife.js';
import { makeInputStyle, pillStyle } from '../../lib/styles.js';

function StorageIcon({ storage, size = 14, color }) {
  if (storage === 'room') return <Home size={size} color={color} />;
  if (storage === 'both') return <ThermometerSun size={size} color={color} />;
  return <Snowflake size={size} color={color} />;
}

function formatExtraDays(days) {
  if (days >= 365) return `${Math.round(days / 365)} ${Math.round(days / 365) === 1 ? 'Jahr' : 'Jahre'}`;
  if (days >= 30) return `${Math.round(days / 30)} ${Math.round(days / 30) === 1 ? 'Monat' : 'Monate'}`;
  return `${days} ${days === 1 ? 'Tag' : 'Tage'}`;
}

const TABS = [
  { id: 'opened', label: 'Geöffnet' },
  { id: 'unopened', label: 'Ungeöffnet' },
  { id: 'frozen', label: 'Tiefgefroren' },
];

const categoryHeaderStyle = (t) => ({
  fontSize: 11, fontWeight: 700, color: t.textFaint, letterSpacing: '0.04em',
  textTransform: 'uppercase', marginBottom: 8, paddingLeft: 2,
});

// Nachschlage-Übersicht aller Haltbarkeits-Richtwerte, mit Tab-Umschalter
// zwischen Geöffnet / Ungeöffnet (über MHD hinaus) / Tiefgefroren, gruppiert
// nach Kategorie (Anzeige-Feld `category`, beeinflusst nicht das Keyword-
// Matching in den lib/*ShelfLife.js-Dateien).
export function ShelfLifeSheet({ open, onClose, t }) {
  const [tab, setTab] = useState('opened');
  const [q, setQ] = useState('');
  const inputStyle = makeInputStyle(t);

  const rules = tab === 'unopened' ? UNOPENED_SHELF_RULES : tab === 'frozen' ? FROZEN_SHELF_RULES : OPENED_SHELF_RULES;

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rules;
    return rules.filter(
      (r) => r.label.toLowerCase().includes(query) || r.keys.some((k) => k.includes(query) || query.includes(k)),
    );
  }, [rules, q]);

  const grouped = useMemo(() => {
    const byCat = {};
    list.forEach((r) => {
      const cat = r.category || 'Sonstiges';
      (byCat[cat] = byCat[cat] || []).push(r);
    });
    return Object.entries(byCat).sort(([a], [b]) => a.localeCompare(b, 'de'));
  }, [list]);

  const subtitle = tab === 'unopened' ? 'Richtwerte ungeöffnet über das MHD hinaus' : tab === 'frozen' ? 'Richtwerte tiefgefroren' : 'Richtwerte nach dem Öffnen';

  return (
    <Modal open={open} onClose={onClose} t={t} title="Haltbarkeits-Ratgeber" subtitle={subtitle}>
      <div style={{ display: 'flex', gap: 8, marginTop: 4, marginBottom: 12 }}>
        {TABS.map((tb) => (
          <button key={tb.id} type="button" onClick={() => setTab(tb.id)} style={pillStyle(tab === tb.id, t)}>
            {tb.label}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={16} color={t.textFaint} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Lebensmittel suchen…" style={{ ...inputStyle, marginTop: 0, paddingLeft: 36 }} />
      </div>

      {tab === 'opened' && (
        <div style={{ fontSize: 11.5, color: t.textFaint, lineHeight: 1.5, marginBottom: 12 }}>
          Gerechnet ab dem Öffnen; gewarnt wird zum früheren von gedrucktem MHD und dieser Frist.
          Konservative Richtwerte bei sauberem Umgang. <Snowflake size={11} style={{ verticalAlign: 'middle' }} /> Kühlschrank ·{' '}
          <ThermometerSun size={11} style={{ verticalAlign: 'middle' }} /> beides · <Home size={11} style={{ verticalAlign: 'middle' }} /> Raumtemperatur.
        </div>
      )}
      {tab === 'unopened' && (
        <div style={{ fontSize: 11.5, color: t.textFaint, lineHeight: 1.5, marginBottom: 12 }}>
          Das MHD ist kein Wegwerfdatum – ungeöffnet und richtig gelagert oft noch länger genießbar.
          Gilt nur für Artikel mit MHD, nicht für Verbrauchsdatum-Artikel wie rohes Fleisch/Fisch (dafür gibt es hier bewusst keinen Eintrag).
        </div>
      )}
      {tab === 'frozen' && (
        <div style={{ fontSize: 11.5, color: t.textFaint, lineHeight: 1.5, marginBottom: 12 }}>
          Bei konstant -18 °C ist Tiefgekühltes durchgehend sicher – die Monatsangaben sind reine Qualitätsempfehlungen (Geschmack/Textur), keine Sicherheitsfrist.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {grouped.map(([cat, entries]) => (
          <div key={cat}>
            <div style={categoryHeaderStyle(t)}>{cat}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tab === 'opened' && entries.map((r) => (
                <div key={r.label} style={{ background: t.cardAlt, borderRadius: 12, padding: '11px 13px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: t.text }}>{r.label}</span>
                    <span style={{ flexShrink: 0, fontSize: 14, fontWeight: 800, color: t.text }}>
                      {r.days} {r.days === 1 ? 'Tag' : 'Tage'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, fontSize: 11.5, fontWeight: 700, color: t.textMuted }}>
                    <StorageIcon storage={r.storage} color={t.textMuted} /> {storageLabel(r.storage)}
                  </div>
                  <div style={{ fontSize: 12, color: t.textFaint, marginTop: 5, lineHeight: 1.45 }}>{r.reason}</div>
                </div>
              ))}

              {tab === 'unopened' && entries.map((r) => (
                <div key={r.label} style={{ background: t.cardAlt, borderRadius: 12, padding: '11px 13px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: t.text }}>{r.label}</span>
                    <span style={{ flexShrink: 0, fontSize: 14, fontWeight: 800, color: t.text }}>
                      {r.extraDays > 0 ? `+${formatExtraDays(r.extraDays)}` : 'kein Puffer'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: t.textFaint, marginTop: 5, lineHeight: 1.45 }}>{r.reason}</div>
                </div>
              ))}

              {tab === 'frozen' && entries.map((r) => (
                <div key={r.label} style={{ background: t.cardAlt, borderRadius: 12, padding: '11px 13px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: t.text }}>{r.label}</span>
                    <span style={{ flexShrink: 0, fontSize: 14, fontWeight: 800, color: t.text }}>
                      {r.notRecommended ? 'nicht empfohlen' : `${r.months} ${r.months === 1 ? 'Monat' : 'Monate'}`}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: t.textFaint, marginTop: 5, lineHeight: 1.45 }}>{r.reason}</div>
                  {r.prep && (
                    <div style={{ fontSize: 12, color: t.textFaint, marginTop: 4, lineHeight: 1.45 }}>
                      <b>Vorbereitung:</b> {r.prep}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {list.length === 0 && (
          <div style={{ textAlign: 'center', color: t.textFaint, padding: '28px 12px', fontSize: 13.5 }}>Nichts gefunden.</div>
        )}
      </div>
    </Modal>
  );
}
