import { AlertTriangle } from 'lucide-react';
import { mhdLabel } from '../lib/date.js';

// Hinweisbanner für Artikel, die heute/morgen ablaufen oder überfällig sind.
export function ExpiringBanner({ expiring, t, onOpen }) {
  if (expiring.length === 0) return null;
  return (
    <div style={{ maxWidth: 480, margin: '14px auto 0', padding: '0 20px' }}>
      <button
        onClick={() => onOpen(expiring[0].zone)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          background: t.dangerBg, border: `1px solid ${t.dangerBorder}`, borderRadius: 12,
          padding: '11px 14px', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <AlertTriangle size={16} color={t.danger} strokeWidth={2} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, color: t.danger, lineHeight: 1.4 }}>
          <strong>{expiring.length} Artikel</strong> {expiring.length === 1 ? 'läuft' : 'laufen'} bald ab:{' '}
          {expiring.slice(0, 3).map((i) => `${i.name} (${mhdLabel(i.days)})`).join(', ')}
          {expiring.length > 3 ? `, +${expiring.length - 3} weitere` : ''}
        </span>
      </button>
    </div>
  );
}
