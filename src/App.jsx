import { useEffect, useMemo, useRef, useState } from 'react';
import { Package, ShoppingCart, Settings, Plus, Star, Search, X, Eye, EyeOff, History, Utensils } from 'lucide-react';

import { useSystemTheme, buildTheme } from './lib/theme.js';
import { zonePalette, ZONE_COLOR_CHOICES, MHD_COLOR_CHOICES } from './lib/colors.js';
import { btnCircle } from './lib/styles.js';
import { useStorage } from './hooks/useStorage.js';
import { useZones } from './hooks/useZones.js';
import { useCategories } from './hooks/useCategories.js';
import { useFoods } from './hooks/useFoods.js';
import { useFavorites } from './hooks/useFavorites.js';
import { useHistory } from './hooks/useHistory.js';
import { useLongPress } from './hooks/useLongPress.js';
import { SEED } from './lib/defaults.js';
import { emptyMacros, foodToMacros, macrosToFood, hasFoodData, hasMacros, defaultBasisForUnit, normalizeName } from './lib/macros.js';
import { openedDaysFor, effectiveExpiry } from './lib/openedShelfLife.js';
import { daysUntil, todayISO } from './lib/date.js';
import { isScanSupported } from './scan/scan.js';
import { captureMhdViaPhoto } from './scan/camera.js';
import { ensureNotifyPermission, syncExpiryNotifications, notificationsSupported } from './lib/notify.js';
import { tr } from './lib/i18n.js';

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
import { ManageFavoritesSheet } from './features/favorites/ManageFavoritesSheet.jsx';
import { SettingsSheet } from './features/settings/SettingsSheet.jsx';
import { BackupSheet } from './features/settings/BackupSheet.jsx';
import { LayoutSheet } from './features/settings/LayoutSheet.jsx';
import { BehaviorSheet } from './features/settings/BehaviorSheet.jsx';
import { WarnSheet } from './features/settings/WarnSheet.jsx';
import { ManageFoodsSheet } from './features/macros/ManageFoodsSheet.jsx';
import { ShelfLifeSheet } from './features/macros/ShelfLifeSheet.jsx';
import { ProduceStorageSheet } from './features/macros/ProduceStorageSheet.jsx';
import { SpiceGuideSheet } from './features/macros/SpiceGuideSheet.jsx';
import { HistorySheet } from './features/macros/HistorySheet.jsx';
import { DetailItemSheet } from './features/detail/DetailItemSheet.jsx';

