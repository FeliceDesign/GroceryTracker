import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { ClearableInput } from './ClearableInput.jsx';
import { makeInputStyle } from '../lib/styles.js';
import { tr } from '../lib/i18n.js';

// Dropdown zur Kategorieauswahl mit Möglichkeit, direkt eine neue Kategorie
// anzulegen. `status` optional (nur beim Anlegen genutzt, sonst Standard
// 'confirmed' ohne jede optische Änderung): 'default' = noch nicht bewusst
// gewählt (Randfarbe Warnung), 'suggested' = anhand des Namens automatisch
// vorgeschlagen und noch nicht bestätigt (Randfarbe Erfolg + kleiner
// Bestätigen-Button), 'confirmed' = normale Darstellung.
export function CategoryPicker({
  value, onChange, categories, onAddCategory, t, lang = 'de',
  status = 'confirmed', onConfirmSuggestion,
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const inputStyle = makeInputStyle(t);
  const highlightStyle = status === 'default'
    ? { border: `1.5px solid ${t.warningBorder}`, background: t.warningBg }
    : status === 'suggested'
      ? { border: `1.5px solid ${t.success}` }
      : {};

  const confirmAdd = () => {
    const name = onAddCategory(draft);
    if (name) onChange(name);
    setDraft('');
    setAdding(false);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative', marginTop: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            ...inputStyle, marginTop: 0, textAlign: 'left', cursor: 'pointer', flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            ...highlightStyle,
          }}
        >
          <span>{value}</span>
          <span style={{ color: t.textFaint, fontSize: 11 }}>{open ? '▲' : '▼'}</span>
        </button>
        {status === 'suggested' && (
          <button
            type="button"
            onClick={onConfirmSuggestion}
            aria-label={tr(lang, 'categoryPicker.confirmSuggestionAria')}
            style={{
              flexShrink: 0, width: 40, height: 40, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: t.success, color: t.card, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Check size={17} strokeWidth={3} />
          </button>
        )}
      </div>
      {status === 'suggested' && (
        <div style={{ fontSize: 11.5, color: t.success, marginTop: 4 }}>
          {tr(lang, 'categoryPicker.suggestedHint')}
        </div>
      )}

      {open && (
        <>
          <div onClick={() => { setOpen(false); setAdding(false); }} style={{ position: 'fixed', inset: 0, zIndex: 45 }} />
          <div
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
              background: t.card, border: `1px solid ${t.border}`, borderRadius: 12,
              maxHeight: 280, overflowY: 'auto', boxShadow: t.shadow, zIndex: 46,
            }}
          >
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { onChange(c); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', textAlign: 'left', padding: '11px 14px', border: 'none',
                  background: c === value ? t.cardAlt : 'transparent',
                  color: c === value ? t.text : t.pillInactiveText,
                  fontWeight: c === value ? 700 : 500, fontSize: 14.5, cursor: 'pointer',
                }}
              >
                {c}
                {c === value && <Check size={15} color={t.success} />}
              </button>
            ))}

            {adding ? (
              <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderTop: `1px solid ${t.border}` }}>
                <ClearableInput
                  t={t}
                  lang={lang}
                  autoFocus
                  value={draft}
                  onChange={setDraft}
                  onKeyDown={(e) => e.key === 'Enter' && confirmAdd()}
                  placeholder={tr(lang, 'categoryPicker.newCategoryPlaceholder')}
                  style={{ ...inputStyle, marginTop: 0 }}
                  wrapperStyle={{ flex: 1, minWidth: 0 }}
                />
                <button
                  type="button"
                  onClick={confirmAdd}
                  style={{
                    flexShrink: 0, border: 'none', borderRadius: 10, padding: '0 14px',
                    background: t.btnPrimary, color: t.btnPrimaryText, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {tr(lang, 'common.ok')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                  padding: '11px 14px', border: 'none', borderTop: `1px solid ${t.border}`,
                  background: 'transparent', color: t.textMuted, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}
              >
                <Plus size={15} /> {tr(lang, 'categoryPicker.addNew')}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
