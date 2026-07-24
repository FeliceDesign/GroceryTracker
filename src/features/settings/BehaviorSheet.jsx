import { Modal } from '../../components/Modal.jsx';

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

function Segmented({ options, value, onChange, t }) {
  return (
    <div style={{ display: 'flex', gap: 6, background: t.cardAlt, borderRadius: 12, padding: 4 }}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '9px 6px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700,
              background: active ? t.card : 'transparent',
              color: active ? t.text : t.textMuted,
              boxShadow: active ? t.shadow : 'none',
            }}
          >
            {o.icon} {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Verhaltens-/Anzeige-Toggles + Formate – vorher Teil der Haupt-Einstellungen
// ("Darstellung"), jetzt eigenes Untermenü (Settings-Declutter).
export function BehaviorSheet({
  open, onClose, t,
  showShoppingCount, onToggleShoppingCount, autoShoppingOnRemove, onToggleAutoShoppingOnRemove, stepGml, onSetStepGml,
  showSlider, onToggleShowSlider, showWarnDot, onToggleShowWarnDot, dateFormat, onSetDateFormat,
}) {
  return (
    <Modal open={open} onClose={onClose} t={t} title="Verhalten" subtitle="Einkaufsliste, Mengen, Formate">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SettingRow
          t={t}
          label="Artikelzahl auf Einkaufsliste"
          sub="Zahl-Badge am Einkaufs-Symbol. Aus: nur ein Punkt bei offenen Artikeln."
          control={<Toggle t={t} on={showShoppingCount !== false} onChange={onToggleShoppingCount} />}
        />
        <SettingRow
          t={t}
          label="Entfernte Artikel auf Einkaufsliste"
          sub="Wenn ein Artikel entfernt wird, automatisch auf die Einkaufsliste setzen."
          control={<Toggle t={t} on={autoShoppingOnRemove !== false} onChange={onToggleAutoShoppingOnRemove} />}
        />

        <div style={{ background: t.cardAlt, borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: t.text }}>Schrittweite (g/ml)</div>
          <div style={{ fontSize: 12, color: t.textFaint, marginTop: 2, marginBottom: 10, lineHeight: 1.35 }}>
            Wie viel die +/−-Knöpfe bei Gramm/Milliliter ändern. „Auto" = 10 bis 100, danach 50.
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['auto', 'Auto'], [5, '5'], [10, '10'], [25, '25'], [50, '50'], [100, '100']].map(([val, lbl]) => {
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
          label="Schieberegler für Menge"
          sub="Im Bearbeiten-Dialog bei g/ml zusätzlich zum Zahlenfeld."
          control={<Toggle t={t} on={showSlider !== false} onChange={onToggleShowSlider} />}
        />

        <SettingRow
          t={t}
          label="Warn-Punkt bei MHD"
          sub="Farbiger Punkt vor dem Namen, wenn MHD oder Öffnungsfrist bald abläuft."
          control={<Toggle t={t} on={showWarnDot !== false} onChange={onToggleShowWarnDot} />}
        />

        <div style={{ background: t.cardAlt, borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: t.text }}>Datumsformat</div>
          <div style={{ fontSize: 12, color: t.textFaint, marginTop: 2, marginBottom: 10, lineHeight: 1.35 }}>
            Gilt für Datums-Anzeigen in der App (z.B. MHD-Badge). Das Kalender-Auswahlfeld selbst richtet sich immer nach der Spracheinstellung des Geräts.
          </div>
          <Segmented
            t={t}
            value={dateFormat || 'dmy'}
            onChange={onSetDateFormat}
            options={[
              { value: 'dmy', label: 'TT.MM.JJJJ' },
              { value: 'dmy-short', label: 'TT.MM.JJ' },
              { value: 'iso', label: 'JJJJ-MM-TT' },
            ]}
          />
        </div>
      </div>
    </Modal>
  );
}
