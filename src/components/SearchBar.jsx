import { Search, X } from 'lucide-react';
import { makeInputStyle, btnCircle } from '../lib/styles.js';

export function SearchBar({ value, onChange, t }) {
  const inputStyle = makeInputStyle(t);
  return (
    <div style={{ maxWidth: 480, margin: '14px auto 0', padding: '0 20px', position: 'relative' }}>
      <Search
        size={16} color={t.textFaint}
        style={{ position: 'absolute', left: 32, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Artikel suchen (alle Lagerorte)…"
        style={{ ...inputStyle, marginTop: 0, paddingLeft: 40, paddingRight: 40 }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Suche zurücksetzen"
          style={{
            position: 'absolute', right: 28, top: '50%', transform: 'translateY(-50%)',
            ...btnCircle(t.cardAlt, t.pillInactiveText, 24),
          }}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
