// Haltbarkeit nach dem Öffnen. Sobald ein Artikel als „geöffnet" markiert ist,
// gilt oft eine kürzere Frist als das gedruckte MHD (z.B. Milch ~5 Tage).
//
// Statt einer echten KI (die einen Server + API-Schlüssel bräuchte und offline
// nicht ginge) nutzen wir eine eingebaute Stichwort-Tabelle. Pro Lebensmittel
// lässt sich der Wert in den Stammdaten (`openedDays`) manuell überschreiben.

import { daysUntil } from './date.js';

// [Stichwörter, Tage] – Reihenfolge ist wichtig: der ERSTE Treffer (Teilstring
// im kleingeschriebenen Namen) gewinnt, deshalb Spezifisches vor Allgemeinem
// (z.B. „Frischkäse" vor „Käse", „Fleischwurst" vor „Fleisch").
export const OPENED_SHELF_RULES = [
  // — Feinkost-/Mayo-Salate & streichfähige Rohwurst: sehr leicht verderblich —
  [['fleischsalat', 'wurstsalat', 'kartoffelsalat', 'nudelsalat', 'eiersalat', 'feinkostsalat', 'heringssalat', 'geflügelsalat'], 2],
  [['leberwurst', 'teewurst', 'mettwurst', 'streichwurst', 'zwiebelmett', 'pastete', 'pâté', 'rillette'], 3],
  // — Rohes Hackfleisch / Tatar: am Kauftag verbrauchen —
  [['hackfleisch', 'hackepeter', 'schabefleisch', 'tatar', 'mett'], 1],
  // — Rohe Bratwurst —
  [['bratwurst', 'rostbratwurst', 'grillwurst'], 2],
  // — Räucherfisch (haltbarer als roher Fisch) / roher Fisch —
  [['räucherlachs', 'raeucherlachs', 'räucherforelle', 'räucherfisch', 'raeucherfisch', 'matjes', 'graved'], 3],
  [['sushi', 'sashimi'], 1],
  [['lachs', 'thunfisch', 'thun', 'forelle', 'garnele', 'shrimp', 'scampi', 'muschel', 'meeresfrüchte', 'fisch'], 2],
  [['burrata'], 2],
  [['guacamole'], 2],
  // — Rohwurst / Dauerwurst (luftgetrocknet, haltbar) —
  [['salami', 'dauerwurst', 'cervelat', 'landjäger', 'landjaeger', 'chorizo', 'pepperoni', 'kaminwurz'], 21],
  [['speck', 'bacon', 'rohschinken', 'serrano', 'parma', 'prosciutto', 'katenschinken', 'schwarzwälder'], 14],
  // — Aufschnitt / Brühwurst / Kochschinken (vor rohem Fleisch, damit
  //   „Fleischwurst" hier landet und nicht bei „Fleisch") —
  [['aufschnitt', 'lyoner', 'mortadella', 'fleischwurst', 'bierschinken', 'kochschinken', 'gelbwurst', 'wiener', 'würstchen', 'wuerstchen', 'frankfurter', 'saitenwurst', 'schinken', 'wurst'], 4],
  // — Rohes Geflügel / Fleisch / Fisch-Filet —
  [['hähnchen', 'haehnchen', 'hühner', 'huhn', 'pute', 'geflügel', 'gefluegel', 'schnitzel', 'gulasch', 'steak', 'filet', 'kotelett', 'fleisch'], 2],

  // — Milch & Milchprodukte (Milchreis/Pudding vor „Milch") —
  [['milchreis', 'pudding', 'grießbrei', 'griessbrei', 'dessert', 'mousse'], 3],
  [['buttermilch'], 7],
  [['hafermilch', 'haferdrink', 'sojamilch', 'sojadrink', 'mandelmilch', 'mandeldrink', 'reisdrink', 'kokosmilch', 'pflanzendrink', 'pflanzenmilch'], 5],
  [['frischmilch', 'vollmilch', 'h-milch', 'milch'], 5],
  [['joghurt', 'skyr', 'quark', 'kefir', 'ayran'], 7],
  [['crème fraîche', 'creme fraiche', 'crème fraiche', 'schmand', 'saure sahne', 'sauerrahm'], 7],
  [['schlagsahne', 'kochsahne', 'sahne', 'obers'], 4],

  // — Käse (nach Frischegrad; alle spezifischen vor „Käse") —
  [['frischkäse', 'streichkäse', 'philadelphia', 'doppelrahm'], 10],
  [['feta', 'hirtenkäse', 'schafskäse'], 14],
  [['mozzarella', 'ricotta', 'hüttenkäse', 'huettenkaese', 'cottage', 'mascarpone'], 5],
  [['grillkäse', 'halloumi'], 7],
  [['schmelzkäse', 'scheibletten'], 14],
  [['gerieben', 'reibekäse', 'pizzakäse'], 5],
  [['parmesan', 'grana', 'pecorino', 'bergkäse', 'hartkäse'], 21],
  [['emmentaler', 'gouda', 'cheddar', 'edamer', 'tilsiter', 'butterkäse', 'maasdamer', 'appenzeller', 'raclette', 'käse', 'kaese'], 14],

  // — Nussmus/Schokocreme VOR „Butter" (sonst landet „Erdnussbutter" bei Butter) —
  [['erdnussbutter', 'erdnussmus', 'mandelmus', 'nussmus', 'nutella', 'schokocreme', 'nougatcreme'], 60],
  // — Fette / Eier (nach den *milch/*käse-Regeln, sonst würde „Buttermilch"
  //   bzw. „Butterkäse" hier hängenbleiben) —
  [['butter', 'margarine'], 30],
  [['eier', 'eierkarton'], 21],

  // — Pflanzlich / frische Feinkost —
  [['räuchertofu', 'raeuchertofu'], 7],
  [['tofu', 'tempeh', 'seitan'], 4],
  [['hummus'], 5],
  [['tzatziki', 'zaziki', 'kräuterquark', 'kraeuterquark', 'dip'], 4],
  [['tortellini', 'ravioli', 'gnocchi', 'frische pasta', 'frische nudeln'], 3],

  // — Aufstriche & haltbare Gläser (viel Zucker/Salz/Säure/Fett) —
  [['marmelade', 'konfitüre', 'konfiture', 'fruchtaufstrich', 'gelee'], 30],
  [['honig'], 180],
  [['pesto'], 7],
  [['tomatenmark'], 7],
  [['passata', 'passierte tomaten'], 4],
  [['oliven', 'antipasti', 'eingelegt', 'in öl', 'getrocknete tomaten'], 14],

  // — Saucen & Würzmittel (spezifische Kondimente vor generischer „Sauce") —
  [['ketchup'], 30],
  [['mayonnaise', 'remoulade', 'mayo'], 60],
  [['senf'], 60],
  [['sojasauce', 'sojasoße', 'fischsauce', 'austernsauce'], 90],
  [['sriracha', 'tabasco', 'hot sauce', 'chilisauce', 'chili sauce'], 60],
  [['teriyaki', 'barbecue', 'bbq', 'grillsauce', 'taco', 'worcester', 'hoisin'], 30],
  [['salsa'], 5],
  [['salatdressing', 'dressing', 'vinaigrette'], 21],
  [['sauce', 'soße', 'sosse'], 5],

  // — Getränke —
  [['smoothie'], 2],
  [['saft', 'direktsaft', 'nektar', 'schorle'], 5],
  [['limonade', 'cola', 'softdrink', 'eistee'], 5],
  [['likör', 'likoer', 'spirituose', 'schnaps'], 365],
  [['wein', 'sekt', 'prosecco'], 5],

  // — Backwaren —
  [['brot', 'toast', 'brötchen', 'broetchen', 'wrap', 'baguette'], 4],

  // — Konserven/Gläser nach dem Öffnen bzw. Umfüllen —
  [['konserve', 'dose', 'bohnen', 'mais', 'erbsen', 'linsen', 'kichererbsen', 'möhr', 'moehr', 'karotten', 'tomaten'], 3],
];

// Regelbasierter Standardwert anhand des Artikelnamens (oder null).
export function shelfLifeAfterOpening(name) {
  const n = (name || '').toLowerCase();
  if (!n) return null;
  for (const [keys, days] of OPENED_SHELF_RULES) {
    if (keys.some((k) => n.includes(k))) return days;
  }
  return null;
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
