import { Modal } from '../../components/Modal.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { Toggle } from '../../components/Toggle.jsx';
import { SettingRow } from '../../components/SettingRow.jsx';
import { makeInputStyle } from '../../lib/styles.js';
import { tr } from '../../lib/i18n.js';

// Kopfzeile (Titel/Ausrichtung) + Button-Positionen – vorher Teil der
// Haupt-Einstellungen ("Darstellung"), jetzt eigenes Untermenü. Einmal
// eingerichtet, selten wieder angefasst.
export function LayoutSheet({
  open, onClose, t, lang = 'de', headerAlign, onSetHeaderAlign, appTitle, onSetAppTitle,
  shoppingPos, onSetShoppingPos, settingsPos, onSetSettingsPos, addPos, onSetAddPos,
  favoritesPos, onSetFavoritesPos,
  zoneEmojiBothSides, onToggleZoneEmojiBothSides,
}) {
  const inputStyle = makeInputStyle(t);

  return (
    <Modal open={open} onClose={onClose} t={t} lang={lang} title={tr(lang, 'layout.title')} subtitle={tr(lang, 'layout.subtitle')}>
      <div style={{ background: t.cardAlt, borderRadius: 14, padding: '12px 14px' }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: t.text }}>{tr(lang, 'layout.header')}</div>
        <div style={{ fontSize: 12, color: t.textFaint, marginTop: 2, marginBottom: 10 }}>{tr(lang, 'layout.headerHint')}</div>
        <input
          value={appTitle || ''}
          onChange={(e) => onSetAppTitle(e.target.value)}
          placeholder={tr(lang, 'layout.titlePlaceholder')}
          maxLength={28}
          style={{ ...inputStyle, marginTop: 0, marginBottom: 10 }}
        />
        <Segmented
          t={t}
          value={headerAlign || 'left'}
          onChange={onSetHeaderAlign}
          options={[
            { value: 'left', label: tr(lang, 'layout.left') },
            { value: 'center', label: tr(lang, 'layout.center') },
          ]}
        />
      </div>

      <div style={{ marginTop: 10 }}>
        <SettingRow
          t={t}
          label={tr(lang, 'layout.zoneEmojiBothSides')}
          sub={tr(lang, 'layout.zoneEmojiBothSidesSub')}
          control={<Toggle t={t} on={zoneEmojiBothSides === true} onChange={onToggleZoneEmojiBothSides} />}
        />
      </div>

      <div style={{ background: t.cardAlt, borderRadius: 14, padding: '12px 14px', marginTop: 10 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: t.text }}>{tr(lang, 'layout.buttons')}</div>
        <div style={{ fontSize: 12, color: t.textFaint, marginTop: 2, marginBottom: 10, lineHeight: 1.35 }}>
          {tr(lang, 'layout.buttonsHint')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: t.textMuted, marginBottom: 6 }}>{tr(lang, 'layout.settings')}</div>
            <Segmented
              t={t}
              value={settingsPos || 'top'}
              onChange={onSetSettingsPos}
              options={[
                { value: 'top', label: tr(lang, 'layout.top') },
                { value: 'bottom', label: tr(lang, 'layout.bottom') },
              ]}
            />
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: t.textMuted, marginBottom: 6 }}>{tr(lang, 'layout.addButton')}</div>
            <Segmented
              t={t}
              value={addPos || 'bottom'}
              onChange={onSetAddPos}
              options={[
                { value: 'top', label: tr(lang, 'layout.top') },
                { value: 'bottom', label: tr(lang, 'layout.bottom') },
              ]}
            />
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: t.textMuted, marginBottom: 6 }}>{tr(lang, 'layout.favoritesButton')}</div>
            <Segmented
              t={t}
              value={favoritesPos || 'off'}
              onChange={onSetFavoritesPos}
              options={[
                { value: 'top', label: tr(lang, 'layout.top') },
                { value: 'bottom', label: tr(lang, 'layout.bottom') },
                { value: 'off', label: tr(lang, 'layout.off') },
              ]}
            />
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: t.textMuted, marginBottom: 6 }}>{tr(lang, 'layout.shopping')}</div>
            <Segmented
              t={t}
              value={shoppingPos || 'top'}
              onChange={onSetShoppingPos}
              options={[
                { value: 'top', label: tr(lang, 'layout.top') },
                { value: 'bottom', label: tr(lang, 'layout.bottom') },
                { value: 'off', label: tr(lang, 'layout.off') },
              ]}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
