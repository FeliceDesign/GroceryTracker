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
// kleingeschriebenen Namen gewinnt, Spezifisches vor Allgemeinem. Jeder
// Eintrag ist recherchiert (u.a. Verbraucherzentrale, Frag Mutti, Stiftung
// Warentest) – keine erfundenen Angaben. Phase 2: 11 weitere Artikel
// (Vorratsschrank-Klassiker: Honig, Gewürze, Kaffee/Tee, Öl, Süßwaren).

export const UNOPENED_SHELF_RULES = [
  { keys: ['eiernudel', 'eiernudeln'], label: 'Eiernudeln', extraDays: 0, reason: 'Enthalten rohes Ei – anders als reine Trockennudeln sollten sie nach Ablauf des MHD sicherheitshalber nicht mehr gegessen werden.' },
  { keys: ['nudeln', 'pasta', 'spaghetti', 'fusilli', 'penne', 'makkaroni'], label: 'Nudeln (ohne Ei)', extraDays: 730, reason: 'Trocken gelagert viele Jahre über das MHD hinaus genießbar.' },
  { keys: ['reis'], label: 'Reis', extraDays: 365, reason: 'Weißer, polierter Reis hält sich trocken gelagert bis zu 2 Jahre über das MHD hinaus; Naturreis etwas kürzer.' },
  { keys: ['mehl'], label: 'Mehl', extraDays: 60, reason: 'Helle Mehlsorten oft noch Wochen bis Monate über dem MHD genießbar, wenn trocken, kühl und gut verschlossen gelagert.' },
  { keys: ['zucker'], label: 'Zucker', extraDays: 3650, reason: 'Praktisch unbegrenzt haltbar – Zucker konserviert sich selbst.' },
  { keys: ['salz'], label: 'Salz', extraDays: 3650, reason: 'Praktisch unbegrenzt haltbar – benötigt laut Verbraucherzentrale eigentlich gar kein MHD.' },
  { keys: ['essig'], label: 'Essig', extraDays: 3650, reason: 'Praktisch unbegrenzt haltbar – Säuregehalt konserviert vollständig.' },
  { keys: ['honig'], label: 'Honig', extraDays: 365, reason: 'Trocken, kühl und gut verschlossen gelagert oft noch etwa ein Jahr über dem MHD genießbar; kristallisiert mit der Zeit, bleibt aber unbedenklich.' },
  { keys: ['gewürz', 'gewuerz', 'zimt', 'curry', 'nelken', 'paprikapulver', 'pfeffer', 'oregano', 'muskat'], label: 'Gewürze (getrocknet)', extraDays: 365, reason: 'Trocken und dicht verschlossen oft noch etwa ein Jahr über dem MHD verwendbar; verlieren mit der Zeit an Aroma, werden aber nicht gesundheitsschädlich.' },
  { keys: ['konserve', 'dose', 'einweckglas', 'bohnen', 'mais', 'erbsen', 'linsen', 'kichererbsen'], label: 'Konserven', extraDays: 730, reason: 'Obst, Gemüse und Suppen in Konserven sind bei intakter Dose/Glas (nicht bombiert, kein Rost) mehrere Jahre über das MHD hinaus genießbar.' },
  { keys: ['kaffee'], label: 'Kaffee', extraDays: 365, reason: 'Luftdicht und trocken gelagert oft noch ein Jahr oder länger über dem MHD trinkbar; ganze Bohnen halten länger als gemahlener Kaffee. Muffiger Geruch oder öliger Glanz sind Warnsignale.' },
  { keys: ['tee'], label: 'Tee', extraDays: 730, reason: 'Trocken und luftdicht gelagert oft noch jahrelang über dem MHD verwendbar (schwarzer/grüner Tee besonders lange); Kräuter-/Früchtetee verliert schneller an Aroma, wird dadurch aber nicht schlecht.' },
  { keys: ['joghurt', 'skyr', 'quark', 'kefir', 'ayran'], label: 'Joghurt / Skyr / Quark', extraDays: 12, reason: 'Ungeöffnet meist 10-14 Tage über dem MHD noch gut; reiner Naturjoghurt kann laut manchen Quellen sogar deutlich länger halten. Geruch/Optik vorher prüfen.' },
  { keys: ['eier', 'eierkarton'], label: 'Eier', extraDays: 21, reason: 'Ungeöffnet bis zu 3 Wochen über dem MHD haltbar, danach sicherheitshalber nur noch für durcherhitzte Speisen verwenden.' },
  { keys: ['h-milch', 'haltbarmilch'], label: 'H-Milch', extraDays: 21, reason: 'Ungeöffnet oft noch Wochen über dem MHD genießbar.' },
  { keys: ['frischmilch', 'vollmilch', 'milch'], label: 'Frischmilch', extraDays: 5, reason: 'Ungeöffnet meist noch einige Tage über dem MHD genießbar.' },
  { keys: ['parmesan', 'grana', 'pecorino', 'bergkäse', 'hartkäse', 'emmentaler', 'gouda', 'cheddar', 'edamer', 'tilsiter', 'butterkäse', 'maasdamer', 'appenzeller', 'raclette', 'käse', 'kaese'], label: 'Käse', extraDays: 21, reason: 'Ungeöffnet mehrere Wochen über dem MHD haltbar; ein ganzes, unangeschnittenes Stück hält sich tendenziell länger als eingeschweißte Scheiben.' },
  { keys: ['olivenöl', 'olivenoel'], label: 'Olivenöl', extraDays: 365, reason: 'Bei kühler, dunkler Lagerung oft viele Jahre über das MHD hinaus genießbar; wird höchstens ranzig im Geschmack, nicht gesundheitsschädlich.' },
  { keys: ['öl', 'oel'], label: 'Pflanzenöl', extraDays: 270, reason: 'Ungeöffnet meist noch 6-12 Monate über dem MHD nutzbar. Ranzig geworden erkennbar an säuerlichem/muffigem Geruch – unangenehm im Geschmack, aber laut Öko-Test nicht im Sinne von gesundheitsschädlich verdorben.' },
  { keys: ['schokolade'], label: 'Schokolade', extraDays: 365, reason: 'Trockenes Produkt mit großzügig bemessenem MHD – bleibt oft noch viele Monate bis Jahre darüber hinaus genießbar (kann grau/weißlich anlaufen, das ist nur Fett-/Zuckerausblühung, unbedenklich).' },
  { keys: ['kekse', 'keks', 'kräcker', 'kraecker'], label: 'Kekse', extraDays: 180, reason: 'Solange sie normal aussehen, riechen und schmecken, auch Monate über das MHD hinaus genießbar.' },
  { keys: ['müsli', 'muesli', 'cornflakes'], label: 'Müsli / Cornflakes', extraDays: 210, reason: 'Ungeöffnet bei trockener, dunkler Lagerung meist 6-8 Monate über dem MHD noch genießbar.' },
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

// Info-Objekt für die Anzeige: { extraDays, reason, label } | null.
export function unopenedInfo(name) {
  const r = unopenedRule(name);
  if (!r) return null;
  return { extraDays: r.extraDays, reason: r.reason, label: r.label };
}
