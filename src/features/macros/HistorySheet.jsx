import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Trash2, PackagePlus, PackageMinus, Utensils, Search, Plus, Repeat, Scissors, Pencil } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { primaryButtonStyle, pillStyle, btnCircle, makeInputStyle, makeLabelStyle, groupLabelStyle } from '../../lib/styles.js';
import { tr } from '../../lib/i18n.js';
import { macroSummary, formatMacroTable, copyToClipboard, hasMacros } from '../../lib/macros.js';

// Innerhalb eines Tages gelten Einträge derselben Aktion (hinzugefügt/
// verzehrt) als eine "Mahlzeit", wenn sie höchstens 30 Minuten auseinander
// liegen - z.B. mehrere Zutaten, die kurz hintereinander verzehrt wurden.
// Lässt sich pro Eintrag manuell übersteuern (siehe forceNewMeal/
// forceMergeWithPrev in groupHistory) - "Ab hier neue Mahlzeit" bzw.
// "Mit voriger Mahlzeit zusammenführen" in der UI.
const MEAL_GAP_MS = 30 * 60 * 1000;

const startOfDay = (date) => { const c = new Date(date); c.setHours(0, 0, 0, 0); return c; };

// Zeitstempel -> Wert für <input type="datetime-local"> (lokale Zeit, keine
// Zeitzone), und zurück beim Speichern via `new Date(value).getTime()`.
function toLocalInputValue(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
// Feld-Korrekturen (siehe HistorySheet) darauf zugreifen können.
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
// `forceNewMeal`/`forceMergeWithPrev` auf einem Eintrag übersteuern die
// automatische 30-Minuten-Regel (manuelles Trennen/Zusammenführen).
// `boundaryEntryId` je Mahlzeit merkt sich den Eintrag, der die Mahlzeit
// eröffnet hat - Ziel für "mit voriger Mahlzeit zusammenführen".
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
    const sameAction = lastMeal && lastMeal.action === entry.action;
    const gapOk = !!prevEntry && (prevEntry.consumedAt - entry.consumedAt) <= MEAL_GAP_MS;
    const forceBreak = entry.forceNewMeal === true;
    const forceJoin = entry.forceMergeWithPrev === true;
    if (lastMeal && sameAction && !forceBreak && (forceJoin || gapOk)) {
      lastMeal.entries.push(entry);
    } else {
      day.meals.push({ action: entry.action, entries: [entry], boundaryEntryId: entry.id });
    }
  }
  for (const day of days) {
    for (const meal of day.meals) meal.entries = mergeMealEntries(meal.entries);
  }
  return days;
}

