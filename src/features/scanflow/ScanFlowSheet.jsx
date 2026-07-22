import { useEffect, useRef, useState } from 'react';
import { X, Camera, SkipForward, Trash2, ScanLine, Plus, Minus } from 'lucide-react';
import { BarcodeIcon } from '../../components/icons.jsx';
import { CategoryPicker } from '../../components/CategoryPicker.jsx';
import { ClearableInput } from '../../components/ClearableInput.jsx';
import { zonePalette } from '../../lib/colors.js';
import { btnCircle, makeInputStyle, pillStyle, primaryButtonStyle } from '../../lib/styles.js';
import { lookupOpenFoodFacts } from '../../scan/scan.js';
import { startBarcodeScan, captureMhdViaPhoto } from '../../scan/camera.js';

function vibrate(ms = 35) {
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch { /* egal */ }
}

// Geführter Scan: Barcode live -> MHD-Foto -> nächstes Produkt. Am Ende alles
// gesammelt übernehmen. Es ist immer nur eine Kamera-Pipeline aktiv (erst der
// native Live-Scanner, dann die System-Kamera fürs MHD-Foto).
// `mode` = 'batch' (Standard, mehrere hintereinander) | 'single' (ein Produkt,
// danach direkt zur Übernahme-Ansicht).
export function ScanFlowSheet({ open, onClose, t, dark, zones, categories, onAddCategory, targetZone, mode = 'batch', onCommit }) {
  const [phase, setPhase] = useState('barcode'); // barcode | mhd | review
  const [collected, setCollected] = useState([]);
  const [current, setCurrent] = useState(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [scanError, setScanError] = useState('');

  const barcodeStopRef = useRef(null);
  const detectedRef = useRef(false);
  const zoneRef = useRef(targetZone);
  zoneRef.current = targetZone;

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
  }, [open]);

  // Barcode-Phase: nativer Live-Scanner
  useEffect(() => {
    if (!open || phase !== 'barcode') return undefined;
    let cancelled = false;
    detectedRef.current = false;
    setScanError('');
    setStatus('Barcode anvisieren…');
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
  }, [open, phase]);

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
    setCurrent({ barcode: value, name: '', category: 'Sonstiges', qty: 1, unit: 'stk', zone: zoneRef.current, mhd: null });
    setStatus('Suche Produkt…');
    setPhase('mhd');
    let product = null;
    try { product = await lookupOpenFoodFacts(value); } catch { product = null; }
    setCurrent((c) => (c ? { ...c, ...(product ? { name: product.name, category: product.category, qty: product.qty, unit: product.unit } : {}) } : c));
    setStatus(product ? `✓ ${product.name}` : `Barcode ${value} – kein Treffer, Name später ergänzen`);
  }

  // Ohne Barcode direkt zum MHD (z.B. lose Ware)
  const skipBarcode = async () => {
    detectedRef.current = true;
    await stopBarcode();
    setCurrent({ barcode: null, name: '', category: 'Sonstiges', qty: 1, unit: 'stk', zone: zoneRef.current, mhd: null });
    setStatus('');
    setPhase('mhd');
  };

  const captureMhd = async () => {
    setBusy(true);
    setStatus('Datum fotografieren…');
    try {
      const res = await captureMhdViaPhoto();
      if (res.date) {
        vibrate();
        commitCurrent({ mhd: res.date });
      } else if (res.text && res.text.trim()) {
        const snippet = res.text.trim().replace(/\s+/g, ' ').slice(0, 40);
        setStatus(`Kein Datum erkannt (gelesen: „${snippet}…"). Datum mittig ins Bild holen und erneut aufnehmen.`);
      } else {
        setStatus('Kein Text erkannt – näher ran und scharf stellen.');
      }
    } catch (e) {
      setStatus(e?.message || 'Erkennung fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  };

  // Aktuelles Produkt in die Sammelliste. Im Batch-Modus geht es direkt weiter
  // zum nächsten Barcode, im Einzel-Modus zur Übernahme-Ansicht.
  const commitCurrent = (patch = {}) => {
    const item = { key: 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), ...current, ...patch };
    setCollected((prev) => [...prev, item]);
    setCurrent(null);
    if (mode === 'single') {
      setStatus('');
      setPhase('review');
    } else {
      setStatus('✓ Übernommen – nächstes Produkt');
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
        <TopBar t={t} title={`Erfasst (${collected.length})`} onClose={close} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px' }}>
          {collected.length === 0 ? (
            <div style={{ textAlign: 'center', color: t.textFaint, padding: '48px 12px' }}>Noch nichts erfasst.</div>
          ) : collected.map((b) => (
            <ReviewRow
              key={b.key}
              b={b}
              zones={zones}
              dark={dark}
              t={t}
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
            Weiter scannen
          </button>
          <button onClick={commitAll} disabled={validCount === 0} style={{ ...primaryButtonStyle(t), opacity: validCount === 0 ? 0.45 : 1 }}>
            Übernehmen
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
          <button onClick={skipBarcode} style={ghostBtn}>Ohne Barcode</button>
          {collected.length > 0 && (
            <button onClick={goReview} style={solidBtn(pal)}>Fertig ({collected.length})</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => commitCurrent()} style={ghostBtn}>
            <SkipForward size={17} /> Ohne MHD
          </button>
          <button onClick={captureMhd} disabled={busy} style={{ ...solidBtn(pal), opacity: busy ? 0.6 : 1 }}>
            <Camera size={18} /> {busy ? 'Lese…' : 'MHD-Foto'}
          </button>
        </div>
      )}
    </div>
  );

  // ----- Barcode-Phase: transparenter Hintergrund (natives Kamerabild) ------
  if (phase === 'barcode') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column' }}>
        <ScanTopBar onClose={close} title="Barcode scannen" step="1" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {scanError ? (
            <div style={{ textAlign: 'center', color: '#fff', padding: '0 32px' }}>
              <div style={{ fontSize: 14, marginBottom: 16, textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>{scanError}</div>
              <button onClick={() => setPhase('review')} style={{ ...ghostBtn, flex: 'none', padding: '12px 20px' }}>Zur Übersicht</button>
            </div>
          ) : (
            <div style={{ width: '78%', maxWidth: 320, aspectRatio: '1.6 / 1', border: `3px solid ${pal.accent}`, borderRadius: 18, boxShadow: '0 0 0 100vmax rgba(0,0,0,0.35)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.85)', gap: 8, textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                <BarcodeIcon size={22} color="rgba(255,255,255,0.85)" /> anvisieren
              </div>
            </div>
          )}
        </div>
        {bottomBar}
      </div>
    );
  }

  // ----- MHD-Phase: Foto-Aufnahme (kein Livebild) ---------------------------
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: t.bg, display: 'flex', flexDirection: 'column' }}>
      <TopBar t={t} title={current?.name ? current.name : 'MHD scannen'} step="2" onClose={close} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', textAlign: 'center' }}>
        <div style={{ width: 96, height: 96, borderRadius: 24, background: pal.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <ScanLine size={44} color={pal.accent} strokeWidth={1.8} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>MHD fotografieren</div>
        <div style={{ fontSize: 13.5, color: t.textMuted, marginTop: 8, lineHeight: 1.5, maxWidth: 300 }}>
          Tippe auf „MHD-Foto", halte das Datum mittig und nah ins Bild. Der Rest wird automatisch zugeschnitten und gelesen.
        </div>
        {status && !status.startsWith('Datum fotografieren') && (
          <div style={{ fontSize: 12.5, marginTop: 16, color: status.startsWith('✓') ? t.success : t.textMuted, lineHeight: 1.4 }}>
            {status}
          </div>
        )}
      </div>
      <div style={{ padding: '12px 16px calc(16px + env(safe-area-inset-bottom))', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 10 }}>
        <button onClick={() => commitCurrent()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 12px', borderRadius: 14, border: `1.5px solid ${t.border}`, background: 'transparent', color: t.textMuted, fontWeight: 700, cursor: 'pointer' }}>
          <SkipForward size={17} /> Ohne MHD
        </button>
        <button onClick={captureMhd} disabled={busy} style={{ ...primaryButtonStyle(t), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: busy ? 0.6 : 1 }}>
          <Camera size={18} /> {busy ? 'Lese…' : 'MHD-Foto'}
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

function ScanTopBar({ onClose, title, step }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 'calc(14px + env(safe-area-inset-top)) 16px 14px' }}>
      <button onClick={onClose} style={btnCircle('rgba(0,0,0,0.4)', '#fff', 40)} aria-label="Schließen">
        <X size={18} />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontWeight: 700, fontSize: 15, textShadow: '0 1px 3px rgba(0,0,0,0.6)', minWidth: 0 }}>
        <span style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 8, padding: '2px 8px', fontSize: 12 }}>Schritt {step}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
      </div>
      <div style={{ width: 40 }} />
    </div>
  );
}

function TopBar({ t, title, step, onClose }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'calc(14px + env(safe-area-inset-top)) 16px 12px', borderBottom: `1px solid ${t.border}` }}>
      <button onClick={onClose} style={btnCircle(t.cardAlt, t.pillInactiveText, 38)} aria-label="Schließen">
        <X size={17} />
      </button>
      {step && <span style={{ background: t.cardAlt, color: t.textMuted, borderRadius: 8, padding: '3px 9px', fontSize: 12, fontWeight: 700 }}>Schritt {step}</span>}
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</h2>
    </div>
  );
}

