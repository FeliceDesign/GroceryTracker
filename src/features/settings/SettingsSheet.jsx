import { useRef, useState } from 'react';
import { Boxes, Tags, Utensils, Clock, ListOrdered, Sprout, Download, Upload, Share2, ClipboardCopy, Sun, Moon, SunMoon, ChevronRight, Plus, Minus, Bell } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Modal } from '../../components/Modal.jsx';
import { ColorSwatches } from '../../components/ColorSwatches.jsx';
import { MHD_COLOR_CHOICES } from '../../lib/colors.js';
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
  fontSize: 12, fontWeight: 800, color: t.textMuted, textTransform: 'uppercase',
  letterSpacing: '0.06em', margin: '30px 2px 10px',
});

const ALL_THRESHOLDS = [14, 7, 3, 1, 0];

export function SettingsSheet({
  open, onClose, t, themeOverride, setThemeOverride,
  onManageZones, onManageCategories, onManageFoods, onOpenShelfLife, onOpenExpiringView, onOpenProduceStorage,
  showShoppingCount, onToggleShoppingCount, autoShoppingOnRemove, onToggleAutoShoppingOnRemove, stepGml, onSetStepGml,
  showSlider, onToggleShowSlider, showWarnDot, onToggleShowWarnDot, headerAlign, onSetHeaderAlign, appTitle, onSetAppTitle,
  shoppingPos, onSetShoppingPos, settingsPos, onSetSettingsPos, addPos, onSetAddPos, dateFormat, onSetDateFormat,
  warn, onUpdateWarn, onSetNotify, notifySupported,
  stats, buildBackup, restoreBackup, previewBackup,
}) {
  const [importing, setImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [msg, setMsg] = useState('');
  const [exportMacros, setExportMacros] = useState(true);
  const [pending, setPending] = useState(null); // { text, summary } – wartet auf Bestätigung
  const fileRef = useRef(null);
  const inputStyle = makeInputStyle(t);

  // Prüfen und zur Bestätigung vormerken (noch NICHT anwenden).
  const preview = (text) => {
    const res = previewBackup(text);
    if (res.ok) { setPending({ text, summary: res.summary }); setMsg(''); }
    else { setPending(null); setMsg(res.message); setTimeout(() => setMsg(''), 4000); }
  };

  const confirmImport = () => {
    if (!pending) return;
    const res = restoreBackup(pending.text);
    setMsg(res.ok ? '✓ ' + res.message : res.message);
    if (res.ok) { setImportText(''); setImporting(false); }
    setPending(null);
    setTimeout(() => setMsg(''), 4000);
  };

  // Backup aus einer ausgewählten .json-Datei einlesen (nur prüfen).
  const onPickFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => preview(String(reader.result || ''));
    reader.onerror = () => { setMsg('Datei konnte nicht gelesen werden.'); };
    reader.readAsText(file);
    e.target.value = ''; // gleiche Datei erneut wählbar machen
  };

  const backupFilename = () => `grocerytracker-backup-${new Date().toISOString().slice(0, 10)}.json`;

  const flashMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  // Schreibt eine echte, über jede Dateien-App auffindbare Datei ins
  // öffentliche Dokumente-Verzeichnis – ohne Auswahldialog (den gibt es unter
  // Capacitor/Android nicht ohne eigenes natives Plugin), aber garantiert
  // eine echte Datei statt nur eines (im WebView wirkungslosen) Web-Downloads.
  const doExport = async () => {
    const json = buildBackup(exportMacros);
    const filename = backupFilename();

    if (Capacitor.isNativePlatform()) {
      try {
        await Filesystem.writeFile({ path: filename, data: json, directory: Directory.Documents, encoding: Encoding.UTF8 });
        flashMsg(`✓ Gespeichert: Dokumente/${filename}`);
      } catch {
        flashMsg('Backup konnte nicht gespeichert werden.');
      }
      return;
    }

    // Browser/Vorschau: kein Dokumente-Verzeichnis, daher Web-Download.
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      flashMsg('✓ Backup heruntergeladen.');
    } catch {
      flashMsg('Backup konnte nicht erstellt werden.');
    }
  };

  // Eigenständige "Teilen"-Aktion (z.B. um das Backup direkt per Mail/Drive/
  // Messenger zu verschicken) statt an den Export gekoppelt.
  const doShareExport = async () => {
    const json = buildBackup(exportMacros);
    const filename = backupFilename();

    if (Capacitor.isNativePlatform()) {
      try {
        await Filesystem.writeFile({ path: filename, data: json, directory: Directory.Cache, encoding: Encoding.UTF8 });
        const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
        await Share.share({ title: 'Backup teilen', url: uri, dialogTitle: 'Backup teilen…' });
      } catch (e) {
        if (!e?.message?.includes('cancel')) flashMsg('Teilen fehlgeschlagen.');
      }
      return;
    }

    if (navigator.share) {
      try {
        const file = new File([json], filename, { type: 'application/json' });
        await navigator.share({ files: [file], title: 'Backup teilen' });
      } catch {
        // Abgebrochen oder nicht unterstützt – keine Fehlermeldung nötig
      }
    } else {
      flashMsg('Teilen ist in der Browser-Vorschau nicht verfügbar.');
    }
  };

  // Eigenständige Zwischenablage-Aktion, unabhängig vom Datei-Export.
  const doCopyExport = async () => {
    const json = buildBackup(exportMacros);
    try {
      await navigator.clipboard.writeText(json);
      flashMsg('✓ Backup in Zwischenablage kopiert.');
    } catch {
      flashMsg('Kopieren nicht möglich.');
    }
  };

  const doImport = () => preview(importText);

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
      <div style={{ marginTop: 10 }}>
        <SettingRow
          t={t}
          label="Artikelzahl auf Einkaufsliste"
          sub="Zahl-Badge am Einkaufs-Symbol. Aus: nur ein Punkt bei offenen Artikeln."
          control={<Toggle t={t} on={showShoppingCount !== false} onChange={onToggleShoppingCount} />}
        />
        <div style={{ marginTop: 10 }}>
          <SettingRow
            t={t}
            label="Entfernte Artikel auf Einkaufsliste"
            sub="Wenn ein Artikel entfernt wird, automatisch auf die Einkaufsliste setzen."
            control={<Toggle t={t} on={autoShoppingOnRemove !== false} onChange={onToggleAutoShoppingOnRemove} />}
          />
        </div>
        <div style={{ background: t.cardAlt, borderRadius: 14, padding: '12px 14px', marginTop: 10 }}>
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
      </div>

        <div style={{ marginTop: 10 }}>
          <SettingRow
            t={t}
            label="Schieberegler für Menge"
            sub="Im Bearbeiten-Dialog bei g/ml zusätzlich zum Zahlenfeld."
            control={<Toggle t={t} on={showSlider !== false} onChange={onToggleShowSlider} />}
          />
        </div>

        <div style={{ marginTop: 10 }}>
          <SettingRow
            t={t}
            label="Warn-Punkt bei MHD"
            sub="Farbiger Punkt vor dem Namen, wenn MHD oder Öffnungsfrist bald abläuft."
            control={<Toggle t={t} on={showWarnDot !== false} onChange={onToggleShowWarnDot} />}
          />
        </div>

        <div style={{ background: t.cardAlt, borderRadius: 14, padding: '12px 14px', marginTop: 10 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: t.text }}>Kopfzeile</div>
          <div style={{ fontSize: 12, color: t.textFaint, marginTop: 2, marginBottom: 10 }}>Eigener Titel und Ausrichtung von Titel, Zone und Artikelzahl.</div>
          <input
            value={appTitle || ''}
            onChange={(e) => onSetAppTitle(e.target.value)}
            placeholder="Stock-Tracker"
            maxLength={28}
            style={{ ...inputStyle, marginTop: 0, marginBottom: 10 }}
          />
          <Segmented
            t={t}
            value={headerAlign || 'left'}
            onChange={onSetHeaderAlign}
            options={[
              { value: 'left', label: 'Links' },
              { value: 'center', label: 'Mittig' },
            ]}
          />
        </div>

        <div style={{ background: t.cardAlt, borderRadius: 14, padding: '12px 14px', marginTop: 10 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: t.text }}>Buttons platzieren</div>
          <div style={{ fontSize: 12, color: t.textFaint, marginTop: 2, marginBottom: 10, lineHeight: 1.35 }}>
            Jeder Button einzeln oben (Kopfzeile) oder unten (schwebend, stapeln sich in fester Reihenfolge).
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: t.textMuted, marginBottom: 6 }}>Einkaufsliste</div>
              <Segmented
                t={t}
                value={shoppingPos || 'top'}
                onChange={onSetShoppingPos}
                options={[
                  { value: 'top', label: 'Oben' },
                  { value: 'bottom', label: 'Unten' },
                ]}
              />
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: t.textMuted, marginBottom: 6 }}>Einstellungen</div>
              <Segmented
                t={t}
                value={settingsPos || 'top'}
                onChange={onSetSettingsPos}
                options={[
                  { value: 'top', label: 'Oben' },
                  { value: 'bottom', label: 'Unten' },
                ]}
              />
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: t.textMuted, marginBottom: 6 }}>Hinzufügen (+)</div>
              <Segmented
                t={t}
                value={addPos || 'bottom'}
                onChange={onSetAddPos}
                options={[
                  { value: 'top', label: 'Oben' },
                  { value: 'bottom', label: 'Unten' },
                ]}
              />
            </div>
          </div>
        </div>

        <div style={{ background: t.cardAlt, borderRadius: 14, padding: '12px 14px', marginTop: 10 }}>
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

      <div style={sectionLabel(t)}>MHD-Warnungen</div>
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
          <ColorSwatches choices={MHD_COLOR_CHOICES} value={warn.colorSoon} onChange={(c) => onUpdateWarn({ colorSoon: c })} />
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
          <ColorSwatches choices={MHD_COLOR_CHOICES} value={warn.colorCritical} onChange={(c) => onUpdateWarn({ colorCritical: c })} />
        </div>

        <div style={{ background: t.cardAlt, borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: t.text }}>Abgelaufen</div>
          <div style={{ fontSize: 12, color: t.textFaint, marginTop: 2, marginBottom: 10 }}>
            Farbe für bereits abgelaufene Artikel.
          </div>
          <ColorSwatches choices={MHD_COLOR_CHOICES} value={warn.colorExpired} onChange={(c) => onUpdateWarn({ colorExpired: c })} />
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
        <Row
          t={t}
          icon={<Clock size={19} />}
          label="Haltbarkeits-Ratgeber"
          sub="Richtwerte nach dem Öffnen inkl. Lagerung"
          onClick={onOpenShelfLife}
        />
        <Row
          t={t}
          icon={<ListOrdered size={19} />}
          label="Alle Artikel nach MHD"
          sub="Zonenübergreifend, nach Ablaufdatum sortiert"
          onClick={onOpenExpiringView}
        />
        <Row
          t={t}
          icon={<Sprout size={19} />}
          label="Obst-&-Gemüse-Ratgeber"
          sub="Kühlen, Ethylen, Verpackung"
          onClick={onOpenProduceStorage}
        />
      </div>

      <div style={sectionLabel(t)}>Daten</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SettingRow
          t={t}
          label="Makros mit exportieren"
          sub={`Nährwerte von ${stats.foods} Lebensmitteln ins Backup aufnehmen.`}
          control={<Toggle t={t} on={exportMacros} onChange={setExportMacros} />}
        />
        <Row t={t} icon={<Download size={19} />} label="Backup exportieren" sub={`${stats.items} Artikel als JSON${exportMacros ? ' inkl. Makros' : ' ohne Makros'} · als Datei speichern`} onClick={doExport} />
        <Row t={t} icon={<Share2 size={19} />} label="Backup teilen" sub="An eine App senden (Mail, Drive, Messenger, …)" onClick={doShareExport} />
        <Row t={t} icon={<ClipboardCopy size={19} />} label="In Zwischenablage kopieren" sub="Zum Einfügen beim Import" onClick={doCopyExport} />
        <Row t={t} icon={<Upload size={19} />} label="Backup importieren" sub="Aus Datei oder JSON – mit Bestätigung" onClick={() => { setImporting((v) => !v); setPending(null); }} />
      </div>

      {importing && (
        <div style={{ marginTop: 10 }}>
          <input ref={fileRef} type="file" accept=".json,application/json" onChange={onPickFile} style={{ display: 'none' }} />
          <button
            type="button"
            onClick={() => fileRef.current && fileRef.current.click()}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px', borderRadius: 12, border: `1.5px solid ${t.border}`,
              background: 'transparent', color: t.text, fontWeight: 700, fontSize: 14, cursor: 'pointer',
              marginBottom: 10,
            }}
          >
            <Upload size={17} /> Datei auswählen (.json)
          </button>
          <div style={{ fontSize: 11.5, color: t.textFaint, marginBottom: 10, textAlign: 'center' }}>
            oder JSON-Text einfügen:
          </div>
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
              width: '100%', marginTop: 8, padding: '12px', borderRadius: 12, border: `1.5px solid ${t.border}`,
              background: 'transparent', color: t.text, fontWeight: 700,
              cursor: importText.trim() ? 'pointer' : 'default', opacity: importText.trim() ? 1 : 0.5,
            }}
          >
            Text prüfen
          </button>
        </div>
      )}

      {pending && (
        <div style={{ marginTop: 12, background: t.cardAlt, borderRadius: 14, padding: 14, border: `1.5px solid ${t.dangerBorder}` }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 6 }}>Backup wirklich übernehmen?</div>
          <div style={{ fontSize: 12.5, color: t.textMuted, lineHeight: 1.5 }}>
            {pending.summary.exportedAt ? `Stand: ${new Date(pending.summary.exportedAt).toLocaleString('de-DE')}` : 'Ohne Datum'}<br />
            <b>{pending.summary.items}</b> Artikel · <b>{pending.summary.foods}</b> Makro-Datensätze · <b>{pending.summary.zones}</b> Lagerorte · <b>{pending.summary.categories}</b> Kategorien
          </div>
          <div style={{ fontSize: 12, color: t.danger, marginTop: 8, lineHeight: 1.4 }}>
            ⚠️ Ersetzt deinen aktuellen Bestand vollständig.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={() => setPending(null)}
              style={{ flex: 1, padding: '12px', borderRadius: 12, border: `1.5px solid ${t.border}`, background: 'transparent', color: t.textMuted, fontWeight: 700, cursor: 'pointer' }}
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={confirmImport}
              style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: t.danger, color: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >
              Ersetzen
            </button>
          </div>
        </div>
      )}

      {msg && (
        <div style={{ fontSize: 12.5, marginTop: 14, color: msg.startsWith('✓') ? t.success : t.danger, lineHeight: 1.4 }}>
          {msg}
        </div>
      )}

      <div style={{ textAlign: 'center', fontSize: 11.5, color: t.textFaint, marginTop: 24 }}>
        Stock-Tracker · lokal gespeichert auf diesem Gerät
      </div>
    </Modal>
  );
}
