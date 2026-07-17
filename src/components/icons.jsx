// Eigenes, kompaktes Barcode-Icon – lucide-react hat kein passendes, und so
// sparen wir uns ein weiteres Paket.
export function BarcodeIcon({ size = 17, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g stroke={color} strokeWidth="2" strokeLinecap="round">
        <line x1="4" y1="6" x2="4" y2="18" />
        <line x1="8" y1="6" x2="8" y2="18" />
        <line x1="12" y1="6" x2="12" y2="18" />
        <line x1="16" y1="6" x2="16" y2="18" />
        <line x1="20" y1="6" x2="20" y2="18" />
      </g>
    </svg>
  );
}
