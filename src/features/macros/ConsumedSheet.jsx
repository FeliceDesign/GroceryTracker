import { useEffect, useState } from 'react';
import { Check, Copy, Trash2 } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { primaryButtonStyle, pillStyle, btnCircle } from '../../lib/styles.js';
import { tr } from '../../lib/i18n.js';
import { macroSummary, formatMacroTable, copyToClipboard } from '../../lib/macros.js';

// Datum/Uhrzeit eines Verzehr-Eintrags kompakt darstellen: "heute · 14:32",
// "gestern · 09:10", sonst "12.03. · 09:10".
function formatWhen(ts, lang) {
  const locale = lang === 'en' ? 'en-US' : 'de-DE';
  const d = new Date(ts);
  const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const startOfDay = (date) => { const c = new Date(date); c.setHours(0, 0, 0, 0); return c; };
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (diffDays === 0) return `${tr(lang, 'date.today')} · ${time}`;
  if (diffDays === 1) return `${tr(lang, 'consumed.yesterday')} · ${time}`;
  return `${d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })} · ${time}`;
}

// Kürzlich aufgebrauchte Artikel mit Makrodaten: mehrere markieren und ihre
// Makros in einem Rutsch (nacheinander, im bestehenden Kopier-Format) in die
// Zwischenablage kopieren - für schnelles Nachtragen mehrerer verzehrter
// Artikel z.B. in eine Tracking-App.
export function ConsumedSheet({ open, onClose, t, lang = 'de', consumed, onRemoveConsumed }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      setCopied(false);
    }
  }, [open]);

  const toggle = (id) => {
    setCopied(false);
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAll = () => setSelectedIds((consumed || []).map((c) => c.id));
  const selectNone = () => setSelectedIds([]);

  const removeEntry = (id) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    onRemoveConsumed?.(id);
  };

  const copySelected = async () => {
    const chosen = (consumed || []).filter((c) => selectedIds.includes(c.id));
    if (chosen.length === 0) return;
    const text = chosen.map((c) => formatMacroTable(c.food, lang)).join('\n\n');
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  const footer = (consumed || []).length > 0 && (
    <button
      type="button"
      onClick={copySelected}
      disabled={selectedIds.length === 0}
      style={{
        ...primaryButtonStyle(t),
        opacity: selectedIds.length === 0 ? 0.45 : 1,
        cursor: selectedIds.length === 0 ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}
    >
      {copied ? <Check size={17} /> : <Copy size={16} />}
      {copied
        ? tr(lang, 'consumed.copied')
        : tr(lang, selectedIds.length === 1 ? 'consumed.copySelectedOne' : 'consumed.copySelected', { count: selectedIds.length })}
    </button>
  );

  return (
    <Modal
      open={open} onClose={onClose} t={t} lang={lang}
      title={tr(lang, 'consumed.title')}
      subtitle={tr(lang, 'consumed.subtitle', { count: (consumed || []).length })}
      footer={footer}
    >
      {(consumed || []).length === 0 ? (
        <div style={{ textAlign: 'center', color: t.textFaint, padding: '32px 12px', fontSize: 13.5 }}>
          {tr(lang, 'consumed.empty')}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button type="button" onClick={selectAll} style={pillStyle(false, t)}>{tr(lang, 'consumed.selectAll')}</button>
            <button type="button" onClick={selectNone} style={pillStyle(false, t)}>{tr(lang, 'consumed.selectNone')}</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {consumed.map((entry) => {
              const selected = selectedIds.includes(entry.id);
              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: t.cardAlt, borderRadius: 14, padding: '10px 12px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggle(entry.id)}
                    aria-pressed={selected}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, textAlign: 'left',
                      background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                    }}
                  >
                    <span style={{
                      flexShrink: 0, width: 22, height: 22, borderRadius: 7,
                      border: `2px solid ${selected ? t.pillActive : t.border}`,
                      background: selected ? t.pillActive : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    >
                      {selected && <Check size={14} color={t.pillActiveText} strokeWidth={3} />}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: t.text, overflowWrap: 'anywhere' }}>
                        {entry.food.name}
                      </span>
                      <span style={{ display: 'block', fontSize: 11.5, color: t.textFaint, marginTop: 2 }}>
                        {macroSummary(entry.food, lang)} · {formatWhen(entry.consumedAt, lang)}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.id)}
                    aria-label={tr(lang, 'consumed.removeAria', { name: entry.food.name })}
                    style={btnCircle('transparent', t.textFaint, 30)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Modal>
  );
}
