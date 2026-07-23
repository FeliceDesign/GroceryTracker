import { useState } from 'react';
import { Plus, Trash2, Snowflake } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { ClearableInput } from '../../components/ClearableInput.jsx';
import { ColorSwatches } from '../../components/ColorSwatches.jsx';
import { ZONE_COLOR_CHOICES, zonePalette } from '../../lib/colors.js';
import { zoneIsCooled } from '../../lib/openedShelfLife.js';
import { makeInputStyle, btnCircle } from '../../lib/styles.js';

// Kleiner „gekühlt"-Umschalter (für Lager-Hinweise bei geöffneten Artikeln).
function CooledToggle({ on, onChange, t }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
        padding: '7px 12px', borderRadius: 999, cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
        border: `1.5px solid ${on ? t.info || '#3B7A9E' : t.border}`,
        background: on ? (t.infoBg || 'rgba(59,122,158,0.14)') : 'transparent',
        color: on ? (t.info || '#3B7A9E') : t.textMuted,
      }}
    >
      <Snowflake size={14} /> {on ? 'Gekühlt' : 'Nicht gekühlt'}
    </button>
  );
}

// Lagerorte verwalten: umbenennen, Emoji/Farbe ändern, hinzufügen, entfernen.
export function ManageZonesSheet({ open, onClose, t, dark, zones, countFor, onAdd, onUpdate, onRemove }) {
  const inputStyle = makeInputStyle(t);
  const [draft, setDraft] = useState({ label: '', emoji: '', color: ZONE_COLOR_CHOICES[0], cooled: false });
  const [showAdd, setShowAdd] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  const submitAdd = () => {
    if (!draft.label.trim()) return;
    onAdd({ label: draft.label, emoji: draft.emoji || '📦', color: draft.color, cooled: draft.cooled });
    setDraft({ label: '', emoji: '', color: ZONE_COLOR_CHOICES[0], cooled: false });
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
                  onClick={() => setConfirmRemoveId(z.id)}
                  disabled={zones.length <= 1}
                  aria-label={`${z.label} entfernen`}
                  style={{ ...btnCircle('transparent', zones.length <= 1 ? t.textFaint : t.danger, 40), opacity: zones.length <= 1 ? 0.4 : 1, cursor: zones.length <= 1 ? 'default' : 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <ColorSwatches choices={ZONE_COLOR_CHOICES} value={z.color} onChange={(c) => onUpdate(z.id, { color: c })} />
              <CooledToggle t={t} on={zoneIsCooled(z)} onChange={(v) => onUpdate(z.id, { cooled: v })} />
              <div style={{ fontSize: 11.5, color: t.textFaint, marginTop: 8 }}>
                {count} {count === 1 ? 'Artikel' : 'Artikel'}{zones.length > 1 ? ' · beim Entfernen wandern sie in den ersten Lagerort' : ''}
              </div>
              {confirmRemoveId === z.id && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  marginTop: 10, padding: '10px 12px', borderRadius: 10,
                  background: t.dangerBg, border: `1.5px solid ${t.dangerBorder}`,
                }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: t.danger }}>
                    „{z.label}" wirklich entfernen?
                  </span>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => setConfirmRemoveId(null)}
                      style={{ border: 'none', background: 'transparent', color: t.textMuted, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', padding: '6px 4px' }}
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      onClick={() => { onRemove(z.id); setConfirmRemoveId(null); }}
                      style={{ border: 'none', background: 'transparent', color: t.danger, fontWeight: 800, fontSize: 12.5, cursor: 'pointer', padding: '6px 4px' }}
                    >
                      Entfernen
                    </button>
                  </div>
                </div>
              )}
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
          <ColorSwatches choices={ZONE_COLOR_CHOICES} value={draft.color} onChange={(c) => setDraft((s) => ({ ...s, color: c }))} />
          <CooledToggle t={t} on={draft.cooled} onChange={(v) => setDraft((s) => ({ ...s, cooled: v }))} />
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
