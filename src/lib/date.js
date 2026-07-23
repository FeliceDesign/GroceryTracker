// Mindesthaltbarkeitsdatum (MHD) – Berechnung und Darstellung.
// Ein MHD ist optional und pro Artikel im Format JJJJ-MM-TT gespeichert.
import { rgba } from './colors.js';

// Heutiges Datum als JJJJ-MM-TT (lokale Zeitzone).
export function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function daysUntil(mhd) {
  if (!mhd) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(mhd + 'T00:00:00');
  return Math.round((target - today) / 86400000);
}

// Einstufung eines MHD:
//  'expired'  – bereits überfällig (rot)
//  'critical' – läuft innerhalb von `orangeDays` Tagen ab (Stufe 2)
//  'soon'     – läuft innerhalb von `yellowDays` Tagen ab (Stufe 1, gelb)
//  'ok'       – noch genug Zeit
export function expiryLevel(days, yellowDays = 3, orangeDays = 1) {
  if (days === null || days === undefined) return null;
  if (days < 0) return 'expired';
  if (days <= orangeDays) return 'critical';
  if (days <= yellowDays) return 'soon';
  return 'ok';
}

// Default-Farbe für Stufe 2, falls in den Einstellungen keine eigene Farbe
// gewählt wurde (das Theme kennt von Haus aus nur "warning"/"danger").
const DEFAULT_CRITICAL_COLOR = '#C2703D';

// `colors` optional: { soon, critical, expired } – eigene Hex-Werte aus den
// Einstellungen überschreiben die Theme-/Default-Farben.
export function levelColor(level, t, colors = {}) {
  if (level === 'expired') return colors.expired || t.danger;
  if (level === 'critical') return colors.critical || DEFAULT_CRITICAL_COLOR;
  if (level === 'soon') return colors.soon || t.warning;
  return t.textMuted;
}

// Passender zarter Flächen-Hintergrund zur jeweiligen Stufe (für Badges).
export function levelBg(level, t, colors = {}) {
  if (level === 'expired') return colors.expired ? rgba(colors.expired, 0.16) : t.dangerBg;
  if (level === 'critical') return colors.critical ? rgba(colors.critical, 0.16) : rgba(DEFAULT_CRITICAL_COLOR, 0.16);
  if (level === 'soon') return colors.soon ? rgba(colors.soon, 0.16) : t.warningBg;
  return 'transparent';
}

export function mhdLabel(days) {
  if (days === null) return '';
  if (days < 0) return `${Math.abs(days)}T überfällig`;
  if (days === 0) return 'heute';
  if (days === 1) return 'morgen';
  return `in ${days}T`;
}
