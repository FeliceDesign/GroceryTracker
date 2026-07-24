// Haltbarkeit ungeöffnet über das gedruckte MHD hinaus. Das MHD
// (Mindesthaltbarkeitsdatum) ist kein Wegwerfdatum – bei unbeschädigter,
// ungeöffneter Verpackung und richtiger Lagerung ist vieles danach noch
// genießbar (Verbraucherzentrale: „MHD ist nicht gleich Verbrauchsdatum").
//
// Bewusst OHNE Einträge für rohes Fleisch/Fisch/Geflügel: die tragen ein
// Verbrauchsdatum statt eines MHD, nach dessen Ablauf ein echtes
// Sicherheitsrisiko besteht statt einer Kann-Aussage. Für solche Artikel
// liefert diese Tabelle absichtlich keinen Treffer (kein Fallback-Text nötig,
// siehe unopenedRule/unopenedInfo).
//
// Gleiches Muster wie openedShelfLife.js: erster Substring-Treffer auf den
// kleingeschriebenen Namen gewinnt, Spezifisches vor Allgemeinem. `category`
// dient NUR der Anzeige (Gruppierung im Ratgeber) und darf die Matching-
// Reihenfolge oben nicht beeinflussen. Jeder Eintrag ist recherchiert (u.a.
// Verbraucherzentrale, Frag Mutti, Stiftung Warentest) – keine erfundenen
// Angaben. Phase 2: 11 weitere Artikel (Vorratsschrank-Klassiker: Honig,
// Gewürze, Kaffee/Tee, Öl, Süßwaren).

