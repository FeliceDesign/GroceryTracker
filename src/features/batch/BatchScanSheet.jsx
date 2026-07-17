import { Plus, Minus, Trash2 } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { ZonePicker } from '../../components/ZonePicker.jsx';
import { BarcodeIcon } from '../../components/icons.jsx';
import { zonePalette } from '../../lib/colors.js';
import { makeInputStyle, btnCircle, primaryButtonStyle } from '../../lib/styles.js';

// Schneller Erfassungs-Modus: nacheinander scannen, sammeln, in einem Rutsch
// übernehmen. Ideal, um einen ganzen Einkauf aufzunehmen.
export function BatchScanSheet({
  open, onClose, t, dark, zones,
  batchZone, setBatchZone, batchItems,
  scanBusy, scanMsg, onScan, onUpdateItem, onRemoveItem, onCycleZone, onCommit,
}) {
  const inputStyle = makeInputStyle(t);
  const targetZone = zones.find((z) => z.id === batchZone) || zones[0];
  const pal = zonePalette(targetZone.color, dark);
  const validCount = batchItems.filter((b) => b.name.trim()).length;

  const footer = (
    <button
      onClick={onCommit}
      disabled={validCount === 0}
      style={{ ...primaryButtonStyle(t), width: '100%', opacity: validCount === 0 ? 0.45 : 1, cursor: validCount === 0 ? 'default' : 'pointer' }}
    >
      {validCount === 0 ? 'Noch nichts gescannt' : `${validCount} ${validCount === 1 ? 'Artikel' : 'Artikel'} übernehmen`}
    </button>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      t={t}
      title="Mehrere scannen"
      subtitle={batchItems.length > 0 ? `${batchItems.length} erfasst` : 'Einkauf schnell aufnehmen'}
      footer={footer}
    >
      <div style={{ marginTop: 4 }}>
        <ZonePicker
          zones={zones}
          value={batchZone}
          onChange={setBatchZone}
          t={t}
          dark={dark}
          label="Neue Scans landen in"
        />
      </div>

      <button
        type="button"
        onClick={onScan}
        disabled={scanBusy}
        style={{
          width: '100%', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '15px 12px', borderRadius: 14, border: 'none', cursor: scanBusy ? 'default' : 'pointer',
          background: pal.accentBg, color: pal.accent, fontSize: 15.5, fontWeight: 800, opacity: scanBusy ? 0.6 : 1,
        }}
      >
        <BarcodeIcon size={20} color={pal.accent} />
        {scanBusy ? 'Scanne…' : 'Barcode scannen'}
      </button>

      {scanMsg && (
        <div style={{ fontSize: 12, marginTop: 10, lineHeight: 1.4, color: scanMsg.startsWith('✓') ? t.success : t.textMuted }}>
          {scanMsg}
        </div>
      )}

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {batchItems.map((b) => {
          const z = zones.find((zz) => zz.id === b.zone) || zones[0];
          const bp = zonePalette(z.color, dark);
          return (
            <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.cardAlt, borderRadius: 12, padding: '8px 10px' }}>
              <button
                type="button"
                onClick={() => onCycleZone(b.key)}
                aria-label="Lagerort wechseln"
                style={{ flexShrink: 0, border: 'none', background: bp.accentBg, borderRadius: 10, width: 40, height: 40, fontSize: 18, cursor: 'pointer' }}
              >
                {z.emoji}
              </button>
              <input
                value={b.name}
                onChange={(e) => onUpdateItem(b.key, { name: e.target.value })}
                placeholder="Name ergänzen…"
                style={{ ...inputStyle, marginTop: 0, padding: '9px 10px', flex: 1, minWidth: 0 }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <button type="button" onClick={() => onUpdateItem(b.key, { qty: Math.max(1, b.qty - 1) })} style={btnCircle(t.card, t.pillInactiveText, 30)}>
                  <Minus size={13} strokeWidth={2.5} />
                </button>
                <span style={{ minWidth: 18, textAlign: 'center', fontSize: 13.5, fontWeight: 700, color: t.text }}>{b.qty}</span>
                <button type="button" onClick={() => onUpdateItem(b.key, { qty: b.qty + 1 })} style={btnCircle(bp.accentBg, bp.accent, 30)}>
                  <Plus size={13} strokeWidth={2.5} />
                </button>
              </div>
              <button type="button" onClick={() => onRemoveItem(b.key)} style={{ ...btnCircle('transparent', t.danger, 30), flexShrink: 0 }} aria-label="Entfernen">
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
