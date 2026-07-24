import { useRef } from 'react';
import { Check, SunMoon, Plus, X } from 'lucide-react';
import { tr } from '../lib/i18n.js';

// Reihe anklickbarer Farbkreise zur Auswahl aus einer festen Palette
// (Lagerorte, MHD-Warnstufen, …). `choices` ist ein Array von Hex-Werten.
// `allowAuto` (+ `t` fürs Theme) blendet vorne einen zusätzlichen Kreis ein,
// der `value === null` repräsentiert ("keine eigene Farbe, Theme-Standard").
// `customChoices` (+ `onAddCustom`/`onRemoveCustom`) ergänzt die feste
// Palette um vom Nutzer selbst hinzugefügte Farben: ein "+"-Kreis öffnet den
// nativen Farbwähler (`input[type=color]`), eigene Farben tragen zusätzlich
// ein kleines "x" zum Entfernen (die feste Palette bleibt unantastbar).
export function ColorSwatches({ choices, customChoices = [], value, onChange, allowAuto, onAddCustom, onRemoveCustom, t, lang = 'de' }) {
  const colorInputRef = useRef(null);

  return (
    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
      {allowAuto && (
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={tr(lang, 'colorSwatches.auto')}
          aria-pressed={value == null}
          style={{
            width: 26, height: 26, borderRadius: '50%', cursor: 'pointer',
            background: t ? t.cardAlt : '#e5e5e5',
            border: value == null ? `3px solid ${t ? t.textMuted : '#888'}` : '3px solid transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <SunMoon size={13} color={t ? t.textMuted : '#888'} />
        </button>
      )}

      {choices.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={tr(lang, 'colorSwatches.colorAria', { hex: c })}
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

      {customChoices.map((c) => (
        <div key={c} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => onChange(c)}
            aria-label={tr(lang, 'colorSwatches.customColorAria', { hex: c })}
            style={{
              width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer',
              border: value === c ? '3px solid rgba(255,255,255,0.9)' : '3px solid transparent',
              boxShadow: value === c ? `0 0 0 2px ${c}` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {value === c && <Check size={13} color="#fff" strokeWidth={3} />}
          </button>
          {onRemoveCustom && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemoveCustom(c); }}
              aria-label={tr(lang, 'colorSwatches.removeCustomAria', { hex: c })}
              style={{
                position: 'absolute', top: -5, right: -5, width: 15, height: 15, borderRadius: '50%', padding: 0,
                border: `1.5px solid ${t ? t.card : '#fff'}`, background: t ? t.textFaint : '#999',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              <X size={9} color="#fff" strokeWidth={3} />
            </button>
          )}
        </div>
      ))}

      {onAddCustom && (
        <>
          <button
            type="button"
            onClick={() => colorInputRef.current && colorInputRef.current.click()}
            aria-label={tr(lang, 'colorSwatches.addCustomAria')}
            style={{
              width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', padding: 0,
              border: `1.5px dashed ${t ? t.border : '#aaa'}`, background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Plus size={13} color={t ? t.textMuted : '#888'} />
          </button>
          <input
            ref={colorInputRef}
            type="color"
            onChange={(e) => onAddCustom(e.target.value)}
            style={{ width: 0, height: 0, opacity: 0, position: 'absolute', pointerEvents: 'none' }}
            tabIndex={-1}
            aria-hidden="true"
          />
        </>
      )}
    </div>
  );
}
