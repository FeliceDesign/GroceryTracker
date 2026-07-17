// Geteilte Stil-Helfer. Bewusst als Funktionen, die das Theme entgegennehmen,
// damit Farben immer aus dem zentralen Theme kommen (siehe lib/theme.js).

export function btnCircle(bg, color, size = 32) {
  return {
    width: size,
    height: size,
    borderRadius: '50%',
    border: 'none',
    background: bg,
    color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    padding: 0,
  };
}

export function pillStyle(active, t) {
  return {
    flex: 1,
    padding: '10px 8px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13.5,
    fontWeight: 700,
    background: active ? t.pillActive : t.pillInactive,
    color: active ? t.pillActiveText : t.pillInactiveText,
    transition: 'background 0.15s ease',
  };
}

export function makeInputStyle(t) {
  return {
    width: '100%',
    marginTop: 6,
    padding: '12px 14px',
    borderRadius: 12,
    border: `1px solid ${t.border}`,
    background: t.inputBg,
    color: t.text,
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
  };
}

export function makeLabelStyle(t) {
  return {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: t.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginTop: 16,
  };
}

export function makeModalHeaderStyle() {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  };
}

export function primaryButtonStyle(t) {
  return {
    flex: 1,
    padding: '14px 16px',
    borderRadius: 14,
    border: 'none',
    background: t.btnPrimary,
    color: t.btnPrimaryText,
    fontSize: 15.5,
    fontWeight: 700,
    cursor: 'pointer',
  };
}
