// Obst-&-Gemüse-Lagerwissen: kühlen ja/nein, Ethylen-Verhalten (wer reift/
// verdirbt wen schneller), Verpackungshinweise. Gleiche Matching-Logik wie
// bei den Öffnen-Regeln in openedShelfLife.js (erster Substring-Treffer auf
// den kleingeschriebenen Namen gewinnt), gleiches storage-Vokabular
// ('fridge'|'room'|'both'), damit storageLabel()/storageMismatch()/
// zoneIsCooled() aus openedShelfLife.js direkt mitgenutzt werden können.
//
// ethyleneProduces/ethyleneSensitive: 'high'|'medium'|'low'|'none'. Kombinationen
// ("was zusammen/nicht zusammen lagern") werden bewusst nicht als starre
// Paar-Tabelle gepflegt, sondern ergeben sich aus diesen zwei Werten: ein
// hoher/mittlerer Ethylen-Produzent sollte nicht neben einer hoch/mittel
// empfindlichen Sorte liegen.
//
// Jeder Eintrag ist recherchiert (u.a. USDA/Extension-Quellen, Michigan
// State University Extension, UC Davis Postharvest Center) – keine
// erfundenen Angaben. Phase 1: 10 sehr gängige, gut abgesicherte Sorten.
// Phase 2: 13 weitere Sorten.
//
// `label`/`reason`/`packaging` sind Deutsch, `label_en`/`reason_en`/
// `packaging_en` die Übersetzungen fürs englische UI (siehe lib/i18n.js).
// `keys` (fürs Matching auf den – immer noch deutschen – Artikelnamen)
// bleiben unverändert, unabhängig von der UI-Sprache.

import { tr } from './i18n.js';