// Eine einzelne Historie-Zeile: Auswahl-Häkchen, Aktions-Symbol, Name,
// Makro-Icon (falls vorhanden), Menge+Einheit, Zeitpunkt - alles reine
// Anzeige. Der Stift-Button klappt darunter ein Bearbeiten-Untermenü auf
// (Name, Aktion, Menge/Einheit, Zeitpunkt als Formular), daneben Duplizieren,
// Kopieren, Löschen.
// `row` kann mehrere zusammengeführte Einträge desselben Artikels innerhalb
// einer Mahlzeit repräsentieren (siehe mergeMealEntries) - Löschen entfernt
// dann alle, jede Feld-Korrektur führt sie auf einen Eintrag zusammen.
function EntryRow({ row, t, lang, selected, onToggle, onCopy, copied, onRemove, onUpdateRow, onDuplicate, isLast }) {
  const [editOpen, setEditOpen] = useState(false);
  const [nameText, setNameText] = useState(row.food.name);
  const [qtyText, setQtyText] = useState(String(row.qty ?? ''));
  const [unitText, setUnitText] = useState(row.unit || 'stk');
  const [timeText, setTimeText] = useState(toLocalInputValue(row.consumedAt));
  useEffect(() => {
    setNameText(row.food.name);
    setQtyText(String(row.qty ?? ''));
    setUnitText(row.unit || 'stk');
    setTimeText(toLocalInputValue(row.consumedAt));
  }, [row.food.name, row.qty, row.unit, row.consumedAt]);

  const hasQty = row.qty != null && row.qty > 0;
  const summary = macroSummary(row.food, lang);
  const inputStyle = {
    width: '100%', fontSize: 13.5, color: t.text, background: t.card,
    border: `1px solid ${t.border}`, borderRadius: 8, padding: '7px 9px', boxSizing: 'border-box',
  };
  const fieldLabelStyle = { ...makeLabelStyle(t), marginTop: 0 };

  const commitName = () => {
    const v = nameText.trim();
    if (v && v !== row.food.name) onUpdateRow(row, { food: { ...row.food, name: v } });
    else setNameText(row.food.name);
  };

  const commitQty = () => {
    const v = parseFloat(qtyText.replace(',', '.'));
    if (Number.isFinite(v) && v > 0) onUpdateRow(row, { qty: v, unit: unitText });
    else { setQtyText(String(row.qty ?? '')); setUnitText(row.unit || 'stk'); }
  };

  const commitTime = () => {
    const ts = new Date(timeText).getTime();
    if (Number.isFinite(ts)) onUpdateRow(row, { consumedAt: ts });
    else setTimeText(toLocalInputValue(row.consumedAt));
  };

  return (
    <div style={{ borderBottom: !isLast ? `1px solid ${t.border}` : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 12px' }}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => onToggle(row.id)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(row.id); } }}
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
              </span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: t.textFaint, marginTop: 2, flexWrap: 'wrap' }}>
              {hasMacros(row.food) && (
                <span title={tr(lang, 'favorites.hasMacrosTitle')} aria-label={tr(lang, 'favorites.hasMacrosTitle')} style={{ flexShrink: 0, display: 'flex' }}>
                  <Utensils size={11} color={t.textMuted} />
                </span>
              )}
              {summary && <span>{summary} ·</span>}
              {hasQty && <span>{formatQty(row.qty, row.unit)} ·</span>}
              <span>{timeOnly(row.consumedAt, lang)}</span>
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setEditOpen((v) => !v)}
          aria-label={tr(lang, 'history.editRowAria', { name: row.food.name })}
          aria-expanded={editOpen}
          style={btnCircle(editOpen ? t.pillActive : 'transparent', editOpen ? t.pillActiveText : t.textFaint, 30)}
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          onClick={() => onDuplicate(row)}
          aria-label={tr(lang, 'history.duplicateAria', { name: row.food.name })}
          style={btnCircle('transparent', t.textFaint, 30)}
        >
          <Repeat size={13} />
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

      {editOpen && (
        <div style={{ padding: '0 12px 12px' }}>
          <div style={{ background: t.card, borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={fieldLabelStyle}>{tr(lang, 'history.editNameLabel')}</span>
              <input
                value={nameText}
                onChange={(e) => setNameText(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                style={inputStyle}
              />
            </label>

            {/* div statt label: umschließt mehrere Buttons (Segmented), ein
                <label> darf aber nur ein einzelnes Formularelement haben -
                sonst verwirrt es die Accessible-Name-Berechnung der Buttons. */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={fieldLabelStyle}>{tr(lang, 'history.editActionLabel')}</span>
              <Segmented
                t={t}
                value={row.action}
                onChange={(action) => onUpdateRow(row, { action })}
                options={[
                  { value: 'added', label: tr(lang, 'history.filterAdded') },
                  { value: 'consumed', label: tr(lang, 'history.filterConsumed') },
                ]}
              />
            </div>

            {/* div statt label: umschließt zwei Formularelemente (Menge +
                Einheit), siehe Begründung bei "Aktion" oben. */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={fieldLabelStyle}>{tr(lang, 'history.editQtyLabel')}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="number"
                  inputMode="decimal"
                  aria-label={tr(lang, 'history.editQtyLabel')}
                  value={qtyText}
                  onChange={(e) => setQtyText(e.target.value)}
                  onBlur={commitQty}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                  placeholder={tr(lang, 'history.addQtyPlaceholder')}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <select
                  value={unitText}
                  onChange={(e) => setUnitText(e.target.value)}
                  onBlur={commitQty}
                  style={{ ...inputStyle, width: 84 }}
                >
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="stk">Stk</option>
                </select>
              </div>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={fieldLabelStyle}>{tr(lang, 'history.editTimeLabel')}</span>
              <input
                type="datetime-local"
                value={timeText}
                onChange={(e) => setTimeText(e.target.value)}
                onBlur={commitTime}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                style={inputStyle}
              />
            </label>

            <button
              type="button"
              onClick={() => setEditOpen(false)}
              style={{ ...pillStyle(false, t), marginTop: 2 }}
            >
              {tr(lang, 'history.editDone')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Historie von Bestandsänderungen mit Makrodaten: "hinzugefügt" und
// "verzehrt" getrennt filterbar, durchsuchbar (Name + Zeitraum) und nach
// Tag/Mahlzeit gruppiert - mit manuellem Trennen/Zusammenführen von
// Mahlzeiten. Mehrere Einträge (auch ganze Mahlzeiten auf einmal) markieren
// und ihre Makros in einem Rutsch in die Zwischenablage kopieren - für
// schnelles Nachtragen z.B. in eine Tracking-App. Einträge sind nachträglich
// in Name, Menge/Einheit, Aktion und Zeitpunkt korrigierbar, duplizierbar
// oder manuell neu anlegbar; Löschen ist per Toast rückgängig zu machen.
export function HistorySheet({
  open, onClose, t, lang = 'de', history, foods, items, getFood,
  onRemoveHistory, onRemoveEntries, onUpdateHistory, onAddHistory,
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [filter, setFilter] = useState('consumed'); // 'all' | 'added' | 'consumed'
  const [period, setPeriod] = useState('all'); // 'all' | 'today' | '7d' | '30d'
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addAction, setAddAction] = useState('consumed');
  const [addQty, setAddQty] = useState('');
  const [addUnit, setAddUnit] = useState('stk');
  const [addTime, setAddTime] = useState(() => toLocalInputValue(Date.now()));

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      setCopied(false);
      setCopiedId(null);
      setFilter('consumed');
      setPeriod('all');
      setSearch('');
      setShowAddForm(false);
      setAddName(''); setAddAction('consumed'); setAddQty(''); setAddUnit('stk');
      setAddTime(toLocalInputValue(Date.now()));
    }
  }, [open]);

  // Bekannte Artikelnamen (Stammdaten + aktueller Bestand) als Vorschläge
  // beim manuellen Anlegen - Makros werden automatisch übernommen, wenn der
  // Name zu einem Stammdaten-Eintrag passt (siehe submitAdd).
  const nameSuggestions = useMemo(() => {
    const names = new Set();
    (foods || []).forEach((f) => f.name && names.add(f.name));
    (items || []).forEach((i) => i.name && names.add(i.name));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [foods, items]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = Date.now();
    const periodStart = period === 'today' ? startOfDay(now).getTime()
      : period === '7d' ? now - 7 * 24 * 60 * 60 * 1000
        : period === '30d' ? now - 30 * 24 * 60 * 60 * 1000
          : null;
    return (history || []).filter((h) => (filter === 'all' || h.action === filter)
      && (!q || h.food.name.toLowerCase().includes(q))
      && (periodStart == null || h.consumedAt >= periodStart));
  }, [history, filter, search, period]);

  const groupedHistory = useMemo(() => groupHistory(visible, lang), [visible, lang]);

  // Flache Liste aller sichtbaren Zeilen (nach Zusammenführung gleicher
  // Artikel je Mahlzeit) - Grundlage für Alle-auswählen/Sammel-Kopieren/
  // Sammel-Löschen, da diese mit Zeilen statt einzelnen Historie-Einträgen
  // arbeiten.
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

  // Ganze Mahlzeit auf einmal (de-)markieren - z.B. um alle Makros einer
  // Mahlzeit in einem Rutsch zu kopieren.
  const toggleMeal = (meal) => {
    const ids = meal.entries.map((r) => r.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) => (allSelected ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]));
  };

  // Entfernt eine Zeile - bei zusammengeführten Artikeln (mehrere Einträge
  // derselben Mahlzeit) alle zugrundeliegenden Historie-Einträge auf einmal.
  // Löst die Rückgängig-Toast in App.jsx aus (onRemoveEntries).
  const removeRow = (row) => {
    setSelectedIds((prev) => prev.filter((x) => x !== row.id));
    onRemoveEntries?.(row.entries);
  };

  const deleteSelected = () => {
    const chosenRows = allRows.filter((r) => selectedIds.includes(r.id));
    if (chosenRows.length === 0) return;
    setSelectedIds([]);
    onRemoveEntries?.(chosenRows.flatMap((r) => r.entries));
  };

  // Generisches Patch auf eine (ggf. zusammengeführte) Zeile - egal ob Menge,
  // Einheit, Name, Aktion oder Zeitpunkt: die Änderung landet auf dem ersten
  // zugrundeliegenden Eintrag, etwaige weitere gehen in der neuen
  // Zusammenfassung auf (kein Undo hierfür - ist Teil der Korrektur selbst,
  // kein bewusstes Löschen).
  // Wichtig: die in der Zeile angezeigte Summenmenge muss dabei auf den
  // verbleibenden Eintrag übertragen werden. Sonst behält dieser nur seine
  // eigene Teilmenge und die der gelöschten Einträge verschwindet still -
  // z.B. beim reinen Umbenennen einer Zeile "150 g" (100 g + 50 g).
  // Ein `qty` im Patch selbst hat Vorrang (Mengen-Korrektur).
  const updateRow = (row, patch) => {
    const [first, ...rest] = row.entries;
    const carryQty = rest.length > 0 && row.qty != null ? { qty: row.qty, unit: row.unit } : null;
    onUpdateHistory?.(first.id, { ...carryQty, ...patch });
    rest.forEach((e) => onRemoveHistory?.(e.id));
  };

  const duplicateRow = (row) => onAddHistory?.(row.food, row.action, row.qty, row.unit, Date.now());

  // Manuelles Trennen: der erste (neueste) zugrundeliegende Eintrag der Zeile
  // NACH dem Trennpunkt bekommt die neue-Mahlzeit-Markierung.
  const splitBefore = (nextRow) => {
    const firstEntry = nextRow.entries[0];
    onUpdateHistory?.(firstEntry.id, { forceNewMeal: true, forceMergeWithPrev: false });
  };

  // Manuelles Zusammenführen: der Eintrag, der die (jüngere) Mahlzeit
  // eröffnet hat, wird trotz Zeitlücke der vorherigen Mahlzeit zugeschlagen.
  const mergeWithPrev = (meal) => {
    onUpdateHistory?.(meal.boundaryEntryId, { forceMergeWithPrev: true, forceNewMeal: false });
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

  const submitAdd = () => {
    const name = addName.trim();
    if (!name) return;
    const qtyNum = parseFloat(String(addQty).replace(',', '.'));
    const qty = Number.isFinite(qtyNum) && qtyNum > 0 ? qtyNum : null;
    const existingFood = getFood?.(name);
    const food = existingFood || { name };
    const ts = new Date(addTime).getTime();
    onAddHistory?.(food, addAction, qty, qty != null ? addUnit : null, Number.isFinite(ts) ? ts : Date.now());
    setAddName(''); setAddQty(''); setAddTime(toLocalInputValue(Date.now()));
    setShowAddForm(false);
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
      subtitle={tr(lang, (history || []).length === 1 ? 'history.subtitleOne' : 'history.subtitle', { count: (history || []).length })}
      footer={footer}
    >
      <button
        type="button"
        onClick={() => setShowAddForm((v) => !v)}
        aria-label={tr(lang, 'history.addEntryAria')}
        style={{
          ...pillStyle(showAddForm, t), width: '100%', marginBottom: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        <Plus size={14} /> {tr(lang, 'history.addEntryTitle')}
      </button>

      {showAddForm && (
        <div style={{ background: t.cardAlt, borderRadius: 14, padding: 12, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            list="history-name-suggestions"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder={tr(lang, 'history.addNamePlaceholder')}
            style={{ ...makeInputStyle(t), marginTop: 0 }}
          />
          <datalist id="history-name-suggestions">
            {nameSuggestions.map((n) => <option key={n} value={n} />)}
          </datalist>
          <Segmented
            t={t}
            value={addAction}
            onChange={setAddAction}
            options={[
              { value: 'added', label: tr(lang, 'history.filterAdded') },
              { value: 'consumed', label: tr(lang, 'history.filterConsumed') },
            ]}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number"
              inputMode="decimal"
              value={addQty}
              onChange={(e) => setAddQty(e.target.value)}
              placeholder={tr(lang, 'history.addQtyPlaceholder')}
              style={{ ...makeInputStyle(t), marginTop: 0, flex: 1 }}
            />
            <select value={addUnit} onChange={(e) => setAddUnit(e.target.value)} style={{ ...makeInputStyle(t), marginTop: 0, width: 84 }}>
              <option value="g">g</option>
              <option value="ml">ml</option>
              <option value="stk">Stk</option>
            </select>
          </div>
          <input
            type="datetime-local"
            value={addTime}
            onChange={(e) => setAddTime(e.target.value)}
            style={{ ...makeInputStyle(t), marginTop: 0 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setShowAddForm(false)} style={{ ...pillStyle(false, t), flex: 1 }}>
              {tr(lang, 'history.addCancel')}
            </button>
            <button
              type="button"
              onClick={submitAdd}
              disabled={!addName.trim()}
              style={{ ...primaryButtonStyle(t), flex: 1, opacity: addName.trim() ? 1 : 0.5, cursor: addName.trim() ? 'pointer' : 'default' }}
            >
              {tr(lang, 'history.addSubmit')}
            </button>
          </div>
        </div>
      )}

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
              { value: 'consumed', label: tr(lang, 'history.filterConsumed') },
              { value: 'added', label: tr(lang, 'history.filterAdded') },
              { value: 'all', label: tr(lang, 'history.filterAll') },
            ]}
          />
          <div style={{ marginTop: 8 }}>
            <Segmented
              t={t}
              value={period}
              onChange={setPeriod}
              options={[
                { value: 'all', label: tr(lang, 'history.periodAll') },
                { value: 'today', label: tr(lang, 'history.periodToday') },
                { value: '7d', label: tr(lang, 'history.period7d') },
                { value: '30d', label: tr(lang, 'history.period30d') },
              ]}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={selectAll} style={pillStyle(false, t)}>{tr(lang, 'history.selectAll')}</button>
            <button type="button" onClick={selectNone} style={pillStyle(false, t)}>{tr(lang, 'history.selectNone')}</button>
            {selectedIds.length > 0 && (
              <button type="button" onClick={deleteSelected} style={{ ...pillStyle(false, t), color: t.danger }}>
                {tr(lang, selectedIds.length === 1 ? 'history.deleteSelectedOne' : 'history.deleteSelected', { count: selectedIds.length })}
              </button>
            )}
          </div>
          {groupedHistory.length === 0 ? (
            <div style={{ textAlign: 'center', color: t.textFaint, padding: '24px 12px', fontSize: 13.5 }}>
              {tr(lang, 'history.emptyFiltered')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {groupedHistory.map((day) => (
                <div key={day.key}>
                  <div style={{ ...groupLabelStyle(t), marginBottom: 6 }}>
                    {day.label}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {day.meals.map((meal, mi) => {
                      const prevMeal = day.meals[mi - 1];
                      const canMergeWithPrev = !!prevMeal && prevMeal.action === meal.action;
                      const mealIds = meal.entries.map((r) => r.id);
                      const mealSelected = mealIds.length > 0 && mealIds.every((id) => selectedIds.includes(id));
                      return (
                        // Stabiler Key statt Index: der Eintrag, der die
                        // Mahlzeit eröffnet, identifiziert sie eindeutig -
                        // beim Trennen/Zusammenführen verschieben sich sonst
                        // die Indizes und React ordnet die Blöcke falsch zu.
                        <div key={meal.boundaryEntryId}>
                          {canMergeWithPrev && (
                            <button
                              type="button"
                              onClick={() => mergeWithPrev(meal)}
                              style={{
                                width: '100%', border: 'none', background: 'transparent', cursor: 'pointer',
                                color: t.textFaint, fontSize: 10.5, fontWeight: 700, padding: '3px 0', textAlign: 'center',
                              }}
                            >
                              {tr(lang, 'history.mergeWithPrev')}
                            </button>
                          )}
                          <div style={{ background: t.cardAlt, borderRadius: 14, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderBottom: `1px solid ${t.border}` }}>
                              <button
                                type="button"
                                onClick={() => toggleMeal(meal)}
                                aria-pressed={mealSelected}
                                aria-label={tr(lang, 'history.selectMealAria')}
                                style={{
                                  flexShrink: 0, width: 18, height: 18, borderRadius: 5,
                                  border: `2px solid ${mealSelected ? t.pillActive : t.border}`,
                                  background: mealSelected ? t.pillActive : 'transparent',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0,
                                }}
                              >
                                {mealSelected && <Check size={11} color={t.pillActiveText} strokeWidth={3} />}
                              </button>
                              <span style={{ ...makeLabelStyle(t), marginTop: 0 }}>
                                {tr(lang, 'history.selectMealAria')}
                              </span>
                            </div>
                            {meal.entries.map((row, ei) => (
                              <div key={row.id}>
                                <EntryRow
                                  row={row}
                                  t={t}
                                  lang={lang}
                                  selected={selectedIds.includes(row.id)}
                                  onToggle={toggle}
                                  onCopy={copyOne}
                                  copied={copiedId === row.id}
                                  onRemove={removeRow}
                                  onUpdateRow={updateRow}
                                  onDuplicate={duplicateRow}
                                  isLast={ei === meal.entries.length - 1}
                                />
                                {ei < meal.entries.length - 1 && (
                                  <div style={{ display: 'flex', justifyContent: 'center', borderBottom: `1px solid ${t.border}` }}>
                                    <button
                                      type="button"
                                      onClick={() => splitBefore(meal.entries[ei + 1])}
                                      aria-label={tr(lang, 'history.splitAria')}
                                      style={{
                                        border: 'none', background: 'transparent', cursor: 'pointer',
                                        color: t.textFaint, padding: '2px 10px', display: 'flex', alignItems: 'center',
                                      }}
                                    >
                                      <Scissors size={11} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
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
