// Haltbarkeit nach dem Öffnen. Sobald ein Artikel als „geöffnet" markiert ist,
// gilt oft eine kürzere Frist als das gedruckte MHD (z.B. Milch ~5 Tage).
//
// Statt einer echten KI (die einen Server + API-Schlüssel bräuchte und offline
// nicht ginge) nutzen wir eine eingebaute Stichwort-Tabelle. Pro Lebensmittel
// lässt sich der Wert in den Stammdaten (`openedDays`) manuell überschreiben.

import { daysUntil } from './date.js';

// [Stichwörter, Tage] – spezifischere Einträge zuerst (erster Treffer gewinnt).
export const OPENED_SHELF_RULES = [
  [['hackfleisch', 'mett', 'tatar'], 1],
  [['frischmilch', 'vollmilch', 'h-milch', 'milch'], 5],
  [['joghurt', 'skyr', 'quark', 'kefir'], 7],
  [['kochsahne', 'schlagsahne', 'sahne', 'schmand', 'crème', 'creme fraiche', 'crème fraîche'], 4],
  [['frischkäse', 'hüttenkäse', 'mozzarella', 'ricotta', 'feta'], 5],
  [['grillkäse', 'halloumi', 'emmentaler', 'gouda', 'cheddar', 'parmesan', 'käse', 'kaese'], 14],
  [['wurst', 'aufschnitt', 'schinken', 'salami', 'speck', 'bacon'], 4],
  [['hähnchen', 'haehnchen', 'pute', 'geflügel', 'gefluegel', 'steak', 'filet', 'fleisch'], 2],
  [['lachs', 'thunfisch', 'thun', 'forelle', 'garnele', 'fisch'], 2],
  [['saft', 'smoothie', 'nektar'], 4],
  [['pudding', 'milchreis', 'dessert'], 3],
  [['pesto'], 7],
  [['ketchup', 'mayo', 'mayonnaise', 'dressing', 'sauce', 'soße', 'sosse', 'senf'], 21],
  [['marmelade', 'konfitüre', 'konfiture', 'honig'], 60],
  [['hummus'], 4],
  [['tofu'], 3],
  [['butter', 'margarine'], 30],
  [['eier', 'ei'], 21],
  [['brot', 'toast', 'wrap', 'brötchen', 'broetchen'], 4],
  // Konserven nach dem Umfüllen (Dose, Bohnen, Mais …)
  [['konserve', 'dose', 'bohnen', 'mais', 'erbsen', 'möhr', 'moehr', 'tomaten'], 3],
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
