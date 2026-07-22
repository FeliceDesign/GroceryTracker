// Makros / Nährwerte als Stammdaten pro Lebensmittel.
//
// Ein „Food"-Datensatz beschreibt die Nährwerte eines Lebensmittels bezogen
// auf eine Bezugsgröße (pro 100 g / 100 ml / Portion) und ist über den
// normalisierten Namen mit den Bestands-Artikeln verknüpft. So bleiben die
// Werte erhalten, auch wenn ein Artikel aufgebraucht/gelöscht wird.

// Reihenfolge = Anzeige-/Kopier-Reihenfolge. `indent` markiert „davon"-Zeilen.
export const MACRO_FIELDS = [
  { key: 'kcal', label: 'Energie', unit: 'kcal', decimals: 0 },
  { key: 'protein', label: 'Eiweiß', unit: 'g' },
  { key: 'carbs', label: 'Kohlenhydrate', unit: 'g' },
  { key: 'sugar', label: 'davon Zucker', unit: 'g', indent: true },
  { key: 'fat', label: 'Fett', unit: 'g' },
  { key: 'satFat', label: 'davon gesättigte', tableLabel: 'davon gesättigt', unit: 'g', indent: true },
  { key: 'fiber', label: 'Ballaststoffe', unit: 'g' },
  { key: 'salt', label: 'Salz', unit: 'g' },
];

export const BASIS_OPTIONS = [
  { value: '100g', label: '100 g' },
  { value: '100ml', label: '100 ml' },
  { value: 'portion', label: 'Portion' },
];

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

export function basisLabel(food) {
  if (!food) return '';
  if (food.basis === '100ml') return 'pro 100 ml';
  if (food.basis === 'portion') {
    return food.portionSize ? `pro Portion (${fmtNum(food.portionSize)} g)` : 'pro Portion';
  }
  return 'pro 100 g';
}

// Leerer Bearbeitungs-Entwurf.
export function emptyMacros(basis = '100g') {
  const m = { basis, portionSize: null };
  MACRO_FIELDS.forEach((f) => { m[f.key] = null; });
  return m;
}

// Gespeicherter Datensatz -> Entwurf (für den Editor).
export function foodToMacros(food, fallbackBasis = '100g') {
  const m = emptyMacros(food?.basis || fallbackBasis);
  if (!food) return m;
  m.portionSize = food.portionSize ?? null;
  MACRO_FIELDS.forEach((f) => { m[f.key] = food[f.key] ?? null; });
  return m;
}

// Entwurf + Name -> speicherbarer Datensatz.
export function macrosToFood(m, name) {
  const food = { name: (name || '').trim(), basis: (m && m.basis) || '100g', portionSize: (m && m.portionSize) ?? null };
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

// Kompakte Zusammenfassung für Listen (z.B. „64 kcal · 3,4 g EW · …").
export function macroSummary(food) {
  if (!food) return '';
  const parts = [];
  if (food.kcal != null) parts.push(`${fmtNum(food.kcal)} kcal`);
  if (food.protein != null) parts.push(`${fmtNum(food.protein)} g EW`);
  if (food.carbs != null) parts.push(`${fmtNum(food.carbs)} g KH`);
  if (food.fat != null) parts.push(`${fmtNum(food.fat)} g F`);
  return parts.join(' · ');
}

// Mehrzeilige Nährwerttabelle zum Kopieren (an „:" ausgerichtet).
export function formatMacroTable(food) {
  const name = (food.name || '').trim();
  const rows = MACRO_FIELDS
    .filter((f) => food[f.key] != null && food[f.key] !== '')
    .map((f) => ({
      label: (f.indent ? ' – ' : '') + (f.tableLabel || f.label) + ':',
      value: `${fmtNum(food[f.key])} ${f.unit}`,
    }));
  const header = `${name} — ${basisLabel(food)}`;
  if (rows.length === 0) return header;
  const width = Math.max(...rows.map((r) => r.label.length)) + 2;
  const body = rows.map((r) => r.label.padEnd(width) + r.value).join('\n');
  return `${header}\n${body}`;
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

export async function copyMacros(food) {
  return copyToClipboard(formatMacroTable(food));
}
