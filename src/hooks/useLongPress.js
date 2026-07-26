import { useCallback, useRef, useState } from 'react';

// Long-Press-Erkennung für einen Button (z.B. Fokus-Modus über den
// Plus-Button). Liefert `progress` (0-1, für eine optionale visuelle
// Anzeige während des Haltens) und fertige Pointer-Handler zum Spreaden
// auf das Zielelement. Ein abgeschlossener Long-Press unterdrückt den
// nachfolgenden Klick (via onClickCapture), ein zu früh losgelassener
// Druck bleibt ein ganz normaler Klick.
export function useLongPress(onLongPress, { ms = 5000 } = {}) {
  const [progress, setProgress] = useState(0);
  const startRef = useRef(0);
  const rafRef = useRef(null);
  const firedRef = useRef(false);

  const clear = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setProgress(0);
  }, []);

  const tick = useCallback(() => {
    const pct = Math.min(1, (Date.now() - startRef.current) / ms);
    setProgress(pct);
    if (pct >= 1) {
      firedRef.current = true;
      clear();
      onLongPress();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [ms, onLongPress, clear]);

  const onPointerDown = useCallback((e) => {
    if (e.button != null && e.button !== 0) return; // nur primäre Taste/Touch
    startRef.current = Date.now();
    firedRef.current = false;
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const onClickCapture = useCallback((e) => {
    if (firedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      firedRef.current = false;
    }
  }, []);

  return {
    progress,
    handlers: {
      onPointerDown,
      onPointerUp: clear,
      onPointerLeave: clear,
      onPointerCancel: clear,
      onContextMenu: (e) => e.preventDefault(),
      onClickCapture,
    },
  };
}
