import { useEffect, useState } from 'react';
import { Plus, Minus, Trash2, Pencil, Copy, Check, Utensils, List, PackageOpen, Star, ChevronDown, ChevronRight } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { ClearableInput } from '../../components/ClearableInput.jsx';
import { ShelfLifeDetails } from '../macros/ShelfLifeDetails.jsx';
import { UnopenedShelfLifeDetails } from '../macros/UnopenedShelfLifeDetails.jsx';
import { FrozenShelfLifeDetails } from '../macros/FrozenShelfLifeDetails.jsx';
import { ThawingDetails } from '../macros/ThawingDetails.jsx';
import { ProduceStorageDetails } from '../macros/ProduceStorageDetails.jsx';
import { zonePalette } from '../../lib/colors.js';
import { daysUntil, expiryLevel, levelColor, levelBg, mhdLabel, formatDateDisplay } from '../../lib/date.js';
import { MACRO_FIELDS, fmtNum, unsaturatedFat, hasMacros, basisLabel, copyMacros, copyToClipboard } from '../../lib/macros.js';
import { groupLabelStyle } from '../../lib/styles.js';
import { openedDaysFor, openedUntil, shelfLifeInfo } from '../../lib/openedShelfLife.js';
import { unopenedInfo } from '../../lib/unopenedShelfLife.js';
import { frozenInfo } from '../../lib/frozenShelfLife.js';
import { thawInfo } from '../../lib/thawing.js';
import { btnCircle, primaryButtonStyle, makeInputStyle, pillStyle } from '../../lib/styles.js';
import { tr } from '../../lib/i18n.js';

const SHELF_TABS = (lang) => [
  { id: 'opened', label: tr(lang, 'detail.tabOpened') },
  { id: 'unopened', label: tr(lang, 'detail.tabUnopened') },
  { id: 'frozen', label: tr(lang, 'detail.tabFrozen') },
  { id: 'thawing', label: tr(lang, 'detail.tabThawing') },
];

// Schreibgeschützte Detail-Ansicht eines Artikels (Nährwerte, Zutaten,
// Haltbarkeit). „Bearbeiten" öffnet das Formular. `warnColors` optional:
// { soon, critical, expired } – eigene Farben aus den Einstellungen.
const NO_WARN_COLORS = {};

