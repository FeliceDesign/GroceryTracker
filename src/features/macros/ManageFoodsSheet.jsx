import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Plus, Copy, Check, Trash2, Search, Star, ChevronDown, ChevronRight, ListChecks, EyeOff } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { ClearableInput } from '../../components/ClearableInput.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { MacroEditor } from './MacroEditor.jsx';
import { makeInputStyle, makeLabelStyle, primaryButtonStyle, groupLabelStyle, pillStyle } from '../../lib/styles.js';
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
  hiddenMacroCategories = [], onToggleHiddenCategory,
}, ref) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // { name, macros } oder null
  const [copiedKey, setCopiedKey] = useState(null);
  // true, wenn der Editor über initialEditName direkt (z.B. von einem
  // Favoriten aus) geöffnet wurde - dann soll Schließen/Speichern/Löschen
  // das ganze Sheet verlassen statt auf die Stammdaten-Liste zurückzufallen.
  const [directEntry, setDirectEntry] = useState(false);
  // Sektion "Stammdaten ohne Makros" ist standardmäßig ausgeklappt.
  const [showNoMacros, setShowNoMacros] = useState(true);
  // Mehrfachauswahl innerhalb der "Ohne Makros"-Sektion, um für mehrere
  // Lebensmittel am Stück (nacheinander im Editor) Makros nachzutragen -
  // siehe startBatch/goToBatchIndex weiter unten.
  const [selectMode, setSelectMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState([]);
  // Verwalten-Ansicht für Kategorien, die grundsätzlich keine Makros
  // brauchen (z.B. Gewürze, Getränke) - blendet sie aus "Ohne Makros" aus.
  const [manageHidden, setManageHidden] = useState(false);
  const inputStyle = makeInputStyle(t);

  // Beim Schließen den Editor-/Suchzustand zurücksetzen; beim Öffnen mit
  // initialEditName direkt den passenden Editor aufmachen.
  useEffect(() => {
    if (!open) {
      setEditing(null);
      setDirectEntry(false);
      setSearch('');
      setCopiedKey(null);
      setShowNoMacros(true);
      setSelectMode(false);
      setSelectedKeys([]);
      setManageHidden(false);
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
  // ohne Makros unten in einer ausklappbaren Sektion - das ist jetzt wirklich
  // "alle Artikel ohne Makros", nicht nur die mit einem Stammdaten-Eintrag:
  // Quelle ist die Vereinigung aus (a) Stammdaten mit sonstigen Daten
  // (Zutaten/eigene Öffnungs-Haltbarkeit), aber ohne Makros, und (b) allen
  // aktuellen Bestandsartikeln ohne Makros, auch wenn dafür noch gar kein
  // Stammdaten-Eintrag existiert - dann eine "virtuelle" Zeile (nur
  // key/name/basis), die beim ersten Speichern automatisch zu einem echten
  // Datensatz wird (gleicher Mechanismus wie "Lebensmittel anlegen").
  // Kategorien in `hiddenMacroCategories` werden komplett ausgeklammert
  // (z.B. Gewürze/Getränke, die grundsätzlich keine Makros brauchen - siehe
  // Verwalten-Ansicht weiter unten).
  // Sortiermodus "Kategorie": Stammdaten haben selbst kein Kategorie-Feld
  // (rein über den Namen mit Bestand verknüpft), die Kategorie wird deshalb
  // abgeleitet - zuerst über einen aktuellen Bestandsartikel mit passendem
  // Namen, sonst über einen passenden Favoriten, sonst "Ohne Zuordnung"
  // (Sammelgruppe, auch für Kategorien, die es in der Kategorien-Liste gar
  // nicht mehr gibt).
  const { withMacros, withoutMacros, groupedWithMacros, groupedWithoutMacros } = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = (name) => !q || name.toLowerCase().includes(q);
    const sortByName = (arr) => arr.slice().sort((a, b) => a.name.localeCompare(b.name, 'de'));

    const deriveCategory = (name) => {
      const norm = normalizeName(name);
      const item = (items || []).find((i) => normalizeName(i.name) === norm);
      const fav = !item ? (favorites || []).find((fv) => normalizeName(fv.name) === norm) : null;
      return item ? item.category : (fav ? fav.category : null);
    };

    const withM = sortByName((foods || []).filter((f) => hasMacros(f) && matches(f.name)));

    const rowsByKey = new Map();
    (foods || []).forEach((f) => { if (!hasMacros(f) && hasFoodData(f)) rowsByKey.set(f.key, f); });
    (items || []).forEach((i) => {
      const key = normalizeName(i.name);
      if (rowsByKey.has(key)) return;
      const existingFood = (foods || []).find((f) => f.key === key);
      if (existingFood) { if (!hasMacros(existingFood)) rowsByKey.set(key, existingFood); return; }
      rowsByKey.set(key, { key, name: i.name, basis: '100g' });
    });
    const hiddenSet = new Set(hiddenMacroCategories || []);
    const withoutM = sortByName(
      [...rowsByKey.values()].filter((f) => matches(f.name) && !hiddenSet.has(deriveCategory(f.name))),
    );

    const catOrder = new Map((categories || []).map((c, i) => [c, i]));
    const group = (arr) => {
      const byCat = {};
      arr.forEach((f) => {
        const derived = deriveCategory(f.name);
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
  }, [foods, search, categories, items, favorites, hiddenMacroCategories]);

  const startNew = () => { setDirectEntry(false); setEditing({ name: search.trim(), macros: emptyMacros('100g') }); };
  const startEdit = (food) => { setDirectEntry(false); setEditing({ key: food.key, name: food.name, originalName: food.name, macros: foodToMacros(food) }); };

  // Öffnet den Editor für den nächsten Eintrag einer Batch-Warteschlange
  // (Liste von Food-Keys, zum Start-Zeitpunkt fixiert - siehe startBatch).
  // Ist die Warteschlange abgearbeitet (oder ein Eintrag inzwischen
  // verschwunden, z.B. gelöscht), springt sie weiter bzw. beendet den Batch
  // wie ein normales Verlassen des Editors.
  const goToBatchIndex = (queue, index) => {
    if (index >= queue.length) { finishEditing(); return; }
    // Nachschlagen in der kombinierten "Ohne Makros"-Liste statt nur in
    // `foods` - der nächste Eintrag kann auch eine virtuelle Zeile sein
    // (Bestandsartikel ohne eigenen Stammdaten-Eintrag).
    const entry = withoutMacros.find((f) => f.key === queue[index]);
    if (!entry) { goToBatchIndex(queue, index + 1); return; }
    setEditing({ key: entry.key, name: entry.name, originalName: entry.name, macros: foodToMacros(entry), batch: { queue, index } });
  };

  const startBatch = () => {
    const queue = withoutMacros.filter((f) => selectedKeys.includes(f.key)).map((f) => f.key);
    if (queue.length === 0) return;
    setSelectMode(false);
    setSelectedKeys([]);
    setDirectEntry(false);
    goToBatchIndex(queue, 0);
  };

  const toggleSelectMode = () => { setSelectMode((v) => !v); setSelectedKeys([]); };
  const toggleSelectFood = (food) => {
    setSelectedKeys((prev) => (prev.includes(food.key) ? prev.filter((k) => k !== food.key) : [...prev, food.key]));
  };
  const selectAllNoMacros = () => setSelectedKeys(withoutMacros.map((f) => f.key));
  const selectNoneNoMacros = () => setSelectedKeys([]);

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
    if (editing.batch) goToBatchIndex(editing.batch.queue, editing.batch.index + 1);
    else finishEditing();
  };

  const del = () => {
    if (editing.key) onRemove(editing.key);
    if (editing.batch) goToBatchIndex(editing.batch.queue, editing.batch.index + 1);
    else finishEditing();
  };

  const copyRow = async (food) => {
    const ok = await copyMacros(food, lang);
    if (ok) {
      setCopiedKey(food.key);
      setTimeout(() => setCopiedKey((k) => (k === food.key ? null : k)), 1600);
      onMacrosCopied?.(food);
    }
  };

  // ----- Verwalten-Ansicht: Kategorien ohne Makro-Pflicht --------------------
  if (open && manageHidden) {
    return (
      <Modal
        open={open} onClose={() => setManageHidden(false)} t={t} lang={lang}
        title={tr(lang, 'foods.hiddenCategoriesTitle')} subtitle={tr(lang, 'foods.hiddenCategoriesSub')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          {(categories || []).map((c) => {
            const hidden = (hiddenMacroCategories || []).includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => onToggleHiddenCategory?.(c)}
                aria-pressed={hidden}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  background: t.cardAlt, borderRadius: 12, padding: '12px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 14.5, fontWeight: 700, color: t.text }}>{c}</span>
                <span style={{
                  flexShrink: 0, width: 22, height: 22, borderRadius: 7,
                  border: `2px solid ${hidden ? t.pillActive : t.border}`,
                  background: hidden ? t.pillActive : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                >
                  {hidden && <Check size={14} color={t.pillActiveText} strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 11.5, color: t.textFaint, marginTop: 12, lineHeight: 1.4 }}>
          {tr(lang, 'foods.hiddenCategoriesHint')}
        </div>
      </Modal>
    );
  }

  // ----- Editor-Ansicht ------------------------------------------------------
  if (open && editing) {
    const batch = editing.batch;
    const isLastInBatch = !!batch && batch.index === batch.queue.length - 1;
    const skipBatch = () => goToBatchIndex(batch.queue, batch.index + 1);
    // `editing.key` ist auch bei virtuellen "Ohne Makros"-Zeilen (reine
    // Bestandsartikel ohne Stammdaten-Eintrag) gesetzt (siehe
    // goToBatchIndex/startEdit) - Löschen ergibt dort aber erst Sinn, wenn
    // tatsächlich schon ein Datensatz existiert.
    const hasRealRecord = !!editing.key && (foods || []).some((f) => f.key === editing.key);
    // Titel zeigt den Artikelnamen selbst (statt nur "Nährwerte bearbeiten")
    // - vor allem im Batch-Modus wichtig, sonst sieht man beim Sprung zum
    // nächsten Eintrag nicht auf einen Blick, welcher Artikel gerade dran ist.
    // Der generische Kontext ("Nährwerte bearbeiten"/"Neues Lebensmittel")
    // wandert dafür in den Untertitel, zusammen mit dem Batch-Fortschritt.
    const editorLabel = editing.key ? tr(lang, 'foods.editTitle') : tr(lang, 'foods.newTitle');
    const subtitleParts = [];
    if (editing.name) subtitleParts.push(editorLabel);
    if (batch) subtitleParts.push(tr(lang, 'foods.batchProgress', { current: batch.index + 1, total: batch.queue.length }));
    const footer = (
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {hasRealRecord && (
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
        {batch && (
          <button
            onClick={skipBatch}
            style={{
              flexShrink: 0, padding: '14px 18px', borderRadius: 14, border: `1.5px solid ${t.border}`,
              background: 'transparent', color: t.textMuted, fontWeight: 700, fontSize: 14.5, cursor: 'pointer',
            }}
          >
            {tr(lang, 'foods.batchSkip')}
          </button>
        )}
        <button
          onClick={save}
          disabled={!(editing.name || '').trim()}
          style={{ ...primaryButtonStyle(t), opacity: (editing.name || '').trim() ? 1 : 0.45 }}
        >
          {batch ? tr(lang, isLastInBatch ? 'foods.batchSaveFinish' : 'foods.batchSaveNext') : tr(lang, 'foods.save')}
        </button>
      </div>
    );
    return (
      <Modal
        open={open} onClose={finishEditing} t={t} lang={lang}
        title={editing.name || tr(lang, 'foods.newTitle')}
        subtitle={subtitleParts.length ? subtitleParts.join(' · ') : undefined}
        footer={footer}
      >
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
  // `selectable` gilt nur für die "Ohne Makros"-Sektion (Mehrfachauswahl für
  // den Makro-Batch-Modus, siehe startBatch) - in der Sektion mit Makros gibt
  // es dafür keinen Anwendungsfall.
  const renderRows = (arr, { selectable = false } = {}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {arr.map((food) => (
        <FoodRow
          key={food.key} food={food} t={t} lang={lang}
          onEdit={startEdit} onCopy={copyRow} copied={copiedKey === food.key}
          isFavorite={isFavorite} onToggleFavorite={onToggleFavorite}
          selectable={selectable} selected={selectedKeys.includes(food.key)} onToggleSelect={toggleSelectFood}
        />
      ))}
    </div>
  );
  const renderGrouped = (groups, opts) => groups.map(([cat, arr]) => (
    <div key={cat ?? '__unassigned__'} style={{ marginBottom: 14 }}>
      <div style={{ ...groupLabelStyle(t), marginBottom: 8, paddingLeft: 2 }}>
        {cat || tr(lang, 'foods.unassigned')}
      </div>
      {renderRows(arr, opts)}
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

      {withMacros.length === 0 && withoutMacros.length === 0 && (hiddenMacroCategories || []).length === 0 ? (
        <div style={{ textAlign: 'center', color: t.textFaint, padding: '32px 12px', fontSize: 13.5 }}>
          {search.trim() ? tr(lang, 'foods.nothingFound') : tr(lang, 'foods.noneYet')}
        </div>
      ) : (
        <>
          {withMacros.length > 0 && (
            sortMode === 'category' ? renderGrouped(groupedWithMacros) : renderRows(withMacros)
          )}

          {/* Sektion bleibt auch sichtbar, wenn die Liste durch ausgeblendete
              Kategorien gerade leer ist - sonst gäbe es keinen Weg mehr
              zurück zum Verwalten-Dialog, um sie wieder einzublenden. */}
          {(withoutMacros.length > 0 || (hiddenMacroCategories || []).length > 0) && (
            <div style={{ marginTop: withMacros.length > 0 ? 18 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowNoMacros((v) => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent',
                    color: t.textMuted, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', padding: '4px 2px',
                  }}
                >
                  {showNoMacros ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  {tr(lang, 'foods.noMacrosSection', { count: withoutMacros.length })}
                </button>
                {showNoMacros && withoutMacros.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleSelectMode}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, border: 'none', background: 'transparent',
                      color: selectMode ? t.pillActive : t.textMuted, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', padding: '4px 2px',
                    }}
                  >
                    <ListChecks size={14} /> {tr(lang, selectMode ? 'foods.selectCancel' : 'foods.selectStart')}
                  </button>
                )}
              </div>

              {showNoMacros && (
                <button
                  type="button"
                  onClick={() => setManageHidden(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, border: 'none', background: 'transparent',
                    color: t.textFaint, fontWeight: 700, fontSize: 11.5, cursor: 'pointer', padding: '2px 2px', marginBottom: 8,
                  }}
                >
                  <EyeOff size={12} /> {tr(lang, 'foods.hiddenCategoriesManage')}
                </button>
              )}

              {showNoMacros && withoutMacros.length === 0 && (
                <div style={{ fontSize: 12.5, color: t.textFaint, padding: '8px 2px' }}>
                  {tr(lang, 'foods.allCategoriesHidden')}
                </div>
              )}

              {showNoMacros && selectMode && withoutMacros.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button type="button" onClick={selectAllNoMacros} style={pillStyle(false, t)}>{tr(lang, 'foods.selectAll')}</button>
                  <button type="button" onClick={selectNoneNoMacros} style={pillStyle(false, t)}>{tr(lang, 'foods.selectNone')}</button>
                  {selectedKeys.length > 0 && (
                    <button
                      type="button"
                      onClick={startBatch}
                      style={{
                        width: '100%', padding: '11px', borderRadius: 12, border: 'none',
                        background: t.btnPrimary, color: t.btnPrimaryText, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      }}
                    >
                      {tr(lang, 'foods.batchStart', { count: selectedKeys.length })}
                    </button>
                  )}
                </div>
              )}

              {showNoMacros && withoutMacros.length > 0 && (
                sortMode === 'category' ? renderGrouped(groupedWithoutMacros, { selectable: selectMode }) : renderRows(withoutMacros, { selectable: selectMode })
              )}
            </div>
          )}
        </>
      )}
    </Modal>
  );
});

function FoodRow({
  food, t, lang, onEdit, onCopy, copied, isFavorite, onToggleFavorite,
  selectable = false, selected = false, onToggleSelect,
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.cardAlt, borderRadius: 14, padding: '10px 12px' }}>
      {selectable && (
        <button
          type="button"
          onClick={() => onToggleSelect(food)}
          aria-pressed={selected}
          aria-label={tr(lang, 'foods.selectAria', { name: food.name })}
          style={{
            flexShrink: 0, width: 22, height: 22, borderRadius: 7,
            border: `2px solid ${selected ? t.pillActive : t.border}`,
            background: selected ? t.pillActive : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0,
          }}
        >
          {selected && <Check size={14} color={t.pillActiveText} strokeWidth={3} />}
        </button>
      )}
      <button
        type="button"
        onClick={() => (selectable ? onToggleSelect(food) : onEdit(food))}
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
      {!selectable && onToggleFavorite && (
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
