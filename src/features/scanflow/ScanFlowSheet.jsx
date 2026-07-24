import { useEffect, useRef, useState } from 'react';
import { X, Camera, SkipForward, Trash2, ScanLine, Utensils, Plus, Minus, Zap } from 'lucide-react';
import { BarcodeIcon } from '../../components/icons.jsx';
import { CategoryPicker } from '../../components/CategoryPicker.jsx';
import { ClearableInput } from '../../components/ClearableInput.jsx';
import { zonePalette } from '../../lib/colors.js';
import { formatDateDisplay } from '../../lib/date.js';
import { btnCircle, makeInputStyle, pillStyle, primaryButtonStyle } from '../../lib/styles.js';
import { hasMacros } from '../../lib/macros.js';
import { tr } from '../../lib/i18n.js';
import { lookupOpenFoodFacts } from '../../scan/scan.js';
import { startBarcodeScan, captureMhdViaPhoto, captureNutritionViaPhoto } from '../../scan/camera.js';

function vibrate(ms = 35) {
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch { /* egal */ }
}

// Geführter Scan: Barcode live -> MHD-Foto -> nächstes Produkt. Am Ende alles
// gesammelt übernehmen. Es ist immer nur eine Kamera-Pipeline aktiv (erst der
// native Live-Scanner, dann die System-Kamera fürs MHD-Foto).
// `mode` = 'batch' (Standard, mehrere hintereinander) | 'single' (ein Produkt,
// danach direkt zur Übernahme-Ansicht).
export function ScanFlowSheet({ open, onClose, t, dark, lang = 'de', zones, categories, onAddCategory, targetZone, mode = 'batch', onCommit, dateFormat = 'dmy' }) {
  const [phase, setPhase] = useState('barcode'); // barcode | mhd | nutrition | review
  const [collected, setCollected] = useState([]);
  const [current, setCurrent] = useState(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [scanError, setScanError] = useState('');
  // Schnellmodus (nur Batch): MHD-/Nährwerte-Fotos komplett überspringen,
  // jeder Barcode wird sofort übernommen und es geht direkt zum nächsten.
  const [skipExtras, setSkipExtras] = useState(false);
  const [scanGen, setScanGen] = useState(0);

  const barcodeStopRef = useRef(null);
  const detectedRef = useRef(false);
  const zoneRef = useRef(targetZone);
  zoneRef.current = targetZone;
  // Ref statt State-Closure, weil handleBarcode als onDetected-Callback an den
  // nativen Scanner übergeben wird und dessen Closure erst beim nächsten
  // Phasenwechsel neu erstellt würde - ein Umschalten mitten im Scannen soll
  // aber sofort beim nächsten Treffer wirken.
  const skipExtrasRef = useRef(skipExtras);
  skipExtrasRef.current = skipExtras;

  const zone = zones.find((z) => z.id === targetZone) || zones[0];
  const pal = zonePalette(zone.color, dark);

  // Reset beim Öffnen
  useEffect(() => {
    if (!open) return;
    setPhase('barcode');
    setCollected([]);
    setCurrent(null);
    setStatus('');
    setScanError('');
    setSkipExtras(false);
    setScanGen(0);
  }, [open]);

  // Barcode-Phase: nativer Live-Scanner. `scanGen` ist ein reiner Neustart-
  // Trigger für den Schnellmodus, der nach jedem Treffer in derselben Phase
  // bleibt (phase ändert sich dort nicht, würde die Kamera also nicht neu
  // starten) - siehe handleBarcode.
  useEffect(() => {
    if (!open || phase !== 'barcode') return undefined;
    let cancelled = false;
    detectedRef.current = false;
    setScanError('');
    setStatus(tr(lang, 'scan.barcodeAiming'));
    (async () => {
      try {
        const stop = await startBarcodeScan({ onDetected: handleBarcode, zoom: 2 });
        barcodeStopRef.current = stop;
        if (cancelled) { stop(); barcodeStopRef.current = null; }
      } catch (e) {
        setScanError(e?.message || 'Scanner konnte nicht starten.');
      }
    })();
    return () => {
      cancelled = true;
      if (barcodeStopRef.current) { barcodeStopRef.current(); barcodeStopRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase, scanGen]);

  const stopBarcode = async () => {
    if (barcodeStopRef.current) {
      const stop = barcodeStopRef.current;
      barcodeStopRef.current = null;
      await stop();
    }
  };

  async function handleBarcode(value) {
    if (detectedRef.current) return;
    detectedRef.current = true;
    vibrate();
    await stopBarcode();
    const base = { barcode: value, name: '', category: 'Sonstiges', qty: 1, unit: 'stk', zone: zoneRef.current, mhd: null, macros: null };
    const quick = skipExtrasRef.current;
    setCurrent(base);
    setStatus(tr(lang, 'scan.searchingProduct'));
    if (!quick) setPhase('mhd');
    let product = null;
    try { product = await lookupOpenFoodFacts(value); } catch { product = null; }
    const resolved = { ...base, ...(product ? { name: product.name, category: product.category, qty: product.qty, unit: product.unit } : {}) };
    setStatus(product ? `✓ ${product.name}` : tr(lang, 'scan.noMatch', { value }));
    if (quick) {
      // Bleibt in der Barcode-Phase (phase ändert sich nicht) - Kamera per
      // scanGen-Bump manuell neu starten statt auf den Phasenwechsel-Effekt zu warten.
      commitCurrent({}, resolved);
      setScanGen((g) => g + 1);
    } else {
      setCurrent(resolved);
    }
  }

  // Ohne Barcode direkt zum MHD (z.B. lose Ware)
  const skipBarcode = async () => {
    detectedRef.current = true;
    await stopBarcode();
    setCurrent({ barcode: null, name: '', category: 'Sonstiges', qty: 1, unit: 'stk', zone: zoneRef.current, mhd: null, macros: null });
    setStatus('');
    setPhase('mhd');
  };

  const captureMhd = async () => {
    setBusy(true);
    setStatus(tr(lang, 'scan.photographDate'));
    try {
      const res = await captureMhdViaPhoto();
      if (res.date) {
        vibrate();
        setCurrent((c) => (c ? { ...c, mhd: res.date } : c));
        setStatus('');
        setPhase('nutrition');
      } else if (res.text && res.text.trim()) {
        const snippet = res.text.trim().replace(/\s+/g, ' ').slice(0, 40);
        setStatus(tr(lang, 'scan.noDateFound', { snippet }));
      } else {
        setStatus(tr(lang, 'scan.noTextFound'));
      }
    } catch (e) {
      setStatus(e?.message || tr(lang, 'scan.recognitionFailed'));
    } finally {
      setBusy(false);
    }
  };

  const captureNutrition = async () => {
    setBusy(true);
    setStatus(tr(lang, 'scan.photographTable'));
    try {
      const { facts, text } = await captureNutritionViaPhoto();
      if (hasMacros(facts)) {
        vibrate();
        commitCurrent({ macros: facts });
      } else if (text && text.trim()) {
        const snippet = text.trim().replace(/\s+/g, ' ').slice(0, 40);
        setStatus(tr(lang, 'scan.noMacrosFound', { snippet }));
      } else {
        setStatus(tr(lang, 'scan.noTextFound'));
      }
    } catch (e) {
      setStatus(e?.message || tr(lang, 'scan.recognitionFailed'));
    } finally {
      setBusy(false);
    }
  };

  // Aktuelles Produkt in die Sammelliste. Im Batch-Modus geht es direkt weiter
  // zum nächsten Barcode, im Einzel-Modus zur Übernahme-Ansicht. `base` kann
  // statt aus dem `current`-State explizit übergeben werden - nötig im
  // Schnellmodus, wo direkt nach dem await der Produktsuche committet wird
  // und der current-State-Closure zu diesem Zeitpunkt noch veraltet sein kann.
  const commitCurrent = (patch = {}, base = current) => {
    const item = { key: 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), ...base, ...patch };
    setCollected((prev) => [...prev, item]);
    setCurrent(null);
    if (mode === 'single') {
      setStatus('');
      setPhase('review');
    } else {
      setStatus(tr(lang, 'scan.committed'));
      setPhase('barcode');
    }
  };

  const goReview = async () => {
    await stopBarcode();
    if (current) {
      setCollected((prev) => [...prev, { key: 'k' + Date.now().toString(36), ...current }]);
      setCurrent(null);
    }
    setPhase('review');
  };

  const close = async () => {
    await stopBarcode();
    onClose();
  };

  const commitAll = async () => {
    await stopBarcode();
    onCommit(collected.filter((c) => c.name.trim()));
  };

  if (!open) return null;

  // ----- Review-Phase --------------------------------------------------------
  if (phase === 'review') {
    const validCount = collected.filter((c) => c.name.trim()).length;
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: t.bg, display: 'flex', flexDirection: 'column' }}>
        <TopBar t={t} lang={lang} title={tr(lang, 'scan.collected', { count: collected.length })} onClose={close} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px' }}>
          {collected.length === 0 ? (
            <div style={{ textAlign: 'center', color: t.textFaint, padding: '48px 12px' }}>{tr(lang, 'scan.notCollected')}</div>
          ) : collected.map((b) => (
            <ReviewRow
              key={b.key}
              b={b}
              zones={zones}
              dark={dark}
              t={t}
              lang={lang}
              dateFormat={dateFormat}
              categories={categories}
              onAddCategory={onAddCategory}
              onUpdate={(patch) => setCollected((prev) => prev.map((x) => (x.key === b.key ? { ...x, ...patch } : x)))}
              onCycleZone={() => setCollected((prev) => prev.map((x) => {
                if (x.key !== b.key) return x;
                const order = zones.map((zz) => zz.id);
                return { ...x, zone: order[(order.indexOf(x.zone) + 1) % order.length] };
              }))}
              onRemove={() => setCollected((prev) => prev.filter((x) => x.key !== b.key))}
            />
          ))}
        </div>
        <div style={{ padding: '12px 16px calc(16px + env(safe-area-inset-bottom))', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 10 }}>
          <button onClick={() => setPhase('barcode')} style={{ flexShrink: 0, padding: '14px 18px', borderRadius: 14, border: `1.5px solid ${t.border}`, background: 'transparent', color: t.textMuted, fontWeight: 700, cursor: 'pointer' }}>
            {tr(lang, 'scan.continueScanning')}
          </button>
          <button onClick={commitAll} disabled={validCount === 0} style={{ ...primaryButtonStyle(t), opacity: validCount === 0 ? 0.45 : 1 }}>
            {tr(lang, 'scan.apply')}
          </button>
        </div>
      </div>
    );
  }

  const bottomBar = (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '16px 16px calc(20px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 12, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
      {status && (
        <div style={{ textAlign: 'center', fontSize: 13.5, fontWeight: 600, color: status.startsWith('✓') ? '#8FE39A' : '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
          {status}
        </div>
      )}
      {phase === 'barcode' ? (
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={skipBarcode} style={ghostBtn}>{tr(lang, 'scan.withoutBarcode')}</button>
          {collected.length > 0 && (
            <button onClick={goReview} style={solidBtn(pal)}>{tr(lang, 'scan.done', { count: collected.length })}</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => commitCurrent()} style={ghostBtn}>
            <SkipForward size={17} /> {tr(lang, 'scan.withoutMhd')}
          </button>
          <button onClick={captureMhd} disabled={busy} style={{ ...solidBtn(pal), opacity: busy ? 0.6 : 1 }}>
            <Camera size={18} /> {busy ? tr(lang, 'scan.reading') : tr(lang, 'scan.mhdPhoto')}
          </button>
        </div>
      )}
    </div>
  );

  // ----- Barcode-Phase: transparenter Hintergrund (natives Kamerabild) ------
  if (phase === 'barcode') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column' }}>
        <ScanTopBar onClose={close} title={tr(lang, 'scan.scanBarcodeTitle')} step="1" lang={lang} />
        {mode === 'batch' && (
          <div style={{ position: 'absolute', top: 'calc(66px + env(safe-area-inset-top))', left: 0, right: 0, zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '0 24px' }}>
            <button
              type="button"
              onClick={() => setSkipExtras((v) => !v)}
              aria-pressed={skipExtras}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, cursor: 'pointer',
                border: `1.5px solid ${skipExtras ? pal.accent : 'rgba(255,255,255,0.5)'}`,
                background: skipExtras ? pal.accent : 'rgba(0,0,0,0.35)',
                color: skipExtras ? '#141210' : '#fff', fontSize: 12.5, fontWeight: 700,
              }}
            >
              <Zap size={14} /> {tr(lang, 'scan.quickMode')}
            </button>
            {skipExtras && (
              <div style={{ textAlign: 'center', fontSize: 11.5, color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                {tr(lang, 'scan.quickModeHint')}
              </div>
            )}
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {scanError ? (
            <div style={{ textAlign: 'center', color: '#fff', padding: '0 32px' }}>
              <div style={{ fontSize: 14, marginBottom: 16, textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>{scanError}</div>
              <button onClick={() => setPhase('review')} style={{ ...ghostBtn, flex: 'none', padding: '12px 20px' }}>{tr(lang, 'scan.toOverview')}</button>
            </div>
          ) : (
            <div style={{ width: '78%', maxWidth: 320, aspectRatio: '1.6 / 1', border: `3px solid ${pal.accent}`, borderRadius: 18, boxShadow: '0 0 0 100vmax rgba(0,0,0,0.35)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.85)', gap: 8, textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                <BarcodeIcon size={22} color="rgba(255,255,255,0.85)" /> {tr(lang, 'scan.aim')}
              </div>
            </div>
          )}
        </div>
        {bottomBar}
      </div>
    );
  }

  // ----- MHD-Phase: Foto-Aufnahme (kein Livebild) ---------------------------
  if (phase === 'mhd') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: t.bg, display: 'flex', flexDirection: 'column' }}>
        <TopBar t={t} lang={lang} title={current?.name ? current.name : tr(lang, 'scan.mhdTitle')} step="2" onClose={close} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', textAlign: 'center' }}>
          <div style={{ width: 96, height: 96, borderRadius: 24, background: pal.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <ScanLine size={44} color={pal.accent} strokeWidth={1.8} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>{tr(lang, 'scan.mhdHeading')}</div>
          <div style={{ fontSize: 13.5, color: t.textMuted, marginTop: 8, lineHeight: 1.5, maxWidth: 300 }}>
            {tr(lang, 'scan.mhdHint')}
          </div>
          {status && !status.startsWith(tr(lang, 'scan.photographDate').split('…')[0]) && (
            <div style={{ fontSize: 12.5, marginTop: 16, color: status.startsWith('✓') ? t.success : t.textMuted, lineHeight: 1.4 }}>
              {status}
            </div>
          )}
        </div>
        <div style={{ padding: '12px 16px calc(16px + env(safe-area-inset-bottom))', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 10 }}>
          <button onClick={() => { setStatus(''); setPhase('nutrition'); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 12px', borderRadius: 14, border: `1.5px solid ${t.border}`, background: 'transparent', color: t.textMuted, fontWeight: 700, cursor: 'pointer' }}>
            <SkipForward size={17} /> {tr(lang, 'scan.withoutMhd')}
          </button>
          <button onClick={captureMhd} disabled={busy} style={{ ...primaryButtonStyle(t), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: busy ? 0.6 : 1 }}>
            <Camera size={18} /> {busy ? tr(lang, 'scan.reading') : tr(lang, 'scan.mhdPhoto')}
          </button>
        </div>
      </div>
    );
  }

  // ----- Nährwerte-Phase: Foto der Nährwerttabelle + OCR --------------------
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: t.bg, display: 'flex', flexDirection: 'column' }}>
      <TopBar t={t} lang={lang} title={current?.name ? current.name : tr(lang, 'scan.nutritionTitle')} step="3" onClose={close} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', textAlign: 'center' }}>
        <div style={{ width: 96, height: 96, borderRadius: 24, background: pal.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Utensils size={42} color={pal.accent} strokeWidth={1.8} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>{tr(lang, 'scan.nutritionHeading')}</div>
        <div style={{ fontSize: 13.5, color: t.textMuted, marginTop: 8, lineHeight: 1.5, maxWidth: 300 }}>
          {tr(lang, 'scan.nutritionHint')}
        </div>
        {status && !status.startsWith(tr(lang, 'scan.photographTable').split('…')[0]) && (
          <div style={{ fontSize: 12.5, marginTop: 16, color: status.startsWith('✓') ? t.success : t.textMuted, lineHeight: 1.4 }}>
            {status}
          </div>
        )}
      </div>
      <div style={{ padding: '12px 16px calc(16px + env(safe-area-inset-bottom))', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 10 }}>
        <button onClick={() => commitCurrent()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 12px', borderRadius: 14, border: `1.5px solid ${t.border}`, background: 'transparent', color: t.textMuted, fontWeight: 700, cursor: 'pointer' }}>
          <SkipForward size={17} /> {tr(lang, 'scan.withoutNutrition')}
        </button>
        <button onClick={captureNutrition} disabled={busy} style={{ ...primaryButtonStyle(t), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: busy ? 0.6 : 1 }}>
          <Camera size={18} /> {busy ? tr(lang, 'scan.reading') : tr(lang, 'scan.scanTable')}
        </button>
      </div>
    </div>
  );
}

const ghostBtn = {
  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  padding: '15px 12px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.5)',
  background: 'rgba(0,0,0,0.35)', color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: 'pointer',
};

function solidBtn(pal) {
  return {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '15px 12px', borderRadius: 14, border: 'none',
    background: pal.accent, color: '#141210', fontSize: 15, fontWeight: 800, cursor: 'pointer',
  };
}

function ScanTopBar({ onClose, title, step, lang }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 'calc(14px + env(safe-area-inset-top)) 16px 14px' }}>
      <button onClick={onClose} style={btnCircle('rgba(0,0,0,0.4)', '#fff', 40)} aria-label={tr(lang, 'common.close')}>
        <X size={18} />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontWeight: 700, fontSize: 15, textShadow: '0 1px 3px rgba(0,0,0,0.6)', minWidth: 0 }}>
        <span style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 8, padding: '2px 8px', fontSize: 12 }}>{tr(lang, 'scan.step', { n: step })}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
      </div>
      <div style={{ width: 40 }} />
    </div>
  );
}