// Eine bearbeitbare Zeile in der Übernahme-Ansicht: Lagerort, Name, Kategorie,
// Einheit und Menge lassen sich vor dem Übernehmen noch anpassen.
function ReviewRow({ b, zones, dark, t, categories, onAddCategory, onUpdate, onCycleZone, onRemove }) {
  const z = zones.find((zz) => zz.id === b.zone) || zones[0];
  const bp = zonePalette(z.color, dark);
  return (
    <div style={{ background: t.cardAlt, borderRadius: 14, padding: 10, marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={onCycleZone}
          style={{ flexShrink: 0, border: 'none', background: bp.accentBg, borderRadius: 10, width: 40, height: 40, fontSize: 18, cursor: 'pointer' }}
          aria-label="Lagerort wechseln"
        >
          {z.emoji}
        </button>
        <ClearableInput
          t={t}
          value={b.name}
          onChange={(v) => onUpdate({ name: v })}
          placeholder="Name ergänzen…"
          style={{ ...makeInputStyle(t), marginTop: 0, padding: '9px 10px' }}
          wrapperStyle={{ flex: 1, minWidth: 0 }}
        />
        <button type="button" onClick={onRemove} style={{ ...btnCircle('transparent', t.danger, 34), flexShrink: 0 }} aria-label="Entfernen">
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
              {u === 'stk' ? 'Stück' : u}
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

      {b.mhd && <div style={{ fontSize: 11, color: t.textMuted, marginTop: 8 }}>MHD {b.mhd}</div>}
    </div>
  );
}
