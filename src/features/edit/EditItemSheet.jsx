import { useRef, useState } from 'react';
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
  // Roh-Text während der Eingabe bei g/ml (statt jeden Tastendruck sofort zu
  // übernehmen) – so kann man z.B. "40" nach Antippen von "−" eintippen, ohne
  // dass zwischendurch schon ein falscher Wert übernommen wird. Erst bei
  // Verlassen des Felds/Enter wird ausgewertet.
  const [qtyDraft, setQtyDraft] = useState(null);
  // Vorzeichen-Umschalter für Delta-Eingabe (z.B. "−" antippen, dann "40"
  // eintippen -> 40 wird von der aktuellen Menge abgezogen). Nötig, weil die
  // numerische Handy-Tastatur kein +/- anbietet.
  const [qtySign, setQtySign] = useState(null);
  const qtyInputRef = useRef(null);
  // Verhindert, dass der onFocus-Handler (der beim normalen Antippen des
  // Felds den Ist-Wert vorbelegt) den gerade von armSign() geleerten Entwurf
  // überschreibt – der programmatische .focus()-Aufruf feuert onFocus noch
  // im selben Tick mit dem alten qtySign-Stand (Ref statt State, da sofort
  // aktuell).
  const armingRef = useRef(false);
  if (!editItem) return null;

  const armSign = (sign) => {
    const next = qtySign === sign ? null : sign;
    setQtySign(next);
    setQtyDraft(next ? '' : String(editItem.qty));
    armingRef.current = true;
    qtyInputRef.current?.focus();
  };

  const commitQtyDraft = () => {
    if (qtyDraft !== null) {
      const raw = qtyDraft.trim();
      if (qtySign) {
        const magnitude = Math.abs(parseInt(raw, 10) || 0);
        const delta = qtySign === '-' ? -magnitude : magnitude;
        setEditItem((s) => ({ ...s, qty: Math.max(0, s.qty + delta) }));
      } else if (/^[+-]\d+$/.test(raw)) {
        setEditItem((s) => ({ ...s, qty: Math.max(0, editItem.qty + parseInt(raw, 10)) }));
      } else {
        const parsed = parseInt(raw, 10);
        setEditItem((s) => ({ ...s, qty: Math.max(0, Number.isFinite(parsed) ? parsed : s.qty) }));
      }
    }
    setQtySign(null);
    setQtyDraft(null);
  };
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
          // Feste Obergrenze, unabhängig von der aktuellen Menge – sonst
          // verschiebt sich die Skala bei jeder Änderung mit.
          const sliderMax = 1000;
          return (
            <div style={{ marginTop: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => armSign('-')}
                  aria-pressed={qtySign === '-'}
                  aria-label="Menge abziehen (Delta)"
                  style={btnCircle(qtySign === '-' ? pal.accentBg : t.cardAlt, qtySign === '-' ? pal.accent : t.pillInactiveText, 34)}
                >
                  <Minus size={15} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => armSign('+')}
                  aria-pressed={qtySign === '+'}
                  aria-label="Menge addieren (Delta)"
                  style={btnCircle(qtySign === '+' ? pal.accentBg : t.cardAlt, qtySign === '+' ? pal.accent : t.pillInactiveText, 34)}
                >
                  <Plus size={15} strokeWidth={2.5} />
                </button>
                <input
                  ref={qtyInputRef}
                  type="text"
                  inputMode="numeric"
                  value={qtyDraft !== null ? qtyDraft : String(editItem.qty)}
                  onFocus={() => {
                    if (armingRef.current) { armingRef.current = false; return; }
                    setQtyDraft(String(editItem.qty));
                  }}
                  onChange={(e) => setQtyDraft(e.target.value)}
                  onBlur={commitQtyDraft}
                  onKeyDown={(e) => { if (e.key === 'Enter') { commitQtyDraft(); e.target.blur(); } }}
                  placeholder={qtySign ? 'Betrag' : undefined}
                  aria-label={qtySign ? `Betrag zum ${qtySign === '-' ? 'Abziehen' : 'Addieren'}` : 'Menge'}
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
        <ClearableInput
          t={t}
          type="date"
          value={editItem.mhd || ''}
          onChange={(v) => setEditItem((s) => ({ ...s, mhd: v || null }))}
          style={{ ...inputStyle, marginTop: 0 }}
          wrapperStyle={{ flex: 1, minWidth: 0 }}
        />
        {scanSupported && (
          <button
            type="button"
            onClick={() => onScanDate('edit')}
            disabled={scanBusy}
            aria-label={scanBusy ? 'Lese MHD…' : 'MHD per Foto einlesen'}
            title="MHD per Foto einlesen"
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 46, height: 46, borderRadius: 12, border: `1.5px solid ${t.border}`,
              background: 'transparent', color: pal.accent,
              cursor: scanBusy ? 'default' : 'pointer', opacity: scanBusy ? 0.6 : 1,
            }}
          >
            <Camera size={17} />
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
