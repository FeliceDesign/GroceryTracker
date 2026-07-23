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

const ETHYLENE_LABELS = { high: 'hoch', medium: 'mittel', low: 'gering', none: 'keins' };

export function ethyleneLabel(level) {
  return ETHYLENE_LABELS[level] || '—';
}
