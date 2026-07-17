import { Plus } from 'lucide-react';
import { zonePalette } from '../lib/colors.js';

// Schwebender Aktionsknopf zum Erfassen neuer Artikel.
export function Fab({ zone, dark, t, onClick }) {
  const pal = zonePalette(zone.color, dark);
  return (
    <button
      onClick={onClick}
      aria-label="Neuen Artikel hinzufügen"
      style={{
        position: 'fixed',
        right: 20,
        bottom: 'calc(22px + env(safe-area-inset-bottom))',
        width: 60, height: 60, borderRadius: '50%', border: 'none',
        background: pal.headerBg, color: t.headerText,
        boxShadow: '0 6px 18px rgba(0,0,0,0.28)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', zIndex: 30,
      }}
    >
      <Plus size={28} strokeWidth={2.6} />
    </button>
  );
}
