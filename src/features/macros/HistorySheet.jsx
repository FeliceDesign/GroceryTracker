import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Trash2, PackagePlus, PackageMinus, Utensils, Search } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { primaryButtonStyle, pillStyle, btnCircle, makeInputStyle } from '../../lib/styles.js';
import { tr } from '../../lib/i18n.js';
import { macroSummary, formatMacroTable, copyToClipboard, hasMacros } from '../../lib/macros.js';

// Innerhalb eines Tages gelten Einträge derselben Aktion (hinzugefügt/
// verzehrt) als eine "Mahlzeit", wenn sie höchstens 30 Minuten auseinander
// liegen - z.B. mehrere Zutaten, die kurz hintereinander verzehrt wurden.
const MEAL_GAP_MS = 30 * 60 * 1000;

const startOfDay = (date) => { const c = new Date(date); c.setHours(0, 0, 0, 0); return c; };

// Tages-Label für Gruppenüberschriften: "Heute", "Gestern", sonst "12.03.".
function dayLabel(ts, lang) {
  const locale = lang === 'en' ? 'en-US' : 'de-DE';
  const d = new Date(ts);
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (diffDays === 0) return tr(lang, 'date.today');
  if (diffDays === 1) return tr(lang, 'history.yesterday');
  return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
}

