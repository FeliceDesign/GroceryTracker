# Stock-Tracker

Ein anpassbarer Vorrats-/Lebensmittel-Tracker als Android-App. Redesign des
[Vorrats-Tracker](https://github.com/FeliceDesign/Vorratstracker) mit modularer
Architektur, moderner Oberfläche und einem neu strukturierten Erfassungs-Flow.

## Features

- **Anpassbare Lagerorte** – Standardmäßig Kühlschrank, Gefrierschrank, Vorrat
  und Snacks. Eigene Lagerorte (Name, Emoji, Farbe) lassen sich hinzufügen,
  bearbeiten und entfernen.
- **Anpassbare Kategorien** – Umfangreiche Standardliste, eigene Kategorien
  können direkt im Formular ergänzt werden.
- **Manuelles Erfassen** über einen Add-FAB mit Lagerort- und Kategorieauswahl.
- **Barcode-Scan** (Google ML Kit, on-device) mit automatischem Produkt-Lookup
  über [Open Food Facts](https://world.openfoodfacts.org/).
- **MHD-Scan** – Mindesthaltbarkeitsdatum per Foto und Texterkennung (OCR)
  auslesen.
- **Batch-Scan** – den ganzen Einkauf schnell nacheinander scannen und in einem
  Rutsch übernehmen.
- **Einkaufsliste** – aufgebrauchte Artikel landen automatisch darauf.
- Suche über alle Lagerorte, MHD-Warnungen, Hell-/Dunkelmodus, Backup als JSON.

Die Scan-Buttons sitzen im Erfassungs-Formular am unteren Rand – in bequemer
Daumenreichweite.

## Tech-Stack

- **Vite + React 19** für die Oberfläche
- **Capacitor 8** als Android-Wrapper (echter Kamerazugriff, baubares APK)
- **@capacitor-mlkit/barcode-scanning** & **text-recognition** für Scans
- **lucide-react** für Icons

## Projektstruktur

```
src/
├── main.jsx                # Einstiegspunkt
├── App.jsx                 # Orchestrator (State-Verdrahtung, Layout)
├── index.css               # globale Basisstile
├── lib/                    # reine Logik ohne UI
│   ├── colors.js           # Hex-Helfer & Ableitung der Lagerort-Farben
│   ├── theme.js            # Farbschema + useSystemTheme-Hook
│   ├── date.js             # MHD-Berechnung
│   ├── defaults.js         # Standard-Lagerorte, -Kategorien, Seed-Daten
│   ├── styles.js           # geteilte Stil-Helfer
│   └── storage.js          # window.storage-Shim (localStorage)
├── scan/scan.js            # Barcode + Open Food Facts + MHD-OCR
├── hooks/                  # useStorage, useZones, useCategories
├── components/             # wiederverwendbare UI-Bausteine
└── features/               # in sich geschlossene Bereiche (Sheets)
    ├── add/  edit/  batch/  shopping/  zones/  settings/
```

## Entwicklung

```bash
npm install
npm run dev        # Web-Vorschau (Scan-Funktionen nur auf dem Gerät)
npm run build      # Web-Assets nach dist/
npx cap sync android
```

## Android-APK bauen

Bei jedem Push auf den Feature-Branch baut die GitHub-Action
`.github/workflows/build-apk.yml` ein Debug-APK und lädt es als Artefakt hoch.
Lokal:

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
# -> android/app/build/outputs/apk/debug/app-debug.apk
```

> Kamera-basierte Funktionen (Barcode-/MHD-Scan) laufen nur in der nativen App,
> nicht in der Web-Vorschau.
