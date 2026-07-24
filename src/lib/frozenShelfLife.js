// Haltbarkeit tiefgefroren (bei konstant -18 °C). Die Monatsangaben sind reine
// Qualitätsempfehlungen (Geschmack/Textur) – laut USDA/FSIS ist tiefgekühltes
// Essen bei -18 °C durchgehend SICHER, unabhängig von der Lagerdauer.
//
// Gleiches Muster wie openedShelfLife.js: erster Substring-Treffer auf den
// kleingeschriebenen Namen gewinnt, Spezifisches vor Allgemeinem. Jeder
// Eintrag ist recherchiert (u.a. USDA FSIS, Verbraucherzentrale, Alnatura,
// Initiative Tierwohl) – keine erfundenen Angaben. Phase 1: 13 gut
// abgesicherte Kernartikel, Schwerpunkt Fleisch/Wurst, Käse, Brot.
//
// `notRecommended: true` statt `months`, wenn Einfrieren grundsätzlich nicht
// empfohlen wird (z.B. Weich-/Frischkäse wird krümelig/wässrig).

export const FROZEN_SHELF_RULES = [
  { keys: ['hackfleisch', 'hackepeter', 'schabefleisch', 'tatar', 'mett'], label: 'Hackfleisch / Mett (roh)', months: 3, prep: null, reason: 'Große Oberfläche, hohe Keimlast – Qualität und Sicherheit sinken nach dem Auftauen schneller als bei Braten/Steaks.' },
  { keys: ['hähnchen', 'haehnchen', 'hühner', 'huhn', 'pute', 'geflügel', 'gefluegel'], label: 'Geflügel (roh)', months: 10, prep: null, reason: 'Ganz oder in Teilen gut einfrierbar; ganzes Geflügel hält sich tendenziell etwas länger als einzelne Teile.' },
  { keys: ['schnitzel', 'gulasch', 'steak', 'filet', 'kotelett', 'braten', 'rinderbraten', 'schweinebraten', 'fleisch'], label: 'Rotes Fleisch (roh, Braten/Steak)', months: 8, prep: null, reason: 'Rind/Schwein roh eingefroren hält sich je nach Stück 6-12 Monate; Qualität nimmt danach graduell ab.' },
  { keys: ['aufschnitt', 'lyoner', 'mortadella', 'fleischwurst', 'bierschinken', 'kochschinken', 'gelbwurst', 'wiener', 'würstchen', 'wuerstchen', 'frankfurter', 'saitenwurst', 'schinken', 'wurst'], label: 'Aufschnitt / Brühwurst', months: 2, prep: null, reason: 'In Originalverpackung eingefroren 1-3 Monate; vakuumiert deutlich länger. Nach dem Auftauen nicht erneut einfrieren.' },
  { keys: ['salami', 'dauerwurst', 'cervelat', 'landjäger', 'landjaeger', 'chorizo', 'pepperoni', 'speck', 'bacon', 'rohschinken', 'serrano', 'parma', 'prosciutto'], label: 'Rohwurst / Speck', months: 2, prep: null, reason: 'Niedrigerer Wassergehalt als Brühwurst, aber ohne belastbare längere Richtwerte – konservativ wie Aufschnitt behandelt.' },
  { keys: ['parmesan', 'grana', 'pecorino', 'bergkäse', 'hartkäse', 'emmentaler'], label: 'Hartkäse', months: 6, prep: 'Am besten gerieben einfrieren.', reason: 'Niedriger Wassergehalt – friert am verträglichsten von allen Käsesorten ein.' },
  { keys: ['frischkäse', 'streichkäse', 'philadelphia', 'doppelrahm', 'mozzarella', 'ricotta', 'feta', 'hirtenkäse', 'schafskäse', 'camembert', 'brie', 'blauschimmel', 'gorgonzola', 'roquefort'], label: 'Weich- / Frischkäse', months: null, notRecommended: true, prep: null, reason: 'Hoher Wassergehalt – wird nach dem Auftauen krümelig, schmierig oder wässrig. Käse mit Schimmelrinde verändert zusätzlich Geschmack und Textur.' },
  { keys: ['gouda', 'cheddar', 'edamer', 'tilsiter', 'butterkäse', 'maasdamer', 'appenzeller', 'raclette'], label: 'Schnittkäse', months: 4, prep: 'Scheiben mit Butterbrotpapier trennen, damit sie nicht zusammenkleben.', reason: 'Fester als Weichkäse, aber etwas wasserreicher als Hartkäse – daher kürzere Frist.' },
  { keys: ['butter', 'margarine'], label: 'Butter / Margarine', months: 6, prep: null, reason: 'Gesalzene Butter hält sich eingefroren tendenziell länger (bis 12 Monate) als ungesalzene.' },
  { keys: ['brot', 'toast', 'brötchen', 'broetchen', 'baguette'], label: 'Brot / Backwaren', months: 3, prep: 'Vor dem Einfrieren auf Zimmertemperatur abkühlen lassen (sonst Kondensation).', reason: 'Aufgeschnitten/verpackt ca. 3 Monate; ein ganzer, unangeschnittener Laib hält sich auch bis zu 6 Monate.' },
  { keys: ['erbsen', 'bohnen', 'brokkoli', 'blumenkohl', 'spinat', 'möhre', 'moehre', 'karotte', 'karotten', 'fenchel', 'kohlrabi', 'mangold', 'rosenkohl'], label: 'Gemüse (blanchiert)', months: 10, prep: 'Vorher blanchieren (3-5 Min. kochen, dann in Eiswasser abschrecken) – deaktiviert Enzyme, erhält Farbe und Vitamine.', reason: 'Ohne Blanchieren verlieren diese Sorten beim Einfrieren deutlich an Farbe, Textur und Vitaminen.' },
  { keys: ['zucchini', 'paprika', 'pilz', 'champignon', 'spargel', 'kürbis', 'kuerbis', 'lauchzwiebel', 'frühlingszwiebel', 'fruehlingszwiebel'], label: 'Gemüse (ohne Blanchieren)', months: 8, prep: null, reason: 'Fester bzw. wasserärmer – kann roh eingefroren werden, kein Blanchieren nötig.' },
  { keys: ['beere', 'beeren', 'himbeere', 'himbeeren', 'heidelbeere', 'heidelbeeren', 'blaubeere', 'blaubeeren', 'erdbeere', 'erdbeeren', 'kirsche', 'kirschen', 'pfirsich', 'aprikose', 'apfel', 'äpfel', 'aepfel', 'birne', 'birnen', 'banane', 'bananen'], label: 'Obst / Beeren', months: 10, prep: 'Beeren einzeln auf einem Blech vorfrieren (verhindert Verklumpen); Steinobst vorher entsteinen; Bananen geschält in Scheiben.', reason: 'Beeren und Steinobst bis zu 12 Monate, Apfel-/Birnenscheiben 8-10 Monate, Bananenscheiben eher 3-6 Monate.' },
  { keys: ['suppe', 'eintopf', 'auflauf', 'fertiggericht', 'reste', 'soße', 'sosse', 'sauce', 'pasta', 'nudelgericht'], label: 'Reste / gekochte Gerichte', months: 3, prep: 'Vor dem Einfrieren vollständig abkühlen lassen.', reason: 'Gilt als grobe Richtschnur für die meisten gekochten Gerichte, Suppen und Saucen.' },
];

// Passende Regel zum Namen (oder null) – erster Substring-Treffer gewinnt.
export function frozenRule(name) {
  const n = (name || '').toLowerCase();
  if (!n) return null;
  for (const r of FROZEN_SHELF_RULES) {
    if (r.keys.some((k) => n.includes(k))) return r;
  }
  return null;
}

// Info-Objekt für die Anzeige: { months, notRecommended, prep, reason, label } | null.
export function frozenInfo(name) {
  const r = frozenRule(name);
  if (!r) return null;
  return { months: r.months, notRecommended: !!r.notRecommended, prep: r.prep, reason: r.reason, label: r.label };
}
