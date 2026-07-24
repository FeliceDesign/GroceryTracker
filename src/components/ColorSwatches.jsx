import { Check, SunMoon } from 'lucide-react';

// Reihe anklickbarer Farbkreise zur Auswahl aus einer festen Palette
// (Lagerorte, MHD-Warnstufen, …). `choices` ist ein Array von Hex-Werten.
// `allowAuto` (+ `t` fürs Theme) blendet vorne einen zusätzlichen Kreis ein,
// der `value === null` repräsentiert ("keine eigene Farbe, Theme-Standard").
// Ohne diesen Kreis war bei null kein Kreis markiert, obwohl im Hintergrund
// längst eine Farbe (Theme-Fallback) aktiv war – wirkte wie ein Bug.
export function ColorSwatches({ choices, value, onChange, allowAuto, t }) {
  return (
    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 8 }}>
      {allowAuto && (
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Automatisch (Theme-Standardfarbe)"
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
          aria-label={`Farbe ${c}`}
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
    </div>
  );
}
