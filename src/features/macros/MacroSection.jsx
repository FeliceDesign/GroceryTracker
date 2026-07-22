import { useState } from 'react';
import { ChevronDown, ChevronRight, Utensils } from 'lucide-react';
import { MacroEditor } from './MacroEditor.jsx';
import { hasMacros, hasFoodData, macroSummary, basisLabel } from '../../lib/macros.js';

// Aufklappbarer „Nährwerte & Zutaten"-Abschnitt für das Bearbeiten-/Anlegen-
// Sheet. Zeigt zugeklappt eine Kurz-Zusammenfassung, aufgeklappt den Editor.
export function MacroSection({ name, macros, onChange, t, scanSupported, accent }) {
  const filled = hasFoodData(macros);
  const [open, setOpen] = useState(filled);
  const summary = hasMacros(macros)
    ? `${macroSummary({ ...macros })} · ${basisLabel(macros)}`
    : (filled ? 'Zutaten hinterlegt' : 'noch keine – tippen zum Erfassen');

  return (
    <div style={{ marginTop: 18, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden' }}>
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
          <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: t.text }}>Nährwerte, Zutaten und Haltbarkeit</span>
          <span style={{
            display: 'block', fontSize: 11.5, color: t.textFaint, marginTop: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {summary}
          </span>
        </span>
        {open ? <ChevronDown size={18} color={t.textFaint} /> : <ChevronRight size={18} color={t.textFaint} />}
      </button>

      {open && (
        <div style={{ padding: '14px' }}>
          <MacroEditor
            name={name}
            macros={macros}
            onChange={onChange}
            t={t}
            scanSupported={scanSupported}
            accent={accent}
          />
        </div>
      )}
    </div>
  );
}