const newId = (prefix = 'i') => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export default function App() {
  const { dark, override: themeOverride, setThemeOverride, themeLoaded } = useSystemTheme();
  const t = buildTheme(dark);

  const { zones, loaded: zonesLoaded, addZone, updateZone, moveZone, setZones } = useZones();
  const { categories, loaded: catsLoaded, addCategory, removeCategory, moveCategory, setCategories } = useCategories();
  const { foods, setFoods, loaded: foodsLoaded, getFood, upsertFood, removeFood } = useFoods();
  const {
    favorites, loaded: favoritesLoaded, isFavorite, addFavorite, updateFavorite, moveFavorite, removeFavorite, removeFavoriteByName,
    clearFavorites, restoreFavorites,
  } = useFavorites();
  const { history, loaded: historyLoaded, addHistory, removeHistory } = useHistory();
  // Zentraler Trigger für die Historie: standardmäßig nur Lebensmittel mit
  // echten Makrodaten (sonst wäre der Eintrag für die Makro-Schnellauswahl
  // nutzlos) - mit `historyAllItems` auch ohne Makros, dann nur mit Namen
  // (`food` kann null sein, wenn es gar keine Stammdaten gibt).
  // action: 'added' | 'consumed'. `qty`/`unit` optional (z.B. beim reinen
  // Makros-Kopieren gibt es keine zugehörige Mengenänderung).
  const logHistory = (name, food, action, qty, unit) => {
    if (prefs.historyAllItems) addHistory(food || { name }, action, qty, unit);
    else if (hasMacros(food)) addHistory(food, action, qty, unit);
  };
  const [items, setItems, itemsLoaded] = useStorage('gt-items-v1', SEED);
  const [shopping, setShopping, shoppingLoaded] = useStorage('gt-shopping-v1', []);
  const [warn, setWarn, warnLoaded] = useStorage('gt-warn-v1', {
    yellowDays: 3, orangeDays: 1, notify: false, thresholds: [7, 3, 1, 0], notifyHour: 9,
    colorSoon: null, colorCritical: null, colorExpired: null,
  });
  // Allgemeine UI-Einstellungen (z.B. Anzeige-Optionen).
  // stepGml: Schrittweite der +/−-Knöpfe für g/ml ('auto' = adaptiv).
  const [prefs, setPrefs, prefsLoaded] = useStorage('gt-prefs-v1', {
    shoppingCount: true, shoppingBadgeMode: 'count', stepGml: 'auto', showSlider: true,
    headerAlign: 'left', appTitle: '', showWarnDot: true,
    shoppingPos: 'top', settingsPos: 'top', addPos: 'bottom',
    autoShoppingOnRemove: true, dateFormat: 'dmy', language: 'de', stripBrandNames: true,
    favoritesCollapsed: false, zoneEmojiBothSides: false, favoritesPos: 'off', showFavoriteChips: true,
    favoritesSortMode: 'manual', mainSortMode: 'category', compactList: false, defaultZoneId: null,
    focusMode: false, buttonsHidden: false, bottomButtonsLayout: 'stack', historyPos: 'off',
    hideAddWithButtons: false, swapAddHideOrder: false, addSameSize: false, historyAllItems: false,
    searchPos: 'bottom', foodsPos: 'off',
    showMacroIconMain: false, showMacroIconFavorites: true,
  });
  const lang = (prefs && prefs.language) || 'de';
  const setLang = (v) => setPrefs((p) => ({ ...p, language: v }));
  const [customZoneColors, setCustomZoneColors] = useStorage('gt-custom-zone-colors-v1', []);
  const [customMhdColors, setCustomMhdColors] = useStorage('gt-custom-mhd-colors-v1', []);

  const addCustomZoneColor = (hex) => {
    if (ZONE_COLOR_CHOICES.includes(hex)) return;
    setCustomZoneColors((prev) => (prev.includes(hex) ? prev : [...prev, hex]));
  };
  const removeCustomZoneColor = (hex) => {
    setCustomZoneColors((prev) => prev.filter((c) => c !== hex));
  };
  const addCustomMhdColor = (hex) => {
    if (MHD_COLOR_CHOICES.includes(hex)) return;
    setCustomMhdColors((prev) => (prev.includes(hex) ? prev : [...prev, hex]));
  };
  const removeCustomMhdColor = (hex) => {
    setCustomMhdColors((prev) => prev.filter((c) => c !== hex));
  };

  const [activeZone, setActiveZone] = useState(null);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  // Zonenübergreifende, nach Dringlichkeit sortierte Ansicht – geöffnet über
  // die Ablauf-Warnung statt eines normalen Zonenwechsels.
  const [expiringView, setExpiringView] = useState(false);

  // Sheets
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showShopping, setShowShopping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showZones, setShowZones] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showFoods, setShowFoods] = useState(false);
  const [editFoodName, setEditFoodName] = useState(null);
  const [foodsFromFavorites, setFoodsFromFavorites] = useState(false);
  const [showShelfLife, setShowShelfLife] = useState(false);
  const [showProduceStorage, setShowProduceStorage] = useState(false);
  const [showSpiceGuide, setShowSpiceGuide] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [showLayout, setShowLayout] = useState(false);
  const [showBehavior, setShowBehavior] = useState(false);
  const [showWarnSettings, setShowWarnSettings] = useState(false);
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
  const [deletedFavorites, setDeletedFavorites] = useState(null);
  const [restoredShopping, setRestoredShopping] = useState(null);
  const [justChanged, setJustChanged] = useState(null);
  const [justChecked, setJustChecked] = useState(null);
  // Lösch-Buttons im Hauptbildschirm bleiben standardmäßig ausgeblendet
  // (weniger Buttons pro Zeile) und erscheinen erst nach Tap auf "Entfernen"
  // über der Liste - gleiches Muster wie in der Einkaufsliste.
  const [showItemTrash, setShowItemTrash] = useState(false);
  const [shoppingInput, setShoppingInput] = useState('');

  const undoTimerRef = useRef(null);
  const zoneUndoTimerRef = useRef(null);
  const favoritesUndoTimerRef = useRef(null);
  const flashTimerRef = useRef(null);
  const checkedTimerRef = useRef(null);
  const shoppingUndoTimerRef = useRef(null);

  const scanSupported = isScanSupported();
  const ready = themeLoaded && zonesLoaded && catsLoaded && foodsLoaded && favoritesLoaded && historyLoaded && itemsLoaded && shoppingLoaded && warnLoaded && prefsLoaded
    && zones !== null && categories !== null && foods !== null && items !== null && shopping !== null && warn !== null && prefs !== null;

  // activeZone gültig halten (z.B. nachdem ein Lagerort entfernt wurde) –
  // greift auch beim App-Start (activeZone noch null): dann zählt die in den
  // Einstellungen festgelegte Standard-Zone, falls sie noch existiert.
  useEffect(() => {
    if (!zones || zones.length === 0) return;
    if (!activeZone || !zones.some((z) => z.id === activeZone)) {
      const defaultZoneId = prefs && prefs.defaultZoneId;
      const fallback = defaultZoneId && zones.some((z) => z.id === defaultZoneId) ? defaultZoneId : zones[0].id;
      setActiveZone(fallback);
    }
  }, [zones, activeZone, prefs]);

  useEffect(() => () => {
    clearTimeout(undoTimerRef.current);
    clearTimeout(favoritesUndoTimerRef.current);
    clearTimeout(flashTimerRef.current);
    clearTimeout(checkedTimerRef.current);
    clearTimeout(shoppingUndoTimerRef.current);
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
  // Schrittweite: Artikel-eigener Override (Stammdaten) geht vor der
  // globalen Einstellung, "Auto" richtet sich nach der aktuellen Menge.
  const stepFor = (unit, qty, name) => {
    if (unit !== 'g' && unit !== 'ml') return 1;
    const food = name ? getFood(name) : null;
    const s = (food && food.stepGml != null) ? food.stepGml : (prefs && prefs.stepGml);
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
    const next = Math.max(0, item.qty + direction * stepFor(item.unit, item.qty, item.name));
    if (next === 0) {
      removeItem(id);
      return;
    }
    // Teilweiser Verbrauch (Menge verringert, aber nicht auf 0) zählt
    // ebenfalls als "verzehrt" - z.B. ein Joghurt aus einer 4er-Packung.
    if (direction < 0) logHistory(item.name, getFood(item.name), 'consumed', item.qty - next, item.unit);
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

  // Favorit umschalten (Stern im Detail-Sheet) - merkt sich Lagerort/
  // Kategorie/Einheit als Vorlage für den Schnellzugriff, keine Menge.
  const toggleFavorite = (item) => {
    if (isFavorite(item.name)) removeFavoriteByName(item.name);
    // Aus den Stammdaten favorisierte Artikel (kein Bezug zu einem
    // physischen Artikel) bekommen die aktuell aktive Zone mit, statt ganz
    // ohne Lagerort zu bleiben.
    else addFavorite({ name: item.name, zone: item.zone || activeZone, category: item.category, unit: item.unit });
  };

  // Wird ein Stammdaten-Datensatz umbenannt (Stammdaten-Editor), einen
  // verknüpften Favoriten (Verknüpfung läuft rein über den Namen) mit
  // umbenennen, damit die Verknüpfung nicht auseinanderläuft.
  const renameLinkedFavorite = (oldName, newName) => {
    const fav = favorites.find((f) => normalizeName(f.name) === normalizeName(oldName));
    if (fav) updateFavorite(fav.id, { name: (newName || '').trim() });
  };

  // Ein-/Ausklappen der Favoriten-Chip-Leiste (gilt für Hauptliste und
  // Einkaufsliste gemeinsam, persistiert in den Prefs).
  const toggleFavoritesCollapsed = () => setPrefs((p) => ({ ...p, favoritesCollapsed: !p.favoritesCollapsed }));

  // Suchfeld über den Kopfzeilen-Button auf-/zuklappen - beim Zuklappen wird
  // der Suchtext mitgelöscht, damit die Liste nicht gefiltert hängen bleibt.
  const toggleSearch = () => {
    setSearchOpen((open) => {
      if (open) setSearch('');
      return !open;
    });
  };

  // Favorit direkt in den Bestand übernehmen (Favoriten-Verwaltung): immer in
  // den beim Markieren gespeicherten Lagerort, mit der am Favoriten
  // hinterlegten Standard-Menge (Default 1).
  const addFavoriteToInventory = (fav) => {
    // Favoriten ohne Lagerort (z.B. per Stern aus den Stammdaten angelegt,
    // ohne Bezug zu einem physischen Artikel) fallen auf die aktive Zone
    // zurück - ein Artikel ohne Lagerort/Kategorie würde sonst die Suche
    // zum Absturz bringen (i.category.toLowerCase() auf undefined).
    const favZone = fav.zone || activeZone;
    const favCategory = fav.category || categories[0];
    const favUnit = fav.unit || 'stk';
    const favQty = fav.qty ?? 1;
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.zone === favZone && i.unit === favUnit && i.name.toLowerCase() === fav.name.toLowerCase());
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + favQty };
        return next;
      }
      return [...prev, { id: newId(), name: fav.name, zone: favZone, category: favCategory, qty: favQty, unit: favUnit, mhd: null }];
    });
    setActiveZone(favZone);
    logHistory(fav.name, getFood(fav.name), 'added', favQty, favUnit);
  };

  // Favorit auf die Einkaufsliste setzen - trägt Lagerort/Kategorie/Einheit/
  // Menge mit, damit er beim Abhaken direkt in den Bestand wandert statt
  // übers Formular zu gehen.
  const addFavoriteToShopping = (fav) => {
    setShopping((prev) => {
      if (prev.some((s) => s.zone === fav.zone && s.name.toLowerCase() === fav.name.toLowerCase())) return prev;
      return [...prev, {
        id: newId('sl'), name: fav.name, zone: fav.zone, category: fav.category, qty: fav.qty ?? 1, unit: fav.unit, mhd: null,
        manual: true, addedAt: Date.now(),
      }];
    });
  };

  // Alle aktuellen Bestandsartikel als Favoriten anlegen (Settings ->
  // Favoriten verwalten). Bereits gemerkte Namen werden übersprungen, bei
  // Duplikaten im Bestand (gleicher Name, mehrere Zonen) zählt der erste
  // Treffer. Übernimmt die aktuelle Menge des Artikels als Standard-Menge.
  // Gibt die Anzahl neu angelegter Favoriten zurück.
  const addAllInventoryToFavorites = (onlyWithMacros = false) => {
    const existing = new Set(favorites.map((f) => f.name.toLowerCase()));
    const seen = new Set();
    let added = 0;
    items.forEach((i) => {
      const key = i.name.toLowerCase();
      if (existing.has(key) || seen.has(key)) return;
      if (onlyWithMacros && !hasFoodData(getFood(i.name))) return;
      seen.add(key);
      added += 1;
      addFavorite({ name: i.name, zone: i.zone, category: i.category, unit: i.unit, qty: i.qty });
    });
    return added;
  };

  // Alle Favoriten löschen (Verwaltungs-Sheet, mit Zwei-Tap-Bestätigung
  // dort) - Undo per Toast wie beim Löschen eines Artikels/Lagerorts.
  const clearAllFavorites = () => {
    setDeletedFavorites(favorites);
    clearFavorites();
    clearTimeout(favoritesUndoTimerRef.current);
    favoritesUndoTimerRef.current = setTimeout(() => setDeletedFavorites(null), 5000);
  };

  const undoFavoritesDelete = () => {
    if (!deletedFavorites) return;
    restoreFavorites(deletedFavorites);
    setDeletedFavorites(null);
  };

  const removeItem = (id) => {
    const removed = items.find((i) => i.id === id);
    if (!removed) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    // Aufgebrauchtes wandert automatisch auf die Einkaufsliste (ohne Duplikate) –
    // abschaltbar in den Einstellungen. Ob es diesmal wirklich passiert ist
    // (Einstellung aus, oder Duplikat schon auf der Liste), wird für den
    // Toast-Hinweis festgehalten - anhand des aktuellen `shopping`-Standes
    // VOR dem Update ermittelt, nicht innerhalb des setShopping-Updaters.
    const alreadyOnShopping = shopping.some((s) => s.zone === removed.zone && s.name.toLowerCase() === removed.name.toLowerCase());
    const addedToShopping = prefs.autoShoppingOnRemove !== false && !alreadyOnShopping;
    if (prefs.autoShoppingOnRemove !== false && !alreadyOnShopping) {
      setShopping((prev) => [...prev, { ...removed, addedAt: Date.now() }]);
    }
    logHistory(removed.name, getFood(removed.name), 'consumed', removed.qty, removed.unit);
    setDeletedItem({ ...removed, addedToShopping });
    clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setDeletedItem(null), 5000);
  };

  const undoDelete = () => {
    if (!deletedItem) return;
    const { addedToShopping: _a, ...restored } = deletedItem;
    setItems((prev) => [...prev, restored]);
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

  // 5s langer Druck auf den Add-Button aktiviert den Fokus-Modus (alle
  // Aktions-Buttons ausgeblendet); zurück geht's nur über die Lagerorte-
  // Verwaltung (Klick auf den Zonennamen bleibt dabei immer erreichbar).
  const addLongPress = useLongPress(() => setPrefs((p) => ({ ...p, focusMode: true })), { ms: 5000 });

  // Antippen öffnet die (schreibgeschützte) Detail-Ansicht.
  const openDetail = (item) => setDetailItem(item);

  // Bearbeiten öffnen und dabei die vorhandenen Nährwerte (Stammdaten) laden.
  const openEdit = (item) => {
    const food = getFood(item.name);
    setEditItem({ ...item, macros: foodToMacros(food, defaultBasisForUnit(item.unit)) });
  };

  // Stammdaten-Entwurf -> Stammdaten (nur wenn Nährwerte ODER Zutaten gesetzt).
  // Wurde die letzte verbliebene Angabe (z.B. der Öffnen-Override) gelöscht,
  // bleibt sonst der alte Stammdaten-Eintrag unverändert liegen - deshalb hier
  // stattdessen entfernen, falls einer existiert.
  const saveFoodMacros = (name, macros) => {
    if (hasFoodData(macros)) upsertFood(macrosToFood(macros, name));
    else if (getFood(name)) removeFood(normalizeName(name));
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
    logHistory(name, newItem.macros ? macrosToFood(newItem.macros, name) : getFood(name), 'added', newItem.qty, newItem.unit);
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
    // Menge im Bearbeiten-Formular manuell verringert (aber nicht auf 0)
    // zählt ebenfalls als teilweiser Verzehr - gespeichert wird die Differenz
    // (verzehrte Menge), nicht die neue Restmenge.
    const originalItem = items.find((i) => i.id === editItem.id);
    if (originalItem && editItem.qty < originalItem.qty) {
      logHistory(name, editItem.macros ? macrosToFood(editItem.macros, name) : getFood(name), 'consumed', originalItem.qty - editItem.qty, editItem.unit);
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
        setScanMsg(tr(lang, 'scanCapture.dateRecognized'));
      } else if (text && text.trim()) {
        const snippet = text.trim().replace(/\s+/g, ' ').slice(0, 45);
        setScanMsg(tr(lang, 'scanCapture.noDateFound', { snippet }));
      } else {
        setScanMsg(tr(lang, 'scanCapture.noTextFound'));
      }
    } catch (e) {
      setScanMsg(e?.message || tr(lang, 'scanCapture.photoFailed'));
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
    valid.forEach((b) => {
      const trimmedName = b.name.trim();
      saveFoodMacros(trimmedName, b.macros);
      logHistory(trimmedName, b.macros ? macrosToFood(b.macros, trimmedName) : getFood(trimmedName), 'added', b.qty > 0 ? b.qty : 1, b.unit || 'stk');
    });
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

    // Entscheidung (zusammenführen oder neu anlegen) anhand des aktuellen
    // `items`-Standes VOR dem Update treffen - nicht innerhalb des
    // setItems-Updaters, dessen Ausführung nicht synchron zur nächsten
    // Zeile garantiert ist (sonst wären mergedItemId/createdItemId beim
    // Setzen von restoredShopping noch null, Undo also wirkungslos).
    const idx = items.findIndex((i) => i.zone === entry.zone && i.unit === entry.unit && i.name.toLowerCase() === entry.name.toLowerCase());
    let mergedItemId = null;
    let mergedPrevQty = null;
    let createdItemId = null;
    if (idx >= 0) {
      mergedItemId = items[idx].id;
      mergedPrevQty = items[idx].qty;
      const addQty = entry.qty > 0 ? entry.qty : 1;
      setItems((prev) => prev.map((i) => (i.id === mergedItemId ? { ...i, qty: i.qty + addQty } : i)));
    } else {
      const { addedAt: _a, manual: _m, ...item } = entry;
      createdItemId = item.id;
      setItems((prev) => [...prev, { ...item, qty: entry.qty > 0 ? entry.qty : 1 }]);
    }
    setActiveZone(entry.zone);
    logHistory(entry.name, getFood(entry.name), 'added', entry.qty > 0 ? entry.qty : 1, entry.unit);
    setRestoredShopping({ entry, mergedItemId, mergedPrevQty, createdItemId });
    clearTimeout(shoppingUndoTimerRef.current);
    shoppingUndoTimerRef.current = setTimeout(() => setRestoredShopping(null), 5000);
  };

  // Rückgängig für "Aus Einkaufsliste in den Bestand übernommen": bei einem
  // neu angelegten Artikel wird er wieder entfernt, bei einer Mengen-
  // Zusammenführung die vorherige Menge wiederhergestellt - der
  // Einkaufslisten-Eintrag kehrt in beiden Fällen zurück.
  const undoRestoreFromShopping = () => {
    if (!restoredShopping) return;
    const { entry, mergedItemId, mergedPrevQty, createdItemId } = restoredShopping;
    if (createdItemId) {
      setItems((prev) => prev.filter((i) => i.id !== createdItemId));
    } else if (mergedItemId) {
      setItems((prev) => prev.map((i) => (i.id === mergedItemId ? { ...i, qty: mergedPrevQty } : i)));
    }
    setShopping((prev) => (prev.some((s) => s.id === entry.id) ? prev : [...prev, entry]));
    setRestoredShopping(null);
    clearTimeout(shoppingUndoTimerRef.current);
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
  const updateShoppingItem = (id, patch) => setShopping((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

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
      return { ok: false, message: tr(lang, 'backup.invalidJson') };
    }
    if (!data || !Array.isArray(data.items) || !Array.isArray(data.zones)) {
      return { ok: false, message: tr(lang, 'backup.incompleteBackup') };
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
      return { ok: false, message: tr(lang, 'backup.invalidJson') };
    }
    if (!data || !Array.isArray(data.items) || !Array.isArray(data.zones)) {
      return { ok: false, message: tr(lang, 'backup.incompleteBackup') };
    }
    setZones(data.zones);
    if (Array.isArray(data.categories)) setCategories(data.categories);
    if (Array.isArray(data.foods)) setFoods(data.foods);
    setItems(data.items);
    setShopping(Array.isArray(data.shopping) ? data.shopping : []);
    if (data.warn && typeof data.warn === 'object') setWarn(data.warn);
    return { ok: true, message: tr(lang, 'backup.restored', { count: data.items.length }) };
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

  // Favoriten-Sortierung: "manuell" liefert die gespeicherte (per Hoch/
  // Runter änderbare) Reihenfolge unverändert, die anderen Modi berechnen
  // eine abgeleitete Anzeige-Reihenfolge, ohne die gespeicherte Reihenfolge
  // zu verändern.
  const sortedFavorites = useMemo(() => {
    const mode = (prefs && prefs.favoritesSortMode) || 'manual';
    if (mode === 'manual' || !favorites) return favorites;
    if (mode === 'alpha') {
      return [...favorites].sort((a, b) => a.name.localeCompare(b.name, 'de'));
    }
    if (mode === 'zone' && zones) {
      const zoneOrder = new Map(zones.map((z, i) => [z.id, i]));
      return [...favorites].sort((a, b) => {
        const za = zoneOrder.has(a.zone) ? zoneOrder.get(a.zone) : zones.length;
        const zb = zoneOrder.has(b.zone) ? zoneOrder.get(b.zone) : zones.length;
        return za !== zb ? za - zb : a.name.localeCompare(b.name, 'de');
      });
    }
    if (mode === 'category') {
      return [...favorites].sort((a, b) => {
        const ca = (a.category || '').localeCompare(b.category || '', 'de');
        return ca !== 0 ? ca : a.name.localeCompare(b.name, 'de');
      });
    }
    return favorites;
  }, [favorites, zones, prefs]);

  // Hauptlisten-Sortierung: "Kategorie" gruppiert nach der manuellen
  // Kategorien-Reihenfolge (Settings -> Kategorien verwalten), "Name"/"MHD"
  // zeigen stattdessen eine flache Liste ohne Gruppierung.
  const grouped = useMemo(() => {
    if (!items) return [];
    const inZone = items.filter((i) => i.zone === activeZone);
    const byCat = {};
    inZone.forEach((i) => {
      (byCat[i.category] = byCat[i.category] || []).push(i);
    });
    const known = (categories || []).filter((c) => byCat[c]);
    const unknown = Object.keys(byCat).filter((c) => !known.includes(c)).sort((a, b) => a.localeCompare(b, 'de'));
    return [...known, ...unknown].map((cat) => [cat, byCat[cat].sort((a, b) => a.name.localeCompare(b.name, 'de'))]);
  }, [items, activeZone, categories]);

  const flatSorted = useMemo(() => {
    if (!items) return [];
    const inZone = items.filter((i) => i.zone === activeZone);
    if ((prefs && prefs.mainSortMode) === 'mhd') {
      return inZone
        .map((i) => {
          const eff = effectiveExpiry(i, openedDaysFor(i.name, getFood(i.name)));
          return { ...i, days: eff.date ? daysUntil(eff.date) : null };
        })
        .sort((a, b) => {
          if (a.days === null && b.days === null) return a.name.localeCompare(b.name, 'de');
          if (a.days === null) return 1;
          if (b.days === null) return -1;
          return a.days - b.days || a.name.localeCompare(b.name, 'de');
        });
    }
    return [...inZone].sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }, [items, activeZone, prefs, getFood]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || !items) return null;
    return items
      .filter((i) => i.name.toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }, [items, search]);

  const yellowDays = warn ? warn.yellowDays : 3;
  const orangeDays = warn ? warn.orangeDays : 1;
  const warnColors = { soon: warn?.colorSoon, critical: warn?.colorCritical, expired: warn?.colorExpired };
  // Alle Artikel mit bekanntem (effektivem) Ablaufdatum, aufsteigend sortiert.
  // Grundlage für die Ablauf-Warnung (nur "bald") und die vollständige
  // MHD-sortierte Übersicht (beide Kategorien).
  const allByExpiry = useMemo(() => {
    if (!items) return [];
    return items
      .map((i) => {
        const eff = effectiveExpiry(i, openedDaysFor(i.name, getFood(i.name)));
        return { ...i, days: eff.date ? daysUntil(eff.date) : null };
      })
      .filter((i) => i.days !== null)
      .sort((a, b) => a.days - b.days);
  }, [items, getFood]);
  const expiringSoon = useMemo(
    () => allByExpiry.filter((i) => i.days <= yellowDays),
    [allByExpiry, yellowDays],
  );
  const expiringLater = useMemo(
    () => allByExpiry.filter((i) => i.days > yellowDays),
    [allByExpiry, yellowDays],
  );

  if (!ready) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg, color: t.textMuted, fontFamily: 'system-ui, sans-serif' }}>
        {tr(lang, 'app.loading')}
      </div>
    );
  }

  const zone = resolveZone(activeZone) || zones[0];
  const totalInZone = grouped.reduce((sum, [, list]) => sum + list.length, 0);
  // Live-Objekt für die Detail-Ansicht (wird ausgeblendet, wenn der Artikel weg ist).
  const detailLive = detailItem ? items.find((i) => i.id === detailItem.id) || null : null;

  // Add- und Ausblende-Button unten: getrennt definiert, damit sich ihre
  // Reihenfolge (welcher die Ankerposition besetzt) über eine Einstellung
  // vertauschen lässt. `hideAddWithButtons` erlaubt es zusätzlich, den
  // Add-Button selbst mit auszublenden (Standard: Add bleibt immer sichtbar).
  const addBottomBtn = !prefs.focusMode && (prefs.addPos || 'bottom') === 'bottom'
    && !(prefs.buttonsHidden && prefs.hideAddWithButtons) && {
      key: 'add', size: prefs.addSameSize ? 48 : 60, primary: !prefs.addSameSize,
      onClick: openAdd,
      ariaLabel: tr(lang, 'app.addAria'),
      icon: <Plus size={prefs.addSameSize ? 19 : 28} strokeWidth={prefs.addSameSize ? 2.2 : 2.6} />,
      extraHandlers: addLongPress.handlers,
      holdProgress: addLongPress.progress,
    };
  const hideBottomBtn = !prefs.focusMode && {
    key: 'hideButtons', size: 48,
    onClick: () => setPrefs((p) => ({ ...p, buttonsHidden: !p.buttonsHidden })),
    ariaLabel: prefs.buttonsHidden ? tr(lang, 'app.showButtonsAria') : tr(lang, 'app.hideButtonsAria'),
    icon: prefs.buttonsHidden ? <Eye size={18} strokeWidth={2.2} /> : <EyeOff size={18} strokeWidth={2.2} />,
  };
  const addHidePair = prefs.swapAddHideOrder ? [hideBottomBtn, addBottomBtn] : [addBottomBtn, hideBottomBtn];

  return (
    <>
    <div className="gt-hide-while-scanning" style={{ minHeight: '100dvh', background: t.bg, paddingBottom: 110 }}>
      {/* Kopf + Tabs bleiben oben kleben */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: t.bg }}>
        <Header
          zone={zone} dark={dark} t={t} lang={lang}
          totalInZone={totalInZone}
          shoppingCount={shopping.length}
          shoppingBadgeMode={prefs.shoppingBadgeMode || 'count'}
          align={prefs.headerAlign} title={prefs.appTitle} emojiBothSides={prefs.zoneEmojiBothSides}
          onShopping={() => setShowShopping(true)}
          onSettings={() => setShowSettings(true)}
          onAdd={openAdd}
          onFavorites={() => setShowFavorites(true)}
          onHistory={() => setShowHistory(true)}
          onToggleSearch={toggleSearch} searchOpen={searchOpen}
          onZoneClick={() => setShowZones(true)}
          showShoppingButton={!prefs.focusMode && !prefs.buttonsHidden && (prefs.shoppingPos || 'top') === 'top'}
          showSettingsButton={!prefs.focusMode && !prefs.buttonsHidden && (prefs.settingsPos || 'top') !== 'bottom'}
          showAddButton={!prefs.focusMode && (prefs.addPos || 'bottom') === 'top' && !(prefs.buttonsHidden && prefs.hideAddWithButtons)}
          showFavoritesButton={!prefs.focusMode && !prefs.buttonsHidden && (prefs.favoritesPos || 'off') === 'top'}
          showHistoryButton={!prefs.focusMode && !prefs.buttonsHidden && (prefs.historyPos || 'off') === 'top'}
          showSearchButton={!prefs.focusMode && !prefs.buttonsHidden && (prefs.searchPos || 'bottom') === 'top'}
          onFoods={() => setShowFoods(true)}
          showFoodsButton={!prefs.focusMode && !prefs.buttonsHidden && (prefs.foodsPos || 'off') === 'top'}
          addExtraHandlers={addLongPress.handlers} addHoldProgress={addLongPress.progress}
        />
        <ZoneTabs zones={zones} activeZone={activeZone} countFor={countFor} onSelect={(id) => { setActiveZone(id); setExpiringView(false); }} t={t} dark={dark} />
      </div>

      {warn.showExpiringBanner !== false && (
        <ExpiringBanner expiring={expiringSoon} t={t} lang={lang} onOpen={() => { setExpiringView(true); setSearch(''); }} />
      )}

      {expiringView ? (
        <div style={{ maxWidth: 480, margin: '14px auto 0', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: t.textMuted }}>{tr(lang, 'app.expiringSortLabel')}</span>
          <button onClick={() => setExpiringView(false)} aria-label={tr(lang, 'common.close')} style={btnCircle(t.cardAlt, t.pillInactiveText, 30)}>
            <X size={14} />
          </button>
        </div>
      ) : searchOpen && (
        <SearchBar value={search} onChange={setSearch} t={t} lang={lang} autoFocus />
      )}

      {/* Liste */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '18px 20px 0' }}>
        {items.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => setShowItemTrash((v) => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent',
                color: showItemTrash ? t.text : t.textMuted, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', padding: '4px 2px',
              }}
            >
              <X size={14} /> {showItemTrash ? tr(lang, 'app.doneRemoving') : tr(lang, 'app.enableRemove')}
            </button>
          </div>
        )}
        {expiringView ? (
          allByExpiry.length === 0 ? (
            <Empty t={t} label={tr(lang, 'app.emptyNoMhd')} />
          ) : (
            <>
              {expiringSoon.length > 0 && (
                <Section t={t} title={tr(lang, 'app.soonSection', { count: expiringSoon.length })}>
                  {expiringSoon.map((item, idx) => (
                    <ItemRow
                      key={item.id} item={item} zone={resolveZone(item.zone)} t={t} dark={dark} lang={lang} yellowDays={yellowDays} orangeDays={orangeDays} warnColors={warnColors}
                      justChanged={justChanged} openedShelfDays={openedDaysFor(item.name, getFood(item.name))} onEdit={openDetail} onChangeQty={changeQty} onRemove={removeItem}
                      showZoneBadge isLast={idx === expiringSoon.length - 1} showWarnDot={prefs.showWarnDot !== false} compact={prefs.compactList === true} showDelete={showItemTrash}
                    />
                  ))}
                </Section>
              )}
              {expiringLater.length > 0 && (
                <Section t={t} title={tr(lang, 'app.laterSection', { count: expiringLater.length })}>
                  {expiringLater.map((item, idx) => (
                    <ItemRow
                      key={item.id} item={item} zone={resolveZone(item.zone)} t={t} dark={dark} lang={lang} yellowDays={yellowDays} orangeDays={orangeDays} warnColors={warnColors}
                      justChanged={justChanged} openedShelfDays={openedDaysFor(item.name, getFood(item.name))} onEdit={openDetail} onChangeQty={changeQty} onRemove={removeItem}
                      showZoneBadge isLast={idx === expiringLater.length - 1} showWarnDot={prefs.showWarnDot !== false} compact={prefs.compactList === true} showDelete={showItemTrash}
                    />
                  ))}
                </Section>
              )}
            </>
          )
        ) : searchResults !== null ? (
          searchResults.length === 0 ? (
            <Empty t={t} label={tr(lang, 'app.emptyNothingFoundFor', { query: search })} />
          ) : (
            <Section t={t} title={tr(lang, 'app.hitsSection', { count: searchResults.length })}>
              {searchResults.map((item, idx) => (
                <ItemRow
                  key={item.id} item={item} zone={resolveZone(item.zone)} t={t} dark={dark} lang={lang} yellowDays={yellowDays} orangeDays={orangeDays} warnColors={warnColors}
                  justChanged={justChanged} openedShelfDays={openedDaysFor(item.name, getFood(item.name))} onEdit={openDetail} onChangeQty={changeQty} onRemove={removeItem}
                  showZoneBadge isLast={idx === searchResults.length - 1} showWarnDot={prefs.showWarnDot !== false} compact={prefs.compactList === true} showDelete={showItemTrash}
                />
              ))}
            </Section>
          )
        ) : (prefs.mainSortMode || 'category') === 'category' ? (
          grouped.length === 0 ? (
            <Empty t={t} label={tr(lang, 'app.emptyList')} />
          ) : (
            grouped.map(([cat, list]) => (
              <Section key={cat} t={t} title={cat}>
                {list.map((item, idx) => (
                  <ItemRow
                    key={item.id} item={item} zone={zone} t={t} dark={dark} lang={lang} yellowDays={yellowDays} orangeDays={orangeDays} warnColors={warnColors}
                    justChanged={justChanged} openedShelfDays={openedDaysFor(item.name, getFood(item.name))} onEdit={openDetail} onChangeQty={changeQty} onRemove={removeItem}
                    isLast={idx === list.length - 1} showWarnDot={prefs.showWarnDot !== false} compact={prefs.compactList === true} showDelete={showItemTrash}
                  />
                ))}
              </Section>
            ))
          )
        ) : flatSorted.length === 0 ? (
          <Empty t={t} label={tr(lang, 'app.emptyList')} />
        ) : (
          <Section t={t} title={tr(lang, 'app.allSection', { count: flatSorted.length })}>
            {flatSorted.map((item, idx) => (
              <ItemRow
                key={item.id} item={item} zone={zone} t={t} dark={dark} lang={lang} yellowDays={yellowDays} orangeDays={orangeDays} warnColors={warnColors}
                justChanged={justChanged} openedShelfDays={openedDaysFor(item.name, getFood(item.name))} onEdit={openDetail} onChangeQty={changeQty} onRemove={removeItem}
                isLast={idx === flatSorted.length - 1} showWarnDot={prefs.showWarnDot !== false} compact={prefs.compactList === true} showDelete={showItemTrash}
              />
            ))}
          </Section>
        )}
      </div>

      <FloatingActions
        zone={zone} dark={dark} t={t} layout={prefs.bottomButtonsLayout || 'stack'}
        items={[
          ...addHidePair,
          !prefs.focusMode && !prefs.buttonsHidden && prefs.settingsPos === 'bottom' && {
            key: 'settings', size: 48,
            onClick: () => setShowSettings(true),
            ariaLabel: tr(lang, 'app.settingsAria'),
            icon: <Settings size={19} strokeWidth={2.2} />,
          },
          !prefs.focusMode && !prefs.buttonsHidden && prefs.shoppingPos === 'bottom' && {
            key: 'shopping', size: 48,
            onClick: () => setShowShopping(true),
            ariaLabel: `${tr(lang, 'app.shoppingAria')}${shopping.length > 0 ? ` (${shopping.length})` : ''}`,
            icon: <ShoppingCart size={19} strokeWidth={2.2} />,
            badge: (
              <CountBadge
                count={shopping.length}
                mode={prefs.shoppingBadgeMode || 'count'}
                badgeBg={t.headerText}
                badgeFg={zonePalette(zone.color, dark).headerBg}
                holeBorder={zonePalette(zone.color, dark).headerBg}
              />
            ),
          },
          !prefs.focusMode && !prefs.buttonsHidden && prefs.favoritesPos === 'bottom' && {
            key: 'favorites', size: 48,
            onClick: () => setShowFavorites(true),
            ariaLabel: tr(lang, 'app.favoritesAria'),
            icon: <Star size={18} strokeWidth={2.2} />,
          },
          !prefs.focusMode && !prefs.buttonsHidden && (prefs.historyPos || 'off') === 'bottom' && {
            key: 'history', size: 48,
            onClick: () => setShowHistory(true),
            ariaLabel: tr(lang, 'app.historyAria'),
            icon: <History size={18} strokeWidth={2.2} />,
          },
          !prefs.focusMode && !prefs.buttonsHidden && (prefs.searchPos || 'bottom') === 'bottom' && {
            key: 'search', size: 48,
            onClick: toggleSearch,
            ariaLabel: searchOpen ? tr(lang, 'app.searchCloseAria') : tr(lang, 'app.searchAria'),
            icon: searchOpen ? <X size={19} strokeWidth={2.2} /> : <Search size={18} strokeWidth={2.2} />,
          },
          !prefs.focusMode && !prefs.buttonsHidden && (prefs.foodsPos || 'off') === 'bottom' && {
            key: 'foods', size: 48,
            onClick: () => setShowFoods(true),
            ariaLabel: tr(lang, 'app.foodsAria'),
            icon: <Utensils size={18} strokeWidth={2.2} />,
          },
        ].filter((x) => x)}
      />

      {deletedItem && (
        <Toast
          t={t}
          message={tr(lang, deletedItem.addedToShopping ? 'app.toastRemoved' : 'app.toastRemovedPlain', { name: deletedItem.name })}
          actionLabel={tr(lang, 'app.undo')}
          onAction={undoDelete}
        />
      )}

      {!deletedItem && deletedZone && (
        <Toast
          t={t}
          message={tr(lang, 'app.toastZoneRemoved', { name: deletedZone.zone.label })}
          actionLabel={tr(lang, 'app.undo')}
          onAction={undoZoneDelete}
        />
      )}

      {!deletedItem && !deletedZone && deletedFavorites && (
        <Toast
          t={t}
          message={tr(lang, 'favorites.toastAllCleared', { count: deletedFavorites.length })}
          actionLabel={tr(lang, 'app.undo')}
          onAction={undoFavoritesDelete}
        />
      )}

      {!deletedItem && !deletedZone && !deletedFavorites && restoredShopping && (
        <Toast
          t={t}
          message={tr(lang, 'app.toastAddedFromShopping', { name: restoredShopping.entry.name })}
          actionLabel={tr(lang, 'app.undo')}
          onAction={undoRestoreFromShopping}
        />
      )}

      <AddItemSheet
        open={showAdd} onClose={closeAdd} t={t} dark={dark} lang={lang}
        zones={zones} categories={categories} onAddCategory={addCategory}
        newItem={newItem} setNewItem={setNewItem}
        scanSupported={scanSupported} scanBusy={scanBusy} scanMsg={scanMsg} stepGml={prefs.stepGml} showSlider={prefs.showSlider}
        onScanBarcode={() => openScanFlow('single')} onScanDate={handleScanDate} onOpenBatch={() => openScanFlow('batch')} onSubmit={addItem}
      />

      <EditItemSheet
        editItem={editItem} setEditItem={setEditItem} onClose={() => { setEditItem(null); setScanMsg(''); }}
        t={t} dark={dark} lang={lang} zones={zones} categories={categories} onAddCategory={addCategory}
        scanSupported={scanSupported} scanBusy={scanBusy} scanMsg={scanMsg} stepGml={prefs.stepGml} showSlider={prefs.showSlider}
        onScanDate={handleScanDate} onSave={saveEdit} onDelete={deleteFromEdit}
      />

      <ShoppingSheet
        open={showShopping} onClose={() => setShowShopping(false)} t={t} dark={dark} lang={lang} zones={zones}
        shopping={shopping} shoppingInput={shoppingInput} setShoppingInput={setShoppingInput}
        onAddManual={addManualShopping} onCheck={checkAndRestore} onRemove={removeFromShopping} onUpdate={updateShoppingItem}
        onClearAll={clearShopping} justChecked={justChecked} showCount={(prefs.shoppingBadgeMode || 'count') !== 'off'}
        favorites={sortedFavorites} onTapFavorite={addFavoriteToShopping} showFavoriteChips={prefs.showFavoriteChips !== false}
        favoritesCollapsed={prefs.favoritesCollapsed} onToggleFavoritesCollapsed={toggleFavoritesCollapsed}
      />

      <SettingsSheet
        open={showSettings} onClose={() => setShowSettings(false)} t={t} lang={lang} onSetLang={setLang}
        themeOverride={themeOverride} setThemeOverride={setThemeOverride}
        onManageZones={() => { setShowSettings(false); setShowZones(true); }}
        onManageCategories={() => { setShowSettings(false); setShowCategories(true); }}
        onManageFavorites={() => { setShowSettings(false); setShowFavorites(true); }}
        onManageFoods={() => { setShowSettings(false); setShowFoods(true); }}
        stats={{ items: items.length, zones: zones.length, categories: categories.length, foods: foods.length, favorites: favorites.length, history: history.length }}
        onOpenShelfLife={() => { setShowSettings(false); setShowShelfLife(true); }}
        onOpenExpiringView={() => { setShowSettings(false); setExpiringView(true); setSearch(''); }}
        onOpenProduceStorage={() => { setShowSettings(false); setShowProduceStorage(true); }}
        onOpenSpiceGuide={() => { setShowSettings(false); setShowSpiceGuide(true); }}
        onOpenHistory={() => { setShowSettings(false); setShowHistory(true); }}
        onOpenBackup={() => { setShowSettings(false); setShowBackup(true); }}
        onOpenLayout={() => { setShowSettings(false); setShowLayout(true); }}
        onOpenBehavior={() => { setShowSettings(false); setShowBehavior(true); }}
        onOpenWarnSettings={() => { setShowSettings(false); setShowWarnSettings(true); }}
      />

      <LayoutSheet
        open={showLayout} onClose={() => setShowLayout(false)} t={t} lang={lang}
        headerAlign={prefs.headerAlign || 'left'}
        onSetHeaderAlign={(v) => setPrefs((p) => ({ ...p, headerAlign: v }))}
        appTitle={prefs.appTitle || ''}
        onSetAppTitle={(v) => setPrefs((p) => ({ ...p, appTitle: v }))}
        shoppingPos={prefs.shoppingPos || 'top'}
        onSetShoppingPos={(v) => setPrefs((p) => ({ ...p, shoppingPos: v }))}
        settingsPos={prefs.settingsPos || 'top'}
        onSetSettingsPos={(v) => setPrefs((p) => ({ ...p, settingsPos: v }))}
        addPos={prefs.addPos || 'bottom'}
        onSetAddPos={(v) => setPrefs((p) => ({ ...p, addPos: v }))}
        favoritesPos={prefs.favoritesPos || 'off'}
        onSetFavoritesPos={(v) => setPrefs((p) => ({ ...p, favoritesPos: v }))}
        historyPos={prefs.historyPos || 'off'}
        onSetHistoryPos={(v) => setPrefs((p) => ({ ...p, historyPos: v }))}
        searchPos={prefs.searchPos || 'bottom'}
        onSetSearchPos={(v) => setPrefs((p) => ({ ...p, searchPos: v }))}
        foodsPos={prefs.foodsPos || 'off'}
        onSetFoodsPos={(v) => setPrefs((p) => ({ ...p, foodsPos: v }))}
        zoneEmojiBothSides={prefs.zoneEmojiBothSides === true}
        onToggleZoneEmojiBothSides={(on) => setPrefs((p) => ({ ...p, zoneEmojiBothSides: on }))}
        bottomButtonsLayout={prefs.bottomButtonsLayout || 'stack'}
        onSetBottomButtonsLayout={(v) => setPrefs((p) => ({ ...p, bottomButtonsLayout: v }))}
        hideAddWithButtons={prefs.hideAddWithButtons === true}
        onToggleHideAddWithButtons={(on) => setPrefs((p) => ({ ...p, hideAddWithButtons: on }))}
        swapAddHideOrder={prefs.swapAddHideOrder === true}
        onToggleSwapAddHideOrder={(on) => setPrefs((p) => ({ ...p, swapAddHideOrder: on }))}
        addSameSize={prefs.addSameSize === true}
        onToggleAddSameSize={(on) => setPrefs((p) => ({ ...p, addSameSize: on }))}
      />

      <BehaviorSheet
        open={showBehavior} onClose={() => setShowBehavior(false)} t={t} lang={lang}
        mainSortMode={prefs.mainSortMode || 'category'}
        onSetMainSortMode={(v) => setPrefs((p) => ({ ...p, mainSortMode: v }))}
        shoppingBadgeMode={prefs.shoppingBadgeMode || 'count'}
        onSetShoppingBadgeMode={(v) => setPrefs((p) => ({ ...p, shoppingBadgeMode: v }))}
        autoShoppingOnRemove={prefs.autoShoppingOnRemove !== false}
        onToggleAutoShoppingOnRemove={(on) => setPrefs((p) => ({ ...p, autoShoppingOnRemove: on }))}
        stepGml={prefs.stepGml}
        onSetStepGml={(v) => setPrefs((p) => ({ ...p, stepGml: v }))}
        showSlider={prefs.showSlider !== false}
        onToggleShowSlider={(on) => setPrefs((p) => ({ ...p, showSlider: on }))}
        showWarnDot={prefs.showWarnDot !== false}
        onToggleShowWarnDot={(on) => setPrefs((p) => ({ ...p, showWarnDot: on }))}
        dateFormat={prefs.dateFormat || 'dmy'}
        onSetDateFormat={(v) => setPrefs((p) => ({ ...p, dateFormat: v }))}
        stripBrandNames={prefs.stripBrandNames !== false}
        onToggleStripBrandNames={(on) => setPrefs((p) => ({ ...p, stripBrandNames: on }))}
        showFavoriteChips={prefs.showFavoriteChips !== false}
        onToggleShowFavoriteChips={(on) => setPrefs((p) => ({ ...p, showFavoriteChips: on }))}
        compactList={prefs.compactList === true}
        onToggleCompactList={(on) => setPrefs((p) => ({ ...p, compactList: on }))}
        historyAllItems={prefs.historyAllItems === true}
        onToggleHistoryAllItems={(on) => setPrefs((p) => ({ ...p, historyAllItems: on }))}
      />

      <WarnSheet
        open={showWarnSettings} onClose={() => setShowWarnSettings(false)} t={t} lang={lang}
        warn={warn} onUpdateWarn={updateWarn} onSetNotify={setNotifyEnabled} notifySupported={notificationsSupported()}
        customColors={customMhdColors} onAddCustomColor={addCustomMhdColor} onRemoveCustomColor={removeCustomMhdColor}
      />

      <ManageZonesSheet
        open={showZones} onClose={() => setShowZones(false)} t={t} dark={dark} lang={lang}
        zones={zones} countFor={countFor}
        onAdd={addZone} onUpdate={updateZone} onRemove={removeZoneWithReassign} onMove={moveZone}
        customColors={customZoneColors} onAddCustomColor={addCustomZoneColor} onRemoveCustomColor={removeCustomZoneColor}
        defaultZoneId={prefs.defaultZoneId}
        onSetDefaultZoneId={(id) => setPrefs((p) => ({ ...p, defaultZoneId: id }))}
        focusMode={prefs.focusMode === true}
        onExitFocusMode={() => setPrefs((p) => ({ ...p, focusMode: false }))}
      />

      <ManageCategoriesSheet
        open={showCategories} onClose={() => setShowCategories(false)} t={t} lang={lang}
        categories={categories} countFor={countForCategory}
        onAdd={addCategory} onRename={renameCategory} onRemove={removeCategoryWithReassign} onMove={moveCategory}
      />

      <ManageFavoritesSheet
        open={showFavorites} onClose={() => setShowFavorites(false)} t={t} dark={dark} lang={lang}
        favorites={sortedFavorites} zones={zones} onRemove={removeFavorite} onUpdate={updateFavorite} onMove={moveFavorite}
        onAddToInventory={addFavoriteToInventory} onAddToShopping={addFavoriteToShopping}
        hasInventoryItems={items.length > 0} onAddAllFromInventory={addAllInventoryToFavorites}
        onClearAll={clearAllFavorites}
        onEditFood={(name) => { setShowFavorites(false); setEditFoodName(name); setFoodsFromFavorites(true); setShowFoods(true); }}
        sortMode={prefs.favoritesSortMode || 'manual'}
        onSetSortMode={(v) => setPrefs((p) => ({ ...p, favoritesSortMode: v }))}
        getFood={getFood}
      />

      <ManageFoodsSheet
        open={showFoods}
        onClose={() => {
          setShowFoods(false);
          setEditFoodName(null);
          if (foodsFromFavorites) { setFoodsFromFavorites(false); setShowFavorites(true); }
        }}
        t={t} lang={lang}
        foods={foods} onUpsert={upsertFood} onRemove={removeFood}
        scanSupported={scanSupported} initialEditName={editFoodName} stepGml={prefs.stepGml}
        onRenameLinkedFavorite={renameLinkedFavorite}
        isFavorite={isFavorite} onToggleFavorite={toggleFavorite}
        onMacrosCopied={(food) => logHistory(food.name, food, 'consumed')}
      />

      <ShelfLifeSheet open={showShelfLife} onClose={() => setShowShelfLife(false)} t={t} lang={lang} />
      <ProduceStorageSheet open={showProduceStorage} onClose={() => setShowProduceStorage(false)} t={t} lang={lang} />
      <SpiceGuideSheet open={showSpiceGuide} onClose={() => setShowSpiceGuide(false)} t={t} lang={lang} />
      <HistorySheet open={showHistory} onClose={() => setShowHistory(false)} t={t} lang={lang} history={history} onRemoveHistory={removeHistory} />
      <BackupSheet
        open={showBackup} onClose={() => setShowBackup(false)} t={t} dark={dark} lang={lang} zones={zones} items={items} shopping={shopping}
        stats={{ items: items.length, zones: zones.length, categories: categories.length, foods: foods.length }}
        buildBackup={buildBackup} restoreBackup={restoreBackup} previewBackup={previewBackup}
        getFood={getFood} dateFormat={prefs.dateFormat || 'dmy'}
      />

      <DetailItemSheet
        open={!!detailLive} item={detailLive}
        zone={detailLive ? resolveZone(detailLive.zone) : null}
        food={detailLive ? getFood(detailLive.name) : null}
        t={t} dark={dark} lang={lang} yellowDays={yellowDays} orangeDays={orangeDays} warnColors={warnColors} dateFormat={prefs.dateFormat || 'dmy'}
        isFavorite={detailLive ? isFavorite(detailLive.name) : false}
        onToggleFavorite={() => detailLive && toggleFavorite(detailLive)}
        onClose={() => setDetailItem(null)}
        onEdit={(it) => { setDetailItem(null); openEdit(it); }}
        onChangeQty={changeQty}
        onRemove={(id) => { setDetailItem(null); removeItem(id); }}
        onToggleOpened={toggleOpened}
        onChangeMhd={changeMhd}
        onMacrosCopied={(food) => logHistory(food.name, food, 'consumed')}
      />
    </div>

    {/* Der geführte Scan-Flow liegt außerhalb des ausgeblendeten Bereichs,
        damit während des transparenten Live-Barcode-Scans nur sein Overlay
        über dem Kamerabild sichtbar ist. */}
    <ScanFlowSheet
      open={showScanFlow} onClose={() => setShowScanFlow(false)} t={t} dark={dark} lang={lang} dateFormat={prefs.dateFormat || 'dmy'}
      zones={zones} categories={categories} onAddCategory={addCategory}
      targetZone={scanZone || activeZone} mode={scanMode}
      onCommit={commitScanFlow} stripBrandNames={prefs.stripBrandNames !== false}
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
