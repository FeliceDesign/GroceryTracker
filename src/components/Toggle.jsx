// Einfacher An/Aus-Schalter für Settings-Sheets.
export function Toggle({ on, onChange, t }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      style={{
        width: 46, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', padding: 3,
        background: on ? t.success : t.border, display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start',
        transition: 'background 0.15s ease',
      }}
    >
      <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
    </button>
  );
}
