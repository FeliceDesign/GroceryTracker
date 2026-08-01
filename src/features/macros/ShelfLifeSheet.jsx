import { useMemo, useState } from 'react';
import { Search, Snowflake, Home, ThermometerSun, Refrigerator, Droplets, Microwave, CookingPot } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { OPENED_SHELF_RULES, storageLabel } from '../../lib/openedShelfLife.js';
import { UNOPENED_SHELF_RULES } from '../../lib/unopenedShelfLife.js';
import { FROZEN_SHELF_RULES } from '../../lib/frozenShelfLife.js';
import { THAWING_RULES } from '../../lib/thawing.js';
import { makeInputStyle, pillStyle, groupLabelStyle } from '../../lib/styles.js';
import { tr } from '../../lib/i18n.js';

function StorageIcon({ storage, size = 14, color }) {
  if (storage === 'room') return <Home size={size} color={color} />;
  if (storage === 'both') return <ThermometerSun size={size} color={color} />;
  return <Snowflake size={size} color={color} />;
}

function MethodIcon({ method, size = 14, color }) {
  if (method === 'coldWater') return <Droplets size={size} color={color} />;
  if (method === 'microwave') return <Microwave size={size} color={color} />;
  if (method === 'room') return <Home size={size} color={color} />;
  if (method === 'direct') return <CookingPot size={size} color={color} />;
  return <Refrigerator size={size} color={color} />;
}

function formatExtraDays(days, lang) {
  if (days >= 365) { const n = Math.round(days / 365); return `${n} ${tr(lang, n === 1 ? 'common.year' : 'common.years')}`; }
  if (days >= 30) { const n = Math.round(days / 30); return `${n} ${tr(lang, n === 1 ? 'common.month' : 'common.months')}`; }
  return `${days} ${tr(lang, days === 1 ? 'common.day' : 'common.days')}`;
}

const TABS = (lang) => [
  { id: 'opened', label: tr(lang, 'shelfLife.tabOpened') },
  { id: 'unopened', label: tr(lang, 'shelfLife.tabUnopened') },
  { id: 'frozen', label: tr(lang, 'shelfLife.tabFrozen') },
  { id: 'thawing', label: tr(lang, 'shelfLife.tabThawing') },
];

const categoryHeaderStyle = (t) => ({ ...groupLabelStyle(t), marginBottom: 8, paddingLeft: 2 });

