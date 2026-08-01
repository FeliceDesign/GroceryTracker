import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { SPICE_RULES } from '../../lib/spices.js';
import { makeInputStyle, groupLabelStyle } from '../../lib/styles.js';
import { tr } from '../../lib/i18n.js';

// Nachschlage-Übersicht: welche Gewürze zu welchen Gerichten passen
// ("Pairing", Erfahrungswissen) und wie lange sie ganz/gemahlen halten
// (recherchiert). Gleiches Muster wie ProduceStorageSheet.jsx.
export function SpiceGuideSheet({ open, onClose, t, lang = 'de' }) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const inputStyle = makeInputStyle(t);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return SPICE_RULES.filter((r) => {
      if (category !== 'all' && r.catKey !== category) return false;
      if (!query) return true;
      if (r.label.toLowerCase().includes(query) || r.keys.some((k) => k.includes(query) || query.includes(k))) return true;
      const pairs = lang === 'en' && r.pairsWith_en ? r.pairsWith_en : r.pairsWith;
      return pairs.some((p) => p.toLowerCase().includes(query));
    });
  }, [q, category, lang]);

  return (
    <Modal open={open} onClose={onClose} t={t} lang={lang} title={tr(lang, 'spices.title')} subtitle={tr(lang, 'spices.subtitle')}>
      <div style={{ position: 'relative', marginTop: 4, marginBottom: 12 }}>
        <Search size={16} color={t.textFaint} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr(lang, 'spices.searchPlaceholder')} style={{ ...inputStyle, marginTop: 0, paddingLeft: 36 }} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <Segmented
          t={t}
          value={category}
          onChange={setCategory}
          options={[
            { value: 'all', label: tr(lang, 'spices.categoryAll') },
            { value: 'warm', label: tr(lang, 'spices.categoryWarm') },
            { value: 'asia', label: tr(lang, 'spices.categoryAsia') },
            { value: 'scharf', label: tr(lang, 'spices.categoryScharf') },
            { value: 'mediterran', label: tr(lang, 'spices.categoryMediterran') },
          ]}
        />
      </div>

      <div style={{ fontSize: 11.5, color: t.textFaint, lineHeight: 1.5, marginBottom: 12 }}>
        {tr(lang, 'spices.hint')}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.map((r) => {
          const label = lang === 'en' && r.label_en ? r.label_en : r.label;
          const pairs = lang === 'en' && r.pairsWith_en ? r.pairsWith_en : r.pairsWith;
          const storageTip = lang === 'en' && r.storageTip_en !== undefined ? r.storageTip_en : r.storageTip;
          return (
            <div key={r.label} style={{ background: t.cardAlt, border: `1px solid ${t.border}`, borderRadius: 12, padding: '11px 13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {r.emoji && (
                  <span style={{
                    flexShrink: 0, width: 32, height: 32, borderRadius: '50%', background: t.card,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
                  }}>
                    {r.emoji}
                  </span>
                )}
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: t.text }}>{label}</span>
              </div>

              <div style={{ ...groupLabelStyle(t), marginTop: 8 }}>
                {tr(lang, 'spices.pairsWith')}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 5 }}>
                {pairs.map((p) => (
                  <span key={p} style={{ fontSize: 12, fontWeight: 600, color: t.textMuted, background: t.card, borderRadius: 999, padding: '4px 10px' }}>
                    {p}
                  </span>
                ))}
              </div>

              <div style={{ ...groupLabelStyle(t), marginTop: 10 }}>
                {tr(lang, 'spices.shelfLife')}
              </div>
              <div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 4 }}>
                {r.wholeYears != null && `${tr(lang, 'spices.whole')}: ${r.wholeYears} ${tr(lang, r.wholeYears === 1 ? 'common.year' : 'common.years')}`}
                {r.wholeYears != null && r.groundMonths != null && ' · '}
                {r.groundMonths != null && `${tr(lang, 'spices.ground')}: ${r.groundMonths} ${tr(lang, r.groundMonths === 1 ? 'common.month' : 'common.months')}`}
              </div>
              {storageTip && (
                <div style={{ fontSize: 12, color: t.textFaint, marginTop: 6, lineHeight: 1.45 }}>{storageTip}</div>
              )}
            </div>
          );
        })}
        {list.length === 0 && (
          <div style={{ textAlign: 'center', color: t.textFaint, padding: '28px 12px', fontSize: 13.5 }}>{tr(lang, 'spices.nothingFound')}</div>
        )}
      </div>
    </Modal>
  );
}
