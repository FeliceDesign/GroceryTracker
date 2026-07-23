import { useState } from 'react';
import { Plus, Minus, Trash2, Pencil, Copy, Check, Utensils, List, PackageOpen } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { ClearableInput } from '../../components/ClearableInput.jsx';
import { ShelfLifeDetails } from '../macros/ShelfLifeDetails.jsx';
import { zonePalette } from '../../lib/colors.js';
import { daysUntil, expiryLevel, levelColor, levelBg, mhdLabel, formatDateDisplay } from '../../lib/date.js';
import { MACRO_FIELDS, fmtNum, unsaturatedFat, hasMacros, basisLabel, copyMacros } from '../../lib/macros.js';
import { openedDaysFor, openedUntil } from '../../lib/openedShelfLife.js';
import { btnCircle, primaryButtonStyle, makeInputStyle } from '../../lib/styles.js';

// Schreibgeschützte Detail-Ansicht eines Artikels (Nährwerte, Zutaten,
// Haltbarkeit). „Bearbeiten" öffnet das Formular. `warnColors` optional:
// { soon, critical, expired } – eigene Farben aus den Einstellungen.
export function DetailItemSheet({
  open, item, zone, food, t, dark, yellowDays = 3, orangeDays = 1, warnColors = {}, dateFormat = 'dmy',
  onClose, onEdit, onChangeQty, onRemove, onToggleOpened, onChangeMhd,
}) {
  const [copied, setCopied] = useState(false);
  if (!open || !item) return null;
  const inputStyle = makeInputStyle(t);

  const pal = zonePalette(zone ? zone.color : t.textMuted, dark);
  const rawDays = daysUntil(item.mhd);
  const mhdLevel = expiryLevel(rawDays, yellowDays, orangeDays);
  const mhdWarn = mhdLevel === 'expired' || mhdLevel === 'critical' || mhdLevel === 'soon';

  const shelfDays = openedDaysFor(item.name, food);
  const openUntil = openedUntil(item, shelfDays);
  const openDays = openUntil ? daysUntil(openUntil) : null;
  const openLevel = openDays != null ? expiryLevel(openDays, yellowDays, orangeDays) : null;
  const openColor = openLevel ? levelColor(openLevel, t, warnColors) : levelColor('soon', t, warnColors);
  const openBg = openLevel ? levelBg(openLevel, t, warnColors) : levelBg('soon', t, warnColors);

  const showMacros = hasMacros(food);
  const unsat = unsaturatedFat(food);

  const doCopy = async () => {
    const ok = await copyMacros({ ...food, name: item.name });
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1600); }
  };

  const section = { marginTop: 18 };
  const secLabel = { fontSize: 11.5, fontWeight: 700, color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 };

  const footer = (
    <div style={{ display: 'flex', gap: 10 }}>
      <button
        onClick={() => onRemove(item.id)}
        style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, padding: '14px 18px', borderRadius: 14,
          border: `1.5px solid ${t.dangerBorder}`, background: t.dangerBg, color: t.danger, fontWeight: 700, fontSize: 14.5, cursor: 'pointer',
        }}
      >
        <Trash2 size={17} /> Entfernen
      </button>
      <button onClick={() => onEdit(item)} style={{ ...primaryButtonStyle(t), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Pencil size={17} /> Bearbeiten
      </button>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} t={t} title={item.name} subtitle={item.category} footer={footer}>
      {/* Lagerort + Menge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
        {zone && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: pal.accentBg, color: pal.accent, fontWeight: 700, fontSize: 13, borderRadius: 999, padding: '6px 12px' }}>
            {zone.emoji} {zone.label}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={() => onChangeQty(item.id, -1)} style={btnCircle(t.cardAlt, t.pillInactiveText, 34)} aria-label="weniger">
          <Minus size={15} strokeWidth={2.5} />
        </button>
        <span style={{ minWidth: 54, textAlign: 'center', fontSize: 16, fontWeight: 800, color: t.text }}>
          {item.unit === 'stk' ? `${item.qty}×` : `${item.qty} ${item.unit}`}
        </span>
        <button onClick={() => onChangeQty(item.id, 1)} style={btnCircle(pal.accentBg, pal.accent, 34)} aria-label="mehr">
          <Plus size={15} strokeWidth={2.5} />
        </button>
      </div>

      {/* Status: MHD + Geöffnet */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {item.mhd && (
          <span style={{ fontSize: 12.5, fontWeight: 700, color: levelColor(mhdLevel, t, warnColors), background: mhdWarn ? levelBg(mhdLevel, t, warnColors) : t.cardAlt, padding: '5px 11px', borderRadius: 8 }}>
            MHD {mhdLabel(rawDays)} ({formatDateDisplay(item.mhd, dateFormat)})
          </span>
        )}
        {item.opened && (
          <span style={{ fontSize: 12.5, fontWeight: 700, color: openColor, background: openBg, padding: '5px 11px', borderRadius: 8 }}>
            Geöffnet{openDays != null ? ` · ${openDays < 0 ? `${Math.abs(openDays)}T überfällig` : openDays === 0 ? 'heute' : openDays === 1 ? 'morgen' : `noch ${openDays}T`}` : ''}
          </span>
        )}
      </div>

      {/* MHD direkt ändern – ohne ins Bearbeiten zu wechseln */}
      {onChangeMhd && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <span style={{ fontSize: 13, color: t.textMuted, flexShrink: 0 }}>MHD ändern</span>
          <ClearableInput
            t={t}
            type="date"
            value={item.mhd || ''}
            onChange={(v) => onChangeMhd(item.id, v)}
            style={{ ...inputStyle, marginTop: 0 }}
            wrapperStyle={{ flex: 1, minWidth: 0 }}
          />
        </div>
      )}

      {/* Schnell als geöffnet markieren – ohne ins Bearbeiten zu wechseln */}
      {onToggleOpened && (
        <button
          type="button"
          onClick={() => onToggleOpened(item.id)}
          aria-pressed={!!item.opened}
          style={{
            marginTop: 10, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '11px 14px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 14,
            border: `1.5px solid ${item.opened ? t.warning : t.border}`,
            background: item.opened ? t.warningBg : 'transparent',
            color: item.opened ? t.warning : t.textMuted,
          }}
        >
          <PackageOpen size={17} /> {item.opened ? 'Als ungeöffnet markieren' : 'Als geöffnet markieren'}
        </button>
      )}

      {/* Nährwerte */}
      {showMacros && (
        <div style={section}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ ...secLabel, marginBottom: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Utensils size={13} /> Nährwerte · {basisLabel(food)}
            </span>
            <button
              type="button"
              onClick={doCopy}
              style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1.5px solid ${t.border}`, background: 'transparent', color: copied ? t.success : t.textMuted, fontWeight: 700, fontSize: 12.5, borderRadius: 10, padding: '7px 12px', cursor: 'pointer' }}
            >
              {copied ? <Check size={15} /> : <Copy size={14} />} {copied ? 'Kopiert' : 'Kopieren'}
            </button>
          </div>
          <div style={{ background: t.cardAlt, borderRadius: 12, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {MACRO_FIELDS.map((f) => {
              const rows = [];
              if (food[f.key] != null && food[f.key] !== '') {
                rows.push(
                  <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                    <span style={{ color: f.indent ? t.textFaint : t.text, fontStyle: f.indent ? 'italic' : 'normal', paddingLeft: f.indent ? 12 : 0 }}>
                      {f.indent ? '– ' : ''}{f.label}
                    </span>
                    <span style={{ fontWeight: 700, color: t.text, fontVariantNumeric: 'tabular-nums' }}>{fmtNum(food[f.key])} {f.unit}</span>
                  </div>,
                );
              }
              if (f.key === 'satFat' && unsat != null) {
                rows.push(
                  <div key="unsat" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                    <span style={{ color: t.textFaint, fontStyle: 'italic', paddingLeft: 12 }}>– davon ungesättigt</span>
                    <span style={{ fontWeight: 700, color: t.textFaint, fontVariantNumeric: 'tabular-nums' }}>{fmtNum(unsat)} g</span>
                  </div>,
                );
              }
              return rows;
            })}
          </div>
        </div>
      )}

      {/* Zutaten */}
      {food && food.ingredients && String(food.ingredients).trim() && (
        <div style={section}>
          <div style={{ ...secLabel, display: 'inline-flex', alignItems: 'center', gap: 6 }}><List size={13} /> Zutaten</div>
          <div style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.5, background: t.cardAlt, borderRadius: 12, padding: '10px 14px' }}>
            {food.ingredients}
          </div>
        </div>
      )}

      {/* Haltbarkeit */}
      <div style={section}>
        <div style={secLabel}>Haltbarkeit nach dem Öffnen</div>
        <ShelfLifeDetails name={item.name} food={food} zone={zone} t={t} />
      </div>
    </Modal>
  );
}
