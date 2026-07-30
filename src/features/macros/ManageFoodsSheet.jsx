import { useEffect, useMemo, useState } from 'react';
import { Plus, Copy, Check, Trash2, Search, Star } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { ClearableInput } from '../../components/ClearableInput.jsx';
import { MacroEditor } from './MacroEditor.jsx';
import { makeInputStyle, primaryButtonStyle } from '../../lib/styles.js';
import { tr } from '../../lib/i18n.js';
import {
  emptyMacros, foodToMacros, macrosToFood, macroSummary, basisLabel,
  hasMacros, hasFoodData, normalizeName, copyMacros,
} from '../../lib/macros.js';

// Stammdaten / Makros verwalten: alle Nährwert-Datensätze durchsuchen,
// bearbeiten, neu anlegen, kopieren und löschen. `initialEditName` springt
// beim Öffnen direkt in den Editor für diesen Namen (z.B. von einem
// Favoriten aus) - vorhandene Stammdaten werden geladen, sonst leer angelegt.
export function ManageFoodsSheet({
  open, onClose, t, lang = 'de', foods, onUpsert, onRemove, scanSupported, initialEditName, stepGml,
  onRenameLinkedFavorite, isFavorite, onToggleFavorite, onMacrosCopied,
}) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // { name, macros } oder null
  const [copiedKey, setCopiedKey] = useState(null);
  // true, wenn der Editor über initialEditName direkt (z.B. von einem
  // Favoriten aus) geöffnet wurde - dann soll Schließen/Speichern/Löschen
  // das ganze Sheet verlassen statt auf die Stammdaten-Liste zurückzufallen.
  const [directEntry, setDirectEntry] = useState(false);
  const inputStyle = makeInputStyle(t);

  // Beim Schließen den Editor-/Suchzustand zurücksetzen; beim Öffnen mit
  // initialEditName direkt den passenden Editor aufmachen.
  useEffect(() => {
    if (!open) {
      setEditing(null);
      setDirectEntry(false);
      setSearch('');
      setCopiedKey(null);
    } else if (initialEditName) {
      const existing = (foods || []).find((f) => normalizeName(f.name) === normalizeName(initialEditName));
      setEditing(existing
        ? { key: existing.key, name: existing.name, originalName: existing.name, macros: foodToMacros(existing) }
        : { name: initialEditName, originalName: initialEditName, macros: emptyMacros('100g') });
      setDirectEntry(true);
    }
    // foods absichtlich ausgelassen - nur open/initialEditName sollen den Einstieg auslösen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialEditName]);

  // Editor verlassen: bei Direkteinstieg das ganze Sheet schließen (z.B.
  // zurück zu Favoriten), sonst nur zur Stammdaten-Liste zurück.
  const finishEditing = () => {
    setEditing(null);
    if (directEntry) onClose();
  };

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    // Komplett leere Datensätze (weder Nährwerte noch Zutaten noch eigene
    // Haltbarkeit) nicht anzeigen - es gibt dort nichts zu verwalten.
    const arr = (foods || []).filter((f) => hasFoodData(f) && (!q || f.name.toLowerCase().includes(q)));
    return arr.slice().sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }, [foods, search]);

  const startNew = () => { setDirectEntry(false); setEditing({ name: search.trim(), macros: emptyMacros('100g') }); };
  const startEdit = (food) => { setDirectEntry(false); setEditing({ key: food.key, name: food.name, originalName: food.name, macros: foodToMacros(food) }); };

  const save = () => {
    const name = (editing.name || '').trim();
    if (!name) return;
    // Nur speichern, wenn tatsächlich Nährwerte/Zutaten/eigene Haltbarkeit
    // vorliegen - sonst bliebe ein leerer Karteileichen-Datensatz zurück
    // (z.B. bei einer reinen Umbenennung ohne weitere Angaben).
    if (hasFoodData(editing.macros)) {
      onUpsert(macrosToFood(editing.macros, name));
      // Falls umbenannt (anderer Schlüssel): alten Datensatz entfernen.
      if (editing.key && editing.key !== normalizeName(name)) onRemove(editing.key);
    }
    // Bei Umbenennung einen verknüpften Favoriten mit umbenennen, damit die
    // Verknüpfung (die rein über den Namen läuft) nicht auseinanderläuft.
    if (editing.originalName && normalizeName(editing.originalName) !== normalizeName(name)) {
      onRenameLinkedFavorite?.(editing.originalName, name);
    }
    finishEditing();
  };

  const del = () => {
    if (editing.key) onRemove(editing.key);
    finishEditing();
  };

  const copyRow = async (food) => {
    const ok = await copyMacros(food, lang);
    if (ok) {
      setCopiedKey(food.key);
      setTimeout(() => setCopiedKey((k) => (k === food.key ? null : k)), 1600);
      onMacrosCopied?.(food);
    }
  };

  // ----- Editor-Ansicht ------------------------------------------------------
  if (open && editing) {
    const footer = (
      <div style={{ display: 'flex', gap: 10 }}>
        {editing.key && (
          <button
            onClick={del}
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7,
              padding: '14px 18px', borderRadius: 14, border: `1.5px solid ${t.dangerBorder}`,
              background: t.dangerBg, color: t.danger, fontWeight: 700, fontSize: 14.5, cursor: 'pointer',
            }}
          >
            <Trash2 size={17} /> {tr(lang, 'foods.delete')}
          </button>
        )}
        <button
          onClick={save}
          disabled={!(editing.name || '').trim()}
          style={{ ...primaryButtonStyle(t), opacity: (editing.name || '').trim() ? 1 : 0.45 }}
        >
          {tr(lang, 'foods.save')}
        </button>
      </div>
    );
    return (
      <Modal open={open} onClose={finishEditing} t={t} lang={lang} title={editing.key ? tr(lang, 'foods.editTitle') : tr(lang, 'foods.newTitle')} footer={footer}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {tr(lang, 'foods.name')}
          </label>
          {onToggleFavorite && (
            <button
              type="button"
              onClick={() => onToggleFavorite({ name: editing.name })}
              aria-pressed={isFavorite?.(editing.name)}
              aria-label={tr(lang, isFavorite?.(editing.name) ? 'detail.unfavoriteAria' : 'detail.favoriteAria')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: isFavorite?.(editing.name) ? t.warningBg : t.cardAlt,
                color: isFavorite?.(editing.name) ? t.warning : t.textFaint,
              }}
            >
              <Star size={14} fill={isFavorite?.(editing.name) ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
        <ClearableInput
          t={t}
          lang={lang}
          value={editing.name}
          onChange={(v) => setEditing((s) => ({ ...s, name: v }))}
          placeholder={tr(lang, 'foods.namePlaceholder')}
          style={inputStyle}
          wrapperStyle={{ marginTop: 6, marginBottom: 16 }}
        />
        <MacroEditor
          name={editing.name}
          macros={editing.macros}
          onChange={(patch) => setEditing((s) => ({ ...s, macros: { ...s.macros, ...patch } }))}
          t={t}
          lang={lang}
          scanSupported={scanSupported}
          globalStepGml={stepGml}
        />
      </Modal>
    );
  }

  // ----- Listen-Ansicht ------------------------------------------------------
  return (
    <Modal open={open} onClose={onClose} t={t} lang={lang} title={tr(lang, 'foods.title')} subtitle={tr(lang, 'foods.subtitle', { count: (foods || []).filter(hasFoodData).length })}>
      <div style={{ position: 'relative', marginTop: 4, marginBottom: 12 }}>
        <Search size={16} color={t.textFaint} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tr(lang, 'foods.searchPlaceholder')}
          style={{ ...inputStyle, marginTop: 0, paddingLeft: 36 }}
        />
      </div>

      <button
        type="button"
        onClick={startNew}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '12px', borderRadius: 12, border: `1.5px dashed ${t.border}`,
          background: 'transparent', color: t.textMuted, fontWeight: 700, fontSize: 14, cursor: 'pointer',
          marginBottom: 14,
        }}
      >
        <Plus size={17} /> {tr(lang, 'foods.addNew')}
      </button>

      {list.length === 0 ? (
        <div style={{ textAlign: 'center', color: t.textFaint, padding: '32px 12px', fontSize: 13.5 }}>
          {search.trim() ? tr(lang, 'foods.nothingFound') : tr(lang, 'foods.noneYet')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.map((food) => (
            <div key={food.key} style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.cardAlt, borderRadius: 14, padding: '10px 12px' }}>
              <button
                type="button"
                onClick={() => startEdit(food)}
                style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', padding: 0 }}
              >
                <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: t.text, overflowWrap: 'anywhere', lineHeight: 1.3 }}>
                  {food.name}
                </span>
                <span style={{ display: 'block', fontSize: 11.5, color: t.textFaint, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {hasMacros(food)
                    ? `${macroSummary(food, lang)} · ${basisLabel(food, lang)}`
                    : (hasFoodData(food) ? tr(lang, 'foods.ingredientsPresent') : tr(lang, 'foods.noValues'))}
                </span>
              </button>
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={() => onToggleFavorite({ name: food.name })}
                  aria-pressed={isFavorite?.(food.name)}
                  aria-label={tr(lang, isFavorite?.(food.name) ? 'detail.unfavoriteAria' : 'detail.favoriteAria')}
                  style={{
                    flexShrink: 0, width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: 'transparent', color: isFavorite?.(food.name) ? t.warning : t.textFaint,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Star size={16} fill={isFavorite?.(food.name) ? 'currentColor' : 'none'} />
                </button>
              )}
              {hasMacros(food) && (
                <button
                  type="button"
                  onClick={() => copyRow(food)}
                  aria-label={tr(lang, 'foods.copyAria')}
                  style={{
                    flexShrink: 0, width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: 'transparent', color: copiedKey === food.key ? t.success : t.textMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {copiedKey === food.key ? <Check size={17} /> : <Copy size={16} />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