export const UNOPENED_SHELF_RULES = [
  { keys: ['eiernudel', 'eiernudeln'], category: 'Vorratsschrank & Trockenware', category_en: 'Pantry & Dry Goods', label: 'Eiernudeln', label_en: 'Egg noodles', extraDays: 0, reason: 'Enthalten rohes Ei – anders als reine Trockennudeln sollten sie nach Ablauf des MHD sicherheitshalber nicht mehr gegessen werden.', reason_en: 'Contain raw egg – unlike plain dry pasta, they should not be eaten past the best-before date as a safety precaution.' },
  { keys: ['nudeln', 'pasta', 'spaghetti', 'fusilli', 'penne', 'makkaroni'], category: 'Vorratsschrank & Trockenware', category_en: 'Pantry & Dry Goods', label: 'Nudeln (ohne Ei)', label_en: 'Pasta (egg-free)', extraDays: 730, reason: 'Trocken gelagert viele Jahre über das MHD hinaus genießbar.', reason_en: 'Stored dry, edible for many years past the best-before date.' },
  { keys: ['reis'], category: 'Vorratsschrank & Trockenware', category_en: 'Pantry & Dry Goods', label: 'Reis', label_en: 'Rice', extraDays: 365, reason: 'Weißer, polierter Reis hält sich trocken gelagert bis zu 2 Jahre über das MHD hinaus; Naturreis etwas kürzer.', reason_en: 'White, polished rice keeps up to 2 years past the best-before date when stored dry; brown rice a bit less.' },
  { keys: ['mehl'], category: 'Vorratsschrank & Trockenware', category_en: 'Pantry & Dry Goods', label: 'Mehl', label_en: 'Flour', extraDays: 60, reason: 'Helle Mehlsorten oft noch Wochen bis Monate über dem MHD genießbar, wenn trocken, kühl und gut verschlossen gelagert.', reason_en: 'Light flours often stay usable weeks to months past the best-before date when stored dry, cool, and well-sealed.' },
  { keys: ['zucker'], category: 'Vorratsschrank & Trockenware', category_en: 'Pantry & Dry Goods', label: 'Zucker', label_en: 'Sugar', extraDays: 3650, reason: 'Praktisch unbegrenzt haltbar – Zucker konserviert sich selbst.', reason_en: 'Keeps practically indefinitely – sugar preserves itself.' },
  { keys: ['salz'], category: 'Vorratsschrank & Trockenware', category_en: 'Pantry & Dry Goods', label: 'Salz', label_en: 'Salt', extraDays: 3650, reason: 'Praktisch unbegrenzt haltbar – benötigt laut Verbraucherzentrale eigentlich gar kein MHD.', reason_en: 'Keeps practically indefinitely – according to consumer authorities, salt doesn\'t really need a best-before date at all.' },
  { keys: ['essig'], category: 'Vorratsschrank & Trockenware', category_en: 'Pantry & Dry Goods', label: 'Essig', label_en: 'Vinegar', extraDays: 3650, reason: 'Praktisch unbegrenzt haltbar – Säuregehalt konserviert vollständig.', reason_en: 'Keeps practically indefinitely – its acidity fully preserves it.' },
  { keys: ['honig'], category: 'Aufstriche & Konserven', category_en: 'Spreads & Canned Goods', label: 'Honig', label_en: 'Honey', extraDays: 365, reason: 'Trocken, kühl und gut verschlossen gelagert oft noch etwa ein Jahr über dem MHD genießbar; kristallisiert mit der Zeit, bleibt aber unbedenklich.', reason_en: 'Stored dry, cool, and well-sealed, often still edible about a year past the best-before date; crystallizes over time but stays safe.' },
  { keys: ['gewürz', 'gewuerz', 'zimt', 'curry', 'nelken', 'paprikapulver', 'pfeffer', 'oregano', 'muskat'], category: 'Vorratsschrank & Trockenware', category_en: 'Pantry & Dry Goods', label: 'Gewürze (getrocknet)', label_en: 'Spices (dried)', extraDays: 365, reason: 'Trocken und dicht verschlossen oft noch etwa ein Jahr über dem MHD verwendbar; verlieren mit der Zeit an Aroma, werden aber nicht gesundheitsschädlich.', reason_en: 'Stored dry and tightly sealed, usable about a year past the best-before date; they lose aroma over time but don\'t become unsafe.' },
  { keys: ['konserve', 'dose', 'einweckglas', 'bohnen', 'mais', 'erbsen', 'linsen', 'kichererbsen'], category: 'Aufstriche & Konserven', category_en: 'Spreads & Canned Goods', label: 'Konserven', label_en: 'Canned goods', extraDays: 730, reason: 'Obst, Gemüse und Suppen in Konserven sind bei intakter Dose/Glas (nicht bombiert, kein Rost) mehrere Jahre über das MHD hinaus genießbar.', reason_en: 'Canned fruit, vegetables, and soups are edible several years past the best-before date if the can/jar is intact (not bulging, no rust).' },
  { keys: ['kaffee'], category: 'Vorratsschrank & Trockenware', category_en: 'Pantry & Dry Goods', label: 'Kaffee', label_en: 'Coffee', extraDays: 365, reason: 'Luftdicht und trocken gelagert oft noch ein Jahr oder länger über dem MHD trinkbar; ganze Bohnen halten länger als gemahlener Kaffee. Muffiger Geruch oder öliger Glanz sind Warnsignale.', reason_en: 'Stored airtight and dry, often still drinkable a year or more past the best-before date; whole beans keep longer than ground coffee. A musty smell or oily sheen are warning signs.' },
  { keys: ['tee'], category: 'Vorratsschrank & Trockenware', category_en: 'Pantry & Dry Goods', label: 'Tee', label_en: 'Tea', extraDays: 730, reason: 'Trocken und luftdicht gelagert oft noch jahrelang über dem MHD verwendbar (schwarzer/grüner Tee besonders lange); Kräuter-/Früchtetee verliert schneller an Aroma, wird dadurch aber nicht schlecht.', reason_en: 'Stored dry and airtight, often usable for years past the best-before date (black/green tea especially); herbal/fruit tea loses aroma faster but doesn\'t spoil because of it.' },
  { keys: ['joghurt', 'skyr', 'quark', 'kefir', 'ayran'], category: 'Milchprodukte', category_en: 'Dairy', label: 'Joghurt / Skyr / Quark', label_en: 'Yogurt / Skyr / Quark', extraDays: 12, reason: 'Ungeöffnet meist 10-14 Tage über dem MHD noch gut; reiner Naturjoghurt kann laut manchen Quellen sogar deutlich länger halten. Geruch/Optik vorher prüfen.', reason_en: 'Unopened, usually still good 10-14 days past the best-before date; plain natural yogurt can, per some sources, keep noticeably longer. Check smell/appearance first.' },
  { keys: ['eier', 'eierkarton'], category: 'Eier', category_en: 'Eggs', label: 'Eier', label_en: 'Eggs', extraDays: 21, reason: 'Ungeöffnet bis zu 3 Wochen über dem MHD haltbar, danach sicherheitshalber nur noch für durcherhitzte Speisen verwenden.', reason_en: 'Unopened, keeps up to 3 weeks past the best-before date; after that, use only in thoroughly cooked dishes as a precaution.' },
  { keys: ['h-milch', 'haltbarmilch'], category: 'Milchprodukte', category_en: 'Dairy', label: 'H-Milch', label_en: 'UHT milk', extraDays: 21, reason: 'Ungeöffnet oft noch Wochen über dem MHD genießbar.', reason_en: 'Unopened, often still fine for weeks past the best-before date.' },
  { keys: ['frischmilch', 'vollmilch', 'milch'], category: 'Milchprodukte', category_en: 'Dairy', label: 'Frischmilch', label_en: 'Fresh milk', extraDays: 5, reason: 'Ungeöffnet meist noch einige Tage über dem MHD genießbar.', reason_en: 'Unopened, usually still fine for a few days past the best-before date.' },
  { keys: ['parmesan', 'grana', 'pecorino', 'bergkäse', 'hartkäse', 'emmentaler', 'gouda', 'cheddar', 'edamer', 'tilsiter', 'butterkäse', 'maasdamer', 'appenzeller', 'raclette', 'käse', 'kaese'], category: 'Käse', category_en: 'Cheese', label: 'Käse', label_en: 'Cheese', extraDays: 21, reason: 'Ungeöffnet mehrere Wochen über dem MHD haltbar; ein ganzes, unangeschnittenes Stück hält sich tendenziell länger als eingeschweißte Scheiben.', reason_en: 'Unopened, keeps several weeks past the best-before date; a whole, uncut piece tends to keep longer than pre-sliced, shrink-wrapped cheese.' },
  { keys: ['olivenöl', 'olivenoel'], category: 'Öl & Fette', category_en: 'Oil & Fats', label: 'Olivenöl', label_en: 'Olive oil', extraDays: 365, reason: 'Bei kühler, dunkler Lagerung oft viele Jahre über das MHD hinaus genießbar; wird höchstens ranzig im Geschmack, nicht gesundheitsschädlich.', reason_en: 'Stored cool and dark, often edible many years past the best-before date; at worst it turns rancid in taste, not unsafe.' },
  { keys: ['öl', 'oel'], category: 'Öl & Fette', category_en: 'Oil & Fats', label: 'Pflanzenöl', label_en: 'Vegetable oil', extraDays: 270, reason: 'Ungeöffnet meist noch 6-12 Monate über dem MHD nutzbar. Ranzig geworden erkennbar an säuerlichem/muffigem Geruch – unangenehm im Geschmack, aber laut Öko-Test nicht im Sinne von gesundheitsschädlich verdorben.', reason_en: 'Unopened, usually usable 6-12 months past the best-before date. Rancidity shows as a sour/musty smell – unpleasant in taste, but per consumer testing not spoiled in a health-hazard sense.' },
  { keys: ['schokolade'], category: 'Süßwaren', category_en: 'Sweets', label: 'Schokolade', label_en: 'Chocolate', extraDays: 365, reason: 'Trockenes Produkt mit großzügig bemessenem MHD – bleibt oft noch viele Monate bis Jahre darüber hinaus genießbar (kann grau/weißlich anlaufen, das ist nur Fett-/Zuckerausblühung, unbedenklich).', reason_en: 'A dry product with a generously set best-before date – often still edible many months to years beyond it (may turn grey/whitish, which is just fat/sugar bloom and harmless).' },
  { keys: ['kekse', 'keks', 'kräcker', 'kraecker'], category: 'Süßwaren', category_en: 'Sweets', label: 'Kekse', label_en: 'Cookies', extraDays: 180, reason: 'Solange sie normal aussehen, riechen und schmecken, auch Monate über das MHD hinaus genießbar.', reason_en: 'As long as they look, smell, and taste normal, edible even months past the best-before date.' },
  { keys: ['müsli', 'muesli', 'cornflakes'], category: 'Vorratsschrank & Trockenware', category_en: 'Pantry & Dry Goods', label: 'Müsli / Cornflakes', label_en: 'Muesli / Cornflakes', extraDays: 210, reason: 'Ungeöffnet bei trockener, dunkler Lagerung meist 6-8 Monate über dem MHD noch genießbar.', reason_en: 'Unopened, stored dry and dark, usually still edible 6-8 months past the best-before date.' },
];

// Passende Regel zum Namen (oder null) – erster Substring-Treffer gewinnt.
export function unopenedRule(name) {
  const n = (name || '').toLowerCase();
  if (!n) return null;
  for (const r of UNOPENED_SHELF_RULES) {
    if (r.keys.some((k) => n.includes(k))) return r;
  }
  return null;
}

// Info-Objekt für die Anzeige: { extraDays, reason, label, reason_en, label_en } | null.
export function unopenedInfo(name) {
  const r = unopenedRule(name);
  if (!r) return null;
  return { extraDays: r.extraDays, reason: r.reason, label: r.label, reason_en: r.reason_en, label_en: r.label_en };
}
