import { Bell, Minus, Plus } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { ColorSwatches } from '../../components/ColorSwatches.jsx';
import { Toggle } from '../../components/Toggle.jsx';
import { SettingRow } from '../../components/SettingRow.jsx';
import { MHD_COLOR_CHOICES } from '../../lib/colors.js';
import { btnCircle } from '../../lib/styles.js';
import { tr } from '../../lib/i18n.js';

function Stepper({ value, onChange, min = 0, max = 60, suffix, t, lang }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} style={btnCircle(t.cardAlt, t.pillInactiveText, 34)} aria-label={tr(lang, 'warn.fewer')}>
        <Minus size={15} strokeWidth={2.5} />
      </button>
      <span style={{ minWidth: 74, textAlign: 'center', fontSize: 14.5, fontWeight: 700, color: t.text }}>
        {value}{suffix ? ` ${suffix}` : ''}
      </span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} style={btnCircle(t.cardAlt, t.pillInactiveText, 34)} aria-label={tr(lang, 'warn.more')}>
        <Plus size={15} strokeWidth={2.5} />
      </button>
    </div>
  );
}

const ALL_THRESHOLDS = [14, 7, 3, 1, 0];

// MHD-Warnstufen (Farben, Schwellwerte) + Push-Benachrichtigung – vorher Teil
// der Haupt-Einstellungen, jetzt eigenes Untermenü (Settings-Declutter).
export function WarnSheet({ open, onClose, t, lang = 'de', warn, onUpdateWarn, onSetNotify, notifySupported, customColors, onAddCustomColor, onRemoveCustomColor }) {
  const dayWord = (n) => tr(lang, n === 1 ? 'common.day' : 'common.days');
  return (
    <Modal open={open} onClose={onClose} t={t} lang={lang} title={tr(lang, 'warn.title')} subtitle={tr(lang, 'warn.subtitle')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ background: t.cardAlt, borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: t.text }}>{tr(lang, 'warn.stage1')}</div>
          <div style={{ fontSize: 12, color: t.textFaint, marginTop: 2, marginBottom: 10 }}>
            {tr(lang, 'warn.stage1Hint', { n: warn.yellowDays, unit: dayWord(warn.yellowDays) })}
          </div>
          <Stepper
            t={t}
            lang={lang}
            value={warn.yellowDays}
            min={Math.max(1, (warn.orangeDays ?? 1) + 1)}
            max={90}
            suffix={dayWord(warn.yellowDays)}
            onChange={(v) => onUpdateWarn({ yellowDays: v })}
          />
          <ColorSwatches t={t} lang={lang} allowAuto choices={MHD_COLOR_CHOICES} value={warn.colorSoon} onChange={(c) => onUpdateWarn({ colorSoon: c })}
            customChoices={customColors} onAddCustom={(c) => { onAddCustomColor(c); onUpdateWarn({ colorSoon: c }); }} onRemoveCustom={onRemoveCustomColor}
          />
        </div>

        <div style={{ background: t.cardAlt, borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: t.text }}>{tr(lang, 'warn.stage2')}</div>
          <div style={{ fontSize: 12, color: t.textFaint, marginTop: 2, marginBottom: 10 }}>
            {tr(lang, 'warn.stage2Hint', { n: warn.orangeDays ?? 1, unit: dayWord(warn.orangeDays ?? 1) })}
          </div>
          <Stepper
            t={t}
            lang={lang}
            value={warn.orangeDays ?? 1}
            min={0}
            max={Math.max(0, warn.yellowDays - 1)}
            suffix={dayWord(warn.orangeDays ?? 1)}
            onChange={(v) => onUpdateWarn({ orangeDays: v })}
          />
          <ColorSwatches
            t={t} lang={lang} allowAuto choices={MHD_COLOR_CHOICES} value={warn.colorCritical} onChange={(c) => onUpdateWarn({ colorCritical: c })}
            customChoices={customColors} onAddCustom={(c) => { onAddCustomColor(c); onUpdateWarn({ colorCritical: c }); }} onRemoveCustom={onRemoveCustomColor}
          />
        </div>

        <div style={{ background: t.cardAlt, borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: t.text }}>{tr(lang, 'warn.expired')}</div>
          <div style={{ fontSize: 12, color: t.textFaint, marginTop: 2, marginBottom: 10 }}>
            {tr(lang, 'warn.expiredHint')}
          </div>
          <ColorSwatches
            t={t} lang={lang} allowAuto choices={MHD_COLOR_CHOICES} value={warn.colorExpired} onChange={(c) => onUpdateWarn({ colorExpired: c })}
            customChoices={customColors} onAddCustom={(c) => { onAddCustomColor(c); onUpdateWarn({ colorExpired: c }); }} onRemoveCustom={onRemoveCustomColor}
          />
        </div>

        {notifySupported ? (
          <>
            <SettingRow
              t={t}
              label={tr(lang, 'warn.push')}
              sub={tr(lang, 'warn.pushHint')}
              control={<Toggle t={t} on={!!warn.notify} onChange={(on) => onSetNotify(on)} />}
            />
            {warn.notify && (
              <div style={{ background: t.cardAlt, borderRadius: 14, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 10 }}>
                  <Bell size={15} /> {tr(lang, 'warn.whenToRemind')}
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
                        {d === 0 ? tr(lang, 'warn.onTheDay') : `${d} ${dayWord(d)}`}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{tr(lang, 'warn.time')}</span>
                  <Stepper t={t} lang={lang} value={warn.notifyHour} min={0} max={23} suffix={tr(lang, 'warn.hour')} onChange={(v) => onUpdateWarn({ notifyHour: v })} />
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 12, color: t.textFaint, padding: '2px 4px', lineHeight: 1.4 }}>
            {tr(lang, 'warn.pushUnsupported')}
          </div>
        )}
      </div>
    </Modal>
  );
}
