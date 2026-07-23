import { useEffect, useMemo, useRef, useState } from 'react';
import { Package, ShoppingCart, Settings, Plus } from 'lucide-react';

import { useSystemTheme, buildTheme } from './lib/theme.js';
import { zonePalette } from './lib/colors.js';
import { useStorage } from './hooks/useStorage.js';
import { useZones } from './hooks/useZones.js';
import { useCategories } from './hooks/useCategories.js';
import { useFoods } from './hooks/useFoods.js';
import { SEED } from './lib/defaults.js';
import { emptyMacros, foodToMacros, macrosToFood, hasFoodData, defaultBasisForUnit } from './lib/macros.js';
import { openedDaysFor, effectiveExpiry } from './lib/openedShelfLife.js';
import { daysUntil, todayISO } from './lib/date.js';
import { isScanSupported } from './scan/scan.js';
import { captureMhdViaPhoto } from './scan/camera.js';
import { ensureNotifyPermission, syncExpiryNotifications, notificationsSupported } from './lib/notify.js';

import { Header } from './components/Header.jsx';
import { ZoneTabs } from './components/ZoneTabs.jsx';
import { ExpiringBanner } from './components/ExpiringBanner.jsx';
import { SearchBar } from './components/SearchBar.jsx';
import { ItemRow } from './components/ItemRow.jsx';
import { FloatingActions } from './components/FloatingActions.jsx';
import { CountBadge } from './components/CountBadge.jsx';
import { Toast } from './components/Toast.jsx';

import { AddItemSheet } from './features/add/AddItemSheet.jsx';
import { EditItemSheet } from './features/edit/EditItemSheet.jsx';
import { ScanFlowSheet } from './features/scanflow/ScanFlowSheet.jsx';
import { ShoppingSheet } from './features/shopping/ShoppingSheet.jsx';
import { ManageZonesSheet } from './features/zones/ManageZonesSheet.jsx';
import { ManageCategoriesSheet } from './features/categories/ManageCategoriesSheet.jsx';
import { SettingsSheet } from './features/settings/SettingsSheet.jsx';
import { ManageFoodsSheet } from './features/macros/ManageFoodsSheet.jsx';
import { ShelfLifeSheet } from './features/macros/ShelfLifeSheet.jsx';
import { DetailItemSheet } from './features/detail/DetailItemSheet.jsx';

