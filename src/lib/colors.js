// Kleine Farb-Helfer, damit eigene Lagerorte gleichwertig zu den Standard-
// Lagerorten aussehen: Aus einer einzigen Basisfarbe leiten wir Akzent,
// Hintergründe und Header-Farbe für Hell- und Dunkelmodus ab.

export function hexToRgb(hex) {
  const clean = String(hex || '').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const int = parseInt(full, 16);
  if (Number.isNaN(int)) return { r: 128, g: 128, b: 128 };
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

export function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function toHex({ r, g, b }) {
  const h = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

// Mischt eine Farbe anteilig (amount 0..1) in Richtung einer Zielfarbe.
function mix(hex, target, amount) {
  const a = hexToRgb(hex);
  const b = target;
  return toHex({
    r: a.r + (b.r - a.r) * amount,
    g: a.g + (b.g - a.g) * amount,
    b: a.b + (b.b - a.b) * amount,
  });
}

export function lighten(hex, amount) {
  return mix(hex, { r: 255, g: 255, b: 255 }, amount);
}

export function darken(hex, amount) {
  return mix(hex, { r: 0, g: 0, b: 0 }, amount);
}

// Ableitung aller Farbrollen eines Lagerorts aus seiner Basisfarbe.
//  accent    – Text-/Icon-Akzent in Listen
//  accentBg  – zarter Flächen-Hintergrund (Badges, aktive Plus-Buttons)
//  headerBg  – große eingefärbte Kopfzeile
export function zonePalette(baseColor, dark) {
  const base = baseColor || '#4A8B6F';
  return {
    accent: dark ? lighten(base, 0.35) : base,
    accentBg: dark ? rgba(base, 0.22) : rgba(base, 0.12),
    headerBg: dark ? darken(base, 0.12) : base,
  };
}

// Auswahlpalette für neue Lagerorte.
export const ZONE_COLOR_CHOICES = [
  '#4A8B6F', // grün
  '#3B7A9E', // blau
  '#9C7A3C', // amber
  '#7A6BA8', // violett
  '#B5556B', // beere
  '#C2703D', // orange
  '#4F8A8B', // petrol
  '#8A6D3B', // ocker
  '#6E7F3B', // olive
  '#9E4B6E', // magenta
];

// Eigene Palette für MHD-Warnstufen – bewusst andere Töne als bei den
// Lagerorten, im Gelb-bis-Rot-Spektrum passend zur Ampel-Logik (Stufe 1,
// Stufe 2/kritisch, Abgelaufen).
export const MHD_COLOR_CHOICES = [
  '#C9A227', // gelb
  '#D98A2B', // orange
  '#C2542F', // rotorange
  '#B23A3A', // rot
  '#8B2E2E', // dunkelrot
  '#9C3B3B', // weinrot
];
