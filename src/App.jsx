import { useEffect, useMemo, useRef, useState } from 'react';
import { Package } from 'lucide-react';

import { useSystemTheme, buildTheme } from './lib/theme.js';
import { useStorage } from './hooks/useStorage.js';
import { useZones } from './hooks/useZones.js';
import { useCategories } from './hooks/useCategories.js';
import { SEED } from './lib/defaults.js';
import { daysUntil } from './lib/date.js';
import { isScanSupported, scanAndLookup, capturePhotoAndReadDate } from './scan/scan.js';

import { Header } from './components/Header.jsx';
import { ZoneTabs } from './components/ZoneTabs.jsx';
import { ExpiringBanner } from './components/ExpiringBanner.jsx';
import { SearchBar } from './components/SearchBar.jsx';
import { ItemRow } from './components/ItemRow.jsx';
import { Fab } from './components/Fab.jsx';
import { Toast } from './components/Toast.jsx';

import { AddItemSheet } from './features/add/AddItemSheet.jsx';
import { EditItemSheet } from './features/edit/EditItemSheet.jsx';
import { BatchScanSheet } from './features/batch/BatchScanSheet.jsx';
import { ShoppingSheet } from './features/shopping/ShoppingSheet.jsx';
import { ManageZonesSheet } from './features/zones/ManageZonesSheet.jsx';
import { SettingsSheet } from './features/settings/SettingsSheet.jsx';

