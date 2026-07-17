import { Plus, Minus, Camera, Trash2 } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { ZonePicker } from '../../components/ZonePicker.jsx';
import { CategoryPicker } from '../../components/CategoryPicker.jsx';
import { zonePalette } from '../../lib/colors.js';
import { makeInputStyle, makeLabelStyle, pillStyle, btnCircle, primaryButtonStyle } from '../../lib/styles.js';

export function EditItemSheet({
  editItem, setEditItem, onClose, t, dark,
  zones, categories, onAddCategory,
  scanSupported, scanBusy, scanMsg, onScanDate, onSave, onDelete,
}) {
  const labelStyle = makeLabelStyle(t);
  const inputStyle = makeInputStyle(t);
  if (!editItem) return null;
  const zone = zones.find((z) => z.id === editItem.zone) || zones[0];
  const pal = zonePalette(zone.color, dark);

  const footer = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {scanMsg && (
        <div style={{ fontSize: 12, lineHeight: 1.4, color: scanMsg.startsWith('✓') ? t.success : t.textMuted }}>
          {scanMsg}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => onDelete(editItem.id)}
          style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7,
            padding: '14px 18px', borderRadius: 14, border: `1.5px solid ${t.dangerBorder}`,
            background: t.dangerBg, color: t.danger, fontWeight: 700, fontSize: 14.5, cursor: 'pointer',
          }}
        >
          <Trash2 size={17} /> Entfernen
        </button>
        <button onClick={onSave} style={primaryButtonStyle(t)}>Speichern</button>
      </div>
    </div>
  );

  return (
    <Modal open={!!editItem} onClose={onClose} t={t} title="Artikel bearbeiten" footer={footer}>
      <label style={{ ...labelStyle, marginTop: 4 }}>Name</label>
      <input
        value={editItem.name}
        onChange={(e) => setEditItem((s) => ({ ...s, name: e.target.value }))}
        style={inputStyle}
      />

      <div style={{ marginTop: 16 }}>
        <ZonePicker
          zones={zones}
          value={editItem.zone}
          onChange={(id) => setEditItem((s) => ({ ...s, zone: id }))}
          t={t}
          dark={dark}
          label="Lagerort"
        />
      </div>

      <label style={labelStyle}>Kategorie</label>
      <CategoryPicker
        value={editItem.category}
        onChange={(c) => setEditItem((s) => ({ ...s, category: c }))}
        categories={categories}
        onAddCategory={onAddCategory}
        t={t}
      />

      <label style={labelStyle}>Einheit</label>
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        {['stk', 'g', 'ml'].map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => setEditItem((s) => ({ ...s, unit: u, qty: u === 'stk' ? Math.max(1, Math.round(s.qty) || 1) : (s.unit === 'stk' ? 500 : s.qty) }))}
            style={pillStyle(editItem.unit === u, t)}
          >
            {u === 'stk' ? 'Stück' : u}
          </button>
        ))}
      </div>

      <label style={labelStyle}>Menge</label>
      {editItem.unit === 'stk' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
          <button type="button" onClick={() => setEditItem((s) => ({ ...s, qty: Math.max(0, s.qty - 1) }))} style={btnCircle(t.cardAlt, t.pillInactiveText, 38)}>
            <Minus size={16} strokeWidth={2.5} />
          </button>
          <span style={{ fontSize: 18, fontWeight: 800, minWidth: 28, textAlign: 'center', color: t.text }}>{editItem.qty}x</span>
          <button type="button" onClick={() => setEditItem((s) => ({ ...s, qty: s.qty + 1 }))} style={btnCircle(pal.accentBg, pal.accent, 38)}>
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <input
            type="number"
            inputMode="numeric"
            value={editItem.qty}
            onChange={(e) => setEditItem((s) => ({ ...s, qty: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
            style={{ ...inputStyle, marginTop: 0 }}
          />
          <span style={{ fontSize: 15, fontWeight: 700, color: t.textMuted }}>{editItem.unit}</span>
        </div>
      )}

      <label style={labelStyle}>Mindesthaltbarkeitsdatum</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
        <input
          type="date"
          value={editItem.mhd || ''}
          onChange={(e) => setEditItem((s) => ({ ...s, mhd: e.target.value || null }))}
          style={{ ...inputStyle, marginTop: 0 }}
        />
        {scanSupported && (
          <button
            type="button"
            onClick={() => onScanDate('edit')}
            disabled={scanBusy}
            aria-label="MHD per Foto einlesen"
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
              padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${t.border}`,
              background: 'transparent', color: t.textMuted, fontWeight: 700, fontSize: 13.5,
              cursor: scanBusy ? 'default' : 'pointer', opacity: scanBusy ? 0.6 : 1,
            }}
          >
            <Camera size={17} /> Foto
          </button>
        )}
      </div>
    </Modal>
  );
}
