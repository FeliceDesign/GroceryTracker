import { useState } from 'react';
import { Boxes, Tags, Utensils, Download, Upload, Sun, Moon, SunMoon, ChevronRight, Plus, Minus, Bell } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { makeInputStyle, btnCircle } from '../../lib/styles.js';

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

function Row({ icon, label, sub, onClick, t }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px',
        background: t.cardAlt, border: 'none', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
      }}
    >
      <span style={{ color: t.textMuted, display: 'flex' }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: t.text }}>{label}</span>
        {sub && <span style={{ display: 'block', fontSize: 12, color: t.textFaint, marginTop: 1 }}>{sub}</span>}
      </span>
      <ChevronRight size={18} color={t.textFaint} />
    </button>
  );
}

const sectionLabel = (t) => ({
  fontSize: 11.5, fontWeight: 700, color: t.textFaint, textTransform: 'uppercase',
  letterSpacing: '0.05em', margin: '18px 2px 8px',
});

const ALL_THRESHOLDS = [14, 7, 3, 1, 0];

export function SettingsSheet({
  open, onClose, t, themeOverride, setThemeOverride,
  onManageZones, onManageCategories, onManageFoods,
  warn, onUpdateWarn, onSetNotify, notifySupported,
  stats, buildBackup, restoreBackup,
}) {
  const [importing, setImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [msg, setMsg] = useState('');
  const inputStyle = makeInputStyle(t);

  const doExport = async () => {
    const json = buildBackup();
    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(json);
        copied = true;
      }
    } catch {
      copied = false;
    }
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grocerytracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Download nicht möglich – Clipboard reicht als Fallback
    }
    setMsg(copied ? '✓ Backup in Zwischenablage kopiert und heruntergeladen.' : '✓ Backup heruntergeladen.');
    setTimeout(() => setMsg(''), 3000);
  };

  const doImport = () => {
    const res = restoreBackup(importText);
    setMsg(res.ok ? '✓ ' + res.message : res.message);
    if (res.ok) {
      setImportText('');
      setImporting(false);
    }
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <Modal open={open} onClose={onClose} t={t} title="Einstellungen">
      <div style={sectionLabel(t)}>Darstellung</div>
      <Segmented
        t={t}
        value={themeOverride}
        onChange={setThemeOverride}
        options={[
          { value: null, label: 'System', icon: <SunMoon size={15} /> },
          { value: 'light', label: 'Hell', icon: <Sun size={15} /> },
          { value: 'dark', label: 'Dunkel', icon: <Moon size={15} /> },
        ]}
      />

      <div style={sectionLabel(t)}>MHD-Warnungen</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SettingRow
          t={t}
          label="Gelb-Markierung"
          sub={`Artikel werden ${warn.yellowDays} ${warn.yellowDays === 1 ? 'Tag' : 'Tage'} vor Ablauf gelb, abgelaufene rot.`}
          control={<Stepper t={t} value={warn.yellowDays} min={0} max={90} suffix={warn.yellowDays === 1 ? 'Tag' : 'Tage'} onChange={(v) => onUpdateWarn({ yellowDays: v })} />}
        />

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

      <div style={sectionLabel(t)}>Struktur</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Row
          t={t}
          icon={<Boxes size={19} />}
          label="Lagerorte verwalten"
          sub={`${stats.zones} Lagerorte`}
          onClick={onManageZones}
        />
        <Row
          t={t}
          icon={<Tags size={19} />}
          label="Kategorien verwalten"
          sub={`${stats.categories} Kategorien`}
          onClick={onManageCategories}
        />
        <Row
          t={t}
          icon={<Utensils size={19} />}
          label="Stammdaten / Makros"
          sub={`Nährwerte für ${stats.foods} Lebensmittel`}
          onClick={onManageFoods}
        />
      </div>

      <div style={sectionLabel(t)}>Daten</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Row t={t} icon={<Download size={19} />} label="Backup exportieren" sub={`${stats.items} Artikel als JSON`} onClick={doExport} />
        <Row t={t} icon={<Upload size={19} />} label="Backup importieren" sub="Aus JSON wiederherstellen" onClick={() => setImporting((v) => !v)} />
      </div>

      {importing && (
        <div style={{ marginTop: 10 }}>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Backup-JSON hier einfügen…"
            rows={5}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12.5 }}
          />
          <button
            type="button"
            onClick={doImport}
            disabled={!importText.trim()}
            style={{
              width: '100%', marginTop: 8, padding: '12px', borderRadius: 12, border: 'none',
              background: t.btnPrimary, color: t.btnPrimaryText, fontWeight: 700,
              cursor: importText.trim() ? 'pointer' : 'default', opacity: importText.trim() ? 1 : 0.5,
            }}
          >
            Wiederherstellen (ersetzt aktuellen Bestand)
          </button>
        </div>
      )}

      {msg && (
        <div style={{ fontSize: 12.5, marginTop: 14, color: msg.startsWith('✓') ? t.success : t.danger, lineHeight: 1.4 }}>
          {msg}
        </div>
      )}

      <div style={{ textAlign: 'center', fontSize: 11.5, color: t.textFaint, marginTop: 24 }}>
        GroceryTracker · lokal gespeichert auf diesem Gerät
      </div>
    </Modal>
  );
}
