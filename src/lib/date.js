// Mindesthaltbarkeitsdatum (MHD) – Berechnung und Darstellung.
// Ein MHD ist optional und pro Artikel im Format JJJJ-MM-TT gespeichert.

export function daysUntil(mhd) {
  if (!mhd) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(mhd + 'T00:00:00');
  return Math.round((target - today) / 86400000);
}

// Einstufung eines MHD:
//  'expired' – bereits überfällig (rot)
//  'soon'    – läuft innerhalb von `yellowDays` Tagen ab (gelb)
//  'ok'      – noch genug Zeit
export function expiryLevel(days, yellowDays = 3) {
  if (days === null || days === undefined) return null;
  if (days < 0) return 'expired';
  if (days <= yellowDays) return 'soon';
  return 'ok';
}

export function levelColor(level, t) {
  if (level === 'expired') return t.danger;
  if (level === 'soon') return t.warning;
  return t.textMuted;
}

export function mhdLabel(days) {
  if (days === null) return '';
  if (days < 0) return `${Math.abs(days)}T überfällig`;
  if (days === 0) return 'heute';
  if (days === 1) return 'morgen';
  return `in ${days}T`;
}
