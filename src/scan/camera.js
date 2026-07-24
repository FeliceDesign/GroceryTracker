// Kamera-Bausteine für den geführten Scan-Flow.
//
//  - Barcode: nativer Live-Scanner (ML Kit `startScan`) mit transparentem
//    WebView-Hintergrund. Wir zeichnen das Overlay selbst und bekommen laufend
//    Treffer-Events. Zoom wird auf ~2x gesetzt.
//  - MHD: Foto über die System-Kamera (`takePhoto`) – die fokussiert nah und
//    scharf. Danach automatischer Ausschnitt (Mittenband) + OCR; findet das
//    nichts, wird das ganze Bild durch die Texterkennung geschickt.
//
// Bewusst KEIN getUserMedia: das ist im Android-WebView unzuverlässig und
// kollidiert mit der nativen Kamera (Kamera bleibt belegt). So ist immer nur
// eine Kamera-Pipeline gleichzeitig aktiv.

import { Capacitor } from '@capacitor/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { TextRecognition } from '@capacitor-mlkit/text-recognition';
import { Camera } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { parseBestBeforeDate } from './scan.js';
import { parseNutritionFacts } from './nutrition.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
export async function startBarcodeScan({ onDetected, zoom = 2, settleMs = 250 }) {
  await BarcodeScanner.requestPermissions().catch(() => {});
  await ensureBarcodeModule();
  // Kurze Pause, damit eine zuvor genutzte Kamera (z.B. Foto) freigegeben ist.
  if (settleMs) await sleep(settleMs);

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
// MHD – Foto (System-Kamera) + OCR
// ---------------------------------------------------------------------------

// Roher OCR-Text aus einem Base64-JPEG (über eine Cache-Datei, die ML Kit
// per file://-URI lesen kann). Danach wird die Datei wieder entfernt.
async function ocrTextFromBase64(base64) {
  const name = `gt-ocr-${Date.now()}.jpg`;
  try {
    await Filesystem.writeFile({ path: name, data: base64, directory: Directory.Cache });
    const { uri } = await Filesystem.getUri({ path: name, directory: Directory.Cache });
    const { text } = await TextRecognition.processImage({ path: uri });
    return text || '';
  } finally {
    try { await Filesystem.deleteFile({ path: name, directory: Directory.Cache }); } catch { /* egal */ }
  }
}

async function ocrFromBase64(base64) {
  const text = await ocrTextFromBase64(base64);
  return { date: parseBestBeforeDate(text), text };
}

function drawToBase64(source, sw, sh, rect) {
  // rect: relative Werte (0..1) für x, y, width, height
  const sx = Math.round(rect.x * sw);
  const sy = Math.round(rect.y * sh);
  const cw = Math.round(rect.width * sw);
  const ch = Math.round(rect.height * sh);
  // 2x hochskalieren hilft der OCR bei kleiner Schrift. Aber die Ausgabe darf
  // nicht zu groß werden: ein ganzes Kamerabild (z.B. 3000x4000) x2 sprengt in
  // der Android-WebView das Canvas-Limit und liefert ein LEERES Bild – dann
  // erkennt die OCR nichts. Deshalb die längste Seite auf ein sicheres Maß
  // begrenzen (kleine Ausschnitte werden weiterhin hochskaliert).
  const MAX_SIDE = 2600;
  const scale = Math.min(2, MAX_SIDE / Math.max(cw, ch, 1));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(cw * scale));
  canvas.height = Math.max(1, Math.round(ch * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(source, sx, sy, cw, ch, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = src;
  });
}

// Fotografiert das MHD über die System-Kamera und liest das Datum aus.
// Erst wird das mittige Band ausgewertet (isoliert das Datum), findet das
// nichts, das ganze Bild. Gibt { date, text } zurück.
export async function captureMhdViaPhoto() {
  await Camera.requestPermissions({ permissions: ['camera'] }).catch(() => {});
  const photo = await Camera.takePhoto({ quality: 80, correctOrientation: true });
  const src = photo.webPath || photo.dataUrl || (photo.uri ? Capacitor.convertFileSrc(photo.uri) : '');
  if (!src) return { date: null, text: '' };

  const img = await loadImage(src);
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  // 1. Versuch: mittiges Band (dort liegt das Datum meist)
  const band = drawToBase64(img, w, h, { x: 0.05, y: 0.34, width: 0.9, height: 0.32 });
  const first = await ocrFromBase64(band);
  if (first.date) return first;

  // 2. Versuch: ganzes Bild
  const full = drawToBase64(img, w, h, { x: 0, y: 0, width: 1, height: 1 });
  const second = await ocrFromBase64(full);
  return { date: second.date, text: second.text || first.text };
}

// ---------------------------------------------------------------------------
// Nährwerttabelle – Foto (System-Kamera) + OCR + Parser
// ---------------------------------------------------------------------------

// Fotografiert die Nährwerttabelle und liest die Makros aus. Anders als beim
// MHD wird das ganze Etikett ausgewertet (die Tabelle füllt meist das ganze
// Bild). Gibt { facts, text } zurück; facts-Felder sind null, wo nichts
// erkannt wurde.
export async function captureNutritionViaPhoto() {
  await Camera.requestPermissions({ permissions: ['camera'] }).catch(() => {});
  const photo = await Camera.takePhoto({ quality: 85, correctOrientation: true });
  const src = photo.webPath || photo.dataUrl || (photo.uri ? Capacitor.convertFileSrc(photo.uri) : '');
  if (!src) return { facts: parseNutritionFacts(''), text: '' };

  const img = await loadImage(src);
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  const full = drawToBase64(img, w, h, { x: 0, y: 0, width: 1, height: 1 });
  const text = await ocrTextFromBase64(full);
  return { facts: parseNutritionFacts(text), text };
}

// Allgemeiner Text-Scan (z.B. Zutatenliste): fotografiert und gibt den rohen
// OCR-Text des ganzen Bildes zurück.
export async function captureTextViaPhoto() {
  await Camera.requestPermissions({ permissions: ['camera'] }).catch(() => {});
  const photo = await Camera.takePhoto({ quality: 85, correctOrientation: true });
  const src = photo.webPath || photo.dataUrl || (photo.uri ? Capacitor.convertFileSrc(photo.uri) : '');
  if (!src) return { text: '' };

  const img = await loadImage(src);
  const full = drawToBase64(img, img.naturalWidth, img.naturalHeight, { x: 0, y: 0, width: 1, height: 1 });
  const text = await ocrTextFromBase64(full);
  return { text };
}
