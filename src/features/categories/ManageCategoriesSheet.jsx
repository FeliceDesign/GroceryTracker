import { useRef, useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { ClearableInput } from '../../components/ClearableInput.jsx';
import { makeInputStyle, btnCircle } from '../../lib/styles.js';
import { tr } from '../../lib/i18n.js';

// Eine Kategorie-Zeile: lokaler Entwurf, gespeichert bei Fokus-Verlust/Enter.
// `dragging` = wird gerade per Ziehgriff verschoben (optische Rückmeldung).
// `onDragStart(e, name, rowEl)`/`onDragMove(e)`/`onDragEnd(commit)` kommen
// vom Sheet, das die Ziehlogik zentral für alle Zeilen verwaltet.
function CategoryRow({
  name, count, locked, t, lang, onRename, onRemove, onMove, canMoveUp, canMoveDown,
  dragging = false, onDragStart, onDragMove, onDragEnd,
}) {
  const [draft, setDraft] = useState(name);
  const rowRef = useRef(null);
  const inputStyle = makeInputStyle(t);
  const save = () => {
    const v = draft.trim();
    if (!v) { setDraft(name); return; }
    if (v !== name) onRename(name, v);
  };
  return (
    <div
      ref={rowRef}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, background: t.cardAlt, borderRadius: 12, padding: '8px 10px',
        opacity: dragging ? 0.65 : 1, boxShadow: dragging ? t.shadow : 'none', position: 'relative', zIndex: dragging ? 1 : 0,
      }}
    >
      <button
        type="button"
        onPointerDown={(e) => onDragStart(e, name, rowRef.current)}
        onPointerMove={onDragMove}
        onPointerUp={() => onDragEnd(true)}
        onPointerCancel={() => onDragEnd(false)}
        aria-label={tr(lang, 'categories.dragAria', { name })}
        style={{
          flexShrink: 0, width: 22, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', background: 'transparent', color: t.textFaint, cursor: 'grab', touchAction: 'none', padding: 0,
        }}
      >
        <GripVertical size={16} />
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => onMove(name, 'up')}
          disabled={!canMoveUp}
          style={{
            width: 24, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', borderRadius: 6, background: 'transparent', cursor: canMoveUp ? 'pointer' : 'default',
            color: canMoveUp ? t.textMuted : t.border,
          }}
          aria-label={tr(lang, 'categories.moveUpAria', { name })}
        >
          <ChevronUp size={15} />
        </button>
        <button
          type="button"
          onClick={() => onMove(name, 'down')}
          disabled={!canMoveDown}
          style={{
            width: 24, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', borderRadius: 6, background: 'transparent', cursor: canMoveDown ? 'pointer' : 'default',
            color: canMoveDown ? t.textMuted : t.border,
          }}
          aria-label={tr(lang, 'categories.moveDownAria', { name })}
        >
          <ChevronDown size={15} />
        </button>
      </div>
      <ClearableInput
        t={t}
        lang={lang}
        value={draft}
        onChange={setDraft}
        disabled={locked}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
        aria-label={tr(lang, 'categories.nameAria', { name })}
        style={{ ...inputStyle, marginTop: 0, opacity: locked ? 0.7 : 1 }}
        wrapperStyle={{ flex: 1, minWidth: 0 }}
      />
      <span style={{ fontSize: 11.5, color: t.textFaint, flexShrink: 0, minWidth: 40, textAlign: 'right' }}>
        {tr(lang, 'categories.itemsCount', { count })}
      </span>
      <button
        type="button"
        onClick={() => !locked && onRemove(name)}
        disabled={locked}
        aria-label={tr(lang, 'categories.removeAria', { name })}
        style={{ ...btnCircle('transparent', locked ? t.textFaint : t.danger, 36), opacity: locked ? 0.35 : 1, cursor: locked ? 'default' : 'pointer' }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

// Lebensmittel-Kategorien verwalten: umbenennen, hinzufügen, entfernen,
// Reihenfolge per ▲/▼-Buttons ODER per Ziehgriff ändern (siehe unten).
// „Sonstiges" ist der Auffang-Eintrag und bleibt fest bestehen (nur
// Umbenennen/Entfernen gesperrt - Verschieben, wie bisher, weiterhin möglich).
export function ManageCategoriesSheet({
  open, onClose, t, lang = 'de', categories, countFor, onAdd, onRename, onRemove, onMove, onReorder,
}) {
  const inputStyle = makeInputStyle(t);
  const [draft, setDraft] = useState('');
  // Ziehen: `dragName` ist die aktuell gegriffene Kategorie, `overIndex` die
  // Position, an der sie gerade "schwebt" (Pointer Events + Pointer Capture -
  // funktioniert einheitlich für Maus/Touch/Stift, wichtig für die
  // Android-App). Erst beim Loslassen wird die echte Reihenfolge (onReorder)
  // aktualisiert; bis dahin ist `displayCategories` unten nur eine
  // Live-Vorschau für die Anzeige.
  const [dragName, setDragName] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const dragInfoRef = useRef(null); // { startY, rowHeight, originIndex }

  const submitAdd = () => {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft('');
  };

  const startDrag = (e, name, rowEl) => {
    if (!rowEl) return;
    e.preventDefault();
    const originIndex = categories.indexOf(name);
    if (originIndex < 0) return;
    dragInfoRef.current = { startY: e.clientY, rowHeight: rowEl.getBoundingClientRect().height + 8, originIndex };
    setDragName(name);
    setOverIndex(originIndex);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onDragMove = (e) => {
    const info = dragInfoRef.current;
    if (!info || dragName == null) return;
    const shift = Math.round((e.clientY - info.startY) / info.rowHeight);
    const next = Math.min(categories.length - 1, Math.max(0, info.originIndex + shift));
    setOverIndex(next);
  };

  const endDrag = (commit) => {
    const info = dragInfoRef.current;
    if (commit && info && overIndex != null && overIndex !== info.originIndex) {
      onReorder(info.originIndex, overIndex);
    }
    setDragName(null);
    setOverIndex(null);
    dragInfoRef.current = null;
  };

  // Live-Vorschau während des Ziehens: die gegriffene Kategorie an die
  // aktuelle Ziel-Position vorziehen. Ohne aktives Ziehen identisch zu
  // `categories`.
  const displayCategories = (() => {
    if (dragName == null || overIndex == null) return categories;
    const originIndex = categories.indexOf(dragName);
    if (originIndex < 0 || originIndex === overIndex) return categories;
    const next = [...categories];
    const [moved] = next.splice(originIndex, 1);
    next.splice(overIndex, 0, moved);
    return next;
  })();

  return (
    <Modal open={open} onClose={onClose} t={t} lang={lang} title={tr(lang, 'categories.title')} subtitle={tr(lang, 'categories.subtitle')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
        {displayCategories.map((c, idx) => (
          <CategoryRow
            key={c}
            name={c}
            count={countFor(c)}
            locked={c === 'Sonstiges'}
            t={t}
            lang={lang}
            onRename={onRename}
            onRemove={onRemove}
            onMove={onMove}
            canMoveUp={idx > 0}
            canMoveDown={idx < displayCategories.length - 1}
            dragging={c === dragName}
            onDragStart={startDrag}
            onDragMove={onDragMove}
            onDragEnd={endDrag}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <ClearableInput
          t={t}
          lang={lang}
          value={draft}
          onChange={setDraft}
          onKeyDown={(e) => e.key === 'Enter' && submitAdd()}
          placeholder={tr(lang, 'categories.newPlaceholder')}
          style={{ ...inputStyle, marginTop: 0 }}
          wrapperStyle={{ flex: 1, minWidth: 0 }}
        />
        <button
          type="button"
          onClick={submitAdd}
          disabled={!draft.trim()}
          aria-label={tr(lang, 'categories.addAria')}
          style={{ flexShrink: 0, border: 'none', borderRadius: 12, padding: '0 16px', background: t.btnPrimary, color: t.btnPrimaryText, cursor: draft.trim() ? 'pointer' : 'default', opacity: draft.trim() ? 1 : 0.5, display: 'flex', alignItems: 'center' }}
        >
          <Plus size={18} strokeWidth={2.6} />
        </button>
      </div>

      <div style={{ fontSize: 11.5, color: t.textFaint, marginTop: 12, lineHeight: 1.4 }}>
        {tr(lang, 'categories.hint')}
      </div>
    </Modal>
  );
}
