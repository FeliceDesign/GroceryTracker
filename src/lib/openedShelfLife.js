// Haltbarkeit nach dem Öffnen. Sobald ein Artikel als „geöffnet" markiert ist,
// gilt oft eine kürzere Frist als das gedruckte MHD (z.B. Milch ~5 Tage).
//
// Statt einer echten KI (die einen Server + API-Schlüssel bräuchte und offline
// nicht ginge) nutzen wir eine eingebaute Stichwort-Tabelle. Pro Lebensmittel
// lässt sich der Wert in den Stammdaten (`openedDays`) manuell überschreiben.
//
// Jede Regel: { keys, days, storage, category, label, reason }.
//  storage: 'fridge' (Kühlschrank) | 'room' (Raumtemperatur) | 'both'
// Reihenfolge ist wichtig: der ERSTE Treffer (Teilstring im kleingeschriebenen
// Namen) gewinnt, deshalb Spezifisches vor Allgemeinem („Frischkäse" vor
// „Käse", „Fleischwurst" vor „Fleisch"). `category` dient NUR der Anzeige
// (Gruppierung im Ratgeber) und darf die Matching-Reihenfolge oben nicht
// beeinflussen.

import { daysUntil } from './date.js';

export const OPENED_SHELF_RULES = [
  // — Feinkost-/Mayo-Salate & streichfähige Rohwurst —
  { keys: ['fleischsalat', 'wurstsalat', 'kartoffelsalat', 'nudelsalat', 'eiersalat', 'feinkostsalat', 'heringssalat', 'geflügelsalat'], days: 2, storage: 'fridge', category: 'Feinkost & Fertigsalate', label: 'Feinkost-/Mayo-Salat', reason: 'Mayonnaise + eiweißreich, oft schon länger verarbeitet → schnell verderblich.' },
  { keys: ['leberwurst', 'teewurst', 'mettwurst', 'streichwurst', 'zwiebelmett', 'pastete', 'pâté', 'rillette'], days: 3, storage: 'fridge', category: 'Fleisch & Wurst', label: 'Streichwurst', reason: 'Streichfähige Rohwurst, feucht → schneller verderblich als Aufschnitt.' },
  { keys: ['hackfleisch', 'hackepeter', 'schabefleisch', 'tatar', 'mett'], days: 1, storage: 'fridge', category: 'Fleisch & Wurst', label: 'Rohes Hack / Mett', reason: 'Riesige Oberfläche + roh → extrem schnelle Keimvermehrung; am Kauftag verbrauchen.' },
  { keys: ['bratwurst', 'rostbratwurst', 'grillwurst'], days: 2, storage: 'fridge', category: 'Fleisch & Wurst', label: 'Rohe Bratwurst', reason: 'Rohes Brät, hohe Keimlast.' },
  { keys: ['räucherlachs', 'raeucherlachs', 'räucherforelle', 'räucherfisch', 'raeucherfisch', 'matjes', 'graved'], days: 3, storage: 'fridge', category: 'Fisch & Meeresfrüchte', label: 'Räucherfisch', reason: 'Räuchern/Salzen hemmt Keime → etwas länger haltbar als roher Fisch.' },
  { keys: ['sushi', 'sashimi'], days: 1, storage: 'fridge', category: 'Fisch & Meeresfrüchte', label: 'Sushi / Sashimi', reason: 'Roher Fisch + Reis → höchstes Risiko, am selben Tag essen.' },
  { keys: ['lachs', 'thunfisch', 'thun', 'forelle', 'garnele', 'shrimp', 'scampi', 'muschel', 'meeresfrüchte', 'fisch'], days: 2, storage: 'fridge', category: 'Fisch & Meeresfrüchte', label: 'Roher Fisch / Meeresfrüchte', reason: 'Sehr verderblich; schnelle Histamin-/Keimbildung.' },
  { keys: ['burrata'], days: 2, storage: 'fridge', category: 'Käse', label: 'Burrata', reason: 'Ultra-frisch, sehr feucht.' },
  { keys: ['guacamole'], days: 2, storage: 'fridge', category: 'Pflanzlich & Frische Feinkost', label: 'Guacamole', reason: 'Oxidiert und verdirbt schnell.' },
  // — Rohwurst / Dauerwurst (haltbarer) —
  { keys: ['salami', 'dauerwurst', 'cervelat', 'landjäger', 'landjaeger', 'chorizo', 'pepperoni', 'kaminwurz'], days: 21, storage: 'fridge', category: 'Fleisch & Wurst', label: 'Rohwurst / Salami', reason: 'Luftgetrocknet, niedrige Wasseraktivität → deutlich haltbarer.' },
  { keys: ['speck', 'bacon', 'rohschinken', 'serrano', 'parma', 'prosciutto', 'katenschinken', 'schwarzwälder'], days: 14, storage: 'fridge', category: 'Fleisch & Wurst', label: 'Speck / Rohschinken', reason: 'Gepökelt/luftgetrocknet, salzhaltig → deutlich haltbarer.' },
  { keys: ['aufschnitt', 'lyoner', 'mortadella', 'fleischwurst', 'bierschinken', 'kochschinken', 'gelbwurst', 'wiener', 'würstchen', 'wuerstchen', 'frankfurter', 'saitenwurst', 'schinken', 'wurst'], days: 4, storage: 'fridge', category: 'Fleisch & Wurst', label: 'Aufschnitt / Brühwurst', reason: 'Angeschnitten und offen; Verbraucherzentrale nennt 3–4 Tage.' },
  { keys: ['hähnchen', 'haehnchen', 'hühner', 'huhn', 'pute', 'geflügel', 'gefluegel', 'schnitzel', 'gulasch', 'steak', 'filet', 'kotelett', 'fleisch'], days: 2, storage: 'fridge', category: 'Fleisch & Wurst', label: 'Rohes Fleisch / Geflügel', reason: 'Salmonellen/Campylobacter-Risiko; Geflügel besonders heikel.' },

  // — Milch & Milchprodukte —
  { keys: ['milchreis', 'pudding', 'grießbrei', 'griessbrei', 'dessert', 'mousse'], days: 3, storage: 'fridge', category: 'Milchprodukte', label: 'Milchdessert', reason: 'Offene Milchdesserts verderben schnell.' },
  { keys: ['buttermilch'], days: 7, storage: 'fridge', category: 'Milchprodukte', label: 'Buttermilch', reason: 'Säuerlich → etwas stabiler als Milch.' },
  { keys: ['hafermilch', 'haferdrink', 'sojamilch', 'sojadrink', 'mandelmilch', 'mandeldrink', 'reisdrink', 'kokosmilch', 'pflanzendrink', 'pflanzenmilch'], days: 5, storage: 'fridge', category: 'Milchprodukte', label: 'Pflanzendrink', reason: 'Nach dem Öffnen wie Milch verderblich.' },
  { keys: ['frischmilch', 'vollmilch', 'h-milch', 'milch'], days: 5, storage: 'fridge', category: 'Milchprodukte', label: 'Milch', reason: 'Frischmilch offen 3–5 Tage, H-Milch bis ~7 → 5 als Mittelwert.' },
  { keys: ['joghurt', 'skyr', 'quark', 'kefir', 'ayran'], days: 7, storage: 'fridge', category: 'Milchprodukte', label: 'Joghurt / Skyr / Quark', reason: 'Säuerlich; Milchsäurekulturen hemmen Keime.' },
  { keys: ['crème fraîche', 'creme fraiche', 'crème fraiche', 'schmand', 'saure sahne', 'sauerrahm'], days: 7, storage: 'fridge', category: 'Milchprodukte', label: 'Crème fraîche / Schmand', reason: 'Hoher Fett- und Säureanteil.' },
  { keys: ['schlagsahne', 'kochsahne', 'sahne', 'obers'], days: 4, storage: 'fridge', category: 'Milchprodukte', label: 'Sahne', reason: 'Fettreich, pasteurisiert; offen 3–5 Tage.' },

  // — Käse (nach Frischegrad) —
  { keys: ['frischkäse', 'streichkäse', 'philadelphia', 'doppelrahm'], days: 10, storage: 'fridge', category: 'Käse', label: 'Frischkäse (streichfähig)', reason: 'Durch Säure/Salz konserviert; offen 1–2 Wochen.' },
  { keys: ['feta', 'hirtenkäse', 'schafskäse'], days: 14, storage: 'fridge', category: 'Käse', label: 'Feta / Schafskäse', reason: 'Salzlake konserviert.' },
  { keys: ['mozzarella', 'ricotta', 'hüttenkäse', 'huettenkaese', 'cottage', 'mascarpone'], days: 5, storage: 'fridge', category: 'Käse', label: 'Mozzarella / Ricotta', reason: 'Frischkäse mit hohem Wassergehalt.' },
  { keys: ['grillkäse', 'halloumi'], days: 7, storage: 'fridge', category: 'Käse', label: 'Grillkäse / Halloumi', reason: 'Fester und salzhaltig.' },
  { keys: ['schmelzkäse', 'scheibletten'], days: 14, storage: 'fridge', category: 'Käse', label: 'Schmelzkäse', reason: 'Verarbeitet und stabilisiert.' },
  { keys: ['gerieben', 'reibekäse', 'pizzakäse'], days: 5, storage: 'fridge', category: 'Käse', label: 'Geriebener Käse', reason: 'Große Oberfläche → schimmelt/trocknet schneller.' },
  { keys: ['parmesan', 'grana', 'pecorino', 'bergkäse', 'hartkäse'], days: 21, storage: 'fridge', category: 'Käse', label: 'Hartkäse', reason: 'Sehr trocken und gereift → lange haltbar.' },
  { keys: ['emmentaler', 'gouda', 'cheddar', 'edamer', 'tilsiter', 'butterkäse', 'maasdamer', 'appenzeller', 'raclette', 'käse', 'kaese'], days: 14, storage: 'fridge', category: 'Käse', label: 'Schnittkäse', reason: 'Fester, niedrigere Wasseraktivität.' },

  // — Nussmus/Schokocreme VOR „Butter" (sonst landet „Erdnussbutter" bei Butter) —
  { keys: ['erdnussbutter', 'erdnussmus', 'mandelmus', 'nussmus', 'nutella', 'schokocreme', 'nougatcreme'], days: 60, storage: 'room', category: 'Fette & Eier', label: 'Nussmus / Schokocreme', reason: 'Fett + wenig Wasser; Kühlung macht nur hart, ist nicht nötig.' },
  { keys: ['butter', 'margarine'], days: 30, storage: 'fridge', category: 'Fette & Eier', label: 'Butter / Margarine', reason: 'Fett, wenig Wasser; offen mehrere Wochen.' },
  { keys: ['eier', 'eierkarton'], days: 21, storage: 'fridge', category: 'Fette & Eier', label: 'Eier', reason: 'Halten gekühlt etwa 3 Wochen.' },

  // — Pflanzlich / frische Feinkost —
  { keys: ['räuchertofu', 'raeuchertofu'], days: 7, storage: 'fridge', category: 'Pflanzlich & Frische Feinkost', label: 'Räuchertofu', reason: 'Geräuchert → stabiler als frischer Tofu.' },
  { keys: ['tofu', 'tempeh', 'seitan'], days: 4, storage: 'fridge', category: 'Pflanzlich & Frische Feinkost', label: 'Tofu / Tempeh', reason: 'Offen (in Wasser) empfindlich.' },
  { keys: ['hummus'], days: 5, storage: 'fridge', category: 'Pflanzlich & Frische Feinkost', label: 'Hummus', reason: 'Kichererbsenpüree, empfindlich.' },
  { keys: ['tzatziki', 'zaziki', 'kräuterquark', 'kraeuterquark', 'dip'], days: 4, storage: 'fridge', category: 'Pflanzlich & Frische Feinkost', label: 'Tzatziki / Dip', reason: 'Joghurt-/Quark-basiert.' },
  { keys: ['tortellini', 'ravioli', 'gnocchi', 'frische pasta', 'frische nudeln'], days: 3, storage: 'fridge', category: 'Pflanzlich & Frische Feinkost', label: 'Frische Pasta', reason: 'Frisch, teils mit Ei/Füllung.' },

  // — Aufstriche & haltbare Gläser —
  { keys: ['marmelade', 'konfitüre', 'konfiture', 'fruchtaufstrich', 'gelee'], days: 30, storage: 'fridge', category: 'Aufstriche & Konserven', label: 'Marmelade / Konfitüre', reason: 'Hoher Zuckergehalt konserviert; offen üblicherweise gekühlt.' },
  { keys: ['honig'], days: 180, storage: 'room', category: 'Aufstriche & Konserven', label: 'Honig', reason: 'Praktisch unbegrenzt haltbar; Kühlung fördert Kristallisation → nicht kühlen.' },
  { keys: ['pesto'], days: 7, storage: 'fridge', category: 'Aufstriche & Konserven', label: 'Pesto', reason: 'Öl-Schutzschicht, aber frische Zutaten.' },
  { keys: ['tomatenmark'], days: 7, storage: 'fridge', category: 'Aufstriche & Konserven', label: 'Tomatenmark', reason: 'Konzentriert; schimmelt an der Oberfläche.' },
  { keys: ['passata', 'passierte tomaten'], days: 4, storage: 'fridge', category: 'Aufstriche & Konserven', label: 'Passata', reason: 'Kaum konserviert, schimmelt schnell.' },
  { keys: ['oliven', 'antipasti', 'eingelegt', 'in öl', 'getrocknete tomaten'], days: 14, storage: 'fridge', category: 'Aufstriche & Konserven', label: 'Oliven / Antipasti', reason: 'Öl/Salz/Säure konservieren.' },

  // — Saucen & Würzmittel —
  { keys: ['ketchup'], days: 30, storage: 'both', category: 'Saucen & Würzmittel', label: 'Ketchup', reason: 'Säure + Zucker; hält auch ungekühlt Wochen, gekühlt länger.' },
  { keys: ['mayonnaise', 'remoulade', 'mayo'], days: 60, storage: 'fridge', category: 'Saucen & Würzmittel', label: 'Mayonnaise / Remoulade', reason: 'Industriell säurestabilisiert; nach dem Öffnen kühlen.' },
  { keys: ['senf'], days: 60, storage: 'both', category: 'Saucen & Würzmittel', label: 'Senf', reason: 'Säure/Senföle konservieren stark; gekühlt aromastabiler.' },
  { keys: ['sojasauce', 'sojasoße', 'fischsauce', 'austernsauce'], days: 90, storage: 'both', category: 'Saucen & Würzmittel', label: 'Soja-/Fischsauce', reason: 'Extrem salzig; ungekühlt haltbar, gekühlt aromastabiler.' },
  { keys: ['sriracha', 'tabasco', 'hot sauce', 'chilisauce', 'chili sauce'], days: 60, storage: 'both', category: 'Saucen & Würzmittel', label: 'Chili- / Hot Sauce', reason: 'Sehr sauer und scharf; ungekühlt haltbar.' },
  { keys: ['teriyaki', 'barbecue', 'bbq', 'grillsauce', 'taco', 'worcester', 'hoisin'], days: 30, storage: 'both', category: 'Saucen & Würzmittel', label: 'BBQ-/Teriyaki-Sauce', reason: 'Zucker/Salz/Säure-Kondimente; Kühlung verlängert.' },
  { keys: ['salsa'], days: 5, storage: 'fridge', category: 'Saucen & Würzmittel', label: 'Salsa (frisch)', reason: 'Frische Tomaten/Zwiebel.' },
  { keys: ['salatdressing', 'dressing', 'vinaigrette'], days: 21, storage: 'fridge', category: 'Saucen & Würzmittel', label: 'Salatdressing', reason: 'Säure + Öl hemmen Keime.' },
  { keys: ['sauce', 'soße', 'sosse'], days: 5, storage: 'fridge', category: 'Saucen & Würzmittel', label: 'Sauce / Soße', reason: 'Sicherheitshalber kurz – frische Kühl-Saucen verderben schnell.' },

  // — Getränke —
  { keys: ['smoothie'], days: 2, storage: 'fridge', category: 'Getränke', label: 'Smoothie', reason: 'Frisches Obst/Gemüse ohne Schutz.' },
  { keys: ['saft', 'direktsaft', 'nektar', 'schorle'], days: 5, storage: 'fridge', category: 'Getränke', label: 'Saft', reason: 'Offen gekühlt etwa 5–7 Tage.' },
  { keys: ['limonade', 'cola', 'softdrink', 'eistee'], days: 5, storage: 'fridge', category: 'Getränke', label: 'Limonade', reason: 'Verliert Kohlensäure; mikrobiell unkritisch.' },
  { keys: ['likör', 'likoer', 'spirituose', 'schnaps'], days: 365, storage: 'room', category: 'Getränke', label: 'Likör / Spirituose', reason: 'Alkohol/Zucker konservieren fast unbegrenzt; Kühlung irrelevant.' },
  { keys: ['wein', 'sekt', 'prosecco'], days: 5, storage: 'fridge', category: 'Getränke', label: 'Wein / Sekt', reason: 'Oxidation (Geschmack), keine Sicherheitsfrage.' },

  // — Backwaren —
  { keys: ['brot', 'toast', 'brötchen', 'broetchen', 'wrap', 'baguette'], days: 4, storage: 'room', category: 'Backwaren', label: 'Brot / Backwaren', reason: 'Brotkasten; im Kühlschrank altert Brot schneller (Retrogradation) → nicht kühlen.' },

  // — Konserven/Gläser nach dem Öffnen/Umfüllen —
  { keys: ['konserve', 'dose', 'bohnen', 'mais', 'erbsen', 'linsen', 'kichererbsen', 'möhr', 'moehr', 'karotten', 'tomaten'], days: 3, storage: 'fridge', category: 'Aufstriche & Konserven', label: 'Konserve (offen)', reason: 'Nach dem Öffnen/Umfüllen wie frisch gekocht behandeln.' },
];

