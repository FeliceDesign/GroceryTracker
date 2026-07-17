// Standardwerte für einen frischen Start. Lagerorte und Kategorien sind
// anpassbar – diese Listen dienen nur als Ausgangspunkt und werden danach
// im persistenten Speicher gehalten.

// Ein Lagerort trägt eine einzige Basisfarbe; alle abgeleiteten Farbtöne
// entstehen daraus (siehe lib/colors.js). So sind eigene Lagerorte den
// Standard-Lagerorten optisch gleichgestellt.
export const DEFAULT_ZONES = [
  { id: 'K', label: 'Kühlschrank', emoji: '🧊', color: '#4A8B6F' },
  { id: 'F', label: 'Gefrierschrank', emoji: '❄️', color: '#3B7A9E' },
  { id: 'V', label: 'Vorrat', emoji: '🥫', color: '#9C7A3C' },
  { id: 'S', label: 'Snacks', emoji: '🍫', color: '#7A6BA8' },
];

export const DEFAULT_CATEGORIES = [
  'Milchprodukte', 'Fleisch', 'Fisch', 'Gemüse', 'Obst',
  'Reis/Nudeln', 'Brot', 'Fertigbeilagen', 'Hülsenfrüchte', 'Konserven',
  'Gewürze', 'Saucen & Öle', 'Getränke', 'Süßigkeiten', 'Riegel',
  'Müsli', 'Nüsse', 'Trockenfrüchte', 'Salziges', 'Sonstiges',
];

// unit: 'stk' (ganze Packungen) | 'g' | 'ml' (exakte Gewichts-/Volumenmenge)
export const SEED = [
  // KÜHLSCHRANK
  { id: 'k1', zone: 'K', category: 'Milchprodukte', name: 'Emmentaler', qty: 1, unit: 'stk', mhd: null },
  { id: 'k2', zone: 'K', category: 'Milchprodukte', name: 'Frischmilch', qty: 1000, unit: 'ml', mhd: null },
  { id: 'k3', zone: 'K', category: 'Milchprodukte', name: 'Joghurt', qty: 1000, unit: 'g', mhd: null },
  { id: 'k4', zone: 'K', category: 'Milchprodukte', name: 'Kochsahne', qty: 1, unit: 'stk', mhd: null },
  { id: 'k5', zone: 'K', category: 'Milchprodukte', name: 'Skyr', qty: 1, unit: 'stk', mhd: null },
  { id: 'k6', zone: 'K', category: 'Saucen & Öle', name: 'Taco Sauce', qty: 1, unit: 'stk', mhd: null },
  { id: 'k7', zone: 'K', category: 'Sonstiges', name: 'Eier', qty: 10, unit: 'stk', mhd: null },
  // GEFRIERSCHRANK
  { id: 'f1', zone: 'F', category: 'Fertigbeilagen', name: 'Country Wedges', qty: 1, unit: 'stk', mhd: null },
  { id: 'f2', zone: 'F', category: 'Fertigbeilagen', name: 'Kroketten', qty: 1, unit: 'stk', mhd: null },
  { id: 'f3', zone: 'F', category: 'Fisch', name: 'Wildlachs', qty: 1, unit: 'stk', mhd: null },
  { id: 'f4', zone: 'F', category: 'Fleisch', name: 'Hähnchenbrust', qty: 1, unit: 'stk', mhd: null },
  { id: 'f5', zone: 'F', category: 'Gemüse', name: 'Gemüsepfanne', qty: 1, unit: 'stk', mhd: null },
  { id: 'f6', zone: 'F', category: 'Obst', name: 'Beerenmischung', qty: 1, unit: 'stk', mhd: null },
  // VORRAT
  { id: 'v1', zone: 'V', category: 'Reis/Nudeln', name: 'Fusilli', qty: 1, unit: 'stk', mhd: null },
  { id: 'v2', zone: 'V', category: 'Reis/Nudeln', name: 'Jasmin Reis', qty: 1000, unit: 'g', mhd: null },
  { id: 'v3', zone: 'V', category: 'Hülsenfrüchte', name: 'Kidney Bohnen (Dose)', qty: 1, unit: 'stk', mhd: null },
  { id: 'v4', zone: 'V', category: 'Konserven', name: 'Gebackene Bohnen', qty: 2, unit: 'stk', mhd: null },
  { id: 'v5', zone: 'V', category: 'Müsli', name: 'Haferflocken', qty: 1, unit: 'stk', mhd: null },
  { id: 'v6', zone: 'V', category: 'Saucen & Öle', name: 'Bratöl', qty: 500, unit: 'ml', mhd: null },
  { id: 'v7', zone: 'V', category: 'Gewürze', name: 'Paprika Gewürz', qty: 1, unit: 'stk', mhd: null },
  // SNACKS
  { id: 's1', zone: 'S', category: 'Riegel', name: 'Protein Cookie Dough', qty: 1, unit: 'stk', mhd: null },
  { id: 's2', zone: 'S', category: 'Nüsse', name: 'Cashewkerne', qty: 1, unit: 'stk', mhd: null },
  { id: 's3', zone: 'S', category: 'Nüsse', name: 'Mandeln', qty: 1, unit: 'stk', mhd: null },
  { id: 's4', zone: 'S', category: 'Trockenfrüchte', name: 'Soft-Pflaumen', qty: 1, unit: 'stk', mhd: null },
  { id: 's5', zone: 'S', category: 'Süßigkeiten', name: 'Zartbitter-Schokolade', qty: 1, unit: 'stk', mhd: null },
];
