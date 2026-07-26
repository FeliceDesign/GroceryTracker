import { Modal } from '../../components/Modal.jsx';
import { Toggle } from '../../components/Toggle.jsx';
import { SettingRow } from '../../components/SettingRow.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { tr } from '../../lib/i18n.js';

// Verhaltens-/Anzeige-Toggles + Formate – vorher Teil der Haupt-Einstellungen
// ("Darstellung"), jetzt eigenes Untermenü (Settings-Declutter).
export function BehaviorSheet({
  open, onClose, t, lang = 'de',
  shoppingBadgeMode, onSetShoppingBadgeMode, autoShoppingOnRemove, onToggleAutoShoppingOnRemove, stepGml, onSetStepGml,
  showSlider, onToggleShowSlider, showWarnDot, onToggleShowWarnDot, dateFormat, onSetDateFormat,
  stripBrandNames, onToggleStripBrandNames, showFavoriteChips, onToggleShowFavoriteChips,
  mainSortMode, onSetMainSortMode,
}) {
  return (
    <Modal open={open} onClose={onClose} t={t} lang={lang} title={tr(lang, 'behavior.title')} subtitle={tr(lang, 'behavior.subtitle')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ background: t.cardAlt, borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: t.text }}>{tr(lang, 'behavior.mainSort')}</div>
          <div style={{ fontSize: 12, color: t.textFaint, marginTop: 2, marginBottom: 10, lineHeight: 1.35 }}>
            {tr(lang, 'behavior.mainSortHint')}
          </div>
          <Segmented
            t={t}
            value={mainSortMode || 'category'}
            onChange={onSetMainSortMode}
            options={[
              { value: 'category', label: tr(lang, 'behavior.sortCategory') },
              { value: 'name', label: tr(lang, 'behavior.sortName') },
              { value: 'mhd', label: tr(lang, 'behavior.sortMhd') },
            ]}
          />
        </div>

        <div style={{ background: t.cardAlt, borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: t.text }}>{tr(lang, 'behavior.shoppingCount')}</div>
          <div style={{ fontSize: 12, color: t.textFaint, marginTop: 2, marginBottom: 10, lineHeight: 1.35 }}>
            {tr(lang, 'behavior.shoppingCountHint')}
          </div>
          <Segmented
            t={t}
            value={shoppingBadgeMode || 'count'}
            onChange={onSetShoppingBadgeMode}
            options={[
              { value: 'count', label: tr(lang, 'behavior.badgeCount') },
              { value: 'dot', label: tr(lang, 'behavior.badgeDot') },
              { value: 'off', label: tr(lang, 'behavior.badgeOff') },
            ]}
          />
        </div>
        <SettingRow
          t={t}
          label={tr(lang, 'behavior.autoShopping')}
          sub={tr(lang, 'behavior.autoShoppingHint')}
          control={<Toggle t={t} on={autoShoppingOnRemove !== false} onChange={onToggleAutoShoppingOnRemove} />}
        />

        <div style={{ background: t.cardAlt, borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: t.text }}>{tr(lang, 'behavior.step')}</div>
          <div style={{ fontSize: 12, color: t.textFaint, marginTop: 2, marginBottom: 10, lineHeight: 1.35 }}>
            {tr(lang, 'behavior.stepHint')}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['auto', tr(lang, 'behavior.stepAuto')], [5, '5'], [10, '10'], [25, '25'], [50, '50'], [100, '100']].map(([val, lbl]) => {
              const active = String(stepGml ?? 'auto') === String(val);
              return (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => onSetStepGml(val)}
                  style={{
                    padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    background: active ? t.pillActive : t.card, color: active ? t.pillActiveText : t.textMuted,
                  }}
                >
                  {lbl}
                </button>
              );
            })}
          </div>
        </div>

        <SettingRow
          t={t}
          label={tr(lang, 'behavior.slider')}
          sub={tr(lang, 'behavior.sliderHint')}
          control={<Toggle t={t} on={showSlider !== false} onChange={onToggleShowSlider} />}
        />

        <SettingRow
          t={t}
          label={tr(lang, 'behavior.warnDot')}
          sub={tr(lang, 'behavior.warnDotHint')}
          control={<Toggle t={t} on={showWarnDot !== false} onChange={onToggleShowWarnDot} />}
        />

        <SettingRow
          t={t}
          label={tr(lang, 'behavior.stripBrandNames')}
          sub={tr(lang, 'behavior.stripBrandNamesHint')}
          control={<Toggle t={t} on={stripBrandNames !== false} onChange={onToggleStripBrandNames} />}
        />

        <SettingRow
          t={t}
          label={tr(lang, 'behavior.showFavoriteChips')}
          sub={tr(lang, 'behavior.showFavoriteChipsHint')}
          control={<Toggle t={t} on={showFavoriteChips !== false} onChange={onToggleShowFavoriteChips} />}
        />

        <div style={{ background: t.cardAlt, borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: t.text }}>{tr(lang, 'behavior.dateFormat')}</div>
          <div style={{ fontSize: 12, color: t.textFaint, marginTop: 2, marginBottom: 10, lineHeight: 1.35 }}>
            {tr(lang, 'behavior.dateFormatHint')}
          </div>
          <Segmented
            t={t}
            value={dateFormat || 'dmy'}
            onChange={onSetDateFormat}
            options={[
              { value: 'dmy', label: tr(lang, 'behavior.fmtDmy') },
              { value: 'dmy-short', label: tr(lang, 'behavior.fmtDmyShort') },
              { value: 'iso', label: tr(lang, 'behavior.fmtIso') },
            ]}
          />
        </div>
      </div>
    </Modal>
  );
}
