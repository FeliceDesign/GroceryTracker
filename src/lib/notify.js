// Lokale MHD-Erinnerungen als Push-Benachrichtigung (nur native App).
// Für jeden Artikel mit MHD werden zu den eingestellten Schwellen (z.B. 7/3/1/0
// Tage vorher) Benachrichtigungen geplant. Bei jeder Änderung wird alles neu
// geplant – so bleibt der Zeitplan konsistent.

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export function notificationsSupported() {
  return Capacitor.isNativePlatform();
}

// Fragt (einmalig) die Berechtigung ab. Gibt true zurück, wenn erlaubt.
export async function ensureNotifyPermission() {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions();
    return perm.display === 'granted';
  } catch {
    return false;
  }
}

async function cancelAllPending() {
  try {
    const pending = await LocalNotifications.getPending();
    if (pending?.notifications?.length) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
    }
  } catch {
    // egal
  }
}

function thresholdLabel(days) {
  if (days <= 0) return 'läuft heute ab';
  if (days === 1) return 'läuft morgen ab';
  return `läuft in ${days} Tagen ab`;
}

// Plant alle Erinnerungen neu. `warn` = { notify, thresholds, notifyHour }.
export async function syncExpiryNotifications(items, warn) {
  if (!Capacitor.isNativePlatform()) return;
  await cancelAllPending();
  if (!warn || !warn.notify || !Array.isArray(items)) return;

  const hour = Number.isFinite(warn.notifyHour) ? warn.notifyHour : 9;
  const thresholds = (warn.thresholds && warn.thresholds.length ? warn.thresholds : [3, 0])
    .slice()
    .sort((a, b) => b - a);
  const now = Date.now();
  const notifications = [];
  let id = 1;

  for (const item of items) {
    if (!item.mhd) continue;
    const mhd = new Date(item.mhd + 'T00:00:00');
    for (const th of thresholds) {
      const fire = new Date(mhd);
      fire.setDate(fire.getDate() - th);
      fire.setHours(hour, 0, 0, 0);
      if (fire.getTime() <= now) continue; // in der Vergangenheit -> überspringen
      notifications.push({
        id: id++,
        title: 'MHD-Warnung',
        body: `${item.name} ${thresholdLabel(th)}`,
        schedule: { at: fire, allowWhileIdle: true },
      });
      if (id > 480) break; // Sicherheitslimit (Android begrenzt aktive Alarme)
    }
    if (id > 480) break;
  }

  if (notifications.length) {
    try {
      await LocalNotifications.schedule({ notifications });
    } catch {
      // Planen fehlgeschlagen – optionales Feature, nicht hart durchreichen
    }
  }
}
