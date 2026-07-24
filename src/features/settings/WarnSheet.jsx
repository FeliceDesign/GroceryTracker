import { Bell, Minus, Plus } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { ColorSwatches } from '../../components/ColorSwatches.jsx';
import { MHD_COLOR_CHOICES } from '../../lib/colors.js';
import { btnCircle } from '../../lib/styles.js';

function Stepper({ value, onChange, min = 0, max = 60, suffix, t }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} style={btnCircle(t.cardAlt, t.pillInactiveText, 34)} aria-label="Weniger">
        <Minus size={15} strokeWidth={2.5} />
      </button>
      <span style={{ minWidth: 74, textAlign: 'center', fontSize: 14.5, fontWeight: 700, color: t.text }}>
        {value}{suffix ? ` ${suffix}` : ''}
      </span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} style={btnCircle(t.cardAlt, t.pillInactiveText, 34)} aria-label="Mehr">
        <Plus size={15} strokeWidth={2.5} />
      </button>
    </div>
  );
}

function Toggle({ on, onChange, t }) {
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

function SettingRow({ label, sub, control, t }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: t.cardAlt, borderRadius: 14, padding: '12px 14px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: t.text }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: t.textFaint, marginTop: 2, lineHeight: 1.35 }}>{sub}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{control}</div>
    </div>
  );
}

const ALL_THRESHOLDS = [14, 7, 3, 1, 0];

// MHD-Warnstufen (Farben, Schwellwerte) + Push-Benachrichtigung – vorher Teil
// der Haupt-Einstellungen, jetzt eigenes Untermenü (Settings-Declutter).
export function WarnSheet({ open, onClose, t, warn, onUpdateWarn, onSetNotify, notifySupported }) {
  return (
    <Modal open={open} onClose={onClose} t={t} title="MHD-Warnungen" subtitle="Schwellwerte, Farben, Erinnerungen">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ background: t.cardAlt, borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: t.text }}>Stufe 1</div>
          <div style={{ fontSize: 12, color: t.textFaint, marginTop: 2, marginBottom: 10 }}>
            Artikel werden {warn.yellowDays} {warn.yellowDays === 1 ? 'Tag' : 'Tage'} vor Ablauf markiert.
          </div>
          <Stepper
            t={t}
            value={warn.yellowDays}
            min={Math.max(1, (warn.orangeDays ?? 1) + 1)}
            max={90}
            suffix={warn.yellowDays === 1 ? 'Tag' : 'Tage'}
            onChange={(v) => onUpdateWarn({ yellowDays: v })}
          />
          <ColorSwatches t={t} allowAuto choices={MHD_COLOR_CHOICES} value={warn.colorSoon} onChange={(c) => onUpdateWarn({ colorSoon: c })} />
        </div>

        <div style={{ background: t.cardAlt, borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: t.text }}>Stufe 2 (kritisch)</div>
          <div style={{ fontSize: 12, color: t.textFaint, marginTop: 2, marginBottom: 10 }}>
            Ab {warn.orangeDays ?? 1} {(warn.orangeDays ?? 1) === 1 ? 'Tag' : 'Tage'} vor Ablauf, dringlicher als Stufe 1.
          </div>
          <Stepper
            t={t}
            value={warn.orangeDays ?? 1}
            min={0}
            max={Math.max(0, warn.yellowDays - 1)}
            suffix={(warn.orangeDays ?? 1) === 1 ? 'Tag' : 'Tage'}
            onChange={(v) => onUpdateWarn({ orangeDays: v })}
          />
          <ColorSwatches t={t} allowAuto choices={MHD_COLOR_CHOICES} value={warn.colorCritical} onChange={(c) => onUpdateWarn({ colorCritical: c })} />
        </div>

        <div style={{ background: t.cardAlt, borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: t.text }}>Abgelaufen</div>
          <div style={{ fontSize: 12, color: t.textFaint, marginTop: 2, marginBottom: 10 }}>
            Farbe für bereits abgelaufene Artikel.
          </div>
          <ColorSwatches t={t} allowAuto choices={MHD_COLOR_CHOICES} value={warn.colorExpired} onChange={(c) => onUpdateWarn({ colorExpired: c })} />
        </div>

        {notifySupported ? (
          <>
            <SettingRow
              t={t}
              label="Push-Benachrichtigung"
              sub="Erinnerung, wenn Artikel bald ablaufen."
              control={<Toggle t={t} on={!!warn.notify} onChange={(on) => onSetNotify(on)} />}
            />
            {warn.notify && (
              <div style={{ background: t.cardAlt, borderRadius: 14, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 10 }}>
                  <Bell size={15} /> Wann erinnern (Tage vorher)
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ALL_THRESHOLDS.map((d) => {
                    const active = (warn.thresholds || []).includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          const cur = warn.thresholds || [];
                          onUpdateWarn({ thresholds: active ? cur.filter((x) => x !== d) : [...cur, d].sort((a, b) => b - a) });
                        }}
                        style={{
                          padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                          fontSize: 13, fontWeight: 700,
                          background: active ? t.pillActive : t.card, color: active ? t.pillActiveText : t.textMuted,
                        }}
                      >
                        {d === 0 ? 'am Tag' : `${d} ${d === 1 ? 'Tag' : 'Tage'}`}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>Uhrzeit</span>
                  <Stepper t={t} value={warn.notifyHour} min={0} max={23} suffix="Uhr" onChange={(v) => onUpdateWarn({ notifyHour: v })} />
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 12, color: t.textFaint, padding: '2px 4px', lineHeight: 1.4 }}>
            Push-Benachrichtigungen sind nur in der Android-App verfügbar.
          </div>
        )}
      </div>
    </Modal>
  );
}
