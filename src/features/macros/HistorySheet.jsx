import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Trash2, PackagePlus, Utensils } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { primaryButtonStyle, pillStyle, btnCircle } from '../../lib/styles.js';
import { tr } from '../../lib/i18n.js';
import { macroSummary, formatMacroTable, copyToClipboard } from '../../lib/macros.js';

// Datum/Uhrzeit eines Historie-Eintrags kompakt darstellen: "heute · 14:32",
// "gestern · 09:10", sonst "12.03. · 09:10".
function formatWhen(ts, lang) {
  const locale = lang === 'en' ? 'en-US' : 'de-DE';
  const d = new Date(ts);
  const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const startOfDay = (date) => { const c = new Date(date); c.setHours(0, 0, 0, 0); return c; };
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (diffDays === 0) return `${tr(lang, 'date.today')} · ${time}`;
  if (diffDays === 1) return `${tr(lang, 'history.yesterday')} · ${time}`;
  return `${d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })} · ${time}`;
}

// Kleines Icon je Aktions-Kategorie: neu hinzugefügt vs. verzehrt/aufgebraucht.
function ActionIcon({ action, t }) {
  const Icon = action === 'added' ? PackagePlus : Utensils;
  return <Icon size={13} color={t.textFaint} />;
}

// Historie von Bestandsänderungen mit Makrodaten: "hinzugefügt" und
// "verzehrt" getrennt filterbar. Mehrere Einträge markieren und ihre Makros
// in einem Rutsch (nacheinander, im bestehenden Kopier-Format) in die
// Zwischenablage kopieren - für schnelles Nachtragen z.B. in eine
// Tracking-App.
export function HistorySheet({ open, onClose, t, lang = 'de', history, onRemoveHistory }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'added' | 'consumed'

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      setCopied(false);
      setFilter('all');
    }
  }, [open]);

  const visible = useMemo(
    () => (history || []).filter((h) => filter === 'all' || h.action === filter),
    [history, filter],
  );

  const toggle = (id) => {
    setCopied(false);
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAll = () => setSelectedIds(visible.map((c) => c.id));
  const selectNone = () => setSelectedIds([]);

  const removeEntry = (id) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    onRemoveHistory?.(id);
  };

  const copySelected = async () => {
    const chosen = (history || []).filter((c) => selectedIds.includes(c.id));
    if (chosen.length === 0) return;
    const text = chosen.map((c) => formatMacroTable(c.food, lang)).join('\n\n');
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  const footer = (history || []).length > 0 && (
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
        ? tr(lang, 'history.copied')
        : tr(lang, selectedIds.length === 1 ? 'history.copySelectedOne' : 'history.copySelected', { count: selectedIds.length })}
    </button>
  );

  return (
    <Modal
      open={open} onClose={onClose} t={t} lang={lang}
      title={tr(lang, 'history.title')}
      subtitle={tr(lang, 'history.subtitle', { count: (history || []).length })}
      footer={footer}
    >
      {(history || []).length === 0 ? (
        <div style={{ textAlign: 'center', color: t.textFaint, padding: '32px 12px', fontSize: 13.5 }}>
          {tr(lang, 'history.empty')}
        </div>
      ) : (
        <>
          <Segmented
            t={t}
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: tr(lang, 'history.filterAll') },
              { value: 'added', label: tr(lang, 'history.filterAdded') },
              { value: 'consumed', label: tr(lang, 'history.filterConsumed') },
            ]}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 12 }}>
            <button type="button" onClick={selectAll} style={pillStyle(false, t)}>{tr(lang, 'history.selectAll')}</button>
            <button type="button" onClick={selectNone} style={pillStyle(false, t)}>{tr(lang, 'history.selectNone')}</button>
          </div>
          {visible.length === 0 ? (
            <div style={{ textAlign: 'center', color: t.textFaint, padding: '24px 12px', fontSize: 13.5 }}>
              {tr(lang, 'history.emptyFiltered')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {visible.map((entry) => {
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
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <ActionIcon action={entry.action} t={t} />
                          <span style={{ fontSize: 14.5, fontWeight: 700, color: t.text, overflowWrap: 'anywhere' }}>
                            {entry.food.name}
                          </span>
                        </span>
                        <span style={{ display: 'block', fontSize: 11.5, color: t.textFaint, marginTop: 2 }}>
                          {macroSummary(entry.food, lang)} · {formatWhen(entry.consumedAt, lang)}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.id)}
                      aria-label={tr(lang, 'history.removeAria', { name: entry.food.name })}
                      style={btnCircle('transparent', t.textFaint, 30)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
