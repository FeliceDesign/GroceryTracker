import { Check } from 'lucide-react';

// Reihe anklickbarer Farbkreise zur Auswahl aus einer festen Palette
// (Lagerorte, MHD-Warnstufen, …). `choices` ist ein Array von Hex-Werten.
export function ColorSwatches({ choices, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 8 }}>
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
