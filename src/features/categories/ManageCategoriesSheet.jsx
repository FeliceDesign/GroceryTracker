import { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { ClearableInput } from '../../components/ClearableInput.jsx';
import { makeInputStyle, btnCircle } from '../../lib/styles.js';
import { tr } from '../../lib/i18n.js';

// Eine Kategorie-Zeile: lokaler Entwurf, gespeichert bei Fokus-Verlust/Enter.
function CategoryRow({ name, count, locked, t, lang, onRename, onRemove, onMove, canMoveUp, canMoveDown }) {
  const [draft, setDraft] = useState(name);
  const inputStyle = makeInputStyle(t);
  const save = () => {
    const v = draft.trim();
    if (!v) { setDraft(name); return; }
    if (v !== name) onRename(name, v);
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.cardAlt, borderRadius: 12, padding: '8px 10px' }}>
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

// Lebensmittel-Kategorien verwalten: umbenennen, hinzufügen, entfernen.
// „Sonstiges" ist der Auffang-Eintrag und bleibt fest bestehen.
export function ManageCategoriesSheet({ open, onClose, t, lang = 'de', categories, countFor, onAdd, onRename, onRemove, onMove }) {
  const inputStyle = makeInputStyle(t);
  const [draft, setDraft] = useState('');

  const submitAdd = () => {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft('');
  };

  return (
    <Modal open={open} onClose={onClose} t={t} lang={lang} title={tr(lang, 'categories.title')} subtitle={tr(lang, 'categories.subtitle')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
        {categories.map((c, idx) => (
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
            canMoveDown={idx < categories.length - 1}
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
