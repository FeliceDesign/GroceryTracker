import { Boxes, Tags, Utensils, Clock, ListOrdered, Sprout, Download, Sun, Moon, SunMoon, LayoutGrid, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';

function Segmented({ options, value, onChange, t }) {
  return (
    <div style={{ display: 'flex', gap: 6, background: t.cardAlt, borderRadius: 12, padding: 4 }}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '9px 6px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700,
              background: active ? t.card : 'transparent',
              color: active ? t.text : t.textMuted,
              boxShadow: active ? t.shadow : 'none',
            }}
          >
            {o.icon} {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Row({ icon, label, sub, onClick, t }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px',
        background: t.cardAlt, border: 'none', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
      }}
    >
      <span style={{ color: t.textMuted, display: 'flex' }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: t.text }}>{label}</span>
        {sub && <span style={{ display: 'block', fontSize: 12, color: t.textFaint, marginTop: 1 }}>{sub}</span>}
      </span>
    </button>
  );
}

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