const newId = (prefix = 'i') => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export default function App() {
  const { dark, override: themeOverride, setThemeOverride, themeLoaded } = useSystemTheme();
  const t = buildTheme(dark);

  const { zones, loaded: zonesLoaded, addZone, updateZone, setZones } = useZones();
  const { categories, loaded: catsLoaded, addCategory, setCategories } = useCategories();
  const [items, setItems, itemsLoaded] = useStorage('gt-items-v1', SEED);
  const [shopping, setShopping, shoppingLoaded] = useStorage('gt-shopping-v1', []);

  const [activeZone, setActiveZone] = useState(null);
  const [search, setSearch] = useState('');

  // Sheets
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showBatch, setShowBatch] = useState(false);
  const [showShopping, setShowShopping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showZones, setShowZones] = useState(false);

  // Formular / Scan
  const [newItem, setNewItem] = useState({ name: '', zone: null, category: null, qty: 1, unit: 'stk', mhd: null });
  const [scanBusy, setScanBusy] = useState(false);
  const [scanMsg, setScanMsg] = useState('');
  const [batchItems, setBatchItems] = useState([]);
  const [batchZone, setBatchZone] = useState(null);

  // Toast / Feedback
  const [deletedItem, setDeletedItem] = useState(null);
  const [justChanged, setJustChanged] = useState(null);
  const [justChecked, setJustChecked] = useState(null);
  const [shoppingInput, setShoppingInput] = useState('');

  const undoTimerRef = useRef(null);
  const flashTimerRef = useRef(null);
  const checkedTimerRef = useRef(null);

  const scanSupported = isScanSupported();
  const ready = themeLoaded && zonesLoaded && catsLoaded && itemsLoaded && shoppingLoaded
    && zones !== null && categories !== null && items !== null && shopping !== null;

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

  const resolveZone = (id) => (zones ? zones.find((z) => z.id === id) : undefined);
  const countFor = (id) => (items ? items.filter((i) => i.zone === id).length : 0);

  // -- Menge / Bearbeiten -----------------------------------------------------
  const stepFor = (unit, qty) => {
    if (unit !== 'g' && unit !== 'ml') return 1;
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
    setNewItem({ name: '', zone: activeZone, category: categories[0], qty: 1, unit: 'stk', mhd: null });
    setScanMsg('');
    setShowAdd(true);
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
    if (editItem.qty <= 0) {
      removeItem(editItem.id);
      setEditItem(null);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === editItem.id
      ? { ...i, name, zone: editItem.zone, category: editItem.category, qty: editItem.qty, unit: editItem.unit, mhd: editItem.mhd || null }
      : i)));
    setEditItem(null);
    setScanMsg('');
  };

  const deleteFromEdit = (id) => {
    removeItem(id);
    setEditItem(null);
  };

  // -- Scannen ----------------------------------------------------------------
  const handleScanBarcode = async () => {
    setScanMsg('');
    setScanBusy(true);
    try {
      const result = await scanAndLookup();
      if (!result) return;
      if (result.product) {
        setNewItem((s) => ({
          ...s,
          name: result.product.name,
          category: result.product.category || s.category,
          unit: result.product.unit,
          qty: result.product.qty,
        }));
        setScanMsg(`✓ ${result.product.name} erkannt.`);
      } else {
        setScanMsg(`Barcode ${result.barcode} nicht gefunden – bitte Name manuell eingeben.`);
      }
    } catch (e) {
      setScanMsg(e?.message || 'Scan fehlgeschlagen.');
    } finally {
      setScanBusy(false);
    }
  };

  const handleScanDate = async (target) => {
    setScanMsg('');
    setScanBusy(true);
    try {
      const { date, text } = await capturePhotoAndReadDate();
      if (date) {
        if (target === 'edit') setEditItem((s) => ({ ...s, mhd: date }));
        else setNewItem((s) => ({ ...s, mhd: date }));
        setScanMsg('✓ Datum erkannt.');
      } else if (text && text.trim()) {
        const snippet = text.trim().replace(/\s+/g, ' ').slice(0, 45);
        setScanMsg(`Kein Datum erkannt (gelesen: „${snippet}…"). Näher rangehen und nur das Datum fotografieren.`);
      } else {
        setScanMsg('Kein Text erkannt – Etikett schärfer/näher fotografieren.');
      }
    } catch (e) {
      setScanMsg(e?.message || 'Foto-Erkennung fehlgeschlagen.');
    } finally {
      setScanBusy(false);
    }
  };

  // -- Batch-Scan -------------------------------------------------------------
  const openBatch = () => {
    setBatchZone(activeZone);
    setScanMsg('');
    setShowAdd(false);
    setShowBatch(true);
  };

  const handleBatchScan = async () => {
    setScanMsg('');
    setScanBusy(true);
    try {
      const result = await scanAndLookup();
      if (!result) return;
      const { barcode, product } = result;
      setBatchItems((prev) => {
        const idx = prev.findIndex((b) => b.barcode && b.barcode === barcode);
        if (idx >= 0 && prev[idx].unit === 'stk') {
          const next = [...prev];
          next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
          return next;
        }
        const base = product || { name: '', category: 'Sonstiges', qty: 1, unit: 'stk' };
        return [...prev, {
          key: newId('b'), barcode,
          name: base.name || '', category: base.category || 'Sonstiges',
          qty: base.qty || 1, unit: base.unit || 'stk', zone: batchZone,
        }];
      });
      setScanMsg(product ? `✓ ${product.name || 'Artikel'} hinzugefügt.` : `Barcode ${barcode} nicht gefunden – Name bitte ergänzen.`);
    } catch (e) {
      setScanMsg(e?.message || 'Scan fehlgeschlagen.');
    } finally {
      setScanBusy(false);
    }
  };

  const updateBatchItem = (key, patch) => setBatchItems((prev) => prev.map((b) => (b.key === key ? { ...b, ...patch } : b)));
  const removeBatchItem = (key) => setBatchItems((prev) => prev.filter((b) => b.key !== key));
  const cycleBatchZone = (key) => setBatchItems((prev) => prev.map((b) => {
    if (b.key !== key) return b;
    const order = zones.map((z) => z.id);
    return { ...b, zone: order[(order.indexOf(b.zone) + 1) % order.length] };
  }));

  const commitBatch = () => {
    const valid = batchItems.filter((b) => b.name.trim());
    if (valid.length === 0) return;
    const newOnes = valid.map((b) => ({
      id: newId(), zone: b.zone, category: b.category, name: b.name.trim(),
      qty: b.qty > 0 ? b.qty : 1, unit: b.unit, mhd: null,
    }));
    setItems((prev) => [...prev, ...newOnes]);
    setShopping((prev) => prev.filter((s) =>
      !newOnes.some((n) => n.name.toLowerCase() === s.name.toLowerCase() && (s.zone === n.zone || s.zone === null))));
    setBatchItems([]);
    setShowBatch(false);
    setActiveZone(batchZone);
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
      setNewItem({ name: entry.name, zone: activeZone, category: categories[0], qty: 1, unit: 'stk', mhd: null });
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

  // -- Lagerorte --------------------------------------------------------------
  const removeZoneWithReassign = (id) => {
    if (!zones || zones.length <= 1) return;
    const target = zones.find((z) => z.id !== id);
    setItems((prev) => prev.map((i) => (i.zone === id ? { ...i, zone: target.id } : i)));
    setShopping((prev) => prev.map((s) => (s.zone === id ? { ...s, zone: target.id } : s)));
    setZones((prev) => prev.filter((z) => z.id !== id));
    if (activeZone === id) setActiveZone(target.id);
  };

  // -- Backup -----------------------------------------------------------------
  const buildBackup = () => JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), zones, categories, items, shopping }, null, 2);

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
    setItems(data.items);
    setShopping(Array.isArray(data.shopping) ? data.shopping : []);
    return { ok: true, message: `${data.items.length} Artikel wiederhergestellt.` };
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

  const expiringSoon = useMemo(() => {
    if (!items) return [];
    return items
      .filter((i) => i.mhd)
      .map((i) => ({ ...i, days: daysUntil(i.mhd) }))
      .filter((i) => i.days !== null && i.days <= 1)
      .sort((a, b) => a.days - b.days);
  }, [items]);

  if (!ready) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg, color: t.textMuted, fontFamily: 'system-ui, sans-serif' }}>
        Lade Bestand…
      </div>
    );
  }

  const zone = resolveZone(activeZone) || zones[0];
  const totalInZone = grouped.reduce((sum, [, list]) => sum + list.length, 0);

  return (
    <div style={{ minHeight: '100dvh', background: t.bg, paddingBottom: 110 }}>
      {/* Kopf + Tabs bleiben oben kleben */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: t.bg }}>
        <Header
          zone={zone} dark={dark} t={t}
          totalInZone={totalInZone}
          shoppingCount={shopping.length}
          onShopping={() => setShowShopping(true)}
          onSettings={() => setShowSettings(true)}
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
                  key={item.id} item={item} zone={resolveZone(item.zone)} t={t} dark={dark}
                  justChanged={justChanged} onEdit={setEditItem} onChangeQty={changeQty} onRemove={removeItem}
                  showZoneBadge isLast={idx === searchResults.length - 1}
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
                  key={item.id} item={item} zone={zone} t={t} dark={dark}
                  justChanged={justChanged} onEdit={setEditItem} onChangeQty={changeQty} onRemove={removeItem}
                  isLast={idx === list.length - 1}
                />
              ))}
            </Section>
          ))
        )}
      </div>

      <Fab zone={zone} dark={dark} t={t} onClick={openAdd} />

      {deletedItem && (
        <Toast
          t={t}
          message={`„${deletedItem.name}" entfernt · auf Einkaufsliste`}
          actionLabel="Rückgängig"
          onAction={undoDelete}
        />
      )}

      <AddItemSheet
        open={showAdd} onClose={closeAdd} t={t} dark={dark}
        zones={zones} categories={categories} onAddCategory={addCategory}
        newItem={newItem} setNewItem={setNewItem}
        scanSupported={scanSupported} scanBusy={scanBusy} scanMsg={scanMsg}
        onScanBarcode={handleScanBarcode} onScanDate={handleScanDate} onOpenBatch={openBatch} onSubmit={addItem}
      />

      <EditItemSheet
        editItem={editItem} setEditItem={setEditItem} onClose={() => { setEditItem(null); setScanMsg(''); }}
        t={t} dark={dark} zones={zones} categories={categories} onAddCategory={addCategory}
        scanSupported={scanSupported} scanBusy={scanBusy} scanMsg={scanMsg}
        onScanDate={handleScanDate} onSave={saveEdit} onDelete={deleteFromEdit}
      />

      <BatchScanSheet
        open={showBatch} onClose={() => setShowBatch(false)} t={t} dark={dark} zones={zones}
        batchZone={batchZone} setBatchZone={setBatchZone} batchItems={batchItems}
        scanBusy={scanBusy} scanMsg={scanMsg}
        onScan={handleBatchScan} onUpdateItem={updateBatchItem} onRemoveItem={removeBatchItem}
        onCycleZone={cycleBatchZone} onCommit={commitBatch}
      />

      <ShoppingSheet
        open={showShopping} onClose={() => setShowShopping(false)} t={t} dark={dark} zones={zones}
        shopping={shopping} shoppingInput={shoppingInput} setShoppingInput={setShoppingInput}
        onAddManual={addManualShopping} onCheck={checkAndRestore} onRemove={removeFromShopping} justChecked={justChecked}
      />

      <SettingsSheet
        open={showSettings} onClose={() => setShowSettings(false)} t={t}
        themeOverride={themeOverride} setThemeOverride={setThemeOverride}
        onManageZones={() => { setShowSettings(false); setShowZones(true); }}
        stats={{ items: items.length, zones: zones.length, categories: categories.length }}
        buildBackup={buildBackup} restoreBackup={restoreBackup}
      />

      <ManageZonesSheet
        open={showZones} onClose={() => setShowZones(false)} t={t} dark={dark}
        zones={zones} countFor={countFor}
        onAdd={addZone} onUpdate={updateZone} onRemove={removeZoneWithReassign}
      />
    </div>
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
