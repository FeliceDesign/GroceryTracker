// Gewürz-Ratgeber: welche Gewürze zu welchen Gerichten passen ("Pairing")
// und wie lange sie halten. Die Haltbarkeits-Grundregel ist recherchiert und
// branchenübereinstimmend: ganze Gewürze 4-5 Jahre, gemahlene ca. 12 Monate,
// kühl/dunkel/luftdicht lagern (15-20 °C). Einzelne Ausreißer (schneller
// verblassende gemahlene Gewürze wie Paprika/Kurkuma) sind vermerkt. Das
// Pairing ist im Gegensatz dazu Erfahrungswissen (Kochpraxis), keine
// sicherheitsrelevante oder extern verifizierbare Angabe.
//
// Gleiches Matching-Muster wie die anderen Ratgeber-Dateien: erster
// Substring-Treffer auf den kleingeschriebenen Namen gewinnt. `category`/
// `category_en` dienen nur der Anzeige, `catKey` dem Kategorie-Filter im
// Ratgeber-Sheet (stabil, unabhängig von der Sprache).
//
// `wholeYears`: Haltbarkeit ganz/ungemahlen in Jahren, `null` wenn im Handel
// praktisch nur gemahlen/als Mischung erhältlich (z.B. Currypulver, Kurkuma).
// `groundMonths`: Haltbarkeit gemahlen in Monaten, `null` wenn praktisch nur
// als ganze Blätter/Zweige gehandelt (z.B. Lorbeer, Rosmarin).

