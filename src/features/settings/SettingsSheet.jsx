import { Boxes, Tags, Utensils, Clock, ListOrdered, Sprout, Download, Sun, Moon, SunMoon, LayoutGrid, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { Row } from '../../components/Row.jsx';

const sectionLabel = (t) => ({
  fontSize: 12, fontWeight: 800, color: t.textMuted, textTransform: 'uppercase',
  letterSpacing: '0.06em', margin: '30px 2px 10px',
});

// Haupt-Einstellungen: nur noch Theme direkt sichtbar (am häufigsten
// genutzt), alles andere über Untermenüs (Layout, Verhalten, MHD-Warnungen,
// Struktur, Daten) – vorher ein sehr langer, flacher Scroll-Bereich.
export function SettingsSheet({
  open, onClose, t, themeOverride, setThemeOverride,
  onManageZones, onManageCategories, onManageFoods, onOpenShelfLife, onOpenExpiringView, onOpenProduceStorage,
  onOpenLayout, onOpenBehavior, onOpenWarnSettings, onOpenBackup,
  stats,
}) {
  return (
    <Modal open={open} onClose={onClose} t={t} title="Einstellungen">
      <div style={sectionLabel(t)}>Darstellung</div>
      <Segmented
        t={t}
        value={themeOverride}
        onChange={setThemeOverride}
        options={[
          { value: null, label: 'System', icon: <SunMoon size={15} /> },
          { value: 'light', label: 'Hell', icon: <Sun size={15} /> },
          { value: 'dark', label: 'Dunkel', icon: <Moon size={15} /> },
        ]}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
        <Row t={t} icon={<LayoutGrid size={19} />} label="Layout" sub="Kopfzeile, Titel, Button-Positionen" onClick={onOpenLayout} />
        <Row t={t} icon={<SlidersHorizontal size={19} />} label="Verhalten" sub="Einkaufsliste, Mengen, Formate" onClick={onOpenBehavior} />
        <Row t={t} icon={<AlertTriangle size={19} />} label="MHD-Warnungen" sub="Schwellwerte, Farben, Erinnerungen" onClick={onOpenWarnSettings} />
      </div>

      <div style={sectionLabel(t)}>Struktur</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Row
          t={t}
          icon={<Boxes size={19} />}
          label="Lagerorte verwalten"
          sub={`${stats.zones} Lagerorte`}
          onClick={onManageZones}
        />
        <Row
          t={t}
          icon={<Tags size={19} />}
          label="Kategorien verwalten"
          sub={`${stats.categories} Kategorien`}
          onClick={onManageCategories}
        />
        <Row
          t={t}
          icon={<Utensils size={19} />}
          label="Stammdaten / Makros"
          sub={`Nährwerte für ${stats.foods} Lebensmittel`}
          onClick={onManageFoods}
        />
        <Row
          t={t}
          icon={<Clock size={19} />}
          label="Haltbarkeits-Ratgeber"
          sub="Geöffnet, ungeöffnet, tiefgefroren"
          onClick={onOpenShelfLife}
        />
        <Row
          t={t}
          icon={<ListOrdered size={19} />}
          label="Alle Artikel nach MHD"
          sub="Zonenübergreifend, nach Ablaufdatum sortiert"
          onClick={onOpenExpiringView}
        />
        <Row
          t={t}
          icon={<Sprout size={19} />}
          label="Obst-&-Gemüse-Ratgeber"
          sub="Kühlen, Ethylen, Verpackung"
          onClick={onOpenProduceStorage}
        />
      </div>

      <div style={sectionLabel(t)}>Daten</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Row t={t} icon={<Download size={19} />} label="Backup & Export" sub={`${stats.items} Artikel · Sichern, Teilen, Bestandsliste`} onClick={onOpenBackup} />
      </div>

      <div style={{ textAlign: 'center', fontSize: 11.5, color: t.textFaint, marginTop: 24 }}>
        Stock-Tracker · lokal gespeichert auf diesem Gerät
      </div>
    </Modal>
  );
}
