// Haltbarkeit tiefgefroren (bei konstant -18 °C). Die Monatsangaben sind reine
// Qualitätsempfehlungen (Geschmack/Textur) – laut USDA/FSIS ist tiefgekühltes
// Essen bei -18 °C durchgehend SICHER, unabhängig von der Lagerdauer.
//
// Gleiches Muster wie openedShelfLife.js: erster Substring-Treffer auf den
// kleingeschriebenen Namen gewinnt, Spezifisches vor Allgemeinem. `category`
// dient NUR der Anzeige (Gruppierung im Ratgeber) und darf die Matching-
// Reihenfolge oben nicht beeinflussen. Jeder Eintrag ist recherchiert (u.a.
// USDA FSIS, Verbraucherzentrale, Alnatura, Initiative Tierwohl) – keine
// erfundenen Angaben. Phase 1: 13 gut abgesicherte Kernartikel, Schwerpunkt
// Fleisch/Wurst, Käse, Brot. Phase 2: 6 weitere Artikel (Fisch, Milch/Sahne,
// Kräuter, Teig).
//
// `notRecommended: true` statt `months`, wenn Einfrieren grundsätzlich nicht
// empfohlen wird (z.B. Weich-/Frischkäse wird krümelig/wässrig).

export const FROZEN_SHELF_RULES = [
  { keys: ['hackfleisch', 'hackepeter', 'schabefleisch', 'tatar', 'mett'], category: 'Fleisch & Wurst', label: 'Hackfleisch / Mett (roh)', months: 3, prep: null, reason: 'Große Oberfläche, hohe Keimlast – Qualität und Sicherheit sinken nach dem Auftauen schneller als bei Braten/Steaks.' },
  { keys: ['hähnchen', 'haehnchen', 'hühner', 'huhn', 'pute', 'geflügel', 'gefluegel'], category: 'Fleisch & Wurst', label: 'Geflügel (roh)', months: 10, prep: null, reason: 'Ganz oder in Teilen gut einfrierbar; ganzes Geflügel hält sich tendenziell etwas länger als einzelne Teile.' },
  { keys: ['schnitzel', 'gulasch', 'steak', 'filet', 'kotelett', 'braten', 'rinderbraten', 'schweinebraten', 'fleisch'], category: 'Fleisch & Wurst', label: 'Rotes Fleisch (roh, Braten/Steak)', months: 8, prep: null, reason: 'Rind/Schwein roh eingefroren hält sich je nach Stück 6-12 Monate; Qualität nimmt danach graduell ab.' },
  { keys: ['lachs', 'hering', 'makrele', 'thunfisch', 'thun'], category: 'Fisch & Meeresfrüchte', label: 'Fettreicher Fisch (roh)', months: 3, prep: null, reason: 'Ungesättigte Fettsäuren oxidieren bei Minustemperaturen schneller als bei magerem Fisch – dadurch ranziger Geschmack nach längerer Lagerung.' },
  { keys: ['kabeljau', 'seelachs', 'scholle', 'zander', 'forelle', 'pangasius', 'fisch'], category: 'Fisch & Meeresfrüchte', label: 'Fettarmer Fisch (roh)', months: 6, prep: null, reason: 'Fettarme Sorten oxidieren langsamer und bleiben länger geschmacklich stabil als fettreiche Fischarten. Nach dem Auftauen nicht erneut einfrieren.' },
  { keys: ['aufschnitt', 'lyoner', 'mortadella', 'fleischwurst', 'bierschinken', 'kochschinken', 'gelbwurst', 'wiener', 'würstchen', 'wuerstchen', 'frankfurter', 'saitenwurst', 'schinken', 'wurst'], category: 'Fleisch & Wurst', label: 'Aufschnitt / Brühwurst', months: 2, prep: null, reason: 'In Originalverpackung eingefroren 1-3 Monate; vakuumiert deutlich länger. Nach dem Auftauen nicht erneut einfrieren.' },
  { keys: ['salami', 'dauerwurst', 'cervelat', 'landjäger', 'landjaeger', 'chorizo', 'pepperoni', 'speck', 'bacon', 'rohschinken', 'serrano', 'parma', 'prosciutto'], category: 'Fleisch & Wurst', label: 'Rohwurst / Speck', months: 2, prep: null, reason: 'Niedrigerer Wassergehalt als Brühwurst, aber ohne belastbare längere Richtwerte – konservativ wie Aufschnitt behandelt.' },
  { keys: ['parmesan', 'grana', 'pecorino', 'bergkäse', 'hartkäse', 'emmentaler'], category: 'Käse', label: 'Hartkäse', months: 6, prep: 'Am besten gerieben einfrieren.', reason: 'Niedriger Wassergehalt – friert am verträglichsten von allen Käsesorten ein.' },
  { keys: ['frischkäse', 'streichkäse', 'philadelphia', 'doppelrahm', 'mozzarella', 'ricotta', 'feta', 'hirtenkäse', 'schafskäse', 'camembert', 'brie', 'blauschimmel', 'gorgonzola', 'roquefort'], category: 'Käse', label: 'Weich- / Frischkäse', months: null, notRecommended: true, prep: null, reason: 'Hoher Wassergehalt – wird nach dem Auftauen krümelig, schmierig oder wässrig. Käse mit Schimmelrinde verändert zusätzlich Geschmack und Textur.' },
  { keys: ['gouda', 'cheddar', 'edamer', 'tilsiter', 'butterkäse', 'maasdamer', 'appenzeller', 'raclette'], category: 'Käse', label: 'Schnittkäse', months: 4, prep: 'Scheiben mit Butterbrotpapier trennen, damit sie nicht zusammenkleben.', reason: 'Fester als Weichkäse, aber etwas wasserreicher als Hartkäse – daher kürzere Frist.' },
  { keys: ['butter', 'margarine'], category: 'Fette & Eier', label: 'Butter / Margarine', months: 6, prep: null, reason: 'Gesalzene Butter hält sich eingefroren tendenziell länger (bis 12 Monate) als ungesalzene.' },
  { keys: ['sahne', 'obers'], category: 'Milchprodukte', label: 'Sahne', months: 3, prep: 'Luftdicht verpacken, Kontakt mit anderen Lebensmitteln vermeiden; am besten über Nacht im Kühlschrank auftauen.', reason: 'Gilt sowohl für flüssige als auch für bereits geschlagene Sahne.' },
  { keys: ['frischmilch', 'vollmilch', 'h-milch', 'milch'], category: 'Milchprodukte', label: 'Milch', months: 3, prep: 'Nach dem Auftauen gut schütteln/verrühren.', reason: 'Fett und Wasser trennen sich beim Einfrieren – Konsistenz leidet, daher nur zum Kochen verwenden, nicht pur trinken.' },
  { keys: ['brot', 'toast', 'brötchen', 'broetchen', 'baguette'], category: 'Backwaren & Teig', label: 'Brot / Backwaren', months: 3, prep: 'Vor dem Einfrieren auf Zimmertemperatur abkühlen lassen (sonst Kondensation).', reason: 'Aufgeschnitten/verpackt ca. 3 Monate; ein ganzer, unangeschnittener Laib hält sich auch bis zu 6 Monate.' },
  { keys: ['blätterteig', 'blaetterteig', 'hefeteig', 'pizzateig'], category: 'Backwaren & Teig', label: 'Teig (Blätter-/Hefeteig, roh)', months: 6, prep: 'Blätterteig am besten industriell gekauft einfrieren (selbstgemacht eher 2-3 Monate); Hefeteig roh vor dem Gehen einfrieren; Pizzateig direkt im Beutel flach ausrollen, taut dann schneller auf.', reason: 'Roh eingefroren bleibt die Hefe im Ruhezustand und kann nach dem Auftauen ihre volle Arbeit verrichten.' },
  { keys: ['erbsen', 'bohnen', 'brokkoli', 'blumenkohl', 'spinat', 'möhre', 'moehre', 'karotte', 'karotten', 'fenchel', 'kohlrabi', 'mangold', 'rosenkohl'], category: 'Obst & Gemüse', label: 'Gemüse (blanchiert)', months: 10, prep: 'Vorher blanchieren (3-5 Min. kochen, dann in Eiswasser abschrecken) – deaktiviert Enzyme, erhält Farbe und Vitamine.', reason: 'Ohne Blanchieren verlieren diese Sorten beim Einfrieren deutlich an Farbe, Textur und Vitaminen.' },
  { keys: ['zucchini', 'paprika', 'pilz', 'champignon', 'spargel', 'kürbis', 'kuerbis', 'lauchzwiebel', 'frühlingszwiebel', 'fruehlingszwiebel'], category: 'Obst & Gemüse', label: 'Gemüse (ohne Blanchieren)', months: 8, prep: null, reason: 'Fester bzw. wasserärmer – kann roh eingefroren werden, kein Blanchieren nötig.' },
  { keys: ['schnittlauch', 'petersilie', 'dill', 'thymian', 'estragon', 'melisse', 'minze', 'basilikum', 'kräuter', 'kraeuter'], category: 'Kräuter', label: 'Frische Kräuter', months: 10, prep: 'Gehackt in Eiswürfelbehältern mit etwas Wasser oder Öl einfrieren; Vakuumieren hält Aroma am besten.', reason: 'Bleiben so 6-12 Monate haltbar, verlieren aber über die Zeit zunehmend an Aroma – nach etwa einem Jahr oft schon spürbar schaler.' },
  { keys: ['beere', 'beeren', 'himbeere', 'himbeeren', 'heidelbeere', 'heidelbeeren', 'blaubeere', 'blaubeeren', 'erdbeere', 'erdbeeren', 'kirsche', 'kirschen', 'pfirsich', 'aprikose', 'apfel', 'äpfel', 'aepfel', 'birne', 'birnen', 'banane', 'bananen'], category: 'Obst & Gemüse', label: 'Obst / Beeren', months: 10, prep: 'Beeren einzeln auf einem Blech vorfrieren (verhindert Verklumpen); Steinobst vorher entsteinen; Bananen geschält in Scheiben.', reason: 'Beeren und Steinobst bis zu 12 Monate, Apfel-/Birnenscheiben 8-10 Monate, Bananenscheiben eher 3-6 Monate.' },
  { keys: ['suppe', 'eintopf', 'auflauf', 'fertiggericht', 'reste', 'soße', 'sosse', 'sauce', 'pasta', 'nudelgericht'], category: 'Fertiggerichte & Reste', label: 'Reste / gekochte Gerichte', months: 3, prep: 'Vor dem Einfrieren vollständig abkühlen lassen.', reason: 'Gilt als grobe Richtschnur für die meisten gekochten Gerichte, Suppen und Saucen.' },
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
