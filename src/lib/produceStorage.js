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
    label: 'Apfel',
    storage: 'fridge',
    ethyleneProduces: 'high',
    ethyleneSensitive: 'low',
    packaging: 'Lose oder in perforierter Tüte im Kühlschrank, nicht luftdicht verpacken.',
    reason: 'Setzt viel Ethylen frei – lässt anderes Obst/Gemüse in der Nähe schneller reifen bzw. verderben. Im Kühlschrank deutlich länger haltbar als bei Raumtemperatur.',
  },
  {
    keys: ['banane', 'bananen'],
    label: 'Banane',
    storage: 'room',
    ethyleneProduces: 'high',
    ethyleneSensitive: 'medium',
    packaging: 'Lose bei Raumtemperatur lagern, nicht im Kühlschrank.',
    reason: 'Setzt sehr viel Ethylen frei – von anderem Obst/Gemüse fernhalten. Kühlschrank stoppt die Reifung und lässt die Schale braun/schwarz werden (die Frucht selbst bleibt meist noch genießbar).',
  },
  {
    keys: ['tomate', 'tomaten'],
    label: 'Tomate',
    storage: 'room',
    ethyleneProduces: 'high',
    ethyleneSensitive: 'low',
    packaging: 'Bei Raumtemperatur, Stielansatz nach unten, nicht luftdicht verpacken.',
    reason: 'Kälte zerstört Aromastoffe – im Kühlschrank werden Tomaten mehlig und fad. Setzt selbst Ethylen frei, reift also andere Sorten in der Nähe schneller nach.',
  },
  {
    keys: ['kartoffel', 'kartoffeln'],
    label: 'Kartoffel',
    storage: 'room',
    ethyleneProduces: 'low',
    ethyleneSensitive: 'medium',
    packaging: 'Kühl, dunkel, trocken und luftig lagern (Papiertüte/Karton, nicht luftdicht in Plastik). Nicht neben Zwiebeln.',
    reason: 'Im Kühlschrank wandelt sich Stärke schneller in Zucker um (süßlich-körniger Geschmack, beim scharfen Braten/Frittieren mehr Acrylamid). Licht lässt sie grün werden und keimen – dunkel lagern. Getrennt von Zwiebeln, beide beschleunigen sich gegenseitig beim Verderben.',
  },
  {
    keys: ['zwiebel', 'zwiebeln'],
    label: 'Zwiebel',
    storage: 'room',
    ethyleneProduces: 'medium',
    ethyleneSensitive: 'medium',
    packaging: 'Kühl, dunkel, trocken und luftig lagern (Netz oder offener Korb, nicht in Plastik). Nicht neben Kartoffeln.',
    reason: 'Im Kühlschrank wandelt sich Stärke schneller in Zucker um, dadurch schnellerer Verderb. Setzt selbst Gase frei, die Kartoffeln in der Nähe schneller keimen lassen.',
  },
  {
    keys: ['karotte', 'karotten', 'möhre', 'moehre', 'möhren', 'moehren'],
    label: 'Karotte',
    storage: 'fridge',
    ethyleneProduces: 'none',
    ethyleneSensitive: 'high',
    packaging: 'Im Kühlschrank, Laub/Grün abschneiden (entzieht sonst Feuchtigkeit), in perforierter Tüte oder feuchtem Tuch.',
    reason: 'Sehr ethylenempfindlich – wird in der Nähe von Äpfeln, Bananen & Co. bitter (Bildung von Isocumarin). Getrennt von ethylenreichem Obst lagern.',
  },
  {
    keys: ['kopfsalat', 'eisbergsalat', 'salatkopf', 'salat'],
    label: 'Salat',
    storage: 'fridge',
    ethyleneProduces: 'none',
    ethyleneSensitive: 'high',
    packaging: 'Im Gemüsefach, locker in einer Tüte (nicht luftdicht), nicht neben Obst.',
    reason: 'Sehr ethylenempfindlich – bekommt braune Flecken (Russet Spotting), wenn es neben Äpfeln, Bananen oder Tomaten liegt.',
  },
  {
    keys: ['gurke', 'gurken', 'salatgurke'],
    label: 'Gurke',
    storage: 'fridge',
    ethyleneProduces: 'low',
    ethyleneSensitive: 'high',
    packaging: 'Im Gemüsefach am wärmeren Rand (nicht direkt an der Kühlwand), getrennt von Obst. Angeschnitten in Folie.',
    reason: 'Sehr ethylenempfindlich – wird schneller weich/gelb neben Obst. Zu kalt (unter ca. 10 °C) schadet zusätzlich (Kälteschäden), daher nicht ganz hinten/unten im Kühlschrank lagern.',
  },
  {
    keys: ['zitrone', 'zitronen'],
    label: 'Zitrone',
    storage: 'both',
    ethyleneProduces: 'low',
    ethyleneSensitive: 'low',
    packaging: 'Unverpackt lagerbar. Im Kühlschrank (Gemüsefach) am längsten haltbar, bei Raumtemperatur nur für den kurzfristigen Verbrauch.',
    reason: 'Bei Raumtemperatur nur wenige Tage haltbar, im Kühlschrank mehrere Wochen. Ethylen spielt bei Zitrusfrüchten eine geringere Rolle als bei anderem Obst.',
  },
  {
    keys: ['avocado', 'avocados'],
    label: 'Avocado',
    storage: 'both',
    ethyleneProduces: 'high',
    ethyleneSensitive: 'high',
    packaging: 'Unreif bei Raumtemperatur (in Papiertüte mit Apfel/Banane reift sie schneller). Reif: im Kühlschrank, das bremst die weitere Reifung.',
    reason: 'Reagiert selbst stark auf Ethylen – reift in der Nähe von Äpfeln, Bananen oder Tomaten oft schneller als gewünscht. Setzt aber auch selbst viel Ethylen frei.',
  },
  {
    keys: ['paprika'],
    label: 'Paprika',
    storage: 'fridge',
    ethyleneProduces: 'low',
    ethyleneSensitive: 'low',
    packaging: 'Im Gemüsefach des Kühlschranks lagern, lose oder in perforierter Tüte.',
    reason: 'Kälteempfindlicher als andere Kühlschrank-Sorten – unterhalb von ca. 7 °C drohen Kälteschäden (Grübchen, beschleunigte Fäulnis). Im Gemüsefach (wärmster Bereich des Kühlschranks) am besten aufgehoben; bei Raumtemperatur nur 3-5 Tage haltbar.',
  },
  {
    keys: ['knoblauch'],
    label: 'Knoblauch',
    storage: 'room',
    ethyleneProduces: 'none',
    ethyleneSensitive: 'low',
    packaging: 'Kühl, dunkel, trocken und luftig lagern (Netz, Papiertüte oder geflochten), nicht in Plastik.',
    reason: 'Im Kühlschrank treibt Knoblauch durch den Kältereiz (Vernalisierung) schneller aus und wird bitterer. Bei Raumtemperatur, trocken und dunkel unter 18 °C hält er sich am längsten. Bereits geschälte oder angeschnittene Zehen dagegen im Kühlschrank lagern.',
  },
  {
    keys: ['champignon', 'champignons', 'pilze', 'pilz'],
    label: 'Champignons',
    storage: 'fridge',
    ethyleneProduces: 'low',
    ethyleneSensitive: 'low',
    packaging: 'In einer Papiertüte im Kühlschrank (nicht im Gemüsefach, dort zu feucht), nicht in geschlossener Plastikverpackung.',
    reason: 'Pilze bestehen zu großen Teilen aus Wasser und brauchen Luftzirkulation – in geschlossener Plastikverpackung werden sie schnell schleimig. Die Papiertüte nimmt überschüssige Feuchtigkeit auf; so halten sie sich 7-10 Tage.',
  },
  {
    keys: ['spinat'],
    label: 'Spinat',
    storage: 'fridge',
    ethyleneProduces: 'none',
    ethyleneSensitive: 'high',
    packaging: 'Im Kühlschrank in luftdurchlässiger Verpackung mit etwas Küchenpapier (nimmt Feuchtigkeit auf), nicht neben Obst lagern.',
    reason: 'Reagiert extrem empfindlich auf Ethylen – schon geringste Mengen lassen die Blätter binnen 24-48 Stunden gelb werden und schneller welken. Getrennt von Äpfeln, Bananen, Tomaten & Co. lagern.',
  },
  {
    keys: ['zucchini'],
    label: 'Zucchini',
    storage: 'fridge',
    ethyleneProduces: 'low',
    ethyleneSensitive: 'medium',
    packaging: 'Lose oder in perforierter Tüte im Gemüsefach lagern, nicht ganz hinten/unten im Kühlschrank (dort zu kalt).',
    reason: 'Unterhalb von ca. 10 °C drohen Kälteschäden (Grübchen, wässrig-mehlige Konsistenz) – daher im wärmeren Gemüsefach lagern. Für den kurzfristigen Verbrauch (1-2 Tage) reicht auch Raumtemperatur.',
  },
  {
    keys: ['aubergine', 'auberginen'],
    label: 'Aubergine',
    storage: 'both',
    ethyleneProduces: 'low',
    ethyleneSensitive: 'medium',
    packaging: 'Kühl bei ca. 10-12 °C lagern (Gemüsefach oder kühler Raum), nicht ganz hinten im Kühlschrank.',
    reason: 'Optimal sind 10-12 °C – wärmer als die meisten Kühlschränke. Unterhalb von ca. 7 °C drohen Kälteschäden (braune Flecken, Bitterkeit, schnelleres Weichwerden). Für 2-4 Tage reicht Raumtemperatur.',
  },
  {
    keys: ['orange', 'orangen'],
    label: 'Orange',
    storage: 'both',
    ethyleneProduces: 'low',
    ethyleneSensitive: 'low',
    packaging: 'Ungewaschen, lose oder in perforierter Tüte im Gemüsefach lagern, nicht luftdicht verpacken.',
    reason: 'Bei Raumtemperatur ca. 5-7 Tage haltbar, im Kühlschrank (Gemüsefach) bis zu 3-4 Wochen. Vor dem Lagern nicht waschen – Feuchtigkeit auf der Schale fördert Schimmelbildung.',
  },
  {
    keys: ['weintraube', 'weintrauben', 'traube', 'trauben'],
    label: 'Weintrauben',
    storage: 'fridge',
    ethyleneProduces: 'low',
    ethyleneSensitive: 'medium',
    packaging: 'Ungewaschen, lose oder in der Originalverpackung mit Luftlöchern im Kühlschrank, nicht luftdicht.',
    reason: 'Im Kühlschrank 1-3 Wochen haltbar, bei Raumtemperatur verderben sie deutlich schneller. Reagieren empfindlich auf Ethylen – nicht direkt neben Äpfeln, Bananen oder Tomaten lagern. Vor dem Lagern nicht waschen, das fördert Schimmel.',
  },
  {
    keys: ['birne', 'birnen'],
    label: 'Birne',
    storage: 'both',
    ethyleneProduces: 'high',
    ethyleneSensitive: 'medium',
    packaging: 'Zum Nachreifen bei Raumtemperatur lagern (ggf. in Papiertüte mit Apfel/Banane), reif dann im Kühlschrank weiterlagern.',
    reason: 'Birnen reifen nach der Ernte nach – bei Raumtemperatur binnen 3-10 Tagen. Sobald reif (leichter Druck am Stielansatz spürbar), im Kühlschrank lagern, um die weitere Reifung zu verlangsamen. Setzen selbst viel Ethylen frei.',
  },
  {
    keys: ['erdbeere', 'erdbeeren'],
    label: 'Erdbeeren',
    storage: 'fridge',
    ethyleneProduces: 'low',
    ethyleneSensitive: 'high',
    packaging: 'Ungewaschen in einem luftigen/perforierten Behälter mit Küchenpapier im Kühlschrank; erst kurz vor dem Verzehr waschen.',
    reason: 'Reagieren sehr empfindlich auf Ethylen und verderben in dessen Nähe deutlich schneller – getrennt von Äpfeln, Bananen & Co. lagern. Waschen vor der Lagerung beschleunigt durch die dünne, durchlässige Schale das Verderben.',
  },
  {
    keys: ['sellerie', 'staudensellerie'],
    label: 'Sellerie',
    storage: 'fridge',
    ethyleneProduces: 'low',
    ethyleneSensitive: 'medium',
    packaging: 'In Alufolie eingewickelt (statt Plastiktüte) im Gemüsefach lagern – lässt entstehendes Ethylen entweichen.',
    reason: 'In geschlossener Plastiktüte staut sich das vom Sellerie selbst freigesetzte Ethylen und lässt ihn schneller welk werden. In Alufolie eingewickelt bleibt er 2-3 Wochen knackig.',
  },
  {
    keys: ['lauch', 'porree'],
    label: 'Lauch',
    storage: 'fridge',
    ethyleneProduces: 'low',
    ethyleneSensitive: 'medium',
    packaging: 'Ungewaschen in perforierter Tüte im Gemüsefach lagern.',
    reason: 'Im Kühlschrank hält sich Lauch bis zu zwei Wochen, bei Raumtemperatur nur wenige Tage. Ungewaschen und mit Wurzelansatz gelagert hält er sich am längsten.',
  },
  {
    keys: ['rote bete', 'rote beete', 'rohe bete', 'bete'],
    label: 'Rote Bete',
    storage: 'fridge',
    ethyleneProduces: 'none',
    ethyleneSensitive: 'low',
    packaging: 'Grün entfernen (entzieht sonst Feuchtigkeit), ungewaschen in perforierter Tüte im Gemüsefach lagern.',
    reason: 'Ohne Grün hält sich Rote Bete im Kühlschrank 2-3 Wochen; das Blattgrün entzieht der Knolle sonst Feuchtigkeit. Vor der Lagerung nicht waschen, nur Erde abbürsten.',
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