export function DetailItemSheet({
  open, item, zone, food, t, dark, lang = 'de', yellowDays = 3, orangeDays = 1, warnColors = NO_WARN_COLORS, dateFormat = 'dmy',
  isFavorite = false, onToggleFavorite, showSlider = true, stepGml,
  onClose, onEdit, onChangeQty, onSetQty, onRemove, onToggleOpened, onChangeMhd, onMacrosCopied,
}) {
  const [copied, setCopied] = useState(false);
  const [copiedIng, setCopiedIng] = useState(false);
  const [shelfTab, setShelfTab] = useState('opened');
  // Standardmäßig eingeklappt, wenn in keinem der drei Tabs überhaupt Daten
  // vorliegen (Regel-Treffer oder eigener Override).
  const shelfLifeHasData = !!item && (
    openedDaysFor(item.name, food) != null
    || shelfLifeInfo(item.name) != null
    || unopenedInfo(item.name) != null
    || frozenInfo(item.name) != null
    || thawInfo(item.name) != null
  );
  const [shelfSectionOpen, setShelfSectionOpen] = useState(shelfLifeHasData);
  // Sheet bleibt beim Schließen gemountet (nur `return null` unten) - der
  // useState-Default würde sonst nur beim allerersten Öffnen greifen. Bei
  // jedem neuen Artikel den Auf/Zu-Zustand frisch aus den Daten ableiten.
  useEffect(() => {
    if (open) setShelfSectionOpen(shelfLifeHasData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id]);
  if (!open || !item) return null;
  const inputStyle = makeInputStyle(t);
  const shelfTabs = SHELF_TABS(lang);

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
  const remLabel = openDays == null ? '' : openDays < 0 ? tr(lang, 'detail.overdue', { n: Math.abs(openDays) }) : openDays === 0 ? tr(lang, 'detail.today') : openDays === 1 ? tr(lang, 'detail.tomorrow') : tr(lang, 'detail.remaining', { n: openDays });

  const showMacros = hasMacros(food);
  const unsat = unsaturatedFat(food);

  // Schieberegler für g/ml-Artikel (Artikel-eigener Override geht vor der
  // globalen Einstellung, gleiches Muster wie in Anlegen/Bearbeiten).
  const effectiveStepGml = food?.stepGml != null ? food.stepGml : stepGml;
  const qtyStep = effectiveStepGml && effectiveStepGml !== 'auto' ? Number(effectiveStepGml) : 10;
  const sliderMax = 1000;

  const doCopy = async () => {
    const merged = { ...food, name: item.name };
    const ok = await copyMacros(merged, lang);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1600); onMacrosCopied?.(merged); }
  };

  const doCopyIngredients = async () => {
    const ok = await copyToClipboard(String(food?.ingredients || '').trim());
    if (ok) { setCopiedIng(true); setTimeout(() => setCopiedIng(false), 1600); }
  };

  const section = { marginTop: 18 };
  const secLabel = { ...groupLabelStyle(t), marginBottom: 8 };

  const footer = (
    <div style={{ display: 'flex', gap: 10 }}>
      <button
        onClick={() => onRemove(item.id)}
        style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, padding: '14px 18px', borderRadius: 14,
          border: `1.5px solid ${t.dangerBorder}`, background: t.dangerBg, color: t.danger, fontWeight: 700, fontSize: 14.5, cursor: 'pointer',
        }}
      >
        <Trash2 size={17} /> {tr(lang, 'detail.remove')}
      </button>
      <button onClick={() => onEdit(item)} style={{ ...primaryButtonStyle(t), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Pencil size={17} /> {tr(lang, 'detail.edit')}
      </button>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} t={t} lang={lang} title={item.name} subtitle={item.category} footer={footer}>
      {/* Lagerort + Menge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
        {zone && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: pal.accentBg, color: pal.accent, fontWeight: 700, fontSize: 13, borderRadius: 999, padding: '6px 12px' }}>
            {zone.emoji} {zone.label}
          </span>
        )}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
            aria-label={tr(lang, isFavorite ? 'detail.unfavoriteAria' : 'detail.favoriteAria')}
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: isFavorite ? t.warningBg : t.cardAlt, color: isFavorite ? t.warning : t.textFaint,
            }}
          >
            <Star size={17} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={() => onChangeQty(item.id, -1)} style={btnCircle(t.cardAlt, t.pillInactiveText, 36)} aria-label={tr(lang, 'detail.fewerAria')}>
          <Minus size={15} strokeWidth={2.5} />
        </button>
        <span style={{ minWidth: 54, textAlign: 'center', fontSize: 16, fontWeight: 800, color: t.text }}>
          {item.unit === 'stk' ? `${item.qty}×` : `${item.qty} ${item.unit}`}
        </span>
        <button onClick={() => onChangeQty(item.id, 1)} style={btnCircle(pal.accentBg, pal.accent, 36)} aria-label={tr(lang, 'detail.moreAria')}>
          <Plus size={15} strokeWidth={2.5} />
        </button>
      </div>

      {item.unit !== 'stk' && showSlider !== false && onSetQty && (
        <input
          type="range"
          min={0}
          max={sliderMax}
          step={qtyStep}
          value={Math.min(item.qty, sliderMax)}
          onChange={(e) => onSetQty(item.id, Math.max(0, parseInt(e.target.value, 10) || 0))}
          aria-label={tr(lang, 'edit.sliderAria')}
          style={{ width: '100%', marginTop: 12, accentColor: pal.accent }}
        />
      )}

      {/* Status: MHD + Geöffnet */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {item.mhd && (
          <span style={{ fontSize: 12.5, fontWeight: 700, color: levelColor(mhdLevel, t, warnColors), background: mhdWarn ? levelBg(mhdLevel, t, warnColors) : t.cardAlt, padding: '5px 11px', borderRadius: 8 }}>
            {tr(lang, 'itemRow.mhdPrefix')} {mhdLabel(rawDays, lang)} ({formatDateDisplay(item.mhd, dateFormat)})
          </span>
        )}
        {item.opened && (
          <span style={{ fontSize: 12.5, fontWeight: 700, color: openColor, background: openBg, padding: '5px 11px', borderRadius: 8 }}>
            {openDays != null ? tr(lang, 'itemRow.openedWith', { rem: remLabel }) : tr(lang, 'itemRow.opened')}
          </span>
        )}
      </div>

      {/* MHD direkt ändern – ohne ins Bearbeiten zu wechseln */}
      {onChangeMhd && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <span style={{ fontSize: 13, color: t.textMuted, flexShrink: 0 }}>{tr(lang, 'detail.changeMhd')}</span>
          <ClearableInput
            t={t}
            lang={lang}
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
          <PackageOpen size={17} /> {item.opened ? tr(lang, 'detail.markUnopened') : tr(lang, 'detail.markOpened')}
        </button>
      )}

      {/* Nährwerte */}
      {showMacros && (
        <div style={section}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ ...secLabel, marginBottom: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Utensils size={13} /> {tr(lang, 'detail.macros')} · {basisLabel(food, lang)}
            </span>
            <button
              type="button"
              onClick={doCopy}
              style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1.5px solid ${t.border}`, background: 'transparent', color: copied ? t.success : t.textMuted, fontWeight: 700, fontSize: 12.5, borderRadius: 10, padding: '7px 12px', cursor: 'pointer' }}
            >
              {copied ? <Check size={15} /> : <Copy size={14} />} {copied ? tr(lang, 'common.copied') : tr(lang, 'common.copy')}
            </button>
          </div>
          <div style={{ background: t.cardAlt, borderRadius: 12, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {MACRO_FIELDS.map((f) => {
              const rows = [];
              if (food[f.key] != null && food[f.key] !== '') {
                rows.push(
                  <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                    <span style={{ color: f.indent ? t.textFaint : t.text, fontStyle: f.indent ? 'italic' : 'normal', paddingLeft: f.indent ? 12 : 0 }}>
                      {f.indent ? '– ' : ''}{tr(lang, `macros.${f.key === 'satFat' ? 'satFat' : f.key}`)}
                    </span>
                    <span style={{ fontWeight: 700, color: t.text, fontVariantNumeric: 'tabular-nums' }}>{fmtNum(food[f.key])} {f.unit}</span>
                  </div>,
                );
              }
              if (f.key === 'satFat' && unsat != null) {
                rows.push(
                  <div key="unsat" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                    <span style={{ color: t.textFaint, fontStyle: 'italic', paddingLeft: 12 }}>{tr(lang, 'detail.unsaturated')}</span>
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
          <div style={{ ...secLabel, display: 'inline-flex', alignItems: 'center', gap: 6 }}><List size={13} /> {tr(lang, 'detail.ingredients')}</div>
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.5, background: t.cardAlt, borderRadius: 12, padding: '10px 42px 10px 14px' }}>
              {food.ingredients}
            </div>
            <button
              type="button"
              onClick={doCopyIngredients}
              aria-label={tr(lang, 'macroEditor.copyIngredients')}
              title={tr(lang, 'macroEditor.copyIngredients')}
              style={{
                position: 'absolute', right: 8, top: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${t.border}`,
                background: t.card, color: copiedIng ? t.success : t.textMuted, cursor: 'pointer',
              }}
            >
              {copiedIng ? <Check size={14} /> : <Copy size={13} />}
            </button>
          </div>
        </div>
      )}

      {/* Obst-&-Gemüse-Lagerhinweise – nur bei passender Kategorie und
          vorhandenem Regel-Treffer (die Komponente rendert sonst nichts). */}
      {(item.category === 'Obst' || item.category === 'Gemüse') && (
        <div style={section}>
          <div style={secLabel}>{tr(lang, 'detail.produceStorage')}</div>
          <ProduceStorageDetails name={item.name} zone={zone} t={t} lang={lang} />
        </div>
      )}

      {/* Haltbarkeit: Geöffnet / Ungeöffnet / Tiefgefroren – ein-/ausklappbar,
          standardmäßig eingeklappt, wenn nirgends Daten vorliegen. */}
      <div style={section}>
        <button
          type="button"
          onClick={() => setShelfSectionOpen((v) => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
            marginBottom: shelfSectionOpen ? 8 : 0,
          }}
        >
          <span style={{ ...secLabel, marginBottom: 0 }}>{tr(lang, 'detail.shelfLife')}</span>
          {shelfSectionOpen ? <ChevronDown size={16} color={t.textFaint} /> : <ChevronRight size={16} color={t.textFaint} />}
        </button>
        {shelfSectionOpen && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {shelfTabs.map((tab) => (
                <button key={tab.id} type="button" onClick={() => setShelfTab(tab.id)} style={pillStyle(shelfTab === tab.id, t)}>
                  {tab.label}
                </button>
              ))}
            </div>
            {shelfTab === 'opened' && <ShelfLifeDetails name={item.name} food={food} zone={zone} t={t} lang={lang} />}
            {shelfTab === 'unopened' && <UnopenedShelfLifeDetails name={item.name} t={t} lang={lang} />}
            {shelfTab === 'frozen' && <FrozenShelfLifeDetails name={item.name} t={t} lang={lang} />}
            {shelfTab === 'thawing' && <ThawingDetails name={item.name} t={t} lang={lang} />}
          </>
        )}
      </div>
    </Modal>
  );
}