// Nachschlage-Übersicht aller Haltbarkeits-Richtwerte, mit Tab-Umschalter
// zwischen Geöffnet / Ungeöffnet (über MHD hinaus) / Tiefgefroren, gruppiert
// nach Kategorie (Anzeige-Feld `category`, beeinflusst nicht das Keyword-
// Matching in den lib/*ShelfLife.js-Dateien).
export function ShelfLifeSheet({ open, onClose, t, lang = 'de' }) {
  const [tab, setTab] = useState('opened');
  const [q, setQ] = useState('');
  const inputStyle = makeInputStyle(t);
  const tabs = TABS(lang);

  const rules = tab === 'unopened' ? UNOPENED_SHELF_RULES : tab === 'frozen' ? FROZEN_SHELF_RULES : tab === 'thawing' ? THAWING_RULES : OPENED_SHELF_RULES;

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

  const subtitle = tab === 'unopened' ? tr(lang, 'shelfLife.subUnopened') : tab === 'frozen' ? tr(lang, 'shelfLife.subFrozen') : tab === 'thawing' ? tr(lang, 'shelfLife.subThawing') : tr(lang, 'shelfLife.subOpened');

  const catLabel = (r) => (lang === 'en' && r.category_en ? r.category_en : r.category) || 'Other';
  const rLabel = (r) => (lang === 'en' && r.label_en ? r.label_en : r.label);
  const rReason = (r) => (lang === 'en' && r.reason_en ? r.reason_en : r.reason);
  const rPrep = (r) => (lang === 'en' && r.prep_en !== undefined ? r.prep_en : r.prep);
  const rTime = (r) => (lang === 'en' && r.time_en ? r.time_en : r.time);

  return (
    <Modal open={open} onClose={onClose} t={t} lang={lang} title={tr(lang, 'shelfLife.title')} subtitle={subtitle}>
      <div style={{ display: 'flex', gap: 8, marginTop: 4, marginBottom: 12 }}>
        {tabs.map((tb) => (
          <button key={tb.id} type="button" onClick={() => setTab(tb.id)} style={pillStyle(tab === tb.id, t)}>
            {tb.label}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={16} color={t.textFaint} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr(lang, 'shelfLife.searchPlaceholder')} style={{ ...inputStyle, marginTop: 0, paddingLeft: 36 }} />
      </div>

      {tab === 'opened' && (
        <div style={{ fontSize: 11.5, color: t.textFaint, lineHeight: 1.5, marginBottom: 12 }}>
          {tr(lang, 'shelfLife.hintOpened')}{' '}
          <Snowflake size={11} style={{ verticalAlign: 'middle' }} /> {tr(lang, 'shelfLife.hintOpenedFridge')} ·{' '}
          <ThermometerSun size={11} style={{ verticalAlign: 'middle' }} /> {tr(lang, 'shelfLife.hintOpenedBoth')} · <Home size={11} style={{ verticalAlign: 'middle' }} /> {tr(lang, 'shelfLife.hintOpenedRoom')}.
        </div>
      )}
      {tab === 'unopened' && (
        <div style={{ fontSize: 11.5, color: t.textFaint, lineHeight: 1.5, marginBottom: 12 }}>
          {tr(lang, 'shelfLife.hintUnopened')}
        </div>
      )}
      {tab === 'frozen' && (
        <div style={{ fontSize: 11.5, color: t.textFaint, lineHeight: 1.5, marginBottom: 12 }}>
          {tr(lang, 'shelfLife.hintFrozen')}
        </div>
      )}
      {tab === 'thawing' && (
        <div style={{ fontSize: 11.5, color: t.textFaint, lineHeight: 1.5, marginBottom: 12 }}>
          {tr(lang, 'shelfLife.hintThawing')}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {grouped.map(([cat, entries]) => (
          <div key={cat}>
            <div style={categoryHeaderStyle(t)}>{lang === 'en' ? catLabel(entries[0]) : cat}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tab === 'opened' && entries.map((r) => (
                <div key={r.label} style={{ background: t.cardAlt, borderRadius: 12, padding: '11px 13px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: t.text }}>{rLabel(r)}</span>
                    <span style={{ flexShrink: 0, fontSize: 14, fontWeight: 800, color: t.text }}>
                      {r.days} {tr(lang, r.days === 1 ? 'common.day' : 'common.days')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, fontSize: 11.5, fontWeight: 700, color: t.textMuted }}>
                    <StorageIcon storage={r.storage} color={t.textMuted} /> {storageLabel(r.storage, lang)}
                  </div>
                  <div style={{ fontSize: 12, color: t.textFaint, marginTop: 5, lineHeight: 1.45 }}>{rReason(r)}</div>
                </div>
              ))}

              {tab === 'unopened' && entries.map((r) => (
                <div key={r.label} style={{ background: t.cardAlt, borderRadius: 12, padding: '11px 13px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: t.text }}>{rLabel(r)}</span>
                    <span style={{ flexShrink: 0, fontSize: 14, fontWeight: 800, color: t.text }}>
                      {r.extraDays > 0 ? `+${formatExtraDays(r.extraDays, lang)}` : tr(lang, 'shelfLife.noBuffer')}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: t.textFaint, marginTop: 5, lineHeight: 1.45 }}>{rReason(r)}</div>
                </div>
              ))}

              {tab === 'frozen' && entries.map((r) => (
                <div key={r.label} style={{ background: t.cardAlt, borderRadius: 12, padding: '11px 13px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: t.text }}>{rLabel(r)}</span>
                    <span style={{ flexShrink: 0, fontSize: 14, fontWeight: 800, color: t.text }}>
                      {r.notRecommended ? tr(lang, 'shelfLife.notRecommended') : `${r.months} ${tr(lang, r.months === 1 ? 'common.month' : 'common.months')}`}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: t.textFaint, marginTop: 5, lineHeight: 1.45 }}>{rReason(r)}</div>
                  {rPrep(r) && (
                    <div style={{ fontSize: 12, color: t.textFaint, marginTop: 4, lineHeight: 1.45 }}>
                      <b>{tr(lang, 'shelfLife.prep')}</b> {rPrep(r)}
                    </div>
                  )}
                </div>
              ))}

              {tab === 'thawing' && entries.map((r) => (
                <div key={r.label} style={{ background: t.cardAlt, borderRadius: 12, padding: '11px 13px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{rLabel(r)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 11.5, fontWeight: 700, color: t.textMuted }}>
                    <MethodIcon method={r.method} color={t.textMuted} />
                    {tr(lang, `thawing.method${r.method.charAt(0).toUpperCase()}${r.method.slice(1)}`)} · {rTime(r)}
                  </div>
                  <div style={{ fontSize: 12, color: t.textFaint, marginTop: 5, lineHeight: 1.45 }}>{rReason(r)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {list.length === 0 && (
          <div style={{ textAlign: 'center', color: t.textFaint, padding: '28px 12px', fontSize: 13.5 }}>{tr(lang, 'shelfLife.nothingFound')}</div>
        )}
      </div>
    </Modal>
  );
}
