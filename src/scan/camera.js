// Kamera-Bausteine für den geführten Scan-Flow.
//
//  - Barcode: nativer Live-Scanner (ML Kit `startScan`) mit transparentem
//    WebView-Hintergrund. Wir zeichnen das Overlay selbst und bekommen laufend
//    Treffer-Events. Zoom wird auf ~2x gesetzt.
//  - MHD: eigenes Live-Kamerabild über getUserMedia mit einem Rahmen. Ein Tap
//    greift den aktuellen Frame, schneidet auf den Rahmen zu und schickt NUR
//    diesen Ausschnitt durch die Texterkennung – so wird das Datum isoliert,
//    ohne dass man von Hand croppen muss.
//  - Fällt getUserMedia aus, gibt es einen Foto-Fallback (Systemkamera) mit
//    automatischem Center-Crop.

import { Capacitor } from '@capacitor/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { TextRecognition } from '@capacitor-mlkit/text-recognition';
import { Camera } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { parseBestBeforeDate } from './scan.js';

export function isNative() {
  return Capacitor.isNativePlatform();
}

// ---------------------------------------------------------------------------
// Transparenter Hintergrund für den nativen Live-Barcode-Scanner
// ---------------------------------------------------------------------------

export function setScanBackgroundTransparent(on) {
  document.body.classList.toggle('gt-scanning', on);
}

// ---------------------------------------------------------------------------
// Barcode – Live
// ---------------------------------------------------------------------------

async function ensureBarcodeModule() {
  try {
    const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
    if (!available) {
      await BarcodeScanner.installGoogleBarcodeScannerModule();
      const err = new Error('Scanner-Modul wird geladen. Bitte in ein paar Sekunden erneut versuchen.');
      err.code = 'MODULE_INSTALLING';
      throw err;
    }
  } catch (e) {
    if (e && e.code === 'MODULE_INSTALLING') throw e;
    // Methode existiert nur auf Android – sonst überspringen.
  }
}

async function applyZoom(target = 2) {
  try {
    const [{ zoomRatio: min }, { zoomRatio: max }] = await Promise.all([
      BarcodeScanner.getMinZoomRatio(),
      BarcodeScanner.getMaxZoomRatio(),
    ]);
    const z = Math.max(min ?? 1, Math.min(target, max ?? target));
    await BarcodeScanner.setZoomRatio({ zoomRatio: z });
  } catch {
    // Zoom nicht unterstützt – unkritisch
  }
}

// Startet den Live-Barcode-Scanner. `onDetected(rawValue)` wird beim ersten
// stabilen Treffer aufgerufen. Gibt eine Funktion zum Stoppen zurück.
export async function startBarcodeScan({ onDetected, zoom = 2 }) {
  await BarcodeScanner.requestPermissions().catch(() => {});
  await ensureBarcodeModule();

  let stopped = false;
  const listener = await BarcodeScanner.addListener('barcodesScanned', (event) => {
    const barcodes = event?.barcodes || [];
    if (stopped || barcodes.length === 0) return;
    const value = barcodes[0].rawValue || barcodes[0].displayValue || null;
    if (value) onDetected(value);
  });

  setScanBackgroundTransparent(true);
  await BarcodeScanner.startScan();
  applyZoom(zoom); // bewusst ohne await – Scan läuft schon

  return async function stop() {
    stopped = true;
    try { await listener.remove(); } catch { /* egal */ }
    try { await BarcodeScanner.stopScan(); } catch { /* egal */ }
    setScanBackgroundTransparent(false);
  };
}

// ---------------------------------------------------------------------------
// MHD – Live-Vorschau (getUserMedia) mit Ausschnitt-OCR
// ---------------------------------------------------------------------------

async function ocrFromBase64(base64) {
  const name = `gt-ocr-${Date.now()}.jpg`;
  let uri;
  try {
    await Filesystem.writeFile({ path: name, data: base64, directory: Directory.Cache });
    ({ uri } = await Filesystem.getUri({ path: name, directory: Directory.Cache }));
    const { text } = await TextRecognition.processImage({ path: uri });
    return { date: parseBestBeforeDate(text), text: text || '' };
  } finally {
    try { await Filesystem.deleteFile({ path: name, directory: Directory.Cache }); } catch { /* egal */ }
  }
}

function cropToBase64(source, sw, sh, rect) {
  // rect: relative Werte (0..1) für x, y, width, height
  const sx = Math.round(rect.x * sw);
  const sy = Math.round(rect.y * sh);
  const cw = Math.round(rect.width * sw);
  const ch = Math.round(rect.height * sh);
  const scale = 2; // hochskalieren hilft der Texterkennung bei kleiner Schrift
  const canvas = document.createElement('canvas');
  canvas.width = cw * scale;
  canvas.height = ch * scale;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(source, sx, sy, cw, ch, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
}

// Öffnet einen getUserMedia-Stream in `videoEl`. Rückgabe: Controller mit
// `capture(rect)` (grabt + croppt + OCR) und `stop()`.
export async function openMhdCamera(videoEl) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
    audio: false,
  });
  videoEl.srcObject = stream;
  await videoEl.play().catch(() => {});

  const track = stream.getVideoTracks()[0];
  // Zoom, wenn das Gerät es kann
  try {
    const caps = track.getCapabilities ? track.getCapabilities() : {};
    if (caps.zoom) {
      const z = Math.min(2, caps.zoom.max || 2);
      await track.applyConstraints({ advanced: [{ zoom: z }] });
    }
  } catch { /* Zoom optional */ }

  return {
    async setTorch(on) {
      try { await track.applyConstraints({ advanced: [{ torch: on }] }); return true; } catch { return false; }
    },
    async capture(rect) {
      const sw = videoEl.videoWidth;
      const sh = videoEl.videoHeight;
      if (!sw || !sh) return { date: null, text: '' };
      const base64 = cropToBase64(videoEl, sw, sh, rect);
      return ocrFromBase64(base64);
    },
    stop() {
      try { stream.getTracks().forEach((tr) => tr.stop()); } catch { /* egal */ }
      videoEl.srcObject = null;
    },
  };
}

// Fallback: ein Foto über die Systemkamera, danach automatischer Center-Crop
// (breites Band in der Bildmitte) vor der OCR.
export async function captureMhdViaPhoto() {
  await Camera.requestPermissions({ permissions: ['camera'] }).catch(() => {});
  const photo = await Camera.takePhoto({ quality: 80, correctOrientation: true });
  const src = photo.webPath || photo.dataUrl || (photo.uri ? Capacitor.convertFileSrc(photo.uri) : '');
  if (!src) return { date: null, text: '' };

  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = src;
  });

  // Mittiges Band: volle Breite, 30 % Höhe – dort liegt das Datum meist.
  const rect = { x: 0.06, y: 0.35, width: 0.88, height: 0.3 };
  const base64 = cropToBase64(img, img.naturalWidth, img.naturalHeight, rect);
  return ocrFromBase64(base64);
}
