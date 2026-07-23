import { Plus, Minus, Camera, Trash2 } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { ZonePicker } from '../../components/ZonePicker.jsx';
import { CategoryPicker } from '../../components/CategoryPicker.jsx';
import { ClearableInput } from '../../components/ClearableInput.jsx';
import { PackageOpen } from 'lucide-react';
import { MacroSection } from '../macros/MacroSection.jsx';
import { zonePalette } from '../../lib/colors.js';
import { emptyMacros, defaultBasisForUnit } from '../../lib/macros.js';
import { todayISO } from '../../lib/date.js';
import { makeInputStyle, makeLabelStyle, pillStyle, btnCircle, primaryButtonStyle } from '../../lib/styles.js';

export function EditItemSheet({
  editItem, setEditItem, onClose, t, dark,
  zones, categories, onAddCategory,
  scanSupported, scanBusy, scanMsg, stepGml, showSlider, onScanDate, onSave, onDelete,
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
      <ClearableInput
        t={t}
        value={editItem.name}
        onChange={(v) => setEditItem((s) => ({ ...s, name: v }))}
        style={inputStyle}
        wrapperStyle={{ marginTop: 6 }}
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
          <input
            type="number"
            inputMode="numeric"
            value={editItem.qty}
            onChange={(e) => setEditItem((s) => ({ ...s, qty: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
            aria-label="Menge"
            style={{ ...inputStyle, marginTop: 0, width: 72, textAlign: 'center', fontSize: 18, fontWeight: 800, padding: '8px 6px' }}
          />
          <button type="button" onClick={() => setEditItem((s) => ({ ...s, qty: s.qty + 1 }))} style={btnCircle(pal.accentBg, pal.accent, 38)}>
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        (() => {
          const step = stepGml && stepGml !== 'auto' ? Number(stepGml) : 10;
          // Obergrenze adaptiv: knapp über der aktuellen Menge (auf Schrittweite
          // gerundet, kleiner Puffer) – kein riesiger leerer Bereich rechts.
          // Hart gedeckelt bei 1000, sonst wächst die Obergrenze beim Ziehen
          // immer weiter mit und der Regler wirkt endlos.
          const sliderMax = Math.min(1000, Math.max(step * 5, Math.ceil((Math.max(editItem.qty, 1) * 1.3) / step) * step));
          return (
            <div style={{ marginTop: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="number"
                  inputMode="numeric"
                  value={editItem.qty}
                  onChange={(e) => setEditItem((s) => ({ ...s, qty: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                  style={{ ...inputStyle, marginTop: 0 }}
                />
                <span style={{ fontSize: 15, fontWeight: 700, color: t.textMuted }}>{editItem.unit}</span>
              </div>
              {showSlider !== false && (
                <input
                  type="range"
                  min={0}
                  max={sliderMax}
                  step={step}
                  value={Math.min(editItem.qty, sliderMax)}
                  onChange={(e) => setEditItem((s) => ({ ...s, qty: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                  aria-label="Menge per Schieberegler"
                  style={{ width: '100%', marginTop: 12, accentColor: pal.accent }}
                />
              )}
            </div>
          );
        })()
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

      <label style={labelStyle}>Status</label>
      <button
        type="button"
        onClick={() => setEditItem((s) => ({ ...s, opened: !s.opened, openedAt: !s.opened ? (s.openedAt || todayISO()) : null }))}
        aria-pressed={!!editItem.opened}
        style={{
          marginTop: 6, width: '100%', display: 'flex', alignItems: 'center', gap: 9,
          padding: '13px 14px', borderRadius: 12, cursor: 'pointer',
          border: `1.5px solid ${editItem.opened ? t.warning : t.border}`,
          background: editItem.opened ? t.warningBg : 'transparent',
          color: editItem.opened ? t.warning : t.textMuted, fontWeight: 700, fontSize: 14.5,
        }}
      >
        <PackageOpen size={18} />
        {editItem.opened ? 'Geöffnet' : 'Als geöffnet markieren'}
      </button>

      {editItem.opened && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <span style={{ fontSize: 13, color: t.textMuted, flexShrink: 0 }}>Geöffnet am</span>
          <input
            type="date"
            value={editItem.openedAt || todayISO()}
            max={todayISO()}
            onChange={(e) => setEditItem((s) => ({ ...s, openedAt: e.target.value || todayISO() }))}
            style={{ ...inputStyle, marginTop: 0 }}
          />
        </div>
      )}

      <MacroSection
        name={editItem.name}
        macros={editItem.macros || emptyMacros(defaultBasisForUnit(editItem.unit))}
        onChange={(patch) => setEditItem((s) => ({ ...s, macros: { ...(s.macros || emptyMacros(defaultBasisForUnit(s.unit))), ...patch } }))}
        t={t}
        scanSupported={scanSupported}
        accent={pal.accent}
      />
    </Modal>
  );
}
