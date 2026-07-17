import { useEffect, useState } from 'react';

// Persistenter State über window.storage (siehe lib/storage.js).
// Liefert [data, setData, loaded]; `loaded` wird erst true, wenn der initiale
// Ladevorgang abgeschlossen ist – so lässt sich ein Flackern vermeiden.
export function useStorage(key, seed) {
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);

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
    (async () => {
      try {
        await window.storage.set(key, JSON.stringify(data));
      } catch {
        // still – der lokale State hält für diese Sitzung die Wahrheit
      }
    })();
  }, [data, loaded, key]);

  return [data, setData, loaded];
}