// Nur die Uhrzeit - das Datum steht bereits in der Tages-Gruppenüberschrift.
function timeOnly(ts, lang) {
  const locale = lang === 'en' ? 'en-US' : 'de-DE';
  return new Date(ts).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

// Kleines Icon je Aktions-Kategorie: neu hinzugefügt vs. verzehrt/aufgebraucht.
// Bewusst nicht Utensils, damit es nicht wie das Makro-Icon (hinter dem Namen)
// aussieht und fälschlich "hat Makros" suggeriert.
function ActionIcon({ action, t }) {
  const Icon = action === 'added' ? PackagePlus : PackageMinus;
  return <Icon size={13} color={t.textFaint} />;
}

// Gespeicherte Menge kompakt darstellen ("2x", "200g", "500ml") - leer,
// wenn für den Eintrag keine Menge hinterlegt wurde (z.B. reines Makros-Kopieren).
function formatQty(qty, unit) {
  if (qty == null || qty <= 0) return '';
  return unit === 'stk' ? `${qty}×` : `${qty}${unit || ''}`;
}

// Innerhalb einer Mahlzeit werden mehrere Einträge desselben Artikels (gleicher
// Name, gleiche Einheit) zu einer Zeile mit aufsummierter Menge zusammengeführt
// - z.B. zwei Portionen desselben Joghurts kurz hintereinander verzehrt. Jede
// Zeile behält alle zugrundeliegenden Einträge (`entries`), damit Löschen und
// Mengen-Korrektur (siehe HistorySheet) darauf zugreifen können.
function mergeMealEntries(entries) {
  const rows = [];
  const byKey = new Map();
  for (const entry of entries) {
    const key = `${entry.food.name}|${entry.unit || ''}`;
    let row = byKey.get(key);
    if (!row) {
      row = { id: entry.id, food: entry.food, action: entry.action, unit: entry.unit, qty: null, consumedAt: entry.consumedAt, entries: [] };
      byKey.set(key, row);
      rows.push(row);
    }
    row.entries.push(entry);
    if (entry.qty != null && entry.qty > 0) row.qty = (row.qty || 0) + entry.qty;
  }
  return rows;
}

// Einträge zuerst nach Tag gruppieren, innerhalb eines Tages zusätzlich nach
// "Mahlzeit" (siehe MEAL_GAP_MS). `entries` ist bereits neueste-zuerst
// sortiert (so wie sie aus der Historie kommen) - diese Reihenfolge bleibt
// erhalten, sowohl über die Tage als auch innerhalb einer Mahlzeit.
function groupHistory(entries, lang) {
  const days = [];
  for (const entry of entries) {
    const key = startOfDay(entry.consumedAt).getTime();
    let day = days[days.length - 1];
    if (!day || day.key !== key) {
      day = { key, label: dayLabel(entry.consumedAt, lang), meals: [] };
      days.push(day);
    }
    const lastMeal = day.meals[day.meals.length - 1];
    const prevEntry = lastMeal ? lastMeal.entries[lastMeal.entries.length - 1] : null;
    if (lastMeal && lastMeal.action === entry.action && (prevEntry.consumedAt - entry.consumedAt) <= MEAL_GAP_MS) {
      lastMeal.entries.push(entry);
    } else {
      day.meals.push({ action: entry.action, entries: [entry] });
    }
  }
  for (const day of days) {
    for (const meal of day.meals) meal.entries = mergeMealEntries(meal.entries);
  }
  return days;
}

// Eine einzelne Historie-Zeile: Auswahl-Häkchen, Name, Makro-Icon (falls
// vorhanden), Menge (antippbar zum Nachkorrigieren), Kopieren, Löschen.
// `row` kann mehrere zusammengeführte Einträge desselben Artikels innerhalb
// einer Mahlzeit repräsentieren (siehe mergeMealEntries) - Löschen entfernt
// dann alle, eine Mengen-Korrektur führt sie auf einen Eintrag zusammen.
function EntryRow({ row, t, lang, selected, onToggle, onCopy, copied, onRemove, onUpdateQty, isLast }) {
  const [editingQty, setEditingQty] = useState(false);
  const [qtyText, setQtyText] = useState(String(row.qty ?? ''));
  useEffect(() => { setQtyText(String(row.qty ?? '')); }, [row.qty]);

  const hasQty = row.qty != null && row.qty > 0;
  const summary = macroSummary(row.food, lang);

  const commitQty = () => {
    const v = parseFloat(qtyText.replace(',', '.'));
    if (Number.isFinite(v) && v > 0) onUpdateQty(row, v);
    else setQtyText(String(row.qty ?? ''));
    setEditingQty(false);
  };

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '10px 12px',
        borderBottom: !isLast ? `1px solid ${t.border}` : 'none',
      }}
    >
      <button
        type="button"
        onClick={() => onToggle(row.id)}
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
          <span style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
            <span style={{ flexShrink: 0, display: 'flex', marginTop: 2 }}>
              <ActionIcon action={row.action} t={t} />
            </span>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: t.text, wordBreak: 'break-word' }}>
              {row.food.name}
              {hasMacros(row.food) && (
                <span title={tr(lang, 'favorites.hasMacrosTitle')} aria-label={tr(lang, 'favorites.hasMacrosTitle')} style={{ display: 'inline-flex', verticalAlign: 'middle', marginLeft: 5 }}>
                  <Utensils size={11} color={t.textMuted} />
                </span>
              )}
            </span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: t.textFaint, marginTop: 2 }}>
            {summary && <span>{summary} ·</span>}
            {hasQty && (
              editingQty ? (
                <input
                  type="number"
                  inputMode="decimal"
                  autoFocus
                  value={qtyText}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setQtyText(e.target.value)}
                  onBlur={commitQty}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                  style={{
                    width: 52, fontSize: 11.5, color: t.text, background: t.card,
                    border: `1px solid ${t.border}`, borderRadius: 6, padding: '1px 4px',
                  }}
                />
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); setEditingQty(true); }}
                  style={{ textDecoration: 'underline dotted', cursor: 'pointer' }}
                >
                  {formatQty(row.qty, row.unit)}
                </span>
              )
            )}
            {hasQty && <span>·</span>}
            <span>{timeOnly(row.consumedAt, lang)}</span>
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => onCopy(row)}
        aria-label={tr(lang, 'history.copyOneAria', { name: row.food.name })}
        style={btnCircle('transparent', copied ? t.success : t.textFaint, 30)}
      >
        {copied ? <Check size={15} /> : <Copy size={14} />}
      </button>
      <button
        type="button"
        onClick={() => onRemove(row)}
        aria-label={tr(lang, 'history.removeAria', { name: row.food.name })}
        style={btnCircle('transparent', t.textFaint, 30)}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// Historie von Bestandsänderungen mit Makrodaten: "hinzugefügt" und
