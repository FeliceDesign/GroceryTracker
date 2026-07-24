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
// beeinflussen. `label_en`/`reason_en`/`category_en` sind die Übersetzungen
// fürs englische UI (siehe lib/i18n.js), `keys` bleiben unabhängig von der
// UI-Sprache immer Deutsch (Matching gegen die – deutschen – Artikelnamen).

import { daysUntil } from './date.js';
import { tr } from './i18n.js';

export const OPENED_SHELF_RULES = [
  // — Feinkost-/Mayo-Salate & streichfähige Rohwurst —
  { keys: ['fleischsalat', 'wurstsalat', 'kartoffelsalat', 'nudelsalat', 'eiersalat', 'feinkostsalat', 'heringssalat', 'geflügelsalat'], days: 2, storage: 'fridge', category: 'Feinkost & Fertigsalate', category_en: 'Deli & Ready-Made Salads', label: 'Feinkost-/Mayo-Salat', label_en: 'Deli/mayo salad', reason: 'Mayonnaise + eiweißreich, oft schon länger verarbeitet → schnell verderblich.', reason_en: 'Mayonnaise-based and high in protein, often already processed for a while → spoils quickly.' },
  { keys: ['leberwurst', 'teewurst', 'mettwurst', 'streichwurst', 'zwiebelmett', 'pastete', 'pâté', 'rillette'], days: 3, storage: 'fridge', category: 'Fleisch & Wurst', category_en: 'Meat & Sausage', label: 'Streichwurst', label_en: 'Spreadable sausage', reason: 'Streichfähige Rohwurst, feucht → schneller verderblich als Aufschnitt.', reason_en: 'Spreadable raw sausage, moist → spoils faster than sliced cold cuts.' },
  { keys: ['hackfleisch', 'hackepeter', 'schabefleisch', 'tatar', 'mett'], days: 1, storage: 'fridge', category: 'Fleisch & Wurst', category_en: 'Meat & Sausage', label: 'Rohes Hack / Mett', label_en: 'Raw ground meat', reason: 'Riesige Oberfläche + roh → extrem schnelle Keimvermehrung; am Kauftag verbrauchen.', reason_en: 'Huge surface area + raw → bacteria multiply extremely fast; use on the day of purchase.' },
  { keys: ['bratwurst', 'rostbratwurst', 'grillwurst'], days: 2, storage: 'fridge', category: 'Fleisch & Wurst', category_en: 'Meat & Sausage', label: 'Rohe Bratwurst', label_en: 'Raw bratwurst', reason: 'Rohes Brät, hohe Keimlast.', reason_en: 'Raw sausage meat, high bacterial load.' },
  { keys: ['räucherlachs', 'raeucherlachs', 'räucherforelle', 'räucherfisch', 'raeucherfisch', 'matjes', 'graved'], days: 3, storage: 'fridge', category: 'Fisch & Meeresfrüchte', category_en: 'Fish & Seafood', label: 'Räucherfisch', label_en: 'Smoked fish', reason: 'Räuchern/Salzen hemmt Keime → etwas länger haltbar als roher Fisch.', reason_en: 'Smoking/salting inhibits bacteria → keeps a bit longer than raw fish.' },
  { keys: ['sushi', 'sashimi'], days: 1, storage: 'fridge', category: 'Fisch & Meeresfrüchte', category_en: 'Fish & Seafood', label: 'Sushi / Sashimi', label_en: 'Sushi / sashimi', reason: 'Roher Fisch + Reis → höchstes Risiko, am selben Tag essen.', reason_en: 'Raw fish + rice → highest risk, eat the same day.' },
  { keys: ['lachs', 'thunfisch', 'thun', 'forelle', 'garnele', 'shrimp', 'scampi', 'muschel', 'meeresfrüchte', 'fisch'], days: 2, storage: 'fridge', category: 'Fisch & Meeresfrüchte', category_en: 'Fish & Seafood', label: 'Roher Fisch / Meeresfrüchte', label_en: 'Raw fish / seafood', reason: 'Sehr verderblich; schnelle Histamin-/Keimbildung.', reason_en: 'Highly perishable; histamine/bacteria form quickly.' },
  { keys: ['burrata'], days: 2, storage: 'fridge', category: 'Käse', category_en: 'Cheese', label: 'Burrata', label_en: 'Burrata', reason: 'Ultra-frisch, sehr feucht.', reason_en: 'Ultra-fresh, very moist.' },
  { keys: ['guacamole'], days: 2, storage: 'fridge', category: 'Pflanzlich & Frische Feinkost', category_en: 'Plant-Based & Fresh Deli', label: 'Guacamole', label_en: 'Guacamole', reason: 'Oxidiert und verdirbt schnell.', reason_en: 'Oxidizes and spoils quickly.' },
  // — Rohwurst / Dauerwurst (haltbarer) —
  { keys: ['salami', 'dauerwurst', 'cervelat', 'landjäger', 'landjaeger', 'chorizo', 'pepperoni', 'kaminwurz'], days: 21, storage: 'fridge', category: 'Fleisch & Wurst', category_en: 'Meat & Sausage', label: 'Rohwurst / Salami', label_en: 'Cured sausage / salami', reason: 'Luftgetrocknet, niedrige Wasseraktivität → deutlich haltbarer.', reason_en: 'Air-dried, low water activity → keeps much longer.' },
  { keys: ['speck', 'bacon', 'rohschinken', 'serrano', 'parma', 'prosciutto', 'katenschinken', 'schwarzwälder'], days: 14, storage: 'fridge', category: 'Fleisch & Wurst', category_en: 'Meat & Sausage', label: 'Speck / Rohschinken', label_en: 'Bacon / cured ham', reason: 'Gepökelt/luftgetrocknet, salzhaltig → deutlich haltbarer.', reason_en: 'Cured/air-dried, salty → keeps much longer.' },
  { keys: ['aufschnitt', 'lyoner', 'mortadella', 'fleischwurst', 'bierschinken', 'kochschinken', 'gelbwurst', 'wiener', 'würstchen', 'wuerstchen', 'frankfurter', 'saitenwurst', 'schinken', 'wurst'], days: 4, storage: 'fridge', category: 'Fleisch & Wurst', category_en: 'Meat & Sausage', label: 'Aufschnitt / Brühwurst', label_en: 'Cold cuts / cooked sausage', reason: 'Angeschnitten und offen; Verbraucherzentrale nennt 3–4 Tage.', reason_en: 'Sliced and open; consumer protection guidance says 3-4 days.' },
  { keys: ['hähnchen', 'haehnchen', 'hühner', 'huhn', 'pute', 'geflügel', 'gefluegel', 'schnitzel', 'gulasch', 'steak', 'filet', 'kotelett', 'fleisch'], days: 2, storage: 'fridge', category: 'Fleisch & Wurst', category_en: 'Meat & Sausage', label: 'Rohes Fleisch / Geflügel', label_en: 'Raw meat / poultry', reason: 'Salmonellen/Campylobacter-Risiko; Geflügel besonders heikel.', reason_en: 'Salmonella/campylobacter risk; poultry especially sensitive.' },

  // — Milch & Milchprodukte —
  { keys: ['milchreis', 'pudding', 'grießbrei', 'griessbrei', 'dessert', 'mousse'], days: 3, storage: 'fridge', category: 'Milchprodukte', category_en: 'Dairy', label: 'Milchdessert', label_en: 'Dairy dessert', reason: 'Offene Milchdesserts verderben schnell.', reason_en: 'Opened dairy desserts spoil quickly.' },
  { keys: ['buttermilch'], days: 7, storage: 'fridge', category: 'Milchprodukte', category_en: 'Dairy', label: 'Buttermilch', label_en: 'Buttermilk', reason: 'Säuerlich → etwas stabiler als Milch.', reason_en: 'Tangy → a bit more stable than milk.' },
  { keys: ['hafermilch', 'haferdrink', 'sojamilch', 'sojadrink', 'mandelmilch', 'mandeldrink', 'reisdrink', 'kokosmilch', 'pflanzendrink', 'pflanzenmilch'], days: 5, storage: 'fridge', category: 'Milchprodukte', category_en: 'Dairy', label: 'Pflanzendrink', label_en: 'Plant-based drink', reason: 'Nach dem Öffnen wie Milch verderblich.', reason_en: 'Perishable like milk once opened.' },
  { keys: ['frischmilch', 'vollmilch', 'h-milch', 'milch'], days: 5, storage: 'fridge', category: 'Milchprodukte', category_en: 'Dairy', label: 'Milch', label_en: 'Milk', reason: 'Frischmilch offen 3–5 Tage, H-Milch bis ~7 → 5 als Mittelwert.', reason_en: 'Fresh milk lasts 3-5 days opened, UHT milk up to ~7 → 5 as an average.' },
  { keys: ['joghurt', 'skyr', 'quark', 'kefir', 'ayran'], days: 7, storage: 'fridge', category: 'Milchprodukte', category_en: 'Dairy', label: 'Joghurt / Skyr / Quark', label_en: 'Yogurt / skyr / quark', reason: 'Säuerlich; Milchsäurekulturen hemmen Keime.', reason_en: 'Tangy; lactic acid cultures inhibit bacteria.' },
  { keys: ['crème fraîche', 'creme fraiche', 'crème fraiche', 'schmand', 'saure sahne', 'sauerrahm'], days: 7, storage: 'fridge', category: 'Milchprodukte', category_en: 'Dairy', label: 'Crème fraîche / Schmand', label_en: 'Crème fraîche / sour cream', reason: 'Hoher Fett- und Säureanteil.', reason_en: 'High fat and acid content.' },
  { keys: ['schlagsahne', 'kochsahne', 'sahne', 'obers'], days: 4, storage: 'fridge', category: 'Milchprodukte', category_en: 'Dairy', label: 'Sahne', label_en: 'Cream', reason: 'Fettreich, pasteurisiert; offen 3–5 Tage.', reason_en: 'High fat, pasteurized; keeps 3-5 days opened.' },

  // — Käse (nach Frischegrad) —
  { keys: ['frischkäse', 'streichkäse', 'philadelphia', 'doppelrahm'], days: 10, storage: 'fridge', category: 'Käse', category_en: 'Cheese', label: 'Frischkäse (streichfähig)', label_en: 'Cream cheese (spreadable)', reason: 'Durch Säure/Salz konserviert; offen 1–2 Wochen.', reason_en: 'Preserved by acid/salt; keeps 1-2 weeks opened.' },
  { keys: ['feta', 'hirtenkäse', 'schafskäse'], days: 14, storage: 'fridge', category: 'Käse', category_en: 'Cheese', label: 'Feta / Schafskäse', label_en: 'Feta / sheep’s cheese', reason: 'Salzlake konserviert.', reason_en: 'Preserved by brine.' },
  { keys: ['mozzarella', 'ricotta', 'hüttenkäse', 'huettenkaese', 'cottage', 'mascarpone'], days: 5, storage: 'fridge', category: 'Käse', category_en: 'Cheese', label: 'Mozzarella / Ricotta', label_en: 'Mozzarella / ricotta', reason: 'Frischkäse mit hohem Wassergehalt.', reason_en: 'Fresh cheese with high water content.' },
  { keys: ['grillkäse', 'halloumi'], days: 7, storage: 'fridge', category: 'Käse', category_en: 'Cheese', label: 'Grillkäse / Halloumi', label_en: 'Grilling cheese / halloumi', reason: 'Fester und salzhaltig.', reason_en: 'Firmer and salty.' },
  { keys: ['schmelzkäse', 'scheibletten'], days: 14, storage: 'fridge', category: 'Käse', category_en: 'Cheese', label: 'Schmelzkäse', label_en: 'Processed cheese', reason: 'Verarbeitet und stabilisiert.', reason_en: 'Processed and stabilized.' },
  { keys: ['gerieben', 'reibekäse', 'pizzakäse'], days: 5, storage: 'fridge', category: 'Käse', category_en: 'Cheese', label: 'Geriebener Käse', label_en: 'Grated cheese', reason: 'Große Oberfläche → schimmelt/trocknet schneller.', reason_en: 'Large surface area → molds/dries out faster.' },
  { keys: ['parmesan', 'grana', 'pecorino', 'bergkäse', 'hartkäse'], days: 21, storage: 'fridge', category: 'Käse', category_en: 'Cheese', label: 'Hartkäse', label_en: 'Hard cheese', reason: 'Sehr trocken und gereift → lange haltbar.', reason_en: 'Very dry and aged → keeps a long time.' },
  { keys: ['emmentaler', 'gouda', 'cheddar', 'edamer', 'tilsiter', 'butterkäse', 'maasdamer', 'appenzeller', 'raclette', 'käse', 'kaese'], days: 14, storage: 'fridge', category: 'Käse', category_en: 'Cheese', label: 'Schnittkäse', label_en: 'Semi-hard cheese', reason: 'Fester, niedrigere Wasseraktivität.', reason_en: 'Firmer, lower water activity.' },

  // — Nussmus/Schokocreme VOR „Butter" (sonst landet „Erdnussbutter" bei Butter) —
  { keys: ['erdnussbutter', 'erdnussmus', 'mandelmus', 'nussmus', 'nutella', 'schokocreme', 'nougatcreme'], days: 60, storage: 'room', category: 'Fette & Eier', category_en: 'Fats & Eggs', label: 'Nussmus / Schokocreme', label_en: 'Nut butter / chocolate spread', reason: 'Fett + wenig Wasser; Kühlung macht nur hart, ist nicht nötig.', reason_en: 'Fat + little water; refrigerating just makes it hard, not necessary.' },
  { keys: ['butter', 'margarine'], days: 30, storage: 'fridge', category: 'Fette & Eier', category_en: 'Fats & Eggs', label: 'Butter / Margarine', label_en: 'Butter / margarine', reason: 'Fett, wenig Wasser; offen mehrere Wochen.', reason_en: 'Fat, little water; keeps several weeks opened.' },
  { keys: ['eier', 'eierkarton'], days: 21, storage: 'fridge', category: 'Fette & Eier', category_en: 'Fats & Eggs', label: 'Eier', label_en: 'Eggs', reason: 'Halten gekühlt etwa 3 Wochen.', reason_en: 'Keep about 3 weeks refrigerated.' },

  // — Pflanzlich / frische Feinkost —
  { keys: ['räuchertofu', 'raeuchertofu'], days: 7, storage: 'fridge', category: 'Pflanzlich & Frische Feinkost', category_en: 'Plant-Based & Fresh Deli', label: 'Räuchertofu', label_en: 'Smoked tofu', reason: 'Geräuchert → stabiler als frischer Tofu.', reason_en: 'Smoked → more stable than fresh tofu.' },
  { keys: ['tofu', 'tempeh', 'seitan'], days: 4, storage: 'fridge', category: 'Pflanzlich & Frische Feinkost', category_en: 'Plant-Based & Fresh Deli', label: 'Tofu / Tempeh', label_en: 'Tofu / tempeh', reason: 'Offen (in Wasser) empfindlich.', reason_en: 'Sensitive once opened (in water).' },
  { keys: ['hummus'], days: 5, storage: 'fridge', category: 'Pflanzlich & Frische Feinkost', category_en: 'Plant-Based & Fresh Deli', label: 'Hummus', label_en: 'Hummus', reason: 'Kichererbsenpüree, empfindlich.', reason_en: 'Chickpea purée, sensitive.' },
  { keys: ['tzatziki', 'zaziki', 'kräuterquark', 'kraeuterquark', 'dip'], days: 4, storage: 'fridge', category: 'Pflanzlich & Frische Feinkost', category_en: 'Plant-Based & Fresh Deli', label: 'Tzatziki / Dip', label_en: 'Tzatziki / dip', reason: 'Joghurt-/Quark-basiert.', reason_en: 'Yogurt/quark-based.' },
  { keys: ['tortellini', 'ravioli', 'gnocchi', 'frische pasta', 'frische nudeln'], days: 3, storage: 'fridge', category: 'Pflanzlich & Frische Feinkost', category_en: 'Plant-Based & Fresh Deli', label: 'Frische Pasta', label_en: 'Fresh pasta', reason: 'Frisch, teils mit Ei/Füllung.', reason_en: 'Fresh, sometimes with egg/filling.' },

  // — Aufstriche & haltbare Gläser —
  { keys: ['marmelade', 'konfitüre', 'konfiture', 'fruchtaufstrich', 'gelee'], days: 30, storage: 'fridge', category: 'Aufstriche & Konserven', category_en: 'Spreads & Canned Goods', label: 'Marmelade / Konfitüre', label_en: 'Jam / preserves', reason: 'Hoher Zuckergehalt konserviert; offen üblicherweise gekühlt.', reason_en: 'High sugar content preserves it; usually refrigerated once opened.' },
  { keys: ['honig'], days: 180, storage: 'room', category: 'Aufstriche & Konserven', category_en: 'Spreads & Canned Goods', label: 'Honig', label_en: 'Honey', reason: 'Praktisch unbegrenzt haltbar; Kühlung fördert Kristallisation → nicht kühlen.', reason_en: 'Keeps virtually indefinitely; refrigeration promotes crystallization → don’t refrigerate.' },
  { keys: ['pesto'], days: 7, storage: 'fridge', category: 'Aufstriche & Konserven', category_en: 'Spreads & Canned Goods', label: 'Pesto', label_en: 'Pesto', reason: 'Öl-Schutzschicht, aber frische Zutaten.', reason_en: 'Oil protective layer, but fresh ingredients.' },
  { keys: ['tomatenmark'], days: 7, storage: 'fridge', category: 'Aufstriche & Konserven', category_en: 'Spreads & Canned Goods', label: 'Tomatenmark', label_en: 'Tomato paste', reason: 'Konzentriert; schimmelt an der Oberfläche.', reason_en: 'Concentrated; molds on the surface.' },
  { keys: ['passata', 'passierte tomaten'], days: 4, storage: 'fridge', category: 'Aufstriche & Konserven', category_en: 'Spreads & Canned Goods', label: 'Passata', label_en: 'Passata', reason: 'Kaum konserviert, schimmelt schnell.', reason_en: 'Barely preserved, molds quickly.' },
  { keys: ['oliven', 'antipasti', 'eingelegt', 'in öl', 'getrocknete tomaten'], days: 14, storage: 'fridge', category: 'Aufstriche & Konserven', category_en: 'Spreads & Canned Goods', label: 'Oliven / Antipasti', label_en: 'Olives / antipasti', reason: 'Öl/Salz/Säure konservieren.', reason_en: 'Oil/salt/acid preserve it.' },

  // — Saucen & Würzmittel —
  { keys: ['ketchup'], days: 30, storage: 'both', category: 'Saucen & Würzmittel', category_en: 'Sauces & Condiments', label: 'Ketchup', label_en: 'Ketchup', reason: 'Säure + Zucker; hält auch ungekühlt Wochen, gekühlt länger.', reason_en: 'Acid + sugar; keeps weeks even unrefrigerated, longer chilled.' },
  { keys: ['mayonnaise', 'remoulade', 'mayo'], days: 60, storage: 'fridge', category: 'Saucen & Würzmittel', category_en: 'Sauces & Condiments', label: 'Mayonnaise / Remoulade', label_en: 'Mayonnaise / remoulade', reason: 'Industriell säurestabilisiert; nach dem Öffnen kühlen.', reason_en: 'Industrially acid-stabilized; refrigerate once opened.' },
  { keys: ['senf'], days: 60, storage: 'both', category: 'Saucen & Würzmittel', category_en: 'Sauces & Condiments', label: 'Senf', label_en: 'Mustard', reason: 'Säure/Senföle konservieren stark; gekühlt aromastabiler.', reason_en: 'Acid/mustard oils preserve it strongly; more aroma-stable chilled.' },
  { keys: ['sojasauce', 'sojasoße', 'fischsauce', 'austernsauce'], days: 90, storage: 'both', category: 'Saucen & Würzmittel', category_en: 'Sauces & Condiments', label: 'Soja-/Fischsauce', label_en: 'Soy / fish sauce', reason: 'Extrem salzig; ungekühlt haltbar, gekühlt aromastabiler.', reason_en: 'Extremely salty; keeps unrefrigerated, more aroma-stable chilled.' },
  { keys: ['sriracha', 'tabasco', 'hot sauce', 'chilisauce', 'chili sauce'], days: 60, storage: 'both', category: 'Saucen & Würzmittel', category_en: 'Sauces & Condiments', label: 'Chili- / Hot Sauce', label_en: 'Chili / hot sauce', reason: 'Sehr sauer und scharf; ungekühlt haltbar.', reason_en: 'Very acidic and spicy; keeps unrefrigerated.' },
  { keys: ['teriyaki', 'barbecue', 'bbq', 'grillsauce', 'taco', 'worcester', 'hoisin'], days: 30, storage: 'both', category: 'Saucen & Würzmittel', category_en: 'Sauces & Condiments', label: 'BBQ-/Teriyaki-Sauce', label_en: 'BBQ / teriyaki sauce', reason: 'Zucker/Salz/Säure-Kondimente; Kühlung verlängert.', reason_en: 'Sugar/salt/acid condiments; refrigeration extends shelf life.' },
  { keys: ['salsa'], days: 5, storage: 'fridge', category: 'Saucen & Würzmittel', category_en: 'Sauces & Condiments', label: 'Salsa (frisch)', label_en: 'Salsa (fresh)', reason: 'Frische Tomaten/Zwiebel.', reason_en: 'Fresh tomatoes/onion.' },
  { keys: ['salatdressing', 'dressing', 'vinaigrette'], days: 21, storage: 'fridge', category: 'Saucen & Würzmittel', category_en: 'Sauces & Condiments', label: 'Salatdressing', label_en: 'Salad dressing', reason: 'Säure + Öl hemmen Keime.', reason_en: 'Acid + oil inhibit bacteria.' },
  { keys: ['sauce', 'soße', 'sosse'], days: 5, storage: 'fridge', category: 'Saucen & Würzmittel', category_en: 'Sauces & Condiments', label: 'Sauce / Soße', label_en: 'Sauce', reason: 'Sicherheitshalber kurz – frische Kühl-Saucen verderben schnell.', reason_en: 'Kept short for safety – fresh chilled sauces spoil quickly.' },

  // — Getränke —
  { keys: ['smoothie'], days: 2, storage: 'fridge', category: 'Getränke', category_en: 'Beverages', label: 'Smoothie', label_en: 'Smoothie', reason: 'Frisches Obst/Gemüse ohne Schutz.', reason_en: 'Fresh fruit/veg with no protective processing.' },
  { keys: ['saft', 'direktsaft', 'nektar', 'schorle'], days: 5, storage: 'fridge', category: 'Getränke', category_en: 'Beverages', label: 'Saft', label_en: 'Juice', reason: 'Offen gekühlt etwa 5–7 Tage.', reason_en: 'Keeps about 5-7 days chilled once opened.' },
  { keys: ['limonade', 'cola', 'softdrink', 'eistee'], days: 5, storage: 'fridge', category: 'Getränke', category_en: 'Beverages', label: 'Limonade', label_en: 'Soda', reason: 'Verliert Kohlensäure; mikrobiell unkritisch.', reason_en: 'Loses carbonation; not a microbial concern.' },
  { keys: ['likör', 'likoer', 'spirituose', 'schnaps'], days: 365, storage: 'room', category: 'Getränke', category_en: 'Beverages', label: 'Likör / Spirituose', label_en: 'Liqueur / spirits', reason: 'Alkohol/Zucker konservieren fast unbegrenzt; Kühlung irrelevant.', reason_en: 'Alcohol/sugar preserve it almost indefinitely; refrigeration irrelevant.' },
  { keys: ['wein', 'sekt', 'prosecco'], days: 5, storage: 'fridge', category: 'Getränke', category_en: 'Beverages', label: 'Wein / Sekt', label_en: 'Wine / sparkling wine', reason: 'Oxidation (Geschmack), keine Sicherheitsfrage.', reason_en: 'Oxidation (taste), not a safety issue.' },

  // — Backwaren —
  { keys: ['brot', 'toast', 'brötchen', 'broetchen', 'wrap', 'baguette'], days: 4, storage: 'room', category: 'Backwaren', category_en: 'Baked Goods', label: 'Brot / Backwaren', label_en: 'Bread / baked goods', reason: 'Brotkasten; im Kühlschrank altert Brot schneller (Retrogradation) → nicht kühlen.', reason_en: 'Bread box; bread stales faster in the fridge (starch retrogradation) → don’t refrigerate.' },

  // — Konserven/Gläser nach dem Öffnen/Umfüllen —
  { keys: ['konserve', 'dose', 'bohnen', 'mais', 'erbsen', 'linsen', 'kichererbsen', 'möhr', 'moehr', 'karotten', 'tomaten'], days: 3, storage: 'fridge', category: 'Aufstriche & Konserven', category_en: 'Spreads & Canned Goods', label: 'Konserve (offen)', label_en: 'Canned goods (opened)', reason: 'Nach dem Öffnen/Umfüllen wie frisch gekocht behandeln.', reason_en: 'Treat like freshly cooked food once opened/decanted.' },
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
  return { days: r.days, storage: r.storage, reason: r.reason, reason_en: r.reason_en, label: r.label, label_en: r.label_en };
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

export function storageLabel(storage, lang = 'de') {
  if (storage === 'room') return tr(lang, 'shelfLife.room');
  if (storage === 'both') return tr(lang, 'shelfLife.both');
  return tr(lang, 'shelfLife.fridge');
}

// Ist ein Lagerort „kalt"? Nutzt das Flag `cooled`, sonst eine Namens-Heuristik.
export function zoneIsCooled(zone) {
  if (!zone) return false;
  if (zone.cooled != null) return !!zone.cooled;
  return /kühl|kuehl|gefrier|kalt|fridge|freezer|frost/i.test(zone.label || '');
}

// Passt der Lagerort zur Empfehlung? Gibt einen Hinweistext zurück oder null.
export function storageMismatch(storage, zone, lang = 'de') {
  if (!storage || !zone) return null;
  const cooled = zoneIsCooled(zone);
  if (storage === 'room' && cooled) return tr(lang, 'shelfLife.mismatchRoom');
  if (storage === 'fridge' && !cooled) return tr(lang, 'shelfLife.mismatchFridge');
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
