import { useEffect, useRef, useState } from 'react';

// Persistenter State über window.storage (siehe lib/storage.js).
// Liefert [data, setData, loaded]; `loaded` wird erst true, wenn der initiale
// Ladevorgang abgeschlossen ist – so lässt sich ein Flackern vermeiden.
//
// Schreiben ist debounced (400ms nach der letzten Änderung), damit z.B.
// schnelles Antippen der Mengen-+/--Knöpfe nicht bei jedem einzelnen Tap
// den kompletten State neu serialisiert und synchron nach localStorage
// schreibt. Beim Verstecken/Schließen der App (Android onPause/onStop)
// wird ein noch wartender Schreibvorgang sofort nachgeholt, damit dabei
// nichts verloren geht.
export function useStorage(key, seed) {
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const pendingRef = useRef(null); // { key, value } – wartet auf den Debounce
  const timerRef = useRef(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await window.storage.get(key);
        if (active) setData(res ? JSON.parse(res.value) : seed);
      } catch {
        if (active) setData(seed);
      }
      if (active) setLoaded(true);
    })();
    return () => {
      active = false;
    };
    // seed absichtlich ausgelassen – nur der key steuert das Neuladen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!loaded || data === null) return;

    pendingRef.current = { key, value: JSON.stringify(data) };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const pending = pendingRef.current;
      pendingRef.current = null;
      if (pending) window.storage.set(pending.key, pending.value).catch(() => {});
    }, 400);
  }, [data, loaded, key]);

  useEffect(() => {
    const flush = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const pending = pendingRef.current;
      pendingRef.current = null;
      if (pending) window.storage.set(pending.key, pending.value).catch(() => {});
    };
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
    };
  }, []);

  return [data, setData, loaded];
}
