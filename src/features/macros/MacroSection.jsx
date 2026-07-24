import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Utensils } from 'lucide-react';
import { MacroEditor } from './MacroEditor.jsx';
import { hasMacros, hasFoodData, macroSummary, basisLabel } from '../../lib/macros.js';
import { tr } from '../../lib/i18n.js';

// Aufklappbarer „Nährwerte, Zutaten und Haltbarkeit"-Abschnitt für das
// Bearbeiten-/Anlegen-Sheet. Zeigt zugeklappt eine Kurz-Zusammenfassung,
// aufgeklappt den Editor – sanft animiert und beim Öffnen ins Bild gescrollt.
export function MacroSection({ name, macros, onChange, t, lang = 'de', scanSupported, accent }) {
  const filled = hasFoodData(macros);
  const [open, setOpen] = useState(filled);
  const ref = useRef(null);
  const summary = hasMacros(macros)
    ? `${macroSummary({ ...macros }, lang)} · ${basisLabel(macros, lang)}`
    : (filled ? tr(lang, 'macroSection.ingredientsPresent') : tr(lang, 'macroSection.none'));

  useEffect(() => {
    if (!open || !ref.current) return undefined;
    const id = setTimeout(() => {
      try { ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch { /* egal */ }
    }, 260);
    return () => clearTimeout(id);
  }, [open]);

  return (
    <div ref={ref} style={{ marginTop: 18, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px',
          background: t.cardAlt, border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <Utensils size={17} color={filled ? (accent || t.text) : t.textMuted} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: t.text }}>{tr(lang, 'macroSection.title')}</span>
          <span style={{
            display: 'block', fontSize: 11.5, color: t.textFaint, marginTop: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {summary}
          </span>
        </span>
        {open ? <ChevronDown size={18} color={t.textFaint} /> : <ChevronRight size={18} color={t.textFaint} />}
      </button>

      {/* Grid-Trick: gridTemplateRows 0fr -> 1fr animiert die Höhe sauber. */}
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.25s ease' }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px' }}>
            <MacroEditor
              name={name}
              macros={macros}
              onChange={onChange}
              t={t}
              lang={lang}
              scanSupported={scanSupported}
              accent={accent}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