// Passende Regel zum Artikelnamen (oder null).
export function shelfLifeRule(name) {
  const n = (name || '').toLowerCase();
  if (!n) return null;
  for (const r of OPENED_SHELF_RULES) {
    if (r.keys.some((k) => n.includes(k))) return r;
  }
  return null;
}

// Regelbasierter Standardwert anhand des Artikelnamens (oder null).
export function shelfLifeAfterOpening(name) {
  const r = shelfLifeRule(name);
  return r ? r.days : null;
}

// Info-Objekt für die „Warum?"-Anzeige: { days, storage, reason, label } | null.
export function shelfLifeInfo(name) {
  const r = shelfLifeRule(name);
  if (!r) return null;
  return { days: r.days, storage: r.storage, reason: r.reason, label: r.label };
}

// Aufgelöste Öffnungs-Haltbarkeit: manueller Override (food.openedDays) hat
// Vorrang, sonst die Regel-Tabelle. Gibt Tage oder null zurück.
export function openedDaysFor(name, food) {
  if (food && food.openedDays != null && food.openedDays !== '') {
    const v = Number(food.openedDays);
    return Number.isFinite(v) ? v : null;
  }
  return shelfLifeAfterOpening(name);
}

export function storageLabel(storage) {
  if (storage === 'room') return 'Raumtemperatur';
  if (storage === 'both') return 'Raumtemp. oder Kühlschrank';
  return 'Kühlschrank';
}

