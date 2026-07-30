# Stock-Tracker – Hinweise für Claude Code

## Test-Policy (Playwright sparsam einsetzen)

- **Immer:** `npm run build` nach jeder Änderung (Sekunden, fängt Syntax-/Typfehler).
- **Playwright nur wenn:** ein neues Interaktionsmuster entsteht (neue Sheets, neue
  Multi-Select-/Undo-Logik), ein Bug nur im Browser reproduzierbar war, oder
  Store-/State-Verhalten geprüft werden muss, das sich nicht aus dem Code
  ablesen lässt.
- **Kein Playwright bei:** reinen i18n-/Text-Änderungen, Style-Feinschliff ohne
  Logikänderung, Reihenfolge-/Positions-Vertauschungen in bereits verifizierten
  Komponenten, Icon-/Label-Tausch.
- **Falls doch getestet:** ein Theme reicht meistens; Hell+Dunkel nur bei neuen
  Farben/neuen Komponenten, nicht bei jeder Struktur-Änderung.
- Screenshots nur, wenn sie wirklich zur Verifikation gebraucht werden, nicht
  routinemäßig „zur Doku".
