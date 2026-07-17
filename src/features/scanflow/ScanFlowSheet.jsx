import { useEffect, useRef, useState } from 'react';
import { X, Zap, ZapOff, Camera, SkipForward, Trash2 } from 'lucide-react';
import { BarcodeIcon } from '../../components/icons.jsx';
import { zonePalette } from '../../lib/colors.js';
import { btnCircle, makeInputStyle, primaryButtonStyle } from '../../lib/styles.js';
import { lookupOpenFoodFacts } from '../../scan/scan.js';
import { startBarcodeScan, openMhdCamera, captureMhdViaPhoto } from '../../scan/camera.js';

// Rahmen, in den das MHD gelegt wird – gleiche relative Werte fürs Overlay
// und für den OCR-Ausschnitt.
const MHD_RECT = { x: 0.06, y: 0.4, width: 0.88, height: 0.2 };

function vibrate(ms = 35) {
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch { /* egal */ }
}

// Geführter Scan: Barcode live -> MHD in den Rahmen legen und tippen ->
// nächstes Produkt. Am Ende alles gesammelt übernehmen.
export function ScanFlowSheet({ open, onClose, t, dark, zones, targetZone, onCommit }) {
  const [phase, setPhase] = useState('barcode'); // barcode | mhd | review
  const [collected, setCollected] = useState([]);
  const [current, setCurrent] = useState(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  const videoRef = useRef(null);
  const barcodeStopRef = useRef(null);
  const mhdCtrlRef = useRef(null);
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
    setUseFallback(false);
    setTorchOn(false);
  }, [open]);

  // Barcode-Phase: nativer Live-Scanner
  useEffect(() => {
    if (!open || phase !== 'barcode') return undefined;
    let cancelled = false;
    detectedRef.current = false;
    setStatus('Barcode anvisieren…');
    (async () => {
      try {
        const stop = await startBarcodeScan({ onDetected: handleBarcode, zoom: 2 });
        barcodeStopRef.current = stop;
        if (cancelled) { stop(); barcodeStopRef.current = null; }
      } catch (e) {
        setStatus(e?.message || 'Scanner konnte nicht starten.');
      }
    })();
    return () => {
      cancelled = true;
      if (barcodeStopRef.current) { barcodeStopRef.current(); barcodeStopRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase]);

  // MHD-Phase: eigenes Live-Kamerabild
  useEffect(() => {
    if (!open || phase !== 'mhd' || useFallback) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const ctrl = await openMhdCamera(videoRef.current);
        mhdCtrlRef.current = ctrl;
        if (cancelled) { ctrl.stop(); mhdCtrlRef.current = null; }
      } catch {
        setUseFallback(true);
        setStatus('Live-Kamera nicht verfügbar – tippe „Foto aufnehmen".');
      }
    })();
    return () => {
      cancelled = true;
      if (mhdCtrlRef.current) { mhdCtrlRef.current.stop(); mhdCtrlRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase, useFallback]);

  const stopAllCameras = () => {
    if (barcodeStopRef.current) { barcodeStopRef.current(); barcodeStopRef.current = null; }
    if (mhdCtrlRef.current) { mhdCtrlRef.current.stop(); mhdCtrlRef.current = null; }
  };

  async function handleBarcode(value) {
    if (detectedRef.current) return;
    detectedRef.current = true;
    vibrate();
    if (barcodeStopRef.current) { await barcodeStopRef.current(); barcodeStopRef.current = null; }
    setCurrent({ barcode: value, name: '', category: 'Sonstiges', qty: 1, unit: 'stk', zone: zoneRef.current, mhd: null });
    setStatus('Suche Produkt…');
    let product = null;
    try { product = await lookupOpenFoodFacts(value); } catch { product = null; }
    setCurrent((c) => ({ ...c, ...(product ? { name: product.name, category: product.category, qty: product.qty, unit: product.unit } : {}) }));
    setStatus(product ? `✓ ${product.name}` : `Barcode ${value} – kein Treffer, Name später ergänzen`);
    setUseFallback(false);
    setPhase('mhd');
  }

  // Ohne Barcode direkt zum MHD (z.B. lose Ware)
  const skipBarcode = async () => {
    detectedRef.current = true;
    if (barcodeStopRef.current) { await barcodeStopRef.current(); barcodeStopRef.current = null; }
    setCurrent({ barcode: null, name: '', category: 'Sonstiges', qty: 1, unit: 'stk', zone: zoneRef.current, mhd: null });
    setStatus('');
    setUseFallback(false);
    setPhase('mhd');
  };

  const captureMhd = async () => {
    setBusy(true);
    setStatus('Lese Datum…');
    try {
      const res = useFallback || !mhdCtrlRef.current
        ? await captureMhdViaPhoto()
        : await mhdCtrlRef.current.capture(MHD_RECT);
      if (res.date) {
        vibrate();
        setCurrent((c) => ({ ...c, mhd: res.date }));
        commitCurrent({ mhd: res.date });
      } else if (res.text && res.text.trim()) {
        const snippet = res.text.trim().replace(/\s+/g, ' ').slice(0, 40);
        setStatus(`Kein Datum erkannt (gelesen: „${snippet}…"). Datum in den Rahmen legen und erneut tippen.`);
      } else {
        setStatus('Kein Text erkannt – näher ran und scharf stellen.');
      }
    } catch (e) {
      setStatus(e?.message || 'Erkennung fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  };

  // Aktuelles Produkt in die Sammelliste, dann weiter zum nächsten Barcode.
  const commitCurrent = (patch = {}) => {
    if (mhdCtrlRef.current) { mhdCtrlRef.current.stop(); mhdCtrlRef.current = null; }
    const item = { key: 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), ...current, ...patch };
    setCollected((prev) => [...prev, item]);
    setCurrent(null);
    setStatus('✓ Übernommen – nächstes Produkt');
    setPhase('barcode');
  };

  const toggleTorch = async () => {
    if (!mhdCtrlRef.current) return;
    const ok = await mhdCtrlRef.current.setTorch(!torchOn);
    if (ok) setTorchOn((v) => !v);
  };

  const goReview = () => {
    stopAllCameras();
    // ein noch offenes current ohne MHD trotzdem mitnehmen
    if (current) {
      setCollected((prev) => [...prev, { key: 'k' + Date.now().toString(36), ...current }]);
      setCurrent(null);
    }
    setPhase('review');
  };

  const close = () => {
    stopAllCameras();
    onClose();
  };

  const commitAll = () => {
    const valid = collected.filter((c) => c.name.trim());
    stopAllCameras();
    onCommit(valid);
  };

  if (!open) return null;

  // ----- Review-Phase: normale (undurchsichtige) Oberfläche -----------------
  if (phase === 'review') {
    return (
      <FullOverlay opaque t={t}>
        <TopBar t={t} title={`Erfasst (${collected.length})`} onClose={close} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px' }}>
          {collected.length === 0 ? (
            <div style={{ textAlign: 'center', color: t.textFaint, padding: '48px 12px' }}>Noch nichts erfasst.</div>
          ) : collected.map((b) => {
            const z = zones.find((zz) => zz.id === b.zone) || zones[0];
            const bp = zonePalette(z.color, dark);
            return (
              <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.cardAlt, borderRadius: 12, padding: '8px 10px', marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={() => setCollected((prev) => prev.map((x) => {
                    if (x.key !== b.key) return x;
                    const order = zones.map((zz) => zz.id);
                    return { ...x, zone: order[(order.indexOf(x.zone) + 1) % order.length] };
                  }))}
                  style={{ flexShrink: 0, border: 'none', background: bp.accentBg, borderRadius: 10, width: 40, height: 40, fontSize: 18, cursor: 'pointer' }}
                  aria-label="Lagerort wechseln"
                >
                  {z.emoji}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input
                    value={b.name}
                    onChange={(e) => setCollected((prev) => prev.map((x) => (x.key === b.key ? { ...x, name: e.target.value } : x)))}
                    placeholder="Name ergänzen…"
                    style={{ ...makeInputStyle(t), marginTop: 0, padding: '8px 10px' }}
                  />
                  {b.mhd && <div style={{ fontSize: 11, color: t.textMuted, marginTop: 3 }}>MHD {b.mhd}</div>}
                </div>
                <button type="button" onClick={() => setCollected((prev) => prev.filter((x) => x.key !== b.key))} style={{ ...btnCircle('transparent', t.danger, 32), flexShrink: 0 }} aria-label="Entfernen">
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
        <div style={{ padding: '12px 16px calc(16px + env(safe-area-inset-bottom))', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 10 }}>
          <button onClick={() => setPhase('barcode')} style={{ flexShrink: 0, padding: '14px 18px', borderRadius: 14, border: `1.5px solid ${t.border}`, background: 'transparent', color: t.textMuted, fontWeight: 700, cursor: 'pointer' }}>
            Weiter scannen
          </button>
          <button onClick={commitAll} disabled={collected.filter((c) => c.name.trim()).length === 0} style={{ ...primaryButtonStyle(t), opacity: collected.filter((c) => c.name.trim()).length === 0 ? 0.45 : 1 }}>
            Übernehmen
          </button>
        </div>
      </FullOverlay>
    );
  }

  const doneBar = (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '16px 16px calc(20px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 12, background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)' }}>
      {status && (
        <div style={{ textAlign: 'center', fontSize: 13.5, fontWeight: 600, color: status.startsWith('✓') ? '#8FE39A' : '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
          {status}
        </div>
      )}

      {phase === 'barcode' ? (
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={skipBarcode} style={ghostBtn}>Ohne Barcode</button>
          {collected.length > 0 && (
            <button onClick={goReview} style={{ ...solidBtn(pal) }}>Fertig ({collected.length})</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => commitCurrent()} style={ghostBtn}>
            <SkipForward size={17} /> Ohne MHD
          </button>
          <button onClick={captureMhd} disabled={busy} style={{ ...solidBtn(pal), opacity: busy ? 0.6 : 1 }}>
            <Camera size={18} /> {busy ? 'Lese…' : (useFallback ? 'Foto aufnehmen' : 'MHD erfassen')}
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
          <div style={{ width: '78%', maxWidth: 320, aspectRatio: '1.6 / 1', border: `3px solid ${pal.accent}`, borderRadius: 18, boxShadow: '0 0 0 100vmax rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.85)', gap: 8 }}>
              <BarcodeIcon size={22} color="rgba(255,255,255,0.85)" /> anvisieren
            </div>
          </div>
        </div>
        {doneBar}
      </div>
    );
  }

  // ----- MHD-Phase: eigenes Live-Kamerabild --------------------------------
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#000', display: 'flex', flexDirection: 'column' }}>
      {!useFallback && (
        <video ref={videoRef} playsInline muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      {/* Rahmen fürs MHD */}
      {!useFallback && (
        <div style={{
          position: 'absolute',
          left: `${MHD_RECT.x * 100}%`, top: `${MHD_RECT.y * 100}%`,
          width: `${MHD_RECT.width * 100}%`, height: `${MHD_RECT.height * 100}%`,
          border: `3px solid ${pal.accent}`, borderRadius: 12, boxShadow: '0 0 0 100vmax rgba(0,0,0,0.45)',
        }}>
          <div style={{ position: 'absolute', top: -26, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 12.5, fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
            MHD in den Rahmen legen
          </div>
        </div>
      )}
      <ScanTopBar
        onClose={close}
        title={current?.name ? current.name : 'MHD scannen'}
        step="2"
        right={!useFallback ? (
          <button onClick={toggleTorch} style={{ ...btnCircle('rgba(0,0,0,0.4)', '#fff', 40) }} aria-label="Blitz">
            {torchOn ? <Zap size={18} /> : <ZapOff size={18} />}
          </button>
        ) : null}
      />
      {doneBar}
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

function ScanTopBar({ onClose, title, step, right }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 'calc(14px + env(safe-area-inset-top)) 16px 14px' }}>
      <button onClick={onClose} style={btnCircle('rgba(0,0,0,0.4)', '#fff', 40)} aria-label="Schließen">
        <X size={18} />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontWeight: 700, fontSize: 15, textShadow: '0 1px 3px rgba(0,0,0,0.6)', minWidth: 0 }}>
        <span style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 8, padding: '2px 8px', fontSize: 12 }}>Schritt {step}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
      </div>
      <div style={{ width: 40, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  );
}

function FullOverlay({ children, opaque, t }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: opaque ? t.bg : 'transparent', display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  );
}

function TopBar({ t, title, onClose }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 'calc(14px + env(safe-area-inset-top)) 16px 12px', borderBottom: `1px solid ${t.border}` }}>
      <button onClick={onClose} style={btnCircle(t.cardAlt, t.pillInactiveText, 38)} aria-label="Schließen">
        <X size={17} />
      </button>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: t.text }}>{title}</h2>
    </div>
  );
}
