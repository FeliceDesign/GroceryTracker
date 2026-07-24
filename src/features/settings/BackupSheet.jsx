import { useMemo, useRef, useState } from 'react';
import { Download, Upload, Share2, ClipboardCopy } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Modal } from '../../components/Modal.jsx';
import { zonePalette } from '../../lib/colors.js';
import { makeInputStyle, pillStyle } from '../../lib/styles.js';
import { DownloadsSaver } from '../../lib/downloadsSaver.js';

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
    </button>
  );
}

const TABS = [
  { id: 'backup', label: 'Backup' },
  { id: 'list', label: 'Bestandsliste' },
];

// Menschenlesbare Tabelle (Kategorie | Artikel) je ausgewähltem Lagerort –
// zum schnellen Teilen (z.B. per Nachricht), kein Backup zum Wiederherstellen.
function buildInventoryText(items, zones, selectedIds) {
  const selected = zones.filter((z) => selectedIds.includes(z.id));
  if (selected.length === 0) return '';
  const blocks = selected.map((z) => {
    const zoneItems = items
      .filter((i) => i.zone === z.id)
      .slice()
      .sort((a, b) => (a.category || '').localeCompare(b.category || '', 'de') || a.name.localeCompare(b.name, 'de'));
    const header = `${z.emoji} ${z.label.toUpperCase()} (${z.id})`;
    if (zoneItems.length === 0) return `${header}\n\nKeine Artikel.`;
    const catWidth = Math.max(9, ...zoneItems.map((i) => (i.category || 'Sonstiges').length));
    const lines = [
      `${'KATEGORIE'.padEnd(catWidth)} | ARTIKEL`,
      `${'-'.repeat(catWidth)}|${'-'.repeat(30)}`,
      ...zoneItems.map((i) => `${(i.category || 'Sonstiges').padEnd(catWidth)} | ${i.name}`),
    ];
    return `${header}\n\n${lines.join('\n')}`;
  });
  return blocks.join('\n\n\n');
}

// Konsolidierte Backup-/Export-Ansicht: JSON-Backup (Sichern/Teilen/
// Zwischenablage/Import) auf einem Tab, dazu eine separate, zonen-
// filterbare Bestandsliste als reine Lesetabelle auf einem zweiten Tab.
export function BackupSheet({ open, onClose, t, dark, zones, items, stats, buildBackup, restoreBackup, previewBackup }) {
  const [tab, setTab] = useState('backup');
  const [importing, setImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [msg, setMsg] = useState('');
  const [exportMacros, setExportMacros] = useState(true);
  const [pending, setPending] = useState(null);
  const [selectedZoneIds, setSelectedZoneIds] = useState(() => zones.map((z) => z.id));
  const fileRef = useRef(null);
  const inputStyle = makeInputStyle(t);

  const flashMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

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

  const doImport = () => preview(importText);

  const backupFilename = () => `grocerytracker-backup-${new Date().toISOString().slice(0, 10)}.json`;

  // Schreibt eine echte, über jede Dateien-App auffindbare Datei in den
  // öffentlichen Downloads-Ordner – ohne Auswahldialog. @capacitor/filesystem
  // scheitert dabei auf Android 11+ (Scoped Storage blockiert den direkten
  // Datei-Zugriff auf öffentliche Verzeichnisse), daher übers eigene
  // DownloadsSaver-Plugin, das ab Android 10 die MediaStore-API nutzt.
  const doExport = async () => {
    const json = buildBackup(exportMacros);
    const filename = backupFilename();

    if (Capacitor.isNativePlatform()) {
      try {
        await DownloadsSaver.save({ filename, content: json });
        flashMsg(`✓ Gespeichert: Downloads/${filename}`);
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

  const inventoryText = useMemo(
    () => buildInventoryText(items, zones, selectedZoneIds),
    [items, zones, selectedZoneIds],
  );

  const toggleZone = (id) => {
    setSelectedZoneIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const doCopyList = async () => {
    try {
      await navigator.clipboard.writeText(inventoryText);
      flashMsg('✓ Bestandsliste in Zwischenablage kopiert.');
    } catch {
      flashMsg('Kopieren nicht möglich.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} t={t} title="Backup & Export" subtitle="Sichern, Teilen, Bestandsliste">
      <div style={{ display: 'flex', gap: 8, marginTop: 4, marginBottom: 16 }}>
        {TABS.map((tb) => (
          <button key={tb.id} type="button" onClick={() => setTab(tb.id)} style={pillStyle(tab === tb.id, t)}>
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'backup' && (
        <>
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
        </>
      )}

      {tab === 'list' && (
        <>
          <div style={{ fontSize: 11.5, color: t.textFaint, lineHeight: 1.5, marginBottom: 12 }}>
            Lesbare Tabelle für ausgewählte Lagerorte, z.B. zum Teilen per Nachricht – kein Backup zum Wiederherstellen.
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {zones.map((z) => {
              const active = selectedZoneIds.includes(z.id);
              const pal = zonePalette(z.color, dark);
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => toggleZone(z.id)}
                  aria-pressed={active}
                  style={{
                    flex: '1 0 auto', minWidth: 80,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '10px 6px', borderRadius: 12, cursor: 'pointer',
                    border: active ? `2px solid ${pal.headerBg}` : '2px solid transparent',
                    background: active ? pal.accentBg : t.cardAlt,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{z.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', color: active ? pal.accent : t.pillInactiveText }}>
                    {z.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button
              type="button"
              onClick={() => setSelectedZoneIds(zones.map((z) => z.id))}
              style={{ flex: 1, padding: '10px', borderRadius: 12, border: `1.5px solid ${t.border}`, background: 'transparent', color: t.text, fontWeight: 700, cursor: 'pointer' }}
            >
              Alle
            </button>
            <button
              type="button"
              onClick={() => setSelectedZoneIds([])}
              style={{ flex: 1, padding: '10px', borderRadius: 12, border: `1.5px solid ${t.border}`, background: 'transparent', color: t.text, fontWeight: 700, cursor: 'pointer' }}
            >
              Keine
            </button>
          </div>

          <textarea
            readOnly
            value={inventoryText || 'Keine Lagerorte ausgewählt.'}
            rows={12}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 11.5, whiteSpace: 'pre' }}
          />

          <button
            type="button"
            onClick={doCopyList}
            disabled={!inventoryText}
            style={{
              width: '100%', marginTop: 10, padding: '12px', borderRadius: 12, border: 'none',
              background: t.btnPrimary, color: t.btnPrimaryText, fontWeight: 700, fontSize: 14.5,
              cursor: inventoryText ? 'pointer' : 'default', opacity: inventoryText ? 1 : 0.5,
            }}
          >
            In Zwischenablage kopieren
          </button>
        </>
      )}

      {msg && (
        <div style={{ fontSize: 12.5, marginTop: 14, color: msg.startsWith('✓') ? t.success : t.danger, lineHeight: 1.4 }}>
          {msg}
        </div>
      )}
    </Modal>
  );
}
