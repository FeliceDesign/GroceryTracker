// Kurzes Feedback am unteren Rand. Optional mit Aktion (z.B. „Rückgängig").
export function Toast({ message, actionLabel, onAction, t }) {
  if (!message) return null;
  return (
    <div
      style={{
        position: 'fixed', left: '50%', transform: 'translateX(-50%)',
        bottom: 'calc(92px + env(safe-area-inset-bottom))',
        maxWidth: 440, width: 'calc(100% - 40px)', zIndex: 35,
        background: t.pillActive, color: t.pillActiveText,
        borderRadius: 12, padding: '12px 16px', boxShadow: '0 6px 18px rgba(0,0,0,0.28)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}
    >
      <span style={{ fontSize: 13.5, minWidth: 0 }}>{message}</span>
      {actionLabel && (
        <button
          onClick={onAction}
          style={{
            flexShrink: 0, border: 'none', background: 'transparent',
            color: t.success, fontWeight: 800, fontSize: 13.5, cursor: 'pointer',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
