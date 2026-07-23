import { useMemo, useState } from 'react';
import { Search, Snowflake, Home, ThermometerSun } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { PRODUCE_RULES, ethyleneLabel } from '../../lib/produceStorage.js';
import { storageLabel } from '../../lib/openedShelfLife.js';
import { makeInputStyle } from '../../lib/styles.js';

function StorageIcon({ storage, size = 14, color }) {
  if (storage === 'room') return <Home size={size} color={color} />;
  if (storage === 'both') return <ThermometerSun size={size} color={color} />;
  return <Snowflake size={size} color={color} />;
}

// Nachschlage-Übersicht der Obst-&-Gemüse-Lagerhinweise.
export function ProduceStorageSheet({ open, onClose, t }) {
  const [q, setQ] = useState('');
  const inputStyle = makeInputStyle(t);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return PRODUCE_RULES;
    return PRODUCE_RULES.filter(
      (r) => r.label.toLowerCase().includes(query) || r.keys.some((k) => k.includes(query)),
    );
  }, [q]);

  return (
    <Modal open={open} onClose={onClose} t={t} title="Obst-&-Gemüse-Ratgeber" subtitle="Lagerung, Ethylen, Verpackung">
      <div style={{ position: 'relative', marginTop: 4, marginBottom: 12 }}>
        <Search size={16} color={t.textFaint} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sorte suchen…" style={{ ...inputStyle, marginTop: 0, paddingLeft: 36 }} />
      </div>

      <div style={{ fontSize: 11.5, color: t.textFaint, lineHeight: 1.5, marginBottom: 12 }}>
        Ethylen: hoher/mittlerer Ausstoß beschleunigt die Reifung empfindlicher Sorten in der Nähe – getrennt lagern.{' '}
        <Snowflake size={11} style={{ verticalAlign: 'middle' }} /> Kühlschrank ·{' '}
        <ThermometerSun size={11} style={{ verticalAlign: 'middle' }} /> beides · <Home size={11} style={{ verticalAlign: 'middle' }} /> Raumtemperatur.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.map((r) => (
          <div key={r.label} style={{ background: t.cardAlt, borderRadius: 12, padding: '11px 13px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: t.text }}>{r.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, fontSize: 11.5, fontWeight: 700, color: t.textMuted }}>
              <StorageIcon storage={r.storage} color={t.textMuted} /> {storageLabel(r.storage)}
              <span style={{ color: t.textFaint, fontWeight: 500 }}>
                · Ethylen: produziert {ethyleneLabel(r.ethyleneProduces)} / empfindlich {ethyleneLabel(r.ethyleneSensitive)}
              </span>
            </div>
            <div style={{ fontSize: 12, color: t.textFaint, marginTop: 5, lineHeight: 1.45 }}>{r.reason}</div>
            <div style={{ fontSize: 12, color: t.textFaint, marginTop: 4, lineHeight: 1.45 }}>
              <b>Verpackung:</b> {r.packaging}
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
