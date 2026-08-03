import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Plus, Copy, Check, Trash2, Search, Star, ChevronDown, ChevronRight } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { ClearableInput } from '../../components/ClearableInput.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { MacroEditor } from './MacroEditor.jsx';
import { makeInputStyle, makeLabelStyle, primaryButtonStyle, groupLabelStyle } from '../../lib/styles.js';
import { tr } from '../../lib/i18n.js';
import {
  emptyMacros, foodToMacros, macrosToFood, macroSummary, basisLabel,
  hasMacros, hasFoodData, applyPendingPaste, normalizeName, copyMacros,
} from '../../lib/macros.js';

// Stammdaten / Makros verwalten: alle Nährwert-Datensätze durchsuchen,
// bearbeiten, neu anlegen, kopieren und löschen. `initialEditName` springt
// beim Öffnen direkt in den Editor für diesen Namen (z.B. von einem
// Favoriten aus) - vorhandene Stammdaten werden geladen, sonst leer angelegt.
export const ManageFoodsSheet = forwardRef(function ManageFoodsSheet({
  open, onClose, t, lang = 'de', foods, onUpsert, onRemove, scanSupported, initialEditName, stepGml,
  onRenameLinkedFavorite, isFavorite, onToggleFavorite, onMacrosCopied,
  items, favorites, categories, sortMode = 'alpha', onSetSortMode,
}, ref) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // { name, macros } oder null
  const [copiedKey, setCopiedKey] = useState(null);
  // true, wenn der Editor über initialEditName direkt (z.B. von einem
  // Favoriten aus) geöffnet wurde - dann soll Schließen/Speichern/Löschen
  // das ganze Sheet verlassen statt auf die Stammdaten-Liste zurückzufallen.
  const [directEntry, setDirectEntry] = useState(false);
  // Sektion "Stammdaten ohne Makros" ist standardmäßig eingeklappt.
  const [showNoMacros, setShowNoMacros] = useState(false);
  const inputStyle = makeInputStyle(t);

  // Beim Schließen den Editor-/Suchzustand zurücksetzen; beim Öffnen mit
  // initialEditName direkt den passenden Editor aufmachen.
  useEffect(() => {
    if (!open) {
      setEditing(null);
      setDirectEntry(false);
      setSearch('');
      setCopiedKey(null);
      setShowNoMacros(false);
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

  // Für den Zurück-Button (Android, siehe App.jsx): ist der Editor offen,
  // erst einen Schritt zurück zur Liste (wie der X-Button), statt das ganze
  // Sheet zu schließen. Gibt zurück, ob intern reagiert wurde.
  useImperativeHandle(ref, () => ({
    goBack: () => {
      if (!editing) return false;
      finishEditing();
      return true;
    },
  }));

  // Zwei Sektionen: Artikel mit echten Makros oben (immer sichtbar), Artikel
  // mit sonstigen Stammdaten (nur Zutaten und/oder eigene Öffnungs-
  // Haltbarkeit, keine Nährwerte) unten in einer ausklappbaren Sektion.
  // Komplett leere Datensätze (weder Nährwerte noch Zutaten noch eigene
  // Haltbarkeit) tauchen in keiner der beiden auf - es gibt dort nichts zu verwalten.
  // Sortiermodus "Kategorie": Stammdaten haben selbst kein Kategorie-Feld
  // (rein über den Namen mit Bestand verknüpft), die Kategorie wird deshalb
  // abgeleitet - zuerst über einen aktuellen Bestandsartikel mit passendem
  // Namen, sonst über einen passenden Favoriten, sonst "Ohne Zuordnung"
  // (Sammelgruppe, auch für Kategorien, die es in der Kategorien-Liste gar
  // nicht mehr gibt).
  const { withMacros, withoutMacros, groupedWithMacros, groupedWithoutMacros } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = (f) => !q || f.name.toLowerCase().includes(q);
    const sortByName = (arr) => arr.slice().sort((a, b) => a.name.localeCompare(b.name, 'de'));
    const all = (foods || []).filter((f) => hasFoodData(f) && matches(f));
    const withM = sortByName(all.filter((f) => hasMacros(f)));
    const withoutM = sortByName(all.filter((f) => !hasMacros(f)));

    const catOrder = new Map((categories || []).map((c, i) => [c, i]));
    const group = (arr) => {
      const byCat = {};
      arr.forEach((f) => {
        const norm = normalizeName(f.name);
        const item = (items || []).find((i) => normalizeName(i.name) === norm);
        const fav = !item ? (favorites || []).find((fv) => normalizeName(fv.name) === norm) : null;
        const derived = item ? item.category : (fav ? fav.category : null);
        const key = derived && catOrder.has(derived) ? derived : null;
        (byCat[key] = byCat[key] || []).push(f);
      });
      const known = (categories || []).filter((c) => byCat[c]);
      const groups = known.map((c) => [c, byCat[c]]);
      if (byCat[null]) groups.push([null, byCat[null]]);
      return groups;
    };

    return {
      withMacros: withM,
      withoutMacros: withoutM,
      groupedWithMacros: group(withM),
      groupedWithoutMacros: group(withoutM),
    };
  }, [foods, search, categories, items, favorites]);

  const startNew = () => { setDirectEntry(false); setEditing({ name: search.trim(), macros: emptyMacros('100g') }); };
  const startEdit = (food) => { setDirectEntry(false); setEditing({ key: food.key, name: food.name, originalName: food.name, macros: foodToMacros(food) }); };

  const save = () => {
    const name = (editing.name || '').trim();
    if (!name) return;
    // Nur speichern, wenn tatsächlich Nährwerte/Zutaten/eigene Haltbarkeit
    // vorliegen - sonst bliebe ein leerer Karteileichen-Datensatz zurück
    // (z.B. bei einer reinen Umbenennung ohne weitere Angaben). Wurde bei
    // einem bestehenden Eintrag die letzte verbliebene Angabe gelöscht, den
    // Eintrag stattdessen entfernen statt ihn unverändert liegen zu lassen.
    // Nicht per Klick übernommener Einfüge-Text (Nährwerttabelle) wird beim
    // Speichern noch nachgeholt, statt verloren zu gehen.
    const macros = applyPendingPaste(editing.macros);
    if (hasFoodData(macros)) {
      onUpsert(macrosToFood(macros, name));
      // Falls umbenannt (anderer Schlüssel): alten Datensatz entfernen.
      if (editing.key && editing.key !== normalizeName(name)) onRemove(editing.key);
    } else if (editing.key) {
      onRemove(editing.key);
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
          <label style={{ ...makeLabelStyle(t), marginTop: 0 }}>
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
  const renderRows = (arr) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {arr.map((food) => (
        <FoodRow
          key={food.key} food={food} t={t} lang={lang}
          onEdit={startEdit} onCopy={copyRow} copied={copiedKey === food.key}
          isFavorite={isFavorite} onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
  const renderGrouped = (groups) => groups.map(([cat, arr]) => (
    <div key={cat ?? '__unassigned__'} style={{ marginBottom: 14 }}>
      <div style={{ ...groupLabelStyle(t), marginBottom: 8, paddingLeft: 2 }}>
        {cat || tr(lang, 'foods.unassigned')}
      </div>
      {renderRows(arr)}
    </div>
  ));

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

      {onSetSortMode && (withMacros.length + withoutMacros.length > 1) && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ ...makeLabelStyle(t), marginTop: 0, marginBottom: 6 }}>
            {tr(lang, 'foods.sortLabel')}
          </div>
          <Segmented
            t={t}
            value={sortMode}
            onChange={onSetSortMode}
            options={[
              { value: 'alpha', label: tr(lang, 'foods.sortAlpha') },
              { value: 'category', label: tr(lang, 'foods.sortCategory') },
            ]}
          />
        </div>
      )}

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

      {withMacros.length === 0 && withoutMacros.length === 0 ? (
        <div style={{ textAlign: 'center', color: t.textFaint, padding: '32px 12px', fontSize: 13.5 }}>
          {search.trim() ? tr(lang, 'foods.nothingFound') : tr(lang, 'foods.noneYet')}
        </div>
      ) : (
        <>
          {withMacros.length > 0 && (
            sortMode === 'category' ? renderGrouped(groupedWithMacros) : renderRows(withMacros)
          )}

          {withoutMacros.length > 0 && (
            <div style={{ marginTop: withMacros.length > 0 ? 18 : 0 }}>
              <button
                type="button"
                onClick={() => setShowNoMacros((v) => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, width: '100%', border: 'none', background: 'transparent',
                  color: t.textMuted, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', padding: '4px 2px', marginBottom: 8,
                }}
              >
                {showNoMacros ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                {tr(lang, 'foods.noMacrosSection', { count: withoutMacros.length })}
              </button>
              {showNoMacros && (
                sortMode === 'category' ? renderGrouped(groupedWithoutMacros) : renderRows(withoutMacros)
              )}
            </div>
          )}
        </>
      )}
    </Modal>
  );
});

function FoodRow({ food, t, lang, onEdit, onCopy, copied, isFavorite, onToggleFavorite }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.cardAlt, borderRadius: 14, padding: '10px 12px' }}>
      <button
        type="button"
        onClick={() => onEdit(food)}
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
          onClick={() => onCopy(food)}
          aria-label={tr(lang, 'foods.copyAria')}
          style={{
            flexShrink: 0, width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'transparent', color: copied ? t.success : t.textMuted,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {copied ? <Check size={17} /> : <Copy size={16} />}
        </button>
      )}
    </div>
  );
}
