import { X } from 'lucide-react';

// Textfeld mit kleinem x-Button am rechten Rand zum Leeren.
// `onChange` bekommt den neuen Wert als String (nicht das Event).
// `wrapperStyle` steuert das Layout (z.B. flex: 1), `style` das Eingabefeld.
export function ClearableInput({ value, onChange, t, style = {}, wrapperStyle = {}, inputRef, disabled, ...rest }) {
  const show = typeof value === 'string' && value.length > 0 && !disabled;
  const basePaddingRight = style.paddingRight != null ? style.paddingRight : 14;
  return (
    <div style={{ position: 'relative', ...wrapperStyle }}>
      <input
        ref={inputRef}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...style, marginTop: 0, width: '100%', paddingRight: show ? 38 : basePaddingRight }}
        {...rest}
      />
      {show && (
        <button
          type="button"
          // preventDefault, damit der Fokus (und ein evtl. onBlur-Speichern) nicht verloren geht
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange('')}
          aria-label="Feld leeren"
          style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            width: 24, height: 24, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: t.cardAlt, color: t.pillInactiveText,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
          }}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
