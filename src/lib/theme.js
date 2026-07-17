import { useEffect, useState } from 'react';

// Zentrales Farbsystem – alle UI-Farben referenzieren dieses Objekt, statt
// Hex-Literale über die Komponenten zu streuen.
export function buildTheme(dark) {
  return dark
    ? {
        bg: '#141210', card: '#221F1A', cardAlt: '#2C2822', border: '#3A352D',
        text: '#F5F2EC', textMuted: '#B0A99C', textFaint: '#7D7669',
        inputBg: '#1B1915', overlay: 'rgba(0,0,0,0.65)',
        pillInactive: '#2C2822', pillInactiveText: '#C4BCAD',
        pillActive: '#4A4438', pillActiveText: '#F5F2EC',
        btnPrimary: '#F5F2EC', btnPrimaryText: '#141210',
        danger: '#E08FA1', dangerBg: '#332025', dangerBorder: '#4A2E34',
        success: '#7FBB84', headerText: '#FFFFFF',
        shadow: '0 8px 24px rgba(0,0,0,0.5)',
      }
    : {
        bg: '#F7F5F1', card: '#FFFFFF', cardAlt: '#F0EDE7', border: '#E5E1D8',
        text: '#3A362F', textMuted: '#8A8478', textFaint: '#B5AFA3',
        inputBg: '#FAF9F6', overlay: 'rgba(30,28,24,0.4)',
        pillInactive: '#F0EDE7', pillInactiveText: '#6B665C',
        pillActive: '#3A362F', pillActiveText: '#FFFFFF',
        btnPrimary: '#3A362F', btnPrimaryText: '#FFFFFF',
        danger: '#B5556B', dangerBg: '#FBEFEF', dangerBorder: '#F0D5D9',
        success: '#4A7A4E', headerText: '#FFFFFF',
        shadow: '0 8px 24px rgba(0,0,0,0.15)',
      };
}

// Folgt standardmäßig dem System-Theme, erlaubt aber einen manuellen Override,
// der persistent gespeichert wird.
export function useSystemTheme() {
  const [systemDark, setSystemDark] = useState(
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false,
  );
  const [override, setOverride] = useState(null); // null = System folgen
  const [overrideLoaded, setOverrideLoaded] = useState(false);

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemDark(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else mq.removeListener(handler);
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get('gt-theme-override');
        if (res && (res.value === 'dark' || res.value === 'light')) setOverride(res.value);
      } catch {
        // kein gespeicherter Override – System-Default bleibt aktiv
      }
      setOverrideLoaded(true);
    })();
  }, []);

  const setThemeOverride = async (value) => {
    setOverride(value);
    try {
      if (value === null) await window.storage.delete('gt-theme-override');
      else await window.storage.set('gt-theme-override', value);
    } catch {
      // Speichern fehlgeschlagen – Auswahl gilt trotzdem für diese Sitzung
    }
  };

  const dark = override === null ? systemDark : override === 'dark';
  return { dark, override, setThemeOverride, themeLoaded: overrideLoaded };
}