// Ist ein Lagerort „kalt"? Nutzt das Flag `cooled`, sonst eine Namens-Heuristik.
export function zoneIsCooled(zone) {
  if (!zone) return false;
  if (zone.cooled != null) return !!zone.cooled;
  return /kühl|kuehl|gefrier|kalt|fridge|freezer|frost/i.test(zone.label || '');
}

// Passt der Lagerort zur Empfehlung? Gibt einen Hinweistext zurück oder null.
export function storageMismatch(storage, zone) {
  if (!storage || !zone) return null;
  const cooled = zoneIsCooled(zone);
  if (storage === 'room' && cooled) return 'Gehört eigentlich nicht in den Kühlschrank.';
  if (storage === 'fridge' && !cooled) return 'Sollte gekühlt gelagert werden.';
  return null;
}

function addDaysISO(iso, days) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// „Verbrauchen bis"-Datum eines geöffneten Artikels (Öffnungsdatum + Tage);
// null, wenn nicht geöffnet oder keine Haltbarkeit bekannt.
export function openedUntil(item, days) {
  if (!item || !item.opened || !item.openedAt || days == null) return null;
  return addDaysISO(item.openedAt, days);
}

// Effektives „verbrauchen bis"-Datum: das frühere von gedrucktem MHD und der
// Öffnungs-Haltbarkeit. { date, source } mit source 'opened' | 'mhd' | null.
export function effectiveExpiry(item, days) {
  const ou = openedUntil(item, days);
  const mhd = item && item.mhd ? item.mhd : null;
  if (ou && mhd) {
    return daysUntil(ou) < daysUntil(mhd) ? { date: ou, source: 'opened' } : { date: mhd, source: 'mhd' };
  }
  if (ou) return { date: ou, source: 'opened' };
  if (mhd) return { date: mhd, source: 'mhd' };
  return { date: null, source: null };
}
