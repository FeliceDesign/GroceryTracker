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

// Kleine Überschrift, die eine Gruppe von Inhalten einleitet - Tages-Gruppen
// in der Historie, Kategorien in der Bestandsliste, Unterabschnitte im
// Artikel-Detail/Gewürz-/Haltbarkeits-Ratgeber. Anders als sectionLabelStyle
// (Navigations-Abschnitte in den Einstellungs-Sheets, kräftiger/größer) - war
// vorher an jeder Stelle leicht anders (Schriftgröße 10–12, Farbe textFaint/
// textMuted, Laufweite 0.03–0.06em), jetzt eine gemeinsame Basis. Abstände
// bleiben bewusst Sache der Aufrufstelle (per Objekt-Spread überschreibbar),
// da die Einbettung sich je nach Kontext unterscheidet.
export function groupLabelStyle(t) {
  return {
    fontSize: 11,
    fontWeight: 700,
    color: t.textFaint,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
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

// Abschnitts-Überschrift innerhalb der Einstellungs-Sheets ("DARSTELLUNG",
// "HAUPTLISTE", …). `marginTop` ist einstellbar, weil der erste Abschnitt
// eines Sheets direkt oben anschließt, die folgenden mehr Luft brauchen.
export function sectionLabelStyle(t, marginTop = 30) {
  return {
    fontSize: 12,
    fontWeight: 800,
    color: t.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    margin: `${marginTop}px 2px 10px`,
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
