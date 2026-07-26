// Kleines Zahl-Badge (oder Punkt, oder ganz aus - je nach `mode`) oben
// rechts an einem runden/eckigen Icon-Button. Wird sowohl im Header als auch
// bei nach unten verschobenen Floating-Buttons verwendet – daher als eigene
// Komponente.
export function CountBadge({ count, mode = 'count', badgeBg, badgeFg, holeBorder }) {
  if (!(count > 0) || mode === 'off') return null;
  return mode === 'count' ? (
    <span style={{
      position: 'absolute', top: -4, right: -4, minWidth: 19, height: 19,
      borderRadius: 10, background: badgeBg, color: badgeFg,
      fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '0 5px', boxSizing: 'border-box',
    }}>
      {count}
    </span>
  ) : (
    <span style={{
      position: 'absolute', top: -2, right: -2, width: 11, height: 11,
      borderRadius: '50%', background: badgeBg,
      border: `2px solid ${holeBorder}`, boxSizing: 'border-box',
    }} />
  );
}
