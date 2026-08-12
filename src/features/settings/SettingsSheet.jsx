import { Boxes, Tags, Utensils, Clock, ListOrdered, Sprout, ChefHat, Download, Upload, Sun, Moon, SunMoon, LayoutGrid, SlidersHorizontal, AlertTriangle, Languages, Star, History, ShoppingCart } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { Row } from '../../components/Row.jsx';
import { tr, LANGUAGES } from '../../lib/i18n.js';
import { sectionLabelStyle } from '../../lib/styles.js';

// Haupt-Einstellungen: nur noch Theme + Sprache direkt sichtbar (am
// häufigsten genutzt), alles andere über Untermenüs (Layout, Verhalten,
// MHD-Warnungen, Struktur, Daten) – vorher ein sehr langer, flacher
// Scroll-Bereich.
export function SettingsSheet({
  open, onClose, t, lang = 'de', onSetLang, themeOverride, setThemeOverride,
  onManageZones, onManageCategories, onManageFoods, onManageFavorites, onOpenShelfLife, onOpenExpiringView, onOpenProduceStorage, onOpenSpiceGuide,
  onOpenHistory, onOpenShopping, onOpenLayout, onOpenBehavior, onOpenWarnSettings, onOpenBackup, onOpenImport,
  stats,
}) {
  return (
    <Modal open={open} onClose={onClose} t={t} lang={lang} title={tr(lang, 'settings.title')}>
      <div style={sectionLabelStyle(t)}>{tr(lang, 'settings.appearance')}</div>
      <Segmented
        t={t}
        value={themeOverride}
        onChange={setThemeOverride}
        options={[
          { value: null, label: tr(lang, 'settings.system'), icon: <SunMoon size={15} /> },
          { value: 'light', label: tr(lang, 'settings.light'), icon: <Sun size={15} /> },
          { value: 'dark', label: tr(lang, 'settings.dark'), icon: <Moon size={15} /> },
        ]}
      />

      <div style={sectionLabelStyle(t, 20)}>{tr(lang, 'settings.language')}</div>
      <Segmented
        t={t}
        value={lang}
        onChange={onSetLang}
        options={LANGUAGES.map((l) => ({ value: l.value, label: l.label, icon: <Languages size={15} /> }))}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
        <Row t={t} icon={<LayoutGrid size={19} />} label={tr(lang, 'settings.layout')} sub={tr(lang, 'settings.layoutSub')} onClick={onOpenLayout} />
        <Row t={t} icon={<SlidersHorizontal size={19} />} label={tr(lang, 'settings.behavior')} sub={tr(lang, 'settings.behaviorSub')} onClick={onOpenBehavior} />
        <Row t={t} icon={<AlertTriangle size={19} />} label={tr(lang, 'settings.warnings')} sub={tr(lang, 'settings.warningsSub')} onClick={onOpenWarnSettings} />
      </div>

      <div style={sectionLabelStyle(t)}>{tr(lang, 'settings.structure')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Row
          t={t}
          icon={<Boxes size={19} />}
          label={tr(lang, 'settings.zonesTitle')}
          sub={tr(lang, 'settings.zonesSub', { count: stats.zones })}
          onClick={onManageZones}
        />
        <Row
          t={t}
          icon={<Tags size={19} />}
          label={tr(lang, 'settings.categoriesTitle')}
          sub={tr(lang, 'settings.categoriesSub', { count: stats.categories })}
          onClick={onManageCategories}
        />
        <Row
          t={t}
          icon={<Star size={19} />}
          label={tr(lang, 'settings.favoritesTitle')}
          sub={tr(lang, 'settings.favoritesSub', { count: stats.favorites })}
          onClick={onManageFavorites}
        />
        <Row
          t={t}
          icon={<Utensils size={19} />}
          label={tr(lang, 'settings.foodsTitle')}
          sub={tr(lang, 'settings.foodsSub', { count: stats.foods })}
          onClick={onManageFoods}
        />
        <Row
          t={t}
          icon={<ListOrdered size={19} />}
          label={tr(lang, 'settings.expiringTitle')}
          sub={tr(lang, 'settings.expiringSub')}
          onClick={onOpenExpiringView}
        />
        <Row
          t={t}
          icon={<History size={19} />}
          label={tr(lang, 'settings.historyTitle')}
          sub={tr(lang, 'settings.historySub', { count: stats.history })}
          onClick={onOpenHistory}
        />
        <Row
          t={t}
          icon={<ShoppingCart size={19} />}
          label={tr(lang, 'settings.shoppingTitle')}
          sub={tr(lang, 'settings.shoppingSub', { count: stats.shopping })}
          onClick={onOpenShopping}
        />
      </div>

      <div style={sectionLabelStyle(t)}>{tr(lang, 'settings.guides')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Row
          t={t}
          icon={<Clock size={19} />}
          label={tr(lang, 'settings.shelfLifeTitle')}
          sub={tr(lang, 'settings.shelfLifeSub')}
          onClick={onOpenShelfLife}
        />
        <Row
          t={t}
          icon={<Sprout size={19} />}
          label={tr(lang, 'settings.produceTitle')}
          sub={tr(lang, 'settings.produceSub')}
          onClick={onOpenProduceStorage}
        />
        <Row
          t={t}
          icon={<ChefHat size={19} />}
          label={tr(lang, 'settings.spiceTitle')}
          sub={tr(lang, 'settings.spiceSub')}
          onClick={onOpenSpiceGuide}
        />
      </div>

      <div style={sectionLabelStyle(t)}>{tr(lang, 'settings.data')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Row t={t} icon={<Download size={19} />} label={tr(lang, 'settings.backupTitle')} sub={tr(lang, 'settings.backupSub', { count: stats.items })} onClick={onOpenBackup} />
        <Row t={t} icon={<Upload size={19} />} label={tr(lang, 'settings.importTitle')} sub={tr(lang, 'settings.importSub')} onClick={onOpenImport} />
      </div>

      <div style={{ textAlign: 'center', fontSize: 11.5, color: t.textFaint, marginTop: 24 }}>
        {tr(lang, 'settings.footer')}
      </div>
    </Modal>
  );
}
