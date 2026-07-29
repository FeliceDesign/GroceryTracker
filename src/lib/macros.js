// Makros / Nährwerte als Stammdaten pro Lebensmittel.
//
// Ein „Food"-Datensatz beschreibt die Nährwerte eines Lebensmittels bezogen
// auf eine Bezugsgröße (pro 100 g / 100 ml / Portion) und ist über den
// normalisierten Namen mit den Bestands-Artikeln verknüpft. So bleiben die
// Werte erhalten, auch wenn ein Artikel aufgebraucht/gelöscht wird.
import { tr } from './i18n.js';

// Reihenfolge = Anzeige-/Kopier-Reihenfolge. `indent` markiert „davon"-Zeilen.
// `label`/`tableLabel` bleiben Deutsch als interner Fallback/Schlüssel für
// formatMacroTable() (Klartext-Export); die UI übersetzt über macros.<key>.
export const MACRO_FIELDS = [
  { key: 'kcal', label: 'Kalorien', unit: 'kcal', decimals: 0 },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Kohlenhydrate', unit: 'g' },
  { key: 'sugar', label: 'davon Zucker', unit: 'g', indent: true },
  { key: 'fiber', label: 'Ballaststoffe', unit: 'g' },
  { key: 'fat', label: 'Fett', unit: 'g' },
  { key: 'satFat', label: 'davon gesättigte', tableLabel: 'davon gesättigt', unit: 'g', indent: true },
  { key: 'salt', label: 'Salz', unit: 'g' },
];

export function basisOptions(lang = 'de') {
  return [
    { value: '100g', label: tr(lang, 'macros.basis100g') },
    { value: '100ml', label: tr(lang, 'macros.basis100ml') },
    { value: 'portion', label: tr(lang, 'macros.basisPortion') },
  ];
}