const newId = (prefix = 'i') => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export default function App() {
  const { dark, override: themeOverride, setThemeOverride, themeLoaded } = useSystemTheme();
  const t = buildTheme(dark);

  const { zones, loaded: zonesLoaded, addZone, updateZone, setZones } = useZones();
  const { categories, loaded: catsLoaded, addCategory, removeCategory, setCategories } = useCategories();
  const { foods, setFoods, loaded: foodsLoaded, getFood, upsertFood, removeFood } = useFoods();
  const [items, setItems, itemsLoaded] = useStorage('gt-items-v1', SEED);
  const [shopping, setShopping, shoppingLoaded] = useStorage('gt-shopping-v1', []);
  const [warn, setWarn, warnLoaded] = useStorage('gt-warn-v1', {
    yellowDays: 3, notify: false, thresholds: [7, 3, 1, 0], notifyHour: 9,
  });
  // Allgemeine UI-Einstellungen (z.B. Anzeige-Optionen).
  // stepGml: Schrittweite der +/−-Knöpfe für g/ml ('auto' = adaptiv).
  const [prefs, setPrefs, prefsLoaded] = useStorage('gt-prefs-v1', {
    shoppingCount: true, stepGml: 'auto', showSlider: true,
    headerAlign: 'left', appTitle: '', showWarnDot: true,
    shoppingPos: 'top', settingsPos: 'top', addPos: 'bottom',
  });

  const [activeZone, setActiveZone] = useState(null);
  const [search, setSearch] = useState('');

  // Sheets
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showShopping, setShowShopping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showZones, setShowZones] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showFoods, setShowFoods] = useState(false);
  const [showShelfLife, setShowShelfLife] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  // Formular / Scan
  const [newItem, setNewItem] = useState({ name: '', zone: null, category: null, qty: 1, unit: 'stk', mhd: null });
  const [scanBusy, setScanBusy] = useState(false);
  const [scanMsg, setScanMsg] = useState('');
  const [showScanFlow, setShowScanFlow] = useState(false);
  const [scanZone, setScanZone] = useState(null);
  const [scanMode, setScanMode] = useState('batch'); // 'batch' | 'single'

  // Toast / Feedback
  const [deletedItem, setDeletedItem] = useState(null);
  const [deletedZone, setDeletedZone] = useState(null);
  const [justChanged, setJustChanged] = useState(null);
  const [justChecked, setJustChecked] = useState(null);
  const [shoppingInput, setShoppingInput] = useState('');

  const undoTimerRef = useRef(null);
  const zoneUndoTimerRef = useRef(null);
  const flashTimerRef = useRef(null);
  const checkedTimerRef = useRef(null);

  const scanSupported = isScanSupported();
  const ready = themeLoaded && zonesLoaded && catsLoaded && foodsLoaded && itemsLoaded && shoppingLoaded && warnLoaded && prefsLoaded
    && zones !== null && categories !== null && foods !== null && items !== null && shopping !== null && warn !== null && prefs !== null;

  // activeZone gültig halten (z.B. nachdem ein Lagerort entfernt wurde)
  useEffect(() => {
    if (!zones || zones.length === 0) return;
    if (!activeZone || !zones.some((z) => z.id === activeZone)) {
      setActiveZone(zones[0].id);
    }
  }, [zones, activeZone]);

  useEffect(() => () => {
    clearTimeout(undoTimerRef.current);
    clearTimeout(flashTimerRef.current);
    clearTimeout(checkedTimerRef.current);
  }, []);

  // MHD-Erinnerungen neu planen, sobald sich Bestand oder Einstellungen ändern.
  useEffect(() => {
    if (!itemsLoaded || !warnLoaded || items === null || warn === null) return;
    // Für Erinnerungen zählt die effektive Rest-Haltbarkeit (geöffnet ggf. früher).
    const effItems = items.map((i) => ({ ...i, mhd: effectiveExpiry(i, openedDaysFor(i.name, getFood(i.name))).date }));
    syncExpiryNotifications(effItems, warn);
  }, [items, warn, itemsLoaded, warnLoaded, getFood]);

  const resolveZone = (id) => (zones ? zones.find((z) => z.id === id) : undefined);
  const countFor = (id) => (items ? items.filter((i) => i.zone === id).length : 0);

  // -- Menge / Bearbeiten -----------------------------------------------------
  const stepFor = (unit, qty) => {
    if (unit !== 'g' && unit !== 'ml') return 1;
    const s = prefs && prefs.stepGml;
    if (s && s !== 'auto') return Number(s);
    return qty <= 100 ? 10 : 50;
  };

  const flash = (id) => {
    setJustChanged(id);
    clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setJustChanged((cur) => (cur === id ? null : cur)), 350);
  };

  const changeQty = (id, direction) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const next = Math.max(0, item.qty + direction * stepFor(item.unit, item.qty));
    if (next === 0) {
      removeItem(id);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: next } : i)));
    flash(id);
  };

  // Schnell öffnen/schließen (aus der Detail-Ansicht). Setzt/entfernt openedAt.
  const toggleOpened = (id) => {
    setItems((prev) => prev.map((i) => {
      if (i.id !== id) return i;
      const opened = !i.opened;
      return { ...i, opened, openedAt: opened ? (i.openedAt || todayISO()) : null };
    }));
  };

  const changeMhd = (id, mhd) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, mhd: mhd || null } : i)));
  };

  const removeItem = (id) => {
    const removed = items.find((i) => i.id === id);
    if (!removed) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    // Aufgebrauchtes wandert automatisch auf die Einkaufsliste (ohne Duplikate)
    setShopping((prev) => {
      const exists = prev.some((s) => s.zone === removed.zone && s.name.toLowerCase() === removed.name.toLowerCase());
      return exists ? prev : [...prev, { ...removed, addedAt: Date.now() }];
    });
    setDeletedItem(removed);
    clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setDeletedItem(null), 5000);
  };

  const undoDelete = () => {
    if (!deletedItem) return;
    setItems((prev) => [...prev, deletedItem]);
    setShopping((prev) => prev.filter((s) => s.id !== deletedItem.id || s.manual));
    setDeletedItem(null);
    clearTimeout(undoTimerRef.current);
  };

  // -- Hinzufügen -------------------------------------------------------------
  const openAdd = () => {
    setNewItem({ name: '', zone: activeZone, category: categories[0], qty: 1, unit: 'stk', mhd: null, macros: emptyMacros('100g') });
    setScanMsg('');
    setShowAdd(true);
  };

  // Antippen öffnet die (schreibgeschützte) Detail-Ansicht.
  const openDetail = (item) => setDetailItem(item);

  // Bearbeiten öffnen und dabei die vorhandenen Nährwerte (Stammdaten) laden.
  const openEdit = (item) => {
    const food = getFood(item.name);
    setEditItem({ ...item, macros: foodToMacros(food, defaultBasisForUnit(item.unit)) });
  };

  // Stammdaten-Entwurf -> Stammdaten (nur wenn Nährwerte ODER Zutaten gesetzt).
  const saveFoodMacros = (name, macros) => {
    if (hasFoodData(macros)) upsertFood(macrosToFood(macros, name));
  };

  const closeAdd = () => {
    setShowAdd(false);
    setScanMsg('');
  };

  const addItem = () => {
    const name = newItem.name.trim();
    if (!name) return;
    const zoneId = newItem.zone || activeZone;
    setItems((prev) => [...prev, {
      id: newId(), zone: zoneId, category: newItem.category || categories[0],
      name, qty: newItem.qty, unit: newItem.unit, mhd: newItem.mhd || null,
    }]);
    saveFoodMacros(name, newItem.macros);
    setShopping((prev) => prev.filter((s) =>
      !(s.name.toLowerCase() === name.toLowerCase() && (s.zone === zoneId || s.zone === null))));
    setActiveZone(zoneId);
    setShowAdd(false);
    setScanMsg('');
  };

  // -- Bearbeiten -------------------------------------------------------------
  const saveEdit = () => {
    if (!editItem) return;
    const name = editItem.name.trim();
    if (!name) return;
    saveFoodMacros(name, editItem.macros);
    if (editItem.qty <= 0) {
      removeItem(editItem.id);
      setEditItem(null);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === editItem.id
      ? {
        ...i, name, zone: editItem.zone, category: editItem.category, qty: editItem.qty, unit: editItem.unit,
        mhd: editItem.mhd || null, opened: !!editItem.opened, openedAt: editItem.opened ? (editItem.openedAt || null) : null,
      }
      : i)));
    setEditItem(null);
    setScanMsg('');
  };

  const deleteFromEdit = (id) => {
    removeItem(id);
    setEditItem(null);
  };

  // -- Scannen ----------------------------------------------------------------
  const handleScanDate = async (target) => {
    setScanMsg('');
    setScanBusy(true);
    try {
      // Center-Crop vor der OCR isoliert das Datum aus dem Foto.
      const { date, text } = await captureMhdViaPhoto();
      if (date) {
        if (target === 'edit') setEditItem((s) => ({ ...s, mhd: date }));
        else setNewItem((s) => ({ ...s, mhd: date }));
        setScanMsg('✓ Datum erkannt.');
      } else if (text && text.trim()) {
        const snippet = text.trim().replace(/\s+/g, ' ').slice(0, 45);
        setScanMsg(`Kein Datum erkannt (gelesen: „${snippet}…"). Datum mittig ins Bild holen und erneut fotografieren.`);
      } else {
        setScanMsg('Kein Text erkannt – Etikett schärfer/näher fotografieren.');
      }
    } catch (e) {
      setScanMsg(e?.message || 'Foto-Erkennung fehlgeschlagen.');
    } finally {
      setScanBusy(false);
    }
  };

  // -- Geführter Scan-Flow (Barcode -> MHD -> nächstes) -----------------------
  const openScanFlow = (mode = 'batch') => {
    setScanMode(mode);
    setScanZone(activeZone);
    setScanMsg('');
    setShowAdd(false);
    setShowScanFlow(true);
  };

  const commitScanFlow = (scanned) => {
    setShowScanFlow(false);
    const valid = (scanned || []).filter((b) => b.name && b.name.trim());
    if (valid.length === 0) return;
    const newOnes = valid.map((b) => ({
      id: newId(), zone: b.zone || scanZone, category: b.category || categories[0],
      name: b.name.trim(), qty: b.qty > 0 ? b.qty : 1, unit: b.unit || 'stk', mhd: b.mhd || null,
    }));
    setItems((prev) => [...prev, ...newOnes]);
    // Gescannte Nährwerte in die Stammdaten übernehmen (per Name).
    valid.forEach((b) => saveFoodMacros(b.name.trim(), b.macros));
    setShopping((prev) => prev.filter((s) =>
      !newOnes.some((n) => n.name.toLowerCase() === s.name.toLowerCase() && (s.zone === n.zone || s.zone === null))));
    if (newOnes[0]) setActiveZone(newOnes[0].zone);
  };

  // -- Einkaufsliste ----------------------------------------------------------
  const addManualShopping = () => {
    const name = shoppingInput.trim();
    if (!name) return;
    if (shopping.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setShoppingInput('');
      return;
    }
    setShopping((prev) => [...prev, {
      id: newId('sl'), name, zone: null, category: null, qty: 1, unit: 'stk', mhd: null,
      manual: true, addedAt: Date.now(),
    }]);
    setShoppingInput('');
  };

  const restoreFromShopping = (entry) => {
    if (!entry.zone) {
      // Freier Eintrag ohne Lagerort -> Add-Formular mit vorbelegtem Namen
      setNewItem({ name: entry.name, zone: activeZone, category: categories[0], qty: 1, unit: 'stk', mhd: null, macros: foodToMacros(getFood(entry.name), '100g') });
      setShowShopping(false);
      setScanMsg('');
      setShowAdd(true);
      return;
    }
    setShopping((prev) => prev.filter((s) => s.id !== entry.id));
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.zone === entry.zone && i.name.toLowerCase() === entry.name.toLowerCase());
      if (idx >= 0 && prev[idx].unit === entry.unit) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + (entry.qty > 0 ? entry.qty : 1) };
        return next;
      }
      const { addedAt: _a, manual: _m, ...item } = entry;
      return [...prev, { ...item, qty: entry.qty > 0 ? entry.qty : 1 }];
    });
    setActiveZone(entry.zone);
  };

  const checkAndRestore = (entry) => {
    if (!entry.zone) {
      restoreFromShopping(entry);
      return;
    }
    setJustChecked(entry.id);
    clearTimeout(checkedTimerRef.current);
    checkedTimerRef.current = setTimeout(() => {
      restoreFromShopping(entry);
      setJustChecked(null);
    }, 400);
  };

  const removeFromShopping = (id) => setShopping((prev) => prev.filter((s) => s.id !== id));
  const clearShopping = () => setShopping([]);

  // -- Kategorien -------------------------------------------------------------
  const countForCategory = (name) => (items ? items.filter((i) => i.category === name).length : 0);

  const renameCategory = (oldName, rawNew) => {
    const name = (rawNew || '').trim();
    if (!name || name === oldName || oldName === 'Sonstiges') return;
    setCategories((prev) => {
      // Ziel existiert schon -> zusammenführen (alten Namen entfernen)
      if (prev.some((c) => c.toLowerCase() === name.toLowerCase() && c !== oldName)) {
        return prev.filter((c) => c !== oldName);
      }
      return prev.map((c) => (c === oldName ? name : c));
    });
    setItems((prev) => prev.map((i) => (i.category === oldName ? { ...i, category: name } : i)));
  };

  const removeCategoryWithReassign = (name) => {
    if (name === 'Sonstiges') return;
    setItems((prev) => prev.map((i) => (i.category === name ? { ...i, category: 'Sonstiges' } : i)));
    removeCategory(name);
  };

  // -- Lagerorte --------------------------------------------------------------
  const removeZoneWithReassign = (id) => {
    if (!zones || zones.length <= 1) return;
    const index = zones.findIndex((z) => z.id === id);
    const removedZone = zones[index];
    const target = zones.find((z) => z.id !== id);
    const movedItemIds = items.filter((i) => i.zone === id).map((i) => i.id);
    const movedShoppingIds = shopping.filter((s) => s.zone === id).map((s) => s.id);
    setItems((prev) => prev.map((i) => (i.zone === id ? { ...i, zone: target.id } : i)));
    setShopping((prev) => prev.map((s) => (s.zone === id ? { ...s, zone: target.id } : s)));
    setZones((prev) => prev.filter((z) => z.id !== id));
    if (activeZone === id) setActiveZone(target.id);
    setDeletedZone({ zone: removedZone, index, movedItemIds, movedShoppingIds, wasActive: activeZone === id });
    clearTimeout(zoneUndoTimerRef.current);
    zoneUndoTimerRef.current = setTimeout(() => setDeletedZone(null), 5000);
  };

  const undoZoneDelete = () => {
    if (!deletedZone) return;
    const { zone, index, movedItemIds, movedShoppingIds, wasActive } = deletedZone;
    setZones((prev) => {
      const next = [...prev];
      next.splice(Math.min(index, next.length), 0, zone);
      return next;
    });
    setItems((prev) => prev.map((i) => (movedItemIds.includes(i.id) ? { ...i, zone: zone.id } : i)));
    setShopping((prev) => prev.map((s) => (movedShoppingIds.includes(s.id) ? { ...s, zone: zone.id } : s)));
    if (wasActive) setActiveZone(zone.id);
    setDeletedZone(null);
    clearTimeout(zoneUndoTimerRef.current);
  };

  // -- Backup -----------------------------------------------------------------
  // includeMacros=false lässt die Nährwert-Stammdaten (foods) aus dem Backup weg.
  const buildBackup = (includeMacros = true) => JSON.stringify(
    { version: 2, exportedAt: new Date().toISOString(), zones, categories, foods: includeMacros ? foods : undefined, items, shopping, warn },
    null, 2,
  );

  // Backup nur prüfen (ohne anzuwenden) für die Import-Bestätigung.
  const previewBackup = (text) => {
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return { ok: false, message: 'Ungültiges JSON – bitte den kompletten Backup-Text einfügen.' };
    }
    if (!data || !Array.isArray(data.items) || !Array.isArray(data.zones)) {
      return { ok: false, message: 'Backup unvollständig (zones/items fehlen).' };
    }
    return {
      ok: true,
      summary: {
        items: data.items.length,
        foods: Array.isArray(data.foods) ? data.foods.length : 0,
        zones: data.zones.length,
        categories: Array.isArray(data.categories) ? data.categories.length : 0,
        exportedAt: data.exportedAt || null,
      },
    };
  };

  const restoreBackup = (text) => {
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return { ok: false, message: 'Ungültiges JSON – bitte den kompletten Backup-Text einfügen.' };
    }
    if (!data || !Array.isArray(data.items) || !Array.isArray(data.zones)) {
      return { ok: false, message: 'Backup unvollständig (zones/items fehlen).' };
    }
    setZones(data.zones);
    if (Array.isArray(data.categories)) setCategories(data.categories);
    if (Array.isArray(data.foods)) setFoods(data.foods);
    setItems(data.items);
    setShopping(Array.isArray(data.shopping) ? data.shopping : []);
    if (data.warn && typeof data.warn === 'object') setWarn(data.warn);
    return { ok: true, message: `${data.items.length} Artikel wiederhergestellt.` };
  };

  // -- MHD-Warnungen ----------------------------------------------------------
  const updateWarn = (patch) => setWarn((prev) => ({ ...prev, ...patch }));

  // Beim Aktivieren von Push zuerst die Berechtigung anfragen.
  const setNotifyEnabled = async (on) => {
    if (!on) { updateWarn({ notify: false }); return false; }
    const ok = await ensureNotifyPermission();
    updateWarn({ notify: ok });
    return ok;
  };

  // -- Ableitungen ------------------------------------------------------------
  const grouped = useMemo(() => {
    if (!items) return [];
    const inZone = items.filter((i) => i.zone === activeZone);
    const byCat = {};
    inZone.forEach((i) => {
      (byCat[i.category] = byCat[i.category] || []).push(i);
    });
    return Object.entries(byCat)
      .sort(([a], [b]) => a.localeCompare(b, 'de'))
      .map(([cat, list]) => [cat, list.sort((a, b) => a.name.localeCompare(b.name, 'de'))]);
  }, [items, activeZone]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || !items) return null;
    return items
      .filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }, [items, search]);

  const yellowDays = warn ? warn.yellowDays : 3;
  const expiringSoon = useMemo(() => {
    if (!items) return [];
    return items
      .map((i) => {
        const eff = effectiveExpiry(i, openedDaysFor(i.name, getFood(i.name)));
        return { ...i, days: eff.date ? daysUntil(eff.date) : null };
      })
      .filter((i) => i.days !== null && i.days <= yellowDays)
      .sort((a, b) => a.days - b.days);
  }, [items, yellowDays, getFood]);

  if (!ready) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg, color: t.textMuted, fontFamily: 'system-ui, sans-serif' }}>
        Lade Bestand…
      </div>
    );
  }

  const zone = resolveZone(activeZone) || zones[0];
  const totalInZone = grouped.reduce((sum, [, list]) => sum + list.length, 0);
  // Live-Objekt für die Detail-Ansicht (wird ausgeblendet, wenn der Artikel weg ist).
  const detailLive = detailItem ? items.find((i) => i.id === detailItem.id) || null : null;

  return (
    <>
    <div className="gt-hide-while-scanning" style={{ minHeight: '100dvh', background: t.bg, paddingBottom: 110 }}>
      {/* Kopf + Tabs bleiben oben kleben */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: t.bg }}>
        <Header
          zone={zone} dark={dark} t={t}
          totalInZone={totalInZone}
          shoppingCount={shopping.length}
          showShoppingCount={prefs.shoppingCount}
          align={prefs.headerAlign} title={prefs.appTitle}
          onShopping={() => setShowShopping(true)}
          onSettings={() => setShowSettings(true)}
          onAdd={openAdd}
          onZoneClick={() => setShowZones(true)}
          showShoppingButton={(prefs.shoppingPos || 'top') !== 'bottom'}
          showSettingsButton={(prefs.settingsPos || 'top') !== 'bottom'}
          showAddButton={(prefs.addPos || 'bottom') === 'top'}
        />
        <ZoneTabs zones={zones} activeZone={activeZone} countFor={countFor} onSelect={setActiveZone} t={t} dark={dark} />
      </div>

      <ExpiringBanner expiring={expiringSoon} t={t} onOpen={setActiveZone} />

      <SearchBar value={search} onChange={setSearch} t={t} />

      {/* Liste */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '18px 20px 0' }}>
        {searchResults !== null ? (
          searchResults.length === 0 ? (
            <Empty t={t} label={`Nichts gefunden für „${search}"`} />
          ) : (
            <Section t={t} title={`${searchResults.length} ${searchResults.length === 1 ? 'Treffer' : 'Treffer'}`}>
              {searchResults.map((item, idx) => (
                <ItemRow
                  key={item.id} item={item} zone={resolveZone(item.zone)} t={t} dark={dark} yellowDays={yellowDays}
                  justChanged={justChanged} openedShelfDays={openedDaysFor(item.name, getFood(item.name))} onEdit={openDetail} onChangeQty={changeQty} onRemove={removeItem}
                  showZoneBadge isLast={idx === searchResults.length - 1} showWarnDot={prefs.showWarnDot !== false}
                />
              ))}
            </Section>
          )
        ) : grouped.length === 0 ? (
          <Empty t={t} label="— leer —" />
        ) : (
          grouped.map(([cat, list]) => (
            <Section key={cat} t={t} title={cat}>
              {list.map((item, idx) => (
                <ItemRow
                  key={item.id} item={item} zone={zone} t={t} dark={dark} yellowDays={yellowDays}
                  justChanged={justChanged} openedShelfDays={openedDaysFor(item.name, getFood(item.name))} onEdit={openDetail} onChangeQty={changeQty} onRemove={removeItem}
                  isLast={idx === list.length - 1} showWarnDot={prefs.showWarnDot !== false}
                />
              ))}
            </Section>
          ))
        )}
      </div>

      <FloatingActions
        zone={zone} dark={dark} t={t}
        items={[
          (prefs.addPos || 'bottom') === 'bottom' && {
            key: 'add', size: 60, primary: true,
            onClick: openAdd,
            ariaLabel: 'Neuen Artikel hinzufügen',
            icon: <Plus size={28} strokeWidth={2.6} />,
          },
          prefs.settingsPos === 'bottom' && {
            key: 'settings', size: 48,
            onClick: () => setShowSettings(true),
            ariaLabel: 'Einstellungen öffnen',
            icon: <Settings size={19} strokeWidth={2.2} />,
          },
          prefs.shoppingPos === 'bottom' && {
            key: 'shopping', size: 48,
            onClick: () => setShowShopping(true),
            ariaLabel: `Einkaufsliste öffnen${shopping.length > 0 ? ` (${shopping.length})` : ''}`,
            icon: <ShoppingCart size={19} strokeWidth={2.2} />,
            badge: (
              <CountBadge
                count={shopping.length}
                show={prefs.shoppingCount}
                badgeBg={t.headerText}
                badgeFg={zonePalette(zone.color, dark).headerBg}
                holeBorder={zonePalette(zone.color, dark).headerBg}
              />
            ),
          },
        ].filter((x) => x)}
      />

      {deletedItem && (
        <Toast
          t={t}
          message={`„${deletedItem.name}" entfernt · auf Einkaufsliste`}
          actionLabel="Rückgängig"
          onAction={undoDelete}
        />
      )}

      {!deletedItem && deletedZone && (
        <Toast
          t={t}
          message={`Lagerort „${deletedZone.zone.label}" entfernt`}
          actionLabel="Rückgängig"
          onAction={undoZoneDelete}
        />
      )}

      <AddItemSheet
        open={showAdd} onClose={closeAdd} t={t} dark={dark}
        zones={zones} categories={categories} onAddCategory={addCategory}
        newItem={newItem} setNewItem={setNewItem}
        scanSupported={scanSupported} scanBusy={scanBusy} scanMsg={scanMsg}
        onScanBarcode={() => openScanFlow('single')} onScanDate={handleScanDate} onOpenBatch={() => openScanFlow('batch')} onSubmit={addItem}
      />

      <EditItemSheet
        editItem={editItem} setEditItem={setEditItem} onClose={() => { setEditItem(null); setScanMsg(''); }}
        t={t} dark={dark} zones={zones} categories={categories} onAddCategory={addCategory}
        scanSupported={scanSupported} scanBusy={scanBusy} scanMsg={scanMsg} stepGml={prefs.stepGml} showSlider={prefs.showSlider}
        onScanDate={handleScanDate} onSave={saveEdit} onDelete={deleteFromEdit}
      />

      <ShoppingSheet
        open={showShopping} onClose={() => setShowShopping(false)} t={t} dark={dark} zones={zones}
        shopping={shopping} shoppingInput={shoppingInput} setShoppingInput={setShoppingInput}
        onAddManual={addManualShopping} onCheck={checkAndRestore} onRemove={removeFromShopping}
        onClearAll={clearShopping} justChecked={justChecked} showCount={prefs.shoppingCount}
      />

      <SettingsSheet
        open={showSettings} onClose={() => setShowSettings(false)} t={t}
        themeOverride={themeOverride} setThemeOverride={setThemeOverride}
        onManageZones={() => { setShowSettings(false); setShowZones(true); }}
        onManageCategories={() => { setShowSettings(false); setShowCategories(true); }}
        onManageFoods={() => { setShowSettings(false); setShowFoods(true); }}
        showShoppingCount={prefs.shoppingCount}
        onToggleShoppingCount={(on) => setPrefs((p) => ({ ...p, shoppingCount: on }))}
        stepGml={prefs.stepGml}
        onSetStepGml={(v) => setPrefs((p) => ({ ...p, stepGml: v }))}
        showSlider={prefs.showSlider !== false}
        onToggleShowSlider={(on) => setPrefs((p) => ({ ...p, showSlider: on }))}
        showWarnDot={prefs.showWarnDot !== false}
        onToggleShowWarnDot={(on) => setPrefs((p) => ({ ...p, showWarnDot: on }))}
        shoppingPos={prefs.shoppingPos || 'top'}
        onSetShoppingPos={(v) => setPrefs((p) => ({ ...p, shoppingPos: v }))}
        settingsPos={prefs.settingsPos || 'top'}
        onSetSettingsPos={(v) => setPrefs((p) => ({ ...p, settingsPos: v }))}
        addPos={prefs.addPos || 'bottom'}
        onSetAddPos={(v) => setPrefs((p) => ({ ...p, addPos: v }))}
        headerAlign={prefs.headerAlign || 'left'}
        onSetHeaderAlign={(v) => setPrefs((p) => ({ ...p, headerAlign: v }))}
        appTitle={prefs.appTitle || ''}
        onSetAppTitle={(v) => setPrefs((p) => ({ ...p, appTitle: v }))}
        warn={warn} onUpdateWarn={updateWarn} onSetNotify={setNotifyEnabled} notifySupported={notificationsSupported()}
        stats={{ items: items.length, zones: zones.length, categories: categories.length, foods: foods.length }}
        buildBackup={buildBackup} restoreBackup={restoreBackup} previewBackup={previewBackup}
        onOpenShelfLife={() => { setShowSettings(false); setShowShelfLife(true); }}
      />

      <ManageZonesSheet
        open={showZones} onClose={() => setShowZones(false)} t={t} dark={dark}
        zones={zones} countFor={countFor}
        onAdd={addZone} onUpdate={updateZone} onRemove={removeZoneWithReassign}
      />

      <ManageCategoriesSheet
        open={showCategories} onClose={() => setShowCategories(false)} t={t}
        categories={categories} countFor={countForCategory}
        onAdd={addCategory} onRename={renameCategory} onRemove={removeCategoryWithReassign}
      />

      <ManageFoodsSheet
        open={showFoods} onClose={() => setShowFoods(false)} t={t}
        foods={foods} onUpsert={upsertFood} onRemove={removeFood}
        scanSupported={scanSupported}
      />

      <ShelfLifeSheet open={showShelfLife} onClose={() => setShowShelfLife(false)} t={t} />

      <DetailItemSheet
        open={!!detailLive} item={detailLive}
        zone={detailLive ? resolveZone(detailLive.zone) : null}
        food={detailLive ? getFood(detailLive.name) : null}
        t={t} dark={dark} yellowDays={yellowDays}
        onClose={() => setDetailItem(null)}
        onEdit={(it) => { setDetailItem(null); openEdit(it); }}
        onChangeQty={changeQty}
        onRemove={(id) => { setDetailItem(null); removeItem(id); }}
        onToggleOpened={toggleOpened}
        onChangeMhd={changeMhd}
      />
    </div>

    {/* Der geführte Scan-Flow liegt außerhalb des ausgeblendeten Bereichs,
        damit während des transparenten Live-Barcode-Scans nur sein Overlay
        über dem Kamerabild sichtbar ist. */}
    <ScanFlowSheet
      open={showScanFlow} onClose={() => setShowScanFlow(false)} t={t} dark={dark}
      zones={zones} categories={categories} onAddCategory={addCategory}
      targetZone={scanZone || activeZone} mode={scanMode}
      onCommit={commitScanFlow}
    />
    </>
  );
}

function Section({ t, title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: t.textFaint, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 2 }}>
        {title}
      </div>
      <div style={{ background: t.card, borderRadius: 16, overflow: 'hidden', boxShadow: t.shadow }}>
        {children}
      </div>
    </div>
  );
}

function Empty({ t, label }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', color: t.textFaint }}>
      <Package size={32} strokeWidth={1.5} style={{ marginBottom: 10, opacity: 0.6 }} />
      <div style={{ fontSize: 14 }}>{label}</div>
    </div>
  );
}
