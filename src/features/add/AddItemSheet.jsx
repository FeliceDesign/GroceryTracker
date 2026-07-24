import { Plus, Minus, Camera, Layers } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { ZonePicker } from '../../components/ZonePicker.jsx';
import { CategoryPicker } from '../../components/CategoryPicker.jsx';
import { ClearableInput } from '../../components/ClearableInput.jsx';
import { BarcodeIcon } from '../../components/icons.jsx';
import { MacroSection } from '../macros/MacroSection.jsx';
import { zonePalette } from '../../lib/colors.js';
import { emptyMacros, defaultBasisForUnit } from '../../lib/macros.js';
import { makeInputStyle, makeLabelStyle, pillStyle, btnCircle, primaryButtonStyle } from '../../lib/styles.js';
import { tr } from '../../lib/i18n.js';

// Erfassungs-Formular. Bewusst so aufgebaut, dass die häufig genutzten
// Aktionen – Scannen und Hinzufügen – unten in Daumenreichweite sitzen.
export function AddItemSheet({
  open, onClose, t, dark, lang = 'de',
  zones, categories, onAddCategory,
  newItem, setNewItem,
  scanSupported, scanBusy, scanMsg,
  onScanBarcode, onScanDate, onOpenBatch, onSubmit,
}) {
  const labelStyle = makeLabelStyle(t);
  const inputStyle = makeInputStyle(t);
  const zone = zones.find((z) => z.id === newItem.zone) || zones[0];
  const pal = zonePalette(zone.color, dark);
  const canSubmit = newItem.name.trim().length > 0;

  const scanBtn = (onClick, children, primary) => (
    <button
      type="button"
      onClick={onClick}
      disabled={scanBusy}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '13px 12px', borderRadius: 14, cursor: scanBusy ? 'default' : 'pointer',
        fontSize: 14.5, fontWeight: 700, opacity: scanBusy ? 0.6 : 1,
        border: primary ? 'none' : `1.5px solid ${t.border}`,
        background: primary ? pal.accentBg : 'transparent',
        color: primary ? pal.accent : t.textMuted,
      }}
    >
      {children}
    </button>
  );

  const footer = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {scanMsg && (
        <div style={{ fontSize: 12, lineHeight: 1.4, color: scanMsg.startsWith('✓') ? t.success : t.textMuted }}>
          {scanMsg}
        </div>
      )}
      {scanSupported && (
        <div style={{ display: 'flex', gap: 8 }}>
          {scanBtn(onScanBarcode, (<><BarcodeIcon size={18} color={pal.accent} /> {scanBusy ? tr(lang, 'add.scanning') : tr(lang, 'add.barcode')}</>), true)}
          {scanBtn(onOpenBatch, (<><Layers size={17} /> {tr(lang, 'add.multiple')}</>), false)}
        </div>
      )}
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        style={{ ...primaryButtonStyle(t), opacity: canSubmit ? 1 : 0.45, cursor: canSubmit ? 'pointer' : 'default' }}
      >
        {tr(lang, 'add.submit')}
      </button>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} t={t} lang={lang} title={tr(lang, 'add.title')} footer={footer}>
      <label style={{ ...labelStyle, marginTop: 4 }}>{tr(lang, 'add.name')}</label>
      <ClearableInput
        t={t}
        lang={lang}
        value={newItem.name}
        onChange={(v) => setNewItem((s) => ({ ...s, name: v }))}
        placeholder={tr(lang, 'add.namePlaceholder')}
        style={inputStyle}
        wrapperStyle={{ marginTop: 6 }}
        autoFocus
      />

      <div style={{ marginTop: 16 }}>
        <ZonePicker
          zones={zones}
          value={newItem.zone}
          onChange={(id) => setNewItem((s) => ({ ...s, zone: id }))}
          t={t}
          dark={dark}
          lang={lang}
          label={tr(lang, 'add.location')}
        />
      </div>

      <label style={labelStyle}>{tr(lang, 'add.category')}</label>
      <CategoryPicker
        value={newItem.category}
        onChange={(c) => setNewItem((s) => ({ ...s, category: c }))}
        categories={categories}
        onAddCategory={onAddCategory}
        t={t}
        lang={lang}
      />

      <label style={labelStyle}>{tr(lang, 'add.unit')}</label>
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        {['stk', 'g', 'ml'].map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => setNewItem((s) => ({ ...s, unit: u, qty: u === 'stk' ? 1 : 500 }))}
            style={pillStyle(newItem.unit === u, t)}
          >
            {u === 'stk' ? tr(lang, 'add.piece') : u}
          </button>
        ))}
      </div>

      <label style={labelStyle}>{tr(lang, 'add.quantity')}</label>
      {newItem.unit === 'stk' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
          <button type="button" onClick={() => setNewItem((s) => ({ ...s, qty: Math.max(1, s.qty - 1) }))} style={btnCircle(t.cardAlt, t.pillInactiveText, 38)}>
            <Minus size={16} strokeWidth={2.5} />
          </button>
          <span style={{ fontSize: 18, fontWeight: 800, minWidth: 28, textAlign: 'center', color: t.text }}>{newItem.qty}x</span>
          <button type="button" onClick={() => setNewItem((s) => ({ ...s, qty: s.qty + 1 }))} style={btnCircle(pal.accentBg, pal.accent, 38)}>
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <input
            type="number"
            inputMode="numeric"
            value={newItem.qty}
            onChange={(e) => setNewItem((s) => ({ ...s, qty: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
            style={{ ...inputStyle, marginTop: 0 }}
          />
          <span style={{ fontSize: 15, fontWeight: 700, color: t.textMuted }}>{newItem.unit}</span>
        </div>
      )}

      <label style={labelStyle}>{tr(lang, 'add.mhd')}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
        <input
          type="date"
          value={newItem.mhd || ''}
          onChange={(e) => setNewItem((s) => ({ ...s, mhd: e.target.value || null }))}
          style={{ ...inputStyle, marginTop: 0 }}
        />
        {scanSupported && (
          <button
            type="button"
            onClick={() => onScanDate('add')}
            disabled={scanBusy}
            aria-label={tr(lang, 'add.photoAria')}
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
              padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${t.border}`,
              background: 'transparent', color: t.textMuted, fontWeight: 700, fontSize: 13.5,
              cursor: scanBusy ? 'default' : 'pointer', opacity: scanBusy ? 0.6 : 1,
            }}
          >
            <Camera size={17} /> {tr(lang, 'add.photo')}
          </button>
        )}
      </div>

      <MacroSection
        name={newItem.name}
        macros={newItem.macros || emptyMacros(defaultBasisForUnit(newItem.unit))}
        onChange={(patch) => setNewItem((s) => ({ ...s, macros: { ...(s.macros || emptyMacros(defaultBasisForUnit(s.unit))), ...patch } }))}
        t={t}
        lang={lang}
        scanSupported={scanSupported}
        accent={pal.accent}
      />
    </Modal>
  );
}