// Normalisierter Schlüssel: kleingeschrieben, getrimmt, Mehrfach-Leerzeichen
// zusammengefasst. Verknüpft Artikel-Name <-> Stammdaten-Datensatz.
export function normalizeName(name) {
  return (name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function defaultBasisForUnit(unit) {
  return unit === 'ml' ? '100ml' : '100g';
}

// Zahl in deutscher Schreibweise (Komma), ohne unnötige Nachkommastellen.
export function fmtNum(n) {
  if (n == null || n === '' || !Number.isFinite(Number(n))) return '';
  const num = Math.round(Number(n) * 100) / 100;
  return String(num).replace('.', ',');
}

export function basisLabel(food, lang = 'de') {
  if (!food) return '';
  if (food.basis === '100ml') return tr(lang, 'macros.per100ml');
  if (food.basis === 'portion') {
    return food.portionSize ? tr(lang, 'macros.perPortionSize', { size: fmtNum(food.portionSize) }) : tr(lang, 'macros.perPortion');
  }
  return tr(lang, 'macros.per100g');
}

// Leerer Bearbeitungs-Entwurf.
export function emptyMacros(basis = '100g') {
  const m = { basis, portionSize: null, ingredients: '', openedDays: null, stepGml: null };
  MACRO_FIELDS.forEach((f) => { m[f.key] = null; });
  return m;
}

// Gespeicherter Datensatz -> Entwurf (für den Editor).
export function foodToMacros(food, fallbackBasis = '100g') {
  const m = emptyMacros(food?.basis || fallbackBasis);
  if (!food) return m;
  m.portionSize = food.portionSize ?? null;
  m.ingredients = food.ingredients || '';
  m.openedDays = food.openedDays ?? null;
  m.stepGml = food.stepGml ?? null;
  MACRO_FIELDS.forEach((f) => { m[f.key] = food[f.key] ?? null; });
  return m;
}

// Entwurf + Name -> speicherbarer Datensatz.
export function macrosToFood(m, name) {
  const food = {
    name: (name || '').trim(),
    basis: (m && m.basis) || '100g',
    portionSize: (m && m.portionSize) ?? null,
    ingredients: (m && m.ingredients ? String(m.ingredients).trim() : ''),
    openedDays: (m && m.openedDays != null && m.openedDays !== '') ? Number(m.openedDays) : null,
    stepGml: (m && m.stepGml != null && m.stepGml !== '') ? Number(m.stepGml) : null,
  };
  MACRO_FIELDS.forEach((f) => { food[f.key] = (m && m[f.key] != null) ? m[f.key] : null; });
  return food;
}

// Erkannte Scan-Werte in einen Entwurf mischen (nur gefundene Felder
// überschreiben, Bezugsgröße nur wenn erkannt).
export function mergeScanned(draft, facts) {
  const next = { ...(draft || emptyMacros()) };
  if (facts && facts.basis) next.basis = facts.basis;
  MACRO_FIELDS.forEach((f) => {
    if (facts && facts[f.key] != null) next[f.key] = facts[f.key];
  });
  return next;
}

export function hasMacros(m) {
  if (!m) return false;
  return MACRO_FIELDS.some((f) => m[f.key] != null && m[f.key] !== '');
}

// Enthält der Datensatz überhaupt Nutzdaten (Nährwerte, Zutaten oder eine
// eigene Öffnungs-Haltbarkeit)?
export function hasFoodData(m) {
  return hasMacros(m)
    || !!(m && m.ingredients && String(m.ingredients).trim())
    || !!(m && m.openedDays != null && m.openedDays !== '');
}

// Abgeleiteter Wert (nicht gespeichert): ungesättigte Fettsäuren = Fett −
// gesättigt. Nur wenn beide Werte vorliegen und das Ergebnis ≥ 0 ist.
export function unsaturatedFat(m) {
  if (!m || m.fat == null || m.satFat == null) return null;
  const v = Math.round((Number(m.fat) - Number(m.satFat)) * 100) / 100;
  return v >= 0 ? v : null;
}

// Kompakte Zusammenfassung für Listen (z.B. „64 kcal · 3,4 g EW · …").
const SUMMARY_ABBR = {
  de: { protein: 'P', carbs: 'KH', fat: 'F' },
  en: { protein: 'P', carbs: 'C', fat: 'F' },
};

export function macroSummary(food, lang = 'de') {
  if (!food) return '';
  const abbr = SUMMARY_ABBR[lang] || SUMMARY_ABBR.de;
  const parts = [];
  if (food.kcal != null) parts.push(`${fmtNum(food.kcal)} kcal`);
  if (food.protein != null) parts.push(`${fmtNum(food.protein)} g ${abbr.protein}`);
  if (food.carbs != null) parts.push(`${fmtNum(food.carbs)} g ${abbr.carbs}`);
  if (food.fat != null) parts.push(`${fmtNum(food.fat)} g ${abbr.fat}`);
  return parts.join(' · ');
}

// Mehrzeilige Nährwerttabelle zum Kopieren, z.B.:
// "Brokkoli - pro 100g\nKalorien: 39kcal\nFett: 0,9g\n  davon gesättigte
// Fettsäuren: 0,2g\n…". „Davon"-Zeilen mit zwei Leerzeichen eingerückt.
export function formatMacroTable(food, lang = 'de') {
  const name = (food.name || '').trim();
  const rows = [];
  MACRO_FIELDS.forEach((f) => {
    if (food[f.key] != null && food[f.key] !== '') {
      const label = f.key === 'satFat' ? tr(lang, 'macros.satFatTable') : tr(lang, `macros.${f.key}`);
      rows.push(`${f.indent ? '  ' : ''}${label}: ${fmtNum(food[f.key])}${f.unit}`);
    }
    // Abgeleitete „davon ungesättigt"-Zeile direkt hinter „davon gesättigt".
    if (f.key === 'satFat') {
      const u = unsaturatedFat(food);
      if (u != null) rows.push(`  ${tr(lang, 'macros.unsaturated')}: ${fmtNum(u)}g`);
    }
  });
  const basis = basisLabel(food, lang).replace(/(\d)\s(g|ml)\b/, '$1$2');
  const header = `${name} - ${basis}`;
  if (rows.length === 0) return header;
  return `${header}\n${rows.join('\n')}`;
}

// Text in die Zwischenablage. navigator.clipboard bevorzugt, sonst
// Textarea-Fallback (funktioniert auch in der Android-WebView).
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback unten versuchen
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export async function copyMacros(food, lang = 'de') {
  return copyToClipboard(formatMacroTable(food, lang));
}
