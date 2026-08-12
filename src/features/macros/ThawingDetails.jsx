import { useState } from 'react';
import { ChevronDown, ChevronRight, Refrigerator, Droplets, Microwave, Home, CookingPot } from 'lucide-react';
import { thawInfo } from '../../lib/thawing.js';
import { tr } from '../../lib/i18n.js';

function MethodIcon({ method, size = 16, color }) {
  if (method === 'coldWater') return <Droplets size={size} color={color} />;
  if (method === 'microwave') return <Microwave size={size} color={color} />;
  if (method === 'room') return <Home size={size} color={color} />;
  if (method === 'direct') return <CookingPot size={size} color={color} />;
  return <Refrigerator size={size} color={color} />;
}

// Ausklappbare Anleitung zum sicheren Auftauen: Methode, Dauer, Begründung/
// Sicherheitshinweis. Kein Lagerort-Abgleich nötig - die Methode ist
// unabhängig davon, wo der Artikel gerade liegt.
export function ThawingDetails({ name, t, lang = 'de', defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const info = thawInfo(name);

  if (!info) {
    return (
      <div style={{ fontSize: 12.5, color: t.textFaint, lineHeight: 1.4 }}>
        {tr(lang, 'thawing.detailNone')}
      </div>
    );
  }

  const reason = lang === 'en' && info.reason_en ? info.reason_en : info.reason;
  const label = lang === 'en' && info.label_en ? info.label_en : info.label;
  const time = lang === 'en' && info.time_en ? info.time_en : info.time;

  return (
    <div style={{ border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '11px 12px',
          background: t.cardAlt, border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <MethodIcon method={info.method} color={t.textMuted} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: t.text }}>
            {tr(lang, `thawing.method${info.method.charAt(0).toUpperCase()}${info.method.slice(1)}`)}
          </span>
          <span style={{ display: 'block', fontSize: 11.5, color: t.textFaint, marginTop: 1 }}>
            {label} · {time}
          </span>
        </span>
        {open ? <ChevronDown size={18} color={t.textFaint} /> : <ChevronRight size={18} color={t.textFaint} />}
      </button>

      {open && (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12.5, color: t.textMuted, lineHeight: 1.5 }}>{reason}</div>
        </div>
      )}
    </div>
  );
}