function TopBar({ t, title, step, onClose, lang }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'calc(14px + env(safe-area-inset-top)) 16px 12px', borderBottom: `1px solid ${t.border}` }}>
      <button onClick={onClose} style={btnCircle(t.cardAlt, t.pillInactiveText, 38)} aria-label={tr(lang, 'common.close')}>
        <X size={17} />
      </button>
      {step && <span style={{ background: t.cardAlt, color: t.textMuted, borderRadius: 8, padding: '3px 9px', fontSize: 12, fontWeight: 700 }}>{tr(lang, 'scan.step', { n: step })}</span>}
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</h2>
    </div>
  );
}

// Eine bearbeitbare Zeile in der Übernahme-Ansicht: Lagerort, Name, Kategorie,
// Einheit und Menge lassen sich vor dem Übernehmen noch anpassen.
function ReviewRow({ b, zones, dark, t, lang, categories, onAddCategory, onUpdate, onCycleZone, onRemove, dateFormat = 'dmy' }) {
  const z = zones.find((zz) => zz.id === b.zone) || zones[0];
  const bp = zonePalette(z.color, dark);
  return (
    <div style={{ background: t.cardAlt, borderRadius: 14, padding: 10, marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={onCycleZone}
          style={{ flexShrink: 0, border: 'none', background: bp.accentBg, borderRadius: 10, width: 40, height: 40, fontSize: 18, cursor: 'pointer' }}
          aria-label={tr(lang, 'scan.changeZoneAria')}
        >
          {z.emoji}
        </button>
        <ClearableInput
          t={t}
          lang={lang}
          value={b.name}
          onChange={(v) => onUpdate({ name: v })}
          placeholder={tr(lang, 'scan.namePlaceholder')}
          style={{ ...makeInputStyle(t), marginTop: 0, padding: '9px 10px' }}
          wrapperStyle={{ flex: 1, minWidth: 0 }}
        />
        <button type="button" onClick={onRemove} style={{ ...btnCircle('transparent', t.danger, 34), flexShrink: 0 }} aria-label={tr(lang, 'scan.removeAria')}>
          <Trash2 size={15} />
        </button>
      </div>

      <div style={{ marginTop: 8 }}>
        <CategoryPicker
          value={b.category}
          onChange={(c) => onUpdate({ category: c })}
          categories={categories}
          onAddCategory={onAddCategory}
          t={t}
          lang={lang}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flex: 1 }}>
          {['stk', 'g', 'ml'].map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => onUpdate({ unit: u, qty: u === 'stk' ? Math.max(1, Math.round(b.qty) || 1) : (b.unit === 'stk' ? 500 : b.qty) })}
              style={{ ...pillStyle(b.unit === u, t), padding: '8px 6px', fontSize: 13 }}
            >
              {u === 'stk' ? tr(lang, 'scan.piece') : u}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button type="button" onClick={() => onUpdate({ qty: Math.max(1, (b.qty || 1) - (b.unit === 'stk' ? 1 : 50)) })} style={btnCircle(t.card, t.pillInactiveText, 32)}>
            <Minus size={14} strokeWidth={2.5} />
          </button>
          <span style={{ minWidth: 42, textAlign: 'center', fontSize: 13.5, fontWeight: 700, color: t.text }}>
            {b.unit === 'stk' ? `${b.qty}x` : `${b.qty}${b.unit}`}
          </span>
          <button type="button" onClick={() => onUpdate({ qty: (b.qty || 1) + (b.unit === 'stk' ? 1 : 50) })} style={btnCircle(bp.accentBg, bp.accent, 32)}>
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {(b.mhd || hasMacros(b.macros)) && (
        <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: t.textMuted }}>
          {b.mhd && <span>{tr(lang, 'scan.mhdLabel', { date: formatDateDisplay(b.mhd, dateFormat) })}</span>}
          {hasMacros(b.macros) && <span style={{ color: t.success, fontWeight: 700 }}>{tr(lang, 'scan.macrosOk')}</span>}
        </div>
      )}
    </div>
  );
}