// "verzehrt" getrennt filterbar, durchsuchbar und nach Tag/Mahlzeit
// gruppiert. Mehrere Einträge markieren und ihre Makros in einem Rutsch
// (nacheinander, im bestehenden Kopier-Format) in die Zwischenablage
// kopieren - für schnelles Nachtragen z.B. in eine Tracking-App.
export function HistorySheet({ open, onClose, t, lang = 'de', history, onRemoveHistory, onUpdateHistory }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'added' | 'consumed'
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      setCopied(false);
      setCopiedId(null);
      setFilter('all');
      setSearch('');
    }
  }, [open]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (history || []).filter((h) => (filter === 'all' || h.action === filter)
      && (!q || h.food.name.toLowerCase().includes(q)));
  }, [history, filter, search]);

  const groupedHistory = useMemo(() => groupHistory(visible, lang), [visible, lang]);

  // Flache Liste aller sichtbaren Zeilen (nach Zusammenführung gleicher
  // Artikel je Mahlzeit) - Grundlage für Alle-auswählen/Sammel-Kopieren,
  // da diese mit Zeilen statt einzelnen Historie-Einträgen arbeiten.
  const allRows = useMemo(
    () => groupedHistory.flatMap((day) => day.meals.flatMap((meal) => meal.entries)),
    [groupedHistory],
  );

  // Reine Zähl-Statistik der letzten 7 Tage, unabhängig von Filter/Suche.
  const weeklyStats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = (history || []).filter((h) => h.consumedAt >= weekAgo);
    return {
      total: recent.length,
      added: recent.filter((h) => h.action === 'added').length,
      consumed: recent.filter((h) => h.action === 'consumed').length,
    };
  }, [history]);

  const toggle = (id) => {
    setCopied(false);
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAll = () => setSelectedIds(allRows.map((r) => r.id));
  const selectNone = () => setSelectedIds([]);

  // Entfernt eine Zeile - bei zusammengeführten Artikeln (mehrere Einträge
  // derselben Mahlzeit) alle zugrundeliegenden Historie-Einträge auf einmal.
  const removeRow = (row) => {
    setSelectedIds((prev) => prev.filter((x) => x !== row.id));
    row.entries.forEach((e) => onRemoveHistory?.(e.id));
  };

  // Mengen-Korrektur einer (ggf. zusammengeführten) Zeile: der neue Wert
  // landet auf dem ersten zugrundeliegenden Eintrag, etwaige weitere werden
  // gelöscht - sie gehen in der neuen Summe auf.
  const updateRowQty = (row, qty) => {
    const [first, ...rest] = row.entries;
    onUpdateHistory?.(first.id, { qty });
    rest.forEach((e) => onRemoveHistory?.(e.id));
  };

  const copyOne = async (row) => {
    const ok = await copyToClipboard(formatMacroTable(row.food, lang));
    if (ok) {
      setCopiedId(row.id);
      setTimeout(() => setCopiedId((k) => (k === row.id ? null : k)), 1600);
    }
  };

  const copySelected = async () => {
    const chosen = allRows.filter((r) => selectedIds.includes(r.id));
    if (chosen.length === 0) return;
    const text = chosen.map((r) => formatMacroTable(r.food, lang)).join('\n\n');
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
          {weeklyStats.total > 0 && (
            <div style={{ fontSize: 12, color: t.textFaint, marginTop: 2, marginBottom: 10 }}>
              {tr(lang, 'history.weekStats', { added: weeklyStats.added, consumed: weeklyStats.consumed })}
            </div>
          )}

          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={16} color={t.textFaint} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tr(lang, 'history.searchPlaceholder')}
              style={{ ...makeInputStyle(t), marginTop: 0, paddingLeft: 36 }}
            />
          </div>

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
          {groupedHistory.length === 0 ? (
            <div style={{ textAlign: 'center', color: t.textFaint, padding: '24px 12px', fontSize: 13.5 }}>
              {tr(lang, 'history.emptyFiltered')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {groupedHistory.map((day) => (
                <div key={day.key}>
                  <div style={{
                    fontSize: 11.5, fontWeight: 700, color: t.textFaint, textTransform: 'uppercase',
                    letterSpacing: '0.04em', marginBottom: 6,
                  }}
                  >
                    {day.label}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {day.meals.map((meal, mi) => (
                      <div key={mi} style={{ background: t.cardAlt, borderRadius: 14, overflow: 'hidden' }}>
                        {meal.entries.map((row, ei) => (
                          <EntryRow
                            key={row.id}
                            row={row}
                            t={t}
                            lang={lang}
                            selected={selectedIds.includes(row.id)}
                            onToggle={toggle}
                            onCopy={copyOne}
                            copied={copiedId === row.id}
                            onRemove={removeRow}
                            onUpdateQty={updateRowQty}
                            isLast={ei === meal.entries.length - 1}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
