import { useState } from 'react';
import { Camera, Copy, Check, ClipboardPaste, List, Clock, Eraser, Layers2 } from 'lucide-react';
import {
  MACRO_FIELDS, basisOptions, hasMacros, mergeScanned, copyMacros, copyToClipboard, unsaturatedFat, fmtNum,
} from '../../lib/macros.js';
import { shelfLifeAfterOpening } from '../../lib/openedShelfLife.js';
import { captureNutritionViaPhoto, captureTextViaPhoto } from '../../scan/camera.js';
import { parseNutritionFacts } from '../../scan/nutrition.js';
import { makeInputStyle } from '../../lib/styles.js';
import { tr } from '../../lib/i18n.js';
import { ShelfLifeDetails } from './ShelfLifeDetails.jsx';
import { useAutoGrowTextarea } from '../../hooks/useAutoGrowTextarea.js';

// Bearbeitungsformular für die Stammdaten eines Lebensmittels (Nährwerte +
// Zutaten). `macros` ist der Entwurf (siehe lib/macros.js), `onChange(patch)`
// mischt Änderungen ein. Scannen, Text-Einfügen und Kopieren sind hier
// gekapselt, damit alle Einbindungen gleich funktionieren.
export function MacroEditor({
  name, macros, onChange, t, lang = 'de', scanSupported, accent, globalStepGml,
}) {
  const [busy, setBusy] = useState(false);
  const [ingBusy, setIngBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedIng, setCopiedIng] = useState(false);
  const [showPaste, setShowPaste] = useState(true);
  const [pasteText, setPasteText] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const inputStyle = makeInputStyle(t);
  const showCopy = hasMacros(macros) && (name || '').trim().length > 0;
  const ruleDays = shelfLifeAfterOpening(name);
  const globalStepLabel = globalStepGml && globalStepGml !== 'auto' ? String(globalStepGml) : tr(lang, 'behavior.stepAuto');
  const pasteRef = useAutoGrowTextarea(pasteText);
  const ingredientsRef = useAutoGrowTextarea(macros.ingredients || '');

  const setField = (key, raw) => {
    const v = raw === '' ? null : parseFloat(String(raw).replace(',', '.'));
    onChange({ [key]: raw === '' ? null : (Number.isFinite(v) ? v : null) });
  };

  const scan = async () => {
    setMsg('');
    setBusy(true);
    try {
      const { facts, text } = await captureNutritionViaPhoto();
      if (hasMacros(facts)) {
        onChange(mergeScanned(macros, facts));
        setMsg(tr(lang, 'macroEditor.macrosRecognized'));
      } else if (text && text.trim()) {
        const snippet = text.trim().replace(/\s+/g, ' ').slice(0, 45);
        setMsg(tr(lang, 'macroEditor.macrosNotRecognized', { snippet }));
      } else {
        setMsg(tr(lang, 'macroEditor.noTextRecognized'));
      }
    } catch (e) {
      setMsg(e?.message || tr(lang, 'macroEditor.recognitionFailed'));
    } finally {
      setBusy(false);
    }
  };

  // Eingefügten Nährwerttabellen-Text übernehmen (gleicher Parser wie beim Scan).
  const applyPaste = () => {
    const facts = parseNutritionFacts(pasteText);
    if (hasMacros(facts)) {
      onChange(mergeScanned(macros, facts));
      setMsg(tr(lang, 'macroEditor.pasteApplied'));
      setPasteText('');
      setShowPaste(false);
    } else {
      setMsg(tr(lang, 'macroEditor.pasteFailed'));
    }
  };

  const scanIngredients = async () => {
    setMsg('');
    setIngBusy(true);
    try {
      const { text } = await captureTextViaPhoto();
      const clean = (text || '').replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
      if (clean) {
        onChange({ ingredients: clean });
        setMsg(tr(lang, 'macroEditor.ingredientsRecognized'));
      } else {
        setMsg(tr(lang, 'macroEditor.ingredientsNotRecognized'));
      }
    } catch (e) {
      setMsg(e?.message || tr(lang, 'macroEditor.recognitionFailed'));
    } finally {
      setIngBusy(false);
    }
  };

  const doCopy = async () => {
    const ok = await copyMacros({ name, ...macros }, lang);
    setCopied(ok);
    setMsg(ok ? '' : tr(lang, 'macroEditor.copyFailed'));
    if (ok) setTimeout(() => setCopied(false), 1600);
  };

  const resetValues = () => {
    const patch = {};
    MACRO_FIELDS.forEach((f) => { patch[f.key] = null; });
    onChange(patch);
    setConfirmReset(false);
  };

  const doCopyIngredients = async () => {
    const ok = await copyToClipboard(String(macros.ingredients || '').trim());
    setCopiedIng(ok);
    if (ok) setTimeout(() => setCopiedIng(false), 1600);
  };

  const secondaryBtn = (extra = {}) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    padding: '12px', borderRadius: 12, border: `1.5px solid ${t.border}`,
    background: 'transparent', color: t.textMuted, fontWeight: 700, fontSize: 13.5,
    cursor: 'pointer', whiteSpace: 'nowrap', ...extra,
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, background: t.cardAlt, borderRadius: 12, padding: 4 }}>
        {basisOptions(lang).map((o) => {
          const active = (macros.basis || '100g') === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange({ basis: o.value })}
              style={{
                flex: 1, padding: '9px 6px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700,
                background: active ? t.card : 'transparent',
                color: active ? t.text : t.textMuted,
                boxShadow: active ? t.shadow : 'none',
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {macros.basis === 'portion' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <span style={{ fontSize: 13, color: t.textMuted, flex: 1 }}>{tr(lang, 'macroEditor.portionSize')}</span>
          <input
            type="number"
            inputMode="decimal"
            value={macros.portionSize ?? ''}
            onChange={(e) => onChange({ portionSize: e.target.value === '' ? null : Math.max(0, parseFloat(e.target.value.replace(',', '.')) || 0) })}
            placeholder={tr(lang, 'macroEditor.portionPlaceholder')}
            style={{ ...inputStyle, marginTop: 0, width: 100, textAlign: 'right' }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: t.textMuted, width: 18 }}>g</span>
        </div>
      )}

      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {MACRO_FIELDS.map((f) => {
          const fieldLabel = tr(lang, `macros.${f.key}`);
          const row = (
            <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                flex: 1, fontSize: 13.5, color: f.indent ? t.textFaint : t.text,
                fontWeight: f.indent ? 500 : 600, paddingLeft: f.indent ? 12 : 0,
                fontStyle: f.indent ? 'italic' : 'normal',
              }}>
                {f.indent ? '– ' : ''}{fieldLabel}
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={macros[f.key] ?? ''}
                onChange={(e) => setField(f.key, e.target.value)}
                placeholder="—"
                style={{ ...inputStyle, marginTop: 0, width: 96, textAlign: 'right', padding: '9px 10px' }}
              />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: t.textMuted, width: 30 }}>{f.unit}</span>
            </div>
          );
          // Direkt hinter „davon gesättigte" die berechnete, schreibgeschützte
          // Zeile „davon ungesättigt" (Fett − gesättigt) – immer sichtbar,
          // zeigt „—", solange nicht beide Werte vorliegen. Optisch wie die
          // echten Eingabefelder (nur deaktiviert), für einheitliches Layout.
          if (f.key === 'satFat') {
            const u = unsaturatedFat(macros);
            return [row, (
              <div key="unsat" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ flex: 1, fontSize: 13.5, color: t.textFaint, fontWeight: 500, paddingLeft: 12, fontStyle: 'italic' }}>
                  {tr(lang, 'macroEditor.unsaturated')}
                </span>
                <input
                  type="text"
                  disabled
                  readOnly
                  value={u != null ? fmtNum(u) : '—'}
                  aria-label={tr(lang, 'macros.unsaturated')}
                  style={{ ...inputStyle, marginTop: 0, width: 96, textAlign: 'right', padding: '9px 10px', color: t.textFaint, cursor: 'default' }}
                />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: t.textMuted, width: 30 }}>g</span>
              </div>
            )];
          }
          return row;
        })}
      </div>

      {hasMacros(macros) && !confirmReset && (
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, marginTop: 10,
            border: 'none', background: 'transparent', color: t.textFaint,
            fontWeight: 700, fontSize: 12, cursor: 'pointer', padding: '4px 2px',
          }}
        >
          <Eraser size={13} /> {tr(lang, 'macroEditor.resetValues')}
        </button>
      )}

      {confirmReset && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          marginTop: 10, padding: '10px 12px', borderRadius: 10,
          background: t.dangerBg, border: `1.5px solid ${t.dangerBorder}`,
        }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: t.danger }}>
            {tr(lang, 'macroEditor.confirmReset')}
          </span>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              style={{ border: 'none', background: 'transparent', color: t.textMuted, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', padding: '6px 4px' }}
            >
              {tr(lang, 'common.cancel')}
            </button>
            <button
              type="button"
              onClick={resetValues}
              style={{ border: 'none', background: 'transparent', color: t.danger, fontWeight: 800, fontSize: 12.5, cursor: 'pointer', padding: '6px 4px' }}
            >
              {tr(lang, 'macroEditor.reset')}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${t.border}` }}>
        {scanSupported && (
          <button
            type="button"
            onClick={scan}
            disabled={busy}
            aria-label={busy ? tr(lang, 'macroEditor.reading') : tr(lang, 'macroEditor.scanTable')}
            title={tr(lang, 'macroEditor.scanTable')}
            style={secondaryBtn({ padding: '12px', width: 46, flexShrink: 0, color: accent || t.textMuted, opacity: busy ? 0.6 : 1, cursor: busy ? 'default' : 'pointer' })}
          >
            <Camera size={16} />
          </button>
        )}
        <button type="button" onClick={() => { setShowPaste((v) => !v); setMsg(''); }} style={secondaryBtn({ flex: 1 })}>
          <ClipboardPaste size={16} /> {tr(lang, 'macroEditor.pasteText')}
        </button>
        <button
          type="button"
          onClick={doCopy}
          disabled={!showCopy}
          aria-label={tr(lang, 'macroEditor.copyTable')}
          title={showCopy ? tr(lang, 'macroEditor.copyTable') : tr(lang, 'macroEditor.noCopyTable')}
          style={secondaryBtn({ color: copied ? t.success : t.textMuted, padding: '12px', width: 46, flexShrink: 0, opacity: showCopy ? 1 : 0.4, cursor: showCopy ? 'pointer' : 'default' })}
        >
          {copied ? <Check size={17} /> : <Copy size={16} />}
        </button>
      </div>

      {showPaste && (
        <div style={{ marginTop: 10 }}>
          <textarea
            ref={pasteRef}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={tr(lang, 'macroEditor.pastePlaceholder')}
            rows={5}
            style={{ ...inputStyle, marginTop: 0, resize: 'none', overflow: 'hidden', fontSize: 13 }}
          />
          <button
            type="button"
            onClick={applyPaste}
            disabled={!pasteText.trim()}
            style={{
              width: '100%', marginTop: 8, padding: '11px', borderRadius: 12, border: 'none',
              background: t.btnPrimary, color: t.btnPrimaryText, fontWeight: 700, fontSize: 14,
              cursor: pasteText.trim() ? 'pointer' : 'default', opacity: pasteText.trim() ? 1 : 0.5,
            }}
          >
            {tr(lang, 'macroEditor.applyValues')}
          </button>
        </div>
      )}

      {/* Zutatenliste */}
      <div style={{ marginTop: 18 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: t.text }}>
          <List size={16} /> {tr(lang, 'macroEditor.ingredients')}
        </span>
        <div style={{ position: 'relative', marginTop: 8 }}>
          <textarea
            ref={ingredientsRef}
            value={macros.ingredients || ''}
            onChange={(e) => onChange({ ingredients: e.target.value })}
            placeholder={tr(lang, 'macroEditor.ingredientsPlaceholder')}
            rows={3}
            style={{ ...inputStyle, marginTop: 0, resize: 'none', overflow: 'hidden', fontSize: 13, lineHeight: 1.45, paddingRight: 42 }}
          />
          {scanSupported && (
            <button
              type="button"
              onClick={scanIngredients}
              disabled={ingBusy}
              aria-label={ingBusy ? tr(lang, 'macroEditor.readingIngredients') : tr(lang, 'macroEditor.scanIngredients')}
              title={tr(lang, 'macroEditor.scanIngredients')}
              style={{
                position: 'absolute', right: 8, top: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${t.border}`,
                background: t.card, color: accent || t.textMuted,
                opacity: ingBusy ? 0.6 : 1, cursor: ingBusy ? 'default' : 'pointer',
              }}
            >
              <Camera size={14} />
            </button>
          )}
          {(() => {
            const hasIngredients = !!(macros.ingredients && String(macros.ingredients).trim());
            return (
              <button
                type="button"
                onClick={doCopyIngredients}
                disabled={!hasIngredients}
                aria-label={tr(lang, 'macroEditor.copyIngredients')}
                title={hasIngredients ? tr(lang, 'macroEditor.copyIngredients') : tr(lang, 'macroEditor.noCopyIngredients')}
                style={{
                  position: 'absolute', right: 8, bottom: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${t.border}`,
                  background: t.card, color: copiedIng ? t.success : t.textMuted,
                  opacity: hasIngredients ? 1 : 0.4, cursor: hasIngredients ? 'pointer' : 'default',
                }}
              >
                {copiedIng ? <Check size={14} /> : <Copy size={13} />}
              </button>
            );
          })()}
        </div>
      </div>

      {/* Schrittweite der +/−-Knöpfe (Override der globalen Einstellung) */}
      <div style={{ marginTop: 18 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: t.text }}>
          <Layers2 size={16} /> {tr(lang, 'macroEditor.stepGml')}
        </span>
        <div style={{ fontSize: 11.5, color: t.textFaint, marginTop: 2, marginBottom: 8, lineHeight: 1.35 }}>
          {tr(lang, 'macroEditor.stepGmlHint', { value: globalStepLabel })}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[[null, tr(lang, 'macroEditor.stepDefault')], ['auto', tr(lang, 'behavior.stepAuto')], [5, '5'], [10, '10'], [25, '25'], [50, '50'], [100, '100']].map(([val, lbl]) => {
            const active = (macros.stepGml ?? null) === val;
            return (
              <button
                key={String(val)}
                type="button"
                onClick={() => onChange({ stepGml: val })}
                style={{
                  padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  background: active ? t.pillActive : t.card, color: active ? t.pillActiveText : t.textMuted,
                }}
              >
                {lbl}
              </button>
            );
          })}
        </div>
      </div>

      {/* Haltbarkeit nach dem Öffnen (Override der Regel-Tabelle) */}
      <div style={{ marginTop: 18 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: t.text }}>
          <Clock size={16} /> {tr(lang, 'macroEditor.openedShelfLife')}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <input
            type="number"
            inputMode="numeric"
            value={macros.openedDays ?? ''}
            onChange={(e) => onChange({ openedDays: e.target.value === '' ? null : Math.max(0, parseInt(e.target.value, 10) || 0) })}
            placeholder={ruleDays != null ? tr(lang, 'macroEditor.openedDaysDefault', { n: ruleDays }) : tr(lang, 'macroEditor.openedDaysPlaceholder')}
            style={{ ...inputStyle, marginTop: 0, width: 160, textAlign: 'right' }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: t.textMuted }}>{tr(lang, 'common.days')}</span>
        </div>
        <div style={{ marginTop: 10 }}>
          <ShelfLifeDetails name={name} food={macros} zone={null} t={t} lang={lang} defaultOpen />
        </div>
      </div>

      {msg && (
        <div style={{ fontSize: 12, marginTop: 10, lineHeight: 1.4, color: msg.startsWith('✓') ? t.success : t.textMuted }}>
          {msg}
        </div>
      )}
    </div>
  );
}