export const PRODUCE_RULES = [
  {
    keys: ['apfel', 'äpfel', 'aepfel'],
    label: 'Apfel', label_en: 'Apple',
    storage: 'fridge',
    ethyleneProduces: 'high',
    ethyleneSensitive: 'low',
    packaging: 'Lose oder in perforierter Tüte im Kühlschrank, nicht luftdicht verpacken.',
    packaging_en: 'Loose or in a perforated bag in the fridge, don’t seal airtight.',
    reason: 'Setzt viel Ethylen frei – lässt anderes Obst/Gemüse in der Nähe schneller reifen bzw. verderben. Im Kühlschrank deutlich länger haltbar als bei Raumtemperatur.',
    reason_en: 'Releases a lot of ethylene – makes other fruit/veg nearby ripen or spoil faster. Keeps much longer in the fridge than at room temperature.',
  },
  {
    keys: ['banane', 'bananen'],
    label: 'Banane', label_en: 'Banana',
    storage: 'room',
    ethyleneProduces: 'high',
    ethyleneSensitive: 'medium',
    packaging: 'Lose bei Raumtemperatur lagern, nicht im Kühlschrank.',
    packaging_en: 'Store loose at room temperature, not in the fridge.',
    reason: 'Setzt sehr viel Ethylen frei – von anderem Obst/Gemüse fernhalten. Kühlschrank stoppt die Reifung und lässt die Schale braun/schwarz werden (die Frucht selbst bleibt meist noch genießbar).',
    reason_en: 'Releases very high amounts of ethylene – keep away from other fruit/veg. The fridge stops ripening and turns the peel brown/black (the fruit itself usually stays edible).',
  },
  {
    keys: ['tomate', 'tomaten'],
    label: 'Tomate', label_en: 'Tomato',
    storage: 'room',
    ethyleneProduces: 'high',
    ethyleneSensitive: 'low',
    packaging: 'Bei Raumtemperatur, Stielansatz nach unten, nicht luftdicht verpacken.',
    packaging_en: 'At room temperature, stem side down, don’t seal airtight.',
    reason: 'Kälte zerstört Aromastoffe – im Kühlschrank werden Tomaten mehlig und fad. Setzt selbst Ethylen frei, reift also andere Sorten in der Nähe schneller nach.',
    reason_en: 'Cold destroys aroma compounds – tomatoes turn mealy and bland in the fridge. Also releases ethylene itself, so it speeds up ripening of other produce nearby.',
  },
  {
    keys: ['kartoffel', 'kartoffeln'],
    label: 'Kartoffel', label_en: 'Potato',
    storage: 'room',
    ethyleneProduces: 'low',
    ethyleneSensitive: 'medium',
    packaging: 'Kühl, dunkel, trocken und luftig lagern (Papiertüte/Karton, nicht luftdicht in Plastik). Nicht neben Zwiebeln.',
    packaging_en: 'Store cool, dark, dry and airy (paper bag/box, not sealed in plastic). Not next to onions.',
    reason: 'Im Kühlschrank wandelt sich Stärke schneller in Zucker um (süßlich-körniger Geschmack, beim scharfen Braten/Frittieren mehr Acrylamid). Licht lässt sie grün werden und keimen – dunkel lagern. Getrennt von Zwiebeln, beide beschleunigen sich gegenseitig beim Verderben.',
    reason_en: 'In the fridge, starch converts to sugar faster (sweetish, grainy taste, more acrylamide when frying/roasting hot). Light makes them turn green and sprout – store in the dark. Keep away from onions, they speed up each other’s spoiling.',
  },
  {
    keys: ['zwiebel', 'zwiebeln'],
    label: 'Zwiebel', label_en: 'Onion',
    storage: 'room',
    ethyleneProduces: 'medium',
    ethyleneSensitive: 'medium',
    packaging: 'Kühl, dunkel, trocken und luftig lagern (Netz oder offener Korb, nicht in Plastik). Nicht neben Kartoffeln.',
    packaging_en: 'Store cool, dark, dry and airy (net or open basket, not in plastic). Not next to potatoes.',
    reason: 'Im Kühlschrank wandelt sich Stärke schneller in Zucker um, dadurch schnellerer Verderb. Setzt selbst Gase frei, die Kartoffeln in der Nähe schneller keimen lassen.',
    reason_en: 'In the fridge, starch converts to sugar faster, causing quicker spoilage. Also releases gases that make nearby potatoes sprout faster.',
  },
  {
    keys: ['karotte', 'karotten', 'möhre', 'moehre', 'möhren', 'moehren'],
    label: 'Karotte', label_en: 'Carrot',
    storage: 'fridge',
    ethyleneProduces: 'none',
    ethyleneSensitive: 'high',
    packaging: 'Im Kühlschrank, Laub/Grün abschneiden (entzieht sonst Feuchtigkeit), in perforierter Tüte oder feuchtem Tuch.',
    packaging_en: 'In the fridge, cut off any green tops (they draw out moisture otherwise), in a perforated bag or damp cloth.',
    reason: 'Sehr ethylenempfindlich – wird in der Nähe von Äpfeln, Bananen & Co. bitter (Bildung von Isocumarin). Getrennt von ethylenreichem Obst lagern.',
    reason_en: 'Very ethylene-sensitive – turns bitter near apples, bananas & co. (isocoumarin forms). Store away from ethylene-rich fruit.',
  },
  {
    keys: ['kopfsalat', 'eisbergsalat', 'salatkopf', 'salat'],
    label: 'Salat', label_en: 'Lettuce',
    storage: 'fridge',
    ethyleneProduces: 'none',
    ethyleneSensitive: 'high',
    packaging: 'Im Gemüsefach, locker in einer Tüte (nicht luftdicht), nicht neben Obst.',
    packaging_en: 'In the crisper drawer, loosely in a bag (not airtight), not next to fruit.',
    reason: 'Sehr ethylenempfindlich – bekommt braune Flecken (Russet Spotting), wenn es neben Äpfeln, Bananen oder Tomaten liegt.',
    reason_en: 'Very ethylene-sensitive – gets brown spots (russet spotting) when stored near apples, bananas or tomatoes.',
  },
  {
    keys: ['gurke', 'gurken', 'salatgurke'],
    label: 'Gurke', label_en: 'Cucumber',
    storage: 'fridge',
    ethyleneProduces: 'low',
    ethyleneSensitive: 'high',
    packaging: 'Im Gemüsefach am wärmeren Rand (nicht direkt an der Kühlwand), getrennt von Obst. Angeschnitten in Folie.',
    packaging_en: 'In the crisper drawer at the warmer edge (not directly against the cold wall), away from fruit. Once cut, wrap in film.',
    reason: 'Sehr ethylenempfindlich – wird schneller weich/gelb neben Obst. Zu kalt (unter ca. 10 °C) schadet zusätzlich (Kälteschäden), daher nicht ganz hinten/unten im Kühlschrank lagern.',
    reason_en: 'Very ethylene-sensitive – turns soft/yellow faster near fruit. Too cold (below about 10 °C/50 °F) also causes chill damage, so don’t store it at the very back/bottom of the fridge.',
  },
  {
    keys: ['zitrone', 'zitronen'],
    label: 'Zitrone', label_en: 'Lemon',
    storage: 'both',
    ethyleneProduces: 'low',
    ethyleneSensitive: 'low',
    packaging: 'Unverpackt lagerbar. Im Kühlschrank (Gemüsefach) am längsten haltbar, bei Raumtemperatur nur für den kurzfristigen Verbrauch.',
    packaging_en: 'Can be stored unwrapped. Keeps longest in the fridge (crisper drawer); at room temperature only for short-term use.',
    reason: 'Bei Raumtemperatur nur wenige Tage haltbar, im Kühlschrank mehrere Wochen. Ethylen spielt bei Zitrusfrüchten eine geringere Rolle als bei anderem Obst.',
    reason_en: 'Keeps only a few days at room temperature, several weeks in the fridge. Ethylene plays a smaller role for citrus fruit than for other produce.',
  },
  {
    keys: ['avocado', 'avocados'],
    label: 'Avocado', label_en: 'Avocado',
    storage: 'both',
    ethyleneProduces: 'high',
    ethyleneSensitive: 'high',
    packaging: 'Unreif bei Raumtemperatur (in Papiertüte mit Apfel/Banane reift sie schneller). Reif: im Kühlschrank, das bremst die weitere Reifung.',
    packaging_en: 'Unripe: at room temperature (in a paper bag with an apple/banana to ripen faster). Ripe: in the fridge, which slows further ripening.',
    reason: 'Reagiert selbst stark auf Ethylen – reift in der Nähe von Äpfeln, Bananen oder Tomaten oft schneller als gewünscht. Setzt aber auch selbst viel Ethylen frei.',
    reason_en: 'Reacts strongly to ethylene itself – often ripens faster than desired near apples, bananas or tomatoes. Also releases a lot of ethylene itself.',
  },
  {
    keys: ['paprika'],
    label: 'Paprika', label_en: 'Bell pepper',
    storage: 'fridge',
    ethyleneProduces: 'low',
    ethyleneSensitive: 'low',
    packaging: 'Im Gemüsefach des Kühlschranks lagern, lose oder in perforierter Tüte.',
    packaging_en: 'Store in the fridge’s crisper drawer, loose or in a perforated bag.',
    reason: 'Kälteempfindlicher als andere Kühlschrank-Sorten – unterhalb von ca. 7 °C drohen Kälteschäden (Grübchen, beschleunigte Fäulnis). Im Gemüsefach (wärmster Bereich des Kühlschranks) am besten aufgehoben; bei Raumtemperatur nur 3-5 Tage haltbar.',
    reason_en: 'More cold-sensitive than other fridge produce – below about 7 °C/45 °F, chill damage (pitting, faster rot) can occur. Best kept in the crisper drawer (the fridge’s warmest zone); keeps only 3-5 days at room temperature.',
  },
  {
    keys: ['knoblauch'],
    label: 'Knoblauch', label_en: 'Garlic',
    storage: 'room',
    ethyleneProduces: 'none',
    ethyleneSensitive: 'low',
    packaging: 'Kühl, dunkel, trocken und luftig lagern (Netz, Papiertüte oder geflochten), nicht in Plastik.',
    packaging_en: 'Store cool, dark, dry and airy (net, paper bag or braided), not in plastic.',
    reason: 'Im Kühlschrank treibt Knoblauch durch den Kältereiz (Vernalisierung) schneller aus und wird bitterer. Bei Raumtemperatur, trocken und dunkel unter 18 °C hält er sich am längsten. Bereits geschälte oder angeschnittene Zehen dagegen im Kühlschrank lagern.',
    reason_en: 'In the fridge, the cold triggers garlic to sprout faster (vernalization) and turn more bitter. It keeps longest at room temperature, dry and dark, below 18 °C/64 °F. Peeled or cut cloves, however, should go in the fridge.',
  },
  {
    keys: ['champignon', 'champignons', 'pilze', 'pilz'],
    label: 'Champignons', label_en: 'Mushrooms',
    storage: 'fridge',
    ethyleneProduces: 'low',
    ethyleneSensitive: 'low',
    packaging: 'In einer Papiertüte im Kühlschrank (nicht im Gemüsefach, dort zu feucht), nicht in geschlossener Plastikverpackung.',
    packaging_en: 'In a paper bag in the fridge (not the crisper drawer, too humid there), not in sealed plastic.',
    reason: 'Pilze bestehen zu großen Teilen aus Wasser und brauchen Luftzirkulation – in geschlossener Plastikverpackung werden sie schnell schleimig. Die Papiertüte nimmt überschüssige Feuchtigkeit auf; so halten sie sich 7-10 Tage.',
    reason_en: 'Mushrooms are mostly water and need air circulation – in sealed plastic they turn slimy fast. The paper bag absorbs excess moisture; this way they keep for 7-10 days.',
  },
  {
    keys: ['spinat'],
    label: 'Spinat', label_en: 'Spinach',
    storage: 'fridge',
    ethyleneProduces: 'none',
    ethyleneSensitive: 'high',
    packaging: 'Im Kühlschrank in luftdurchlässiger Verpackung mit etwas Küchenpapier (nimmt Feuchtigkeit auf), nicht neben Obst lagern.',
    packaging_en: 'In the fridge in breathable packaging with some kitchen paper (absorbs moisture), don’t store next to fruit.',
    reason: 'Reagiert extrem empfindlich auf Ethylen – schon geringste Mengen lassen die Blätter binnen 24-48 Stunden gelb werden und schneller welken. Getrennt von Äpfeln, Bananen, Tomaten & Co. lagern.',
    reason_en: 'Extremely ethylene-sensitive – even tiny amounts turn the leaves yellow and wilted within 24-48 hours. Store away from apples, bananas, tomatoes & co.',
  },
  {
    keys: ['zucchini'],
    label: 'Zucchini', label_en: 'Zucchini',
    storage: 'fridge',
    ethyleneProduces: 'low',
    ethyleneSensitive: 'medium',
    packaging: 'Lose oder in perforierter Tüte im Gemüsefach lagern, nicht ganz hinten/unten im Kühlschrank (dort zu kalt).',
    packaging_en: 'Store loose or in a perforated bag in the crisper drawer, not at the very back/bottom of the fridge (too cold there).',
    reason: 'Unterhalb von ca. 10 °C drohen Kälteschäden (Grübchen, wässrig-mehlige Konsistenz) – daher im wärmeren Gemüsefach lagern. Für den kurzfristigen Verbrauch (1-2 Tage) reicht auch Raumtemperatur.',
    reason_en: 'Below about 10 °C/50 °F, chill damage can occur (pitting, watery-mealy texture) – so store in the warmer crisper drawer. For short-term use (1-2 days), room temperature is also fine.',
  },
  {
    keys: ['aubergine', 'auberginen'],
    label: 'Aubergine', label_en: 'Eggplant',
    storage: 'both',
    ethyleneProduces: 'low',
    ethyleneSensitive: 'medium',
    packaging: 'Kühl bei ca. 10-12 °C lagern (Gemüsefach oder kühler Raum), nicht ganz hinten im Kühlschrank.',
    packaging_en: 'Store cool at about 10-12 °C/50-54 °F (crisper drawer or a cool room), not at the very back of the fridge.',
    reason: 'Optimal sind 10-12 °C – wärmer als die meisten Kühlschränke. Unterhalb von ca. 7 °C drohen Kälteschäden (braune Flecken, Bitterkeit, schnelleres Weichwerden). Für 2-4 Tage reicht Raumtemperatur.',
    reason_en: 'Optimal is 10-12 °C/50-54 °F – warmer than most fridges. Below about 7 °C/45 °F, chill damage can occur (brown spots, bitterness, softening faster). Room temperature is fine for 2-4 days.',
  },
  {
    keys: ['orange', 'orangen'],
    label: 'Orange', label_en: 'Orange',
    storage: 'both',
    ethyleneProduces: 'low',
    ethyleneSensitive: 'low',
    packaging: 'Ungewaschen, lose oder in perforierter Tüte im Gemüsefach lagern, nicht luftdicht verpacken.',
    packaging_en: 'Store unwashed, loose or in a perforated bag in the crisper drawer, don’t seal airtight.',
    reason: 'Bei Raumtemperatur ca. 5-7 Tage haltbar, im Kühlschrank (Gemüsefach) bis zu 3-4 Wochen. Vor dem Lagern nicht waschen – Feuchtigkeit auf der Schale fördert Schimmelbildung.',
    reason_en: 'Keeps about 5-7 days at room temperature, up to 3-4 weeks in the fridge (crisper drawer). Don’t wash before storing – moisture on the peel promotes mold.',
  },
  {
    keys: ['weintraube', 'weintrauben', 'traube', 'trauben'],
    label: 'Weintrauben', label_en: 'Grapes',
    storage: 'fridge',
    ethyleneProduces: 'low',
    ethyleneSensitive: 'medium',
    packaging: 'Ungewaschen, lose oder in der Originalverpackung mit Luftlöchern im Kühlschrank, nicht luftdicht.',
    packaging_en: 'Store unwashed, loose or in the original perforated packaging in the fridge, not airtight.',
    reason: 'Im Kühlschrank 1-3 Wochen haltbar, bei Raumtemperatur verderben sie deutlich schneller. Reagieren empfindlich auf Ethylen – nicht direkt neben Äpfeln, Bananen oder Tomaten lagern. Vor dem Lagern nicht waschen, das fördert Schimmel.',
    reason_en: 'Keeps 1-3 weeks in the fridge; spoils much faster at room temperature. Sensitive to ethylene – don’t store directly next to apples, bananas or tomatoes. Don’t wash before storing, that promotes mold.',
  },
  {
    keys: ['birne', 'birnen'],
    label: 'Birne', label_en: 'Pear',
    storage: 'both',
    ethyleneProduces: 'high',
    ethyleneSensitive: 'medium',
    packaging: 'Zum Nachreifen bei Raumtemperatur lagern (ggf. in Papiertüte mit Apfel/Banane), reif dann im Kühlschrank weiterlagern.',
    packaging_en: 'To ripen, store at room temperature (optionally in a paper bag with an apple/banana); once ripe, keep in the fridge.',
    reason: 'Birnen reifen nach der Ernte nach – bei Raumtemperatur binnen 3-10 Tagen. Sobald reif (leichter Druck am Stielansatz spürbar), im Kühlschrank lagern, um die weitere Reifung zu verlangsamen. Setzen selbst viel Ethylen frei.',
    reason_en: 'Pears continue ripening after harvest – within 3-10 days at room temperature. Once ripe (slight give near the stem), store in the fridge to slow further ripening. They release a lot of ethylene themselves.',
  },
  {
    keys: ['erdbeere', 'erdbeeren'],
    label: 'Erdbeeren', label_en: 'Strawberries',
    storage: 'fridge',
    ethyleneProduces: 'low',
    ethyleneSensitive: 'high',
    packaging: 'Ungewaschen in einem luftigen/perforierten Behälter mit Küchenpapier im Kühlschrank; erst kurz vor dem Verzehr waschen.',
    packaging_en: 'Store unwashed in an airy/perforated container with kitchen paper in the fridge; wash only right before eating.',
    reason: 'Reagieren sehr empfindlich auf Ethylen und verderben in dessen Nähe deutlich schneller – getrennt von Äpfeln, Bananen & Co. lagern. Waschen vor der Lagerung beschleunigt durch die dünne, durchlässige Schale das Verderben.',
    reason_en: 'Very ethylene-sensitive and spoil much faster near it – store away from apples, bananas & co. Washing before storage speeds up spoiling because of the thin, permeable skin.',
  },
  {
    keys: ['sellerie', 'staudensellerie'],
    label: 'Sellerie', label_en: 'Celery',
    storage: 'fridge',
    ethyleneProduces: 'low',
    ethyleneSensitive: 'medium',
    packaging: 'In Alufolie eingewickelt (statt Plastiktüte) im Gemüsefach lagern – lässt entstehendes Ethylen entweichen.',
    packaging_en: 'Wrap in aluminum foil (instead of a plastic bag) and store in the crisper drawer – lets the ethylene it produces escape.',
    reason: 'In geschlossener Plastiktüte staut sich das vom Sellerie selbst freigesetzte Ethylen und lässt ihn schneller welk werden. In Alufolie eingewickelt bleibt er 2-3 Wochen knackig.',
    reason_en: 'In a sealed plastic bag, the ethylene celery releases itself builds up and makes it wilt faster. Wrapped in foil, it stays crisp for 2-3 weeks.',
  },
  {
    keys: ['lauch', 'porree'],
    label: 'Lauch', label_en: 'Leek',
    storage: 'fridge',
    ethyleneProduces: 'low',
    ethyleneSensitive: 'medium',
    packaging: 'Ungewaschen in perforierter Tüte im Gemüsefach lagern.',
    packaging_en: 'Store unwashed in a perforated bag in the crisper drawer.',
    reason: 'Im Kühlschrank hält sich Lauch bis zu zwei Wochen, bei Raumtemperatur nur wenige Tage. Ungewaschen und mit Wurzelansatz gelagert hält er sich am längsten.',
    reason_en: 'Leek keeps up to two weeks in the fridge, only a few days at room temperature. It keeps longest stored unwashed with the root end intact.',
  },
  {
    keys: ['rote bete', 'rote beete', 'rohe bete', 'bete'],
    label: 'Rote Bete', label_en: 'Beetroot',
    storage: 'fridge',
    ethyleneProduces: 'none',
    ethyleneSensitive: 'low',
    packaging: 'Grün entfernen (entzieht sonst Feuchtigkeit), ungewaschen in perforierter Tüte im Gemüsefach lagern.',
    packaging_en: 'Remove the greens (they draw out moisture otherwise), store unwashed in a perforated bag in the crisper drawer.',
    reason: 'Ohne Grün hält sich Rote Bete im Kühlschrank 2-3 Wochen; das Blattgrün entzieht der Knolle sonst Feuchtigkeit. Vor der Lagerung nicht waschen, nur Erde abbürsten.',
    reason_en: 'Without the greens, beetroot keeps 2-3 weeks in the fridge; the leaves otherwise draw moisture out of the root. Don’t wash before storing, just brush off the soil.',
  },
];

// Passende Regel zum Namen (oder null) – erster Substring-Treffer gewinnt.
export function produceRule(name) {
  const n = (name || '').toLowerCase();
  if (!n) return null;
  for (const r of PRODUCE_RULES) {
    if (r.keys.some((k) => n.includes(k))) return r;
  }
  return null;
}

const ETHYLENE_KEYS = { high: 'produce.ethyleneHigh', medium: 'produce.ethyleneMedium', low: 'produce.ethyleneLow', none: 'produce.ethyleneNone' };

export function ethyleneLabel(level, lang = 'de') {
  const key = ETHYLENE_KEYS[level];
  return key ? tr(lang, key) : '—';
}
