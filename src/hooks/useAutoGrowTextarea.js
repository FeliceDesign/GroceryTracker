import { useEffect, useRef } from 'react';

// Laesst ein Textfeld mit der Textlaenge mitwachsen/-schrumpfen statt fest
// zurechtgeschnitten oder nur manuell (resize-Griff) verstellbar zu sein.
// Hoehe wird bei jeder Wertaenderung neu aus scrollHeight berechnet (erst auf
// "auto" zurueckgesetzt, sonst bleibt beim Loeschen von Text die alte, zu
// grosse Hoehe stehen). Ziel-Element braucht overflow:hidden und resize:none.
export function useAutoGrowTextarea(value) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return ref;
}
