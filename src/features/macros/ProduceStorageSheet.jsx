import { useMemo, useState } from 'react';
import { Search, Snowflake, Home, ThermometerSun } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { PRODUCE_RULES, ethyleneLabel } from '../../lib/produceStorage.js';
import { storageLabel } from '../../lib/openedShelfLife.js';
import { makeInputStyle } from '../../lib/styles.js';
import { tr } from '../../lib/i18n.js';

function StorageIcon({ storage, size = 14, color }) {
  if (storage === 'room') return <Home size={size} color={color} />;
  if (storage === 'both') return <ThermometerSun size={size} color={color} />;
  return <Snowflake size={size} color={color} />;
}

// Nachschlage-Übersicht der Obst-&-Gemüse-Lagerhinweise.
export function ProduceStorageSheet({ open, onClose, t, lang = 'de' }) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const inputStyle = makeInputStyle(t);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return PRODUCE_RULES.filter((r) => {
      if (category !== 'all' && r.category !== category) return false;
      if (!query) return true;
      return r.label.toLowerCase().includes(query) || r.keys.some((k) => k.includes(query) || query.includes(k));
    });
  }, [q, category]);

  return (
    <Modal open={open} onClose={onClose} t={t} lang={lang} title={tr(lang, 'produce.title')} subtitle={tr(lang, 'produce.subtitle')}>
      <div style={{ position: 'relative', marginTop: 4, marginBottom: 12 }}>
        <Search size={16} color={t.textFaint} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr(lang, 'produce.searchPlaceholder')} style={{ ...inputStyle, marginTop: 0, paddingLeft: 36 }} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <Segmented
          t={t}
          value={category}
          onChange={setCategory}
          options={[
            { value: 'all', label: tr(lang, 'produce.categoryAll') },
            { value: 'obst', label: tr(lang, 'produce.categoryObst') },
            { value: 'gemuese', label: tr(lang, 'produce.categoryGemuese') },
            { value: 'kraeuter', label: tr(lang, 'produce.categoryKraeuter') },
          ]}
        />
      </div>

      <div style={{ fontSize: 11.5, color: t.textFaint, lineHeight: 1.5, marginBottom: 12 }}>
        {tr(lang, 'produce.hint')}{' '}
        <Snowflake size={11} style={{ verticalAlign: 'middle' }} /> {tr(lang, 'produce.fridge')} ·{' '}
        <ThermometerSun size={11} style={{ verticalAlign: 'middle' }} /> {tr(lang, 'produce.both')} · <Home size={11} style={{ verticalAlign: 'middle' }} /> {tr(lang, 'produce.room')}.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.map((r) => {
          const label = lang === 'en' && r.label_en ? r.label_en : r.label;
          const reason = lang === 'en' && r.reason_en ? r.reason_en : r.reason;
          const packaging = lang === 'en' && r.packaging_en ? r.packaging_en : r.packaging;
          return (
            <div key={r.label} style={{ background: t.cardAlt, borderRadius: 12, padding: '11px 13px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: t.text }}>{label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, fontSize: 11.5, fontWeight: 700, color: t.textMuted }}>
                <StorageIcon storage={r.storage} color={t.textMuted} /> {storageLabel(r.storage, lang)}
                <span style={{ color: t.textFaint, fontWeight: 500 }}>
                  · {tr(lang, 'produce.ethylene', { produces: ethyleneLabel(r.ethyleneProduces, lang), sensitive: ethyleneLabel(r.ethyleneSensitive, lang) })}
                </span>
              </div>
              <div style={{ fontSize: 12, color: t.textMuted, marginTop: 5, lineHeight: 1.45 }}>{reason}</div>
              <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4, lineHeight: 1.45 }}>
                <b>{tr(lang, 'produce.packaging')}</b> {packaging}
              </div>
            </div>
          );
        })}
        {list.length === 0 && (
          <div style={{ textAlign: 'center', color: t.textFaint, padding: '28px 12px', fontSize: 13.5 }}>{tr(lang, 'produce.nothingFound')}</div>
        )}
      </div>
    </Modal>
  );
}
