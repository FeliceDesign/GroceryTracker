import { X } from 'lucide-react';
import { btnCircle } from '../lib/styles.js';

// Wiederverwendbares Bottom-Sheet. Overlay schließt bei Klick daneben; der
// Inhalt scrollt bei Bedarf. `footer` bleibt unten sichtbar (Daumenbereich).
export function Modal({ open, onClose, title, subtitle, t, children, footer, maxHeight = '92vh' }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: t.overlay, zIndex: 40,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: t.card, borderRadius: '22px 22px 0 0',
          width: '100%', maxWidth: 480, maxHeight,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 -6px 28px rgba(0,0,0,0.22)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Griff */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
          <div style={{ width: 38, height: 4, borderRadius: 4, background: t.border }} />
        </div>

        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 12, padding: '12px 20px 8px',
        }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: t.text }}>{title}</h2>
            {subtitle && (
              <div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 2 }}>{subtitle}</div>
            )}
          </div>
          <button onClick={onClose} style={btnCircle(t.cardAlt, t.pillInactiveText)} aria-label="Schließen">
            <X size={16} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '4px 20px 20px', flex: 1 }}>{children}</div>

        {footer && (
          <div style={{
            padding: '12px 20px calc(16px + env(safe-area-inset-bottom))',
            borderTop: `1px solid ${t.border}`, background: t.card,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