export const SPICE_RULES = [
  { keys: ['zimt', 'cinnamon'], catKey: 'warm', category: 'Wärmend & Süß', category_en: 'Warm & Sweet', label: 'Zimt', label_en: 'Cinnamon', emoji: '🍂', pairsWith: ['Apfel', 'Milchreis', 'Porridge', 'Glühwein', 'Kaffee'], pairsWith_en: ['Apple', 'Rice pudding', 'Porridge', 'Mulled wine', 'Coffee'], wholeYears: 4, groundMonths: 9, storageTip: 'Zimtstangen halten Aroma deutlich länger als gemahlener Zimt.', storageTip_en: 'Cinnamon sticks keep their aroma much longer than ground cinnamon.' },
  { keys: ['muskat'], catKey: 'warm', category: 'Wärmend & Süß', category_en: 'Warm & Sweet', label: 'Muskatnuss', label_en: 'Nutmeg', emoji: '🌰', pairsWith: ['Kartoffelpüree', 'Spinat', 'Béchamel', 'Kürbis'], pairsWith_en: ['Mashed potatoes', 'Spinach', 'Béchamel', 'Pumpkin'], wholeYears: 4, groundMonths: 6, storageTip: 'Am besten die ganze Nuss aufbewahren und erst kurz vor Gebrauch frisch reiben.', storageTip_en: 'Best to keep the whole nut and grate it fresh just before use.' },
  { keys: ['vanille'], catKey: 'warm', category: 'Wärmend & Süß', category_en: 'Warm & Sweet', label: 'Vanille', label_en: 'Vanilla', emoji: '🌱', pairsWith: ['Desserts', 'Milchreis', 'Kompott', 'Kaffee'], pairsWith_en: ['Desserts', 'Rice pudding', 'Stewed fruit', 'Coffee'], wholeYears: 2, groundMonths: 12, storageTip: 'Schoten luftdicht und dunkel lagern, sonst trocknen sie schnell aus.', storageTip_en: 'Store pods airtight and dark, otherwise they dry out quickly.' },
  { keys: ['nelken'], catKey: 'warm', category: 'Wärmend & Süß', category_en: 'Warm & Sweet', label: 'Nelken', label_en: 'Cloves', emoji: '🌰', pairsWith: ['Glühwein', 'Braten', 'Lebkuchen', 'Rotkohl'], pairsWith_en: ['Mulled wine', 'Roasts', 'Gingerbread', 'Red cabbage'], wholeYears: 4, groundMonths: 12, storageTip: 'Sehr intensiv – sparsam dosieren.', storageTip_en: 'Very intense – use sparingly.' },
  { keys: ['piment'], catKey: 'warm', category: 'Wärmend & Süß', category_en: 'Warm & Sweet', label: 'Piment', label_en: 'Allspice', emoji: '🌰', pairsWith: ['Rotkohl', 'Braten', 'Lebkuchen', 'Marinaden'], pairsWith_en: ['Red cabbage', 'Roasts', 'Gingerbread', 'Marinades'], wholeYears: 4, groundMonths: 12, storageTip: null, storageTip_en: null },
  { keys: ['kreuzkümmel', 'kreuzkuemmel', 'cumin'], catKey: 'asia', category: 'Asiatisch & Curry', category_en: 'Asian & Curry', label: 'Kreuzkümmel', label_en: 'Cumin', emoji: '🌿', pairsWith: ['Hülsenfrüchte', 'Chili con Carne', 'Falafel', 'Currys'], pairsWith_en: ['Legumes', 'Chili con carne', 'Falafel', 'Curries'], wholeYears: 4, groundMonths: 9, storageTip: 'Ganze Samen vor Gebrauch kurz anrösten – bringt deutlich mehr Aroma.', storageTip_en: 'Briefly toast whole seeds before use – brings out much more aroma.' },
  { keys: ['koriander'], catKey: 'asia', category: 'Asiatisch & Curry', category_en: 'Asian & Curry', label: 'Koriander (Samen)', label_en: 'Coriander (seeds)', emoji: '🌿', pairsWith: ['Currys', 'Hummus', 'Marinaden'], pairsWith_en: ['Curries', 'Hummus', 'Marinades'], wholeYears: 4, groundMonths: 6, storageTip: 'Gemahlen verliert Koriander besonders schnell an Aroma – lieber ganze Samen kaufen und frisch mahlen.', storageTip_en: 'Ground coriander loses aroma especially fast – better to buy whole seeds and grind fresh.' },
  { keys: ['kurkuma', 'turmeric'], catKey: 'asia', category: 'Asiatisch & Curry', category_en: 'Asian & Curry', label: 'Kurkuma', label_en: 'Turmeric', emoji: '🟡', pairsWith: ['Currys', 'Reis', 'Goldene Milch'], pairsWith_en: ['Curries', 'Rice', 'Golden milk'], wholeYears: null, groundMonths: 12, storageTip: 'Praktisch nur gemahlen erhältlich; unbedingt dunkel lagern, sonst verblasst die Farbe.', storageTip_en: 'Practically only available ground; store in the dark or the color fades.' },
  { keys: ['currypulver', 'curry'], catKey: 'asia', category: 'Asiatisch & Curry', category_en: 'Asian & Curry', label: 'Currypulver', label_en: 'Curry powder', emoji: '🍛', pairsWith: ['Currys', 'Reisgerichte', 'Suppen'], pairsWith_en: ['Curries', 'Rice dishes', 'Soups'], wholeYears: null, groundMonths: 12, storageTip: 'Gewürzmischung – Haltbarkeit richtet sich nach dem empfindlichsten Bestandteil.', storageTip_en: 'A spice blend – shelf life follows its most sensitive ingredient.' },
  { keys: ['ingwer', 'ginger'], catKey: 'asia', category: 'Asiatisch & Curry', category_en: 'Asian & Curry', label: 'Ingwer, gemahlen', label_en: 'Ground ginger', emoji: '🫚', pairsWith: ['Lebkuchen', 'Currys', 'Asiatische Suppen'], pairsWith_en: ['Gingerbread', 'Curries', 'Asian soups'], wholeYears: null, groundMonths: 12, storageTip: 'Getrocknet/gemahlen deutlich schärfer im Aroma als frischer Ingwer.', storageTip_en: 'Dried/ground has a noticeably sharper aroma than fresh ginger.' },
  { keys: ['kardamom'], catKey: 'asia', category: 'Asiatisch & Curry', category_en: 'Asian & Curry', label: 'Kardamom', label_en: 'Cardamom', emoji: '🌿', pairsWith: ['Chai', 'Currys', 'Gebäck'], pairsWith_en: ['Chai', 'Curries', 'Baked goods'], wholeYears: 3, groundMonths: 6, storageTip: 'Ganze Kapseln halten Aroma deutlich länger als gemahlener Kardamom.', storageTip_en: 'Whole pods keep their aroma much longer than ground cardamom.' },
  { keys: ['sternanis'], catKey: 'asia', category: 'Asiatisch & Curry', category_en: 'Asian & Curry', label: 'Sternanis', label_en: 'Star anise', emoji: '⭐', pairsWith: ['Glühwein', 'Currys', 'Pho / Asia-Suppen'], pairsWith_en: ['Mulled wine', 'Curries', 'Pho / Asian soups'], wholeYears: 4, groundMonths: 9, storageTip: null, storageTip_en: null },
  { keys: ['paprika'], catKey: 'scharf', category: 'Scharf & Rauchig', category_en: 'Spicy & Smoky', label: 'Paprikapulver (edelsüß/scharf/geräuchert)', label_en: 'Paprika powder (sweet/hot/smoked)', emoji: '🌶️', pairsWith: ['Gulasch', 'Paprikahähnchen', 'Kartoffeln'], pairsWith_en: ['Goulash', 'Paprika chicken', 'Potatoes'], wholeYears: null, groundMonths: 6, storageTip: 'Verliert Farbe und Aroma schneller als andere Gewürze – unbedingt lichtgeschützt lagern.', storageTip_en: 'Loses color and aroma faster than other spices – keep away from light.' },
  { keys: ['chili', 'cayennepfeffer', 'cayenne'], catKey: 'scharf', category: 'Scharf & Rauchig', category_en: 'Spicy & Smoky', label: 'Chili / Cayennepfeffer', label_en: 'Chili / cayenne pepper', emoji: '🌶️', pairsWith: ['Chili con Carne', 'Currys', 'Pasta Arrabbiata'], pairsWith_en: ['Chili con carne', 'Curries', 'Pasta arrabbiata'], wholeYears: 3, groundMonths: 12, storageTip: null, storageTip_en: null },
  { keys: ['lorbeer'], catKey: 'mediterran', category: 'Mediterran', category_en: 'Mediterranean', label: 'Lorbeerblatt', label_en: 'Bay leaf', emoji: '🍃', pairsWith: ['Schmorgerichte', 'Suppen', 'Eintöpfe', 'Sud'], pairsWith_en: ['Braised dishes', 'Soups', 'Stews', 'Stock'], wholeYears: 2, groundMonths: null, storageTip: 'Vor dem Servieren aus dem Gericht entnehmen.', storageTip_en: 'Remove from the dish before serving.' },
  { keys: ['rosmarin'], catKey: 'mediterran', category: 'Mediterran', category_en: 'Mediterranean', label: 'Rosmarin, getrocknet', label_en: 'Dried rosemary', emoji: '🌿', pairsWith: ['Kartoffeln', 'Lamm', 'Focaccia'], pairsWith_en: ['Potatoes', 'Lamb', 'Focaccia'], wholeYears: 2, groundMonths: null, storageTip: null, storageTip_en: null },
  { keys: ['oregano'], catKey: 'mediterran', category: 'Mediterran', category_en: 'Mediterranean', label: 'Oregano, getrocknet', label_en: 'Dried oregano', emoji: '🌿', pairsWith: ['Pizza', 'Tomatensauce', 'Pasta'], pairsWith_en: ['Pizza', 'Tomato sauce', 'Pasta'], wholeYears: 2, groundMonths: null, storageTip: null, storageTip_en: null },
];

// Passende Regel zum Namen (oder null) – erster Substring-Treffer gewinnt.
export function spiceRule(name) {
  const n = (name || '').toLowerCase();
  if (!n) return null;
  for (const r of SPICE_RULES) {
    if (r.keys.some((k) => n.includes(k))) return r;
  }
  return null;
}
