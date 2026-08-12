// Parser für Nährwerttabellen aus OCR-Text (deutsch + englisch).
//
// Liefert ein Objekt { basis, kcal, protein, carbs, sugar, fat, satFat,
// fiber, salt } – Felder, die nicht erkannt wurden, sind null. Der Ablauf ist
// bewusst zeilenbasiert: Nährwerttabellen listen je Nährwert eine Zeile
// „Bezeichnung … Wert Einheit", das ist am robustesten zu treffen.

// Reihenfolge ist wichtig: speziellere „davon"-Zeilen zuerst, damit z.B.
// „davon gesättigte Fettsäuren" nicht fälschlich als „Fett" gewertet wird.
const KEY_PATTERNS = [
  ['satFat', /ges[äa]ttigt|saturat/],
  ['sugar', /zucker|sugar/],
  ['fiber', /ballaststoff|fibre|fiber|faser/],
  ['carbs', /kohlenhydrat|carbohydrat|carbs\b/],
  ['protein', /eiwei|protein/],
  ['fat', /\bfett\b|\bfat\b|lipid/],
  ['salt', /\bsalz\b|\bsalt\b|natrium|sodium/],
  ['kcal', /energie|energy|brennwert|kalorien|calorie/],
];

function matchKey(low) {
  for (const [key, re] of KEY_PATTERNS) {
    if (re.test(low)) return key;
  }
  return null;
}

// Bezugsgröße bestimmen. Bei „100 g" und „100 ml" gewinnt das zuerst
// genannte; sonst Portion, sonst unbekannt (null).
function detectBasis(text) {
  const s = text.toLowerCase();
  const mi = s.search(/100\s*ml/);
  const gi = s.search(/100\s*g/);
  if (mi >= 0 && (gi < 0 || mi < gi)) return '100ml';
  if (gi >= 0) return '100g';
  if (/portion|serving/.test(s)) return 'portion';
  return null;
}

// Erste Zahl (mit optionaler Einheit) aus einer Zeile ziehen.
function extractNumber(str) {
  const m = str.match(/(<\s*)?(\d+(?:[.,]\d+)?)\s*(kj|kcal|mg|µg|mcg|g)?/i);
  if (!m) return null;
  const value = parseFloat(m[2].replace(',', '.'));
  if (!Number.isFinite(value)) return null;
  return { value, unit: (m[3] || '').toLowerCase() };
}

// Energie: kcal bevorzugen, sonst kJ umrechnen (÷ 4,184).
function extractEnergy(low) {
  const kcal = low.match(/(\d+(?:[.,]\d+)?)\s*kcal/);
  if (kcal) return parseFloat(kcal[1].replace(',', '.'));
  const kj = low.match(/(\d+(?:[.,]\d+)?)\s*kj/);
  if (kj) return parseFloat(kj[1].replace(',', '.')) / 4.184;
  const any = low.match(/(\d+(?:[.,]\d+)?)/);
  return any ? parseFloat(any[1].replace(',', '.')) : null;
}

function roundFor(key, v) {
  return key === 'kcal' ? Math.round(v) : Math.round(v * 100) / 100;
}

// „100 g"/„100 ml" entfernen, damit die Bezugsangabe nicht als Wert zählt.
function stripRef(low) {
  return low.replace(/100\s*(g|ml)/g, ' ');
}

function hasDigit(low) {
  return /\d/.test(stripRef(low));
}

export function parseNutritionFacts(rawText) {
  const facts = {
    basis: null, kcal: null, protein: null, carbs: null,
    sugar: null, fat: null, satFat: null, fiber: null, salt: null,
  };
  const text = (rawText || '').replace(/\r/g, '');
  if (!text.trim()) return facts;

  facts.basis = detectBasis(text);

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const assign = (key, value) => {
    if (value == null || !Number.isFinite(value)) return;
    if (facts[key] == null) facts[key] = roundFor(key, value);
  };

  // Weist einer bereits bekannten Bezeichnung den Zahlenwert einer Zeile zu.
  const assignFromLine = (key, low) => {
    if (key === 'kcal') { assign('kcal', extractEnergy(low)); return; }
    const num = extractNumber(stripRef(low));
    if (!num) return;
    let value = num.value;
    if (num.unit === 'mg') value /= 1000;
    else if (num.unit === 'µg' || num.unit === 'mcg') value /= 1000000;
    // Natrium -> Salz (× 2,5), falls die Zeile nur Natrium ausweist.
    if (key === 'salt' && /natrium|sodium/.test(low) && !/salz|salt/.test(low)) value *= 2.5;
    assign(key, value);
  };

  // Zeilenweise. Steht der Wert in derselben Zeile wie die Bezeichnung, wird
  // sofort zugewiesen. Bei zweispaltigem Layout (Bezeichnung und Wert in
  // getrennten Zeilen) merken wir uns die Bezeichnung („pending") und lösen sie
  // mit der nächsten Zahlenzeile auf.
  let pending = null;
  for (const line of lines) {
    const low = line.toLowerCase();
    const key = matchKey(low);
    const digit = hasDigit(low);

    if (key) {
      if (digit) {
        assignFromLine(key, low);
        pending = null;
      } else {
        pending = key;
      }
    } else if (pending && digit) {
      assignFromLine(pending, low);
      pending = null;
    } else if (pending && !digit) {
      // Zwischenzeile ohne Bezug -> Bezeichnung verwerfen (nicht überbrücken).
      pending = null;
    }
  }

  return facts;
}
