import { useEffect, useMemo, useState } from 'react';
import { Plus, Copy, Check, Trash2, Search } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { ClearableInput } from '../../components/ClearableInput.jsx';
import { MacroEditor } from './MacroEditor.jsx';
import { makeInputStyle, primaryButtonStyle } from '../../lib/styles.js';
import {
  emptyMacros, foodToMacros, macrosToFood, macroSummary, basisLabel,
  hasMacros, normalizeName, copyMacros,
} from '../../lib/macros.js';

// Stammdaten / Makros verwalten: alle Nährwert-Datensätze durchsuchen,
// bearbeiten, neu anlegen, kopieren und löschen.
export function ManageFoodsSheet({ open, onClose, t, foods, onUpsert, onRemove, scanSupported }) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // { name, macros } oder null
  const [copiedKey, setCopiedKey] = useState(null);
  const inputStyle = makeInputStyle(t);

  // Beim Schließen den Editor-/Suchzustand zurücksetzen.
  useEffect(() => {
    if (!open) {
      setEditing(null);
      setSearch('');
      setCopiedKey(null);
    }
  }, [open]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    const arr = (foods || []).filter((f) => !q || f.name.toLowerCase().includes(q));
    return arr.slice().sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }, [foods, search]);

  const startNew = () => setEditing({ name: search.trim(), macros: emptyMacros('100g') });
  const startEdit = (food) => setEditing({ key: food.key, name: food.name, macros: foodToMacros(food) });

  const save = () => {
    const name = (editing.name || '').trim();
    if (!name) return;
    onUpsert(macrosToFood(editing.macros, name));
    // Falls umbenannt (anderer Schlüssel): alten Datensatz entfernen.
    if (editing.key && editing.key !== normalizeName(name)) onRemove(editing.key);
    setEditing(null);
  };

  const del = () => {
    if (editing.key) onRemove(editing.key);
    setEditing(null);
  };

  const copyRow = async (food) => {
    const ok = await copyMacros(food);
    if (ok) {
      setCopiedKey(food.key);
      setTimeout(() => setCopiedKey((k) => (k === food.key ? null : k)), 1600);
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
            <Trash2 size={17} /> Löschen
          </button>
        )}
        <button
          onClick={save}
          disabled={!(editing.name || '').trim()}
          style={{ ...primaryButtonStyle(t), opacity: (editing.name || '').trim() ? 1 : 0.45 }}
        >
          Speichern
        </button>
      </div>
    );
    return (
      <Modal open={open} onClose={() => setEditing(null)} t={t} title={editing.key ? 'Nährwerte bearbeiten' : 'Neues Lebensmittel'} footer={footer}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>
          Name
        </label>
        <ClearableInput
          t={t}
          value={editing.name}
          onChange={(v) => setEditing((s) => ({ ...s, name: v }))}
          placeholder="z.B. Frischmilch"
          style={inputStyle}
          wrapperStyle={{ marginTop: 6, marginBottom: 16 }}
        />
        <MacroEditor
          name={editing.name}
          macros={editing.macros}
          onChange={(patch) => setEditing((s) => ({ ...s, macros: { ...s.macros, ...patch } }))}
          t={t}
          scanSupported={scanSupported}
        />
      </Modal>
    );
  }

  // ----- Listen-Ansicht ------------------------------------------------------
  return (
    <Modal open={open} onClose={onClose} t={t} title="Stammdaten / Makros" subtitle={`${(foods || []).length} Lebensmittel`}>
      <div style={{ position: 'relative', marginTop: 4, marginBottom: 12 }}>
        <Search size={16} color={t.textFaint} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Lebensmittel suchen…"
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
        <Plus size={17} /> Lebensmittel anlegen
      </button>

      {list.length === 0 ? (
        <div style={{ textAlign: 'center', color: t.textFaint, padding: '32px 12px', fontSize: 13.5 }}>
          {search.trim() ? 'Nichts gefunden.' : 'Noch keine Nährwerte erfasst.'}
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
                <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {food.name}
                </span>
                <span style={{ display: 'block', fontSize: 11.5, color: t.textFaint, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {hasMacros(food) ? `${macroSummary(food)} · ${basisLabel(food)}` : 'keine Werte'}
                </span>
              </button>
              {hasMacros(food) && (
                <button
                  type="button"
                  onClick={() => copyRow(food)}
                  aria-label="Nährwerte kopieren"
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
