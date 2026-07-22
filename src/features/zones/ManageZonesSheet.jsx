import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { ClearableInput } from '../../components/ClearableInput.jsx';
import { ZONE_COLOR_CHOICES, zonePalette } from '../../lib/colors.js';
import { makeInputStyle, btnCircle } from '../../lib/styles.js';

function ColorRow({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 8 }}>
      {ZONE_COLOR_CHOICES.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={`Farbe ${c}`}
          style={{
            width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer',
            border: value === c ? '3px solid rgba(255,255,255,0.9)' : '3px solid transparent',
            boxShadow: value === c ? `0 0 0 2px ${c}` : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {value === c && <Check size={13} color="#fff" strokeWidth={3} />}
        </button>
      ))}
    </div>
  );
}

// Lagerorte verwalten: umbenennen, Emoji/Farbe ändern, hinzufügen, entfernen.
export function ManageZonesSheet({ open, onClose, t, dark, zones, countFor, onAdd, onUpdate, onRemove }) {
  const inputStyle = makeInputStyle(t);
  const [draft, setDraft] = useState({ label: '', emoji: '', color: ZONE_COLOR_CHOICES[0] });
  const [showAdd, setShowAdd] = useState(false);

  const submitAdd = () => {
    if (!draft.label.trim()) return;
    onAdd({ label: draft.label, emoji: draft.emoji || '📦', color: draft.color });
    setDraft({ label: '', emoji: '', color: ZONE_COLOR_CHOICES[0] });
    setShowAdd(false);
  };

  return (
    <Modal open={open} onClose={onClose} t={t} title="Lagerorte" subtitle="Anpassen, hinzufügen oder entfernen">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
        {zones.map((z) => {
          const pal = zonePalette(z.color, dark);
          const count = countFor(z.id);
          return (
            <div key={z.id} style={{ background: t.cardAlt, borderRadius: 14, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  value={z.emoji}
                  onChange={(e) => onUpdate(z.id, { emoji: e.target.value.slice(0, 3) })}
                  aria-label="Emoji"
                  style={{ ...inputStyle, marginTop: 0, width: 52, textAlign: 'center', padding: '10px 4px', fontSize: 20, flexShrink: 0 }}
                />
                <ClearableInput
                  t={t}
                  value={z.label}
                  onChange={(v) => onUpdate(z.id, { label: v })}
                  aria-label="Name des Lagerorts"
                  style={{ ...inputStyle, marginTop: 0, borderColor: pal.accent }}
                  wrapperStyle={{ flex: 1, minWidth: 0 }}
                />
                <button
                  type="button"
                  onClick={() => onRemove(z.id)}
                  disabled={zones.length <= 1}
                  aria-label={`${z.label} entfernen`}
                  style={{ ...btnCircle('transparent', zones.length <= 1 ? t.textFaint : t.danger, 40), opacity: zones.length <= 1 ? 0.4 : 1, cursor: zones.length <= 1 ? 'default' : 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <ColorRow value={z.color} onChange={(c) => onUpdate(z.id, { color: c })} />
              <div style={{ fontSize: 11.5, color: t.textFaint, marginTop: 8 }}>
                {count} {count === 1 ? 'Artikel' : 'Artikel'}{zones.length > 1 ? ' · beim Entfernen wandern sie in den ersten Lagerort' : ''}
              </div>
            </div>
          );
        })}
      </div>

      {showAdd ? (
        <div style={{ background: t.cardAlt, borderRadius: 14, padding: 12, marginTop: 12, border: `1.5px dashed ${t.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              value={draft.emoji}
              onChange={(e) => setDraft((s) => ({ ...s, emoji: e.target.value.slice(0, 3) }))}
              placeholder="📦"
              aria-label="Emoji"
              style={{ ...inputStyle, marginTop: 0, width: 52, textAlign: 'center', padding: '10px 4px', fontSize: 20, flexShrink: 0 }}
            />
            <ClearableInput
              t={t}
              value={draft.label}
              onChange={(v) => setDraft((s) => ({ ...s, label: v }))}
              onKeyDown={(e) => e.key === 'Enter' && submitAdd()}
              placeholder="z.B. Keller"
              autoFocus
              aria-label="Name des Lagerorts"
              style={{ ...inputStyle, marginTop: 0 }}
              wrapperStyle={{ flex: 1, minWidth: 0 }}
            />
          </div>
          <ColorRow value={draft.color} onChange={(c) => setDraft((s) => ({ ...s, color: c }))} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setDraft({ label: '', emoji: '', color: ZONE_COLOR_CHOICES[0] }); }}
              style={{ flex: 1, padding: '12px', borderRadius: 12, border: `1.5px solid ${t.border}`, background: 'transparent', color: t.textMuted, fontWeight: 700, cursor: 'pointer' }}
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={submitAdd}
              disabled={!draft.label.trim()}
              style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: t.btnPrimary, color: t.btnPrimaryText, fontWeight: 700, cursor: draft.label.trim() ? 'pointer' : 'default', opacity: draft.label.trim() ? 1 : 0.5 }}
            >
              Hinzufügen
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          style={{
            width: '100%', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px', borderRadius: 14, border: `1.5px dashed ${t.border}`,
            background: 'transparent', color: t.textMuted, fontWeight: 700, fontSize: 14.5, cursor: 'pointer',
          }}
        >
          <Plus size={18} /> Neuer Lagerort
        </button>
      )}
    </Modal>
  );
}
