// Mindesthaltbarkeitsdatum (MHD) – Berechnung und Darstellung.
// Ein MHD ist optional und pro Artikel im Format JJJJ-MM-TT gespeichert.

export function daysUntil(mhd) {
  if (!mhd) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(mhd + 'T00:00:00');
  return Math.round((target - today) / 86400000);
}

// Auffällig rot nur bei „läuft heute/morgen ab" oder bereits überfällig,
// sonst dezent – damit die Warnung Signalwirkung behält.
export function mhdColor(days, t) {
  if (days === null) return null;
  if (days <= 1) return t.danger;
  return t.textMuted;
}

export function mhdLabel(days) {
  if (days === null) return '';
  if (days < 0) return `${Math.abs(days)}T überfällig`;
  if (days === 0) return 'heute';
  if (days === 1) return 'morgen';
  return `in ${days}T`;
}
