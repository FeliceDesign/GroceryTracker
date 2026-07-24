import { useMemo, useRef, useState } from 'react';
import { Download, Upload, Share2, ClipboardCopy } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Modal } from '../../components/Modal.jsx';
import { Toggle } from '../../components/Toggle.jsx';
import { SettingRow } from '../../components/SettingRow.jsx';
import { Row } from '../../components/Row.jsx';
import { zonePalette } from '../../lib/colors.js';
import { makeInputStyle, pillStyle } from '../../lib/styles.js';
import { DownloadsSaver } from '../../lib/downloadsSaver.js';
import { tr } from '../../lib/i18n.js';
import { formatDateDisplay } from '../../lib/date.js';
import { hasMacros, macroSummary } from '../../lib/macros.js';

// Menschenlesbare Tabelle (Kategorie | Artikel | ggf. MHD | ggf. Makros) je
// ausgewähltem Lagerort – zum schnellen Teilen (z.B. per Nachricht), kein
// Backup zum Wiederherstellen.
function buildInventoryText(items, zones, selectedIds, lang, opts = {}) {
  const { showMhd = false, showMacros = false, getFood = null, dateFormat = 'dmy' } = opts;
  const selected = zones.filter((z) => selectedIds.includes(z.id));
  if (selected.length === 0) return '';
  const dash = '–';
  const cols = [
    { label: tr(lang, 'backup.category'), get: (i) => i.category || 'Sonstiges' },
    { label: tr(lang, 'backup.articleCol'), get: (i) => i.name },
  ];
  if (showMhd) cols.push({ label: tr(lang, 'backup.mhdCol'), get: (i) => (i.mhd ? formatDateDisplay(i.mhd, dateFormat) : dash) });
  if (showMacros) {
    cols.push({
      label: tr(lang, 'backup.macroCol'),
      get: (i) => {
        const food = getFood ? getFood(i.name) : null;
        return food && hasMacros(food) ? macroSummary(food, lang) : dash;
      },
    });
  }

  const blocks = selected.map((z) => {
    const zoneItems = items
      .filter((i) => i.zone === z.id)
      .slice()
      .sort((a, b) => (a.category || '').localeCompare(b.category || '', 'de') || a.name.localeCompare(b.name, 'de'));
    const header = `${z.emoji} ${z.label.toUpperCase()} (${z.id})`;
    if (zoneItems.length === 0) return `${header}\n\n${tr(lang, 'backup.noItemsInZone')}`;
    const widths = cols.map((c) => Math.max(c.label.length, ...zoneItems.map((i) => c.get(i).length)));
    const padRow = (vals) => vals.map((v, idx) => (idx === cols.length - 1 ? v : v.padEnd(widths[idx]))).join(' | ');
    const lines = [
      padRow(cols.map((c) => c.label)),
      widths.map((w) => '-'.repeat(w)).join('-|-'),
      ...zoneItems.map((i) => padRow(cols.map((c) => c.get(i)))),
    ];
    return `${header}\n\n${lines.join('\n')}`;
  });
  return blocks.join('\n\n\n');
}

const TABS = (lang) => [
  { id: 'backup', label: tr(lang, 'backup.tabBackup') },
  { id: 'list', label: tr(lang, 'backup.tabList') },
];

// Konsolidierte Backup-/Export-Ansicht: JSON-Backup (Sichern/Teilen/
// Zwischenablage/Import) auf einem Tab, dazu eine separate, zonen-
// filterbare Bestandsliste als reine Lesetabelle auf einem zweiten Tab.
export function BackupSheet({ open, onClose, t, dark, lang = 'de', zones, items, stats, buildBackup, restoreBackup, previewBackup, getFood, dateFormat = 'dmy' }) {
  const [tab, setTab] = useState('backup');
  const [importing, setImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [msg, setMsg] = useState('');
  const [exportMacros, setExportMacros] = useState(true);
  const [pending, setPending] = useState(null);
  const [selectedZoneIds, setSelectedZoneIds] = useState(() => zones.map((z) => z.id));
  const [showMhd, setShowMhd] = useState(false);
  const [showMacros, setShowMacros] = useState(false);
  const fileRef = useRef(null);
  const inputStyle = makeInputStyle(t);
  const tabs = TABS(lang);

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
    reader.onerror = () => { setMsg(tr(lang, 'backup.fileReadFailed')); };
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
        flashMsg(tr(lang, 'backup.savedTo', { filename }));
      } catch {
        flashMsg(tr(lang, 'backup.saveFailed'));
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
      flashMsg(tr(lang, 'backup.downloaded'));
    } catch {
      flashMsg(tr(lang, 'backup.createFailed'));
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
        await Share.share({ title: tr(lang, 'backup.shareBackup'), url: uri, dialogTitle: `${tr(lang, 'backup.shareBackup')}…` });
      } catch (e) {
        if (!e?.message?.includes('cancel')) flashMsg(tr(lang, 'backup.shareFailed'));
      }
      return;
    }

    if (navigator.share) {
      try {
        const file = new File([json], filename, { type: 'application/json' });
        await navigator.share({ files: [file], title: tr(lang, 'backup.shareBackup') });
      } catch {
        // Abgebrochen oder nicht unterstützt – keine Fehlermeldung nötig
      }
    } else {
      flashMsg(tr(lang, 'backup.shareUnavailable'));
    }
  };

  // Eigenständige Zwischenablage-Aktion, unabhängig vom Datei-Export.
  const doCopyExport = async () => {
    const json = buildBackup(exportMacros);
    try {
      await navigator.clipboard.writeText(json);
      flashMsg(tr(lang, 'backup.copiedBackup'));
    } catch {
      flashMsg(tr(lang, 'backup.copyFailed'));
    }
  };

  const inventoryText = useMemo(
    () => buildInventoryText(items, zones, selectedZoneIds, lang, { showMhd, showMacros, getFood, dateFormat }),
    [items, zones, selectedZoneIds, lang, showMhd, showMacros, getFood, dateFormat],
  );

  const toggleZone = (id) => {
    setSelectedZoneIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const doCopyList = async () => {
    try {
      await navigator.clipboard.writeText(inventoryText);
      flashMsg(tr(lang, 'backup.copiedList'));
    } catch {
      flashMsg(tr(lang, 'backup.copyFailed'));
    }
  };

  return (
    <Modal open={open} onClose={onClose} t={t} lang={lang} title={tr(lang, 'backup.title')} subtitle={tr(lang, 'backup.subtitle')}>
      <div style={{ display: 'flex', gap: 8, marginTop: 4, marginBottom: 16 }}>
        {tabs.map((tb) => (
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
              label={tr(lang, 'backup.exportMacros')}
              sub={tr(lang, 'backup.exportMacrosHint', { count: stats.foods })}
              control={<Toggle t={t} on={exportMacros} onChange={setExportMacros} />}
            />
            <Row t={t} icon={<Download size={19} />} label={tr(lang, 'backup.exportBackup')} sub={tr(lang, 'backup.exportBackupHint', { count: stats.items, macros: exportMacros ? tr(lang, 'backup.withMacros') : tr(lang, 'backup.withoutMacros') })} onClick={doExport} />
            <Row t={t} icon={<Share2 size={19} />} label={tr(lang, 'backup.shareBackup')} sub={tr(lang, 'backup.shareBackupHint')} onClick={doShareExport} />
            <Row t={t} icon={<ClipboardCopy size={19} />} label={tr(lang, 'backup.copyToClipboard')} sub={tr(lang, 'backup.copyToClipboardHint')} onClick={doCopyExport} />
            <Row t={t} icon={<Upload size={19} />} label={tr(lang, 'backup.importBackup')} sub={tr(lang, 'backup.importBackupHint')} onClick={() => { setImporting((v) => !v); setPending(null); }} />
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
                <Upload size={17} /> {tr(lang, 'backup.pickFile')}
              </button>
              <div style={{ fontSize: 11.5, color: t.textFaint, marginBottom: 10, textAlign: 'center' }}>
                {tr(lang, 'backup.orPasteJson')}
              </div>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={tr(lang, 'backup.pastePlaceholder')}
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
                {tr(lang, 'backup.checkText')}
              </button>
            </div>
          )}

          {pending && (
            <div style={{ marginTop: 12, background: t.cardAlt, borderRadius: 14, padding: 14, border: `1.5px solid ${t.dangerBorder}` }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 6 }}>{tr(lang, 'backup.confirmRestore')}</div>
              <div style={{ fontSize: 12.5, color: t.textMuted, lineHeight: 1.5 }}>
                {pending.summary.exportedAt ? tr(lang, 'backup.restoreStamp', { date: new Date(pending.summary.exportedAt).toLocaleString(lang === 'en' ? 'en-US' : 'de-DE') }) : tr(lang, 'backup.noDate')}<br />
                {tr(lang, 'backup.restoreSummary', { items: pending.summary.items, foods: pending.summary.foods, zones: pending.summary.zones, categories: pending.summary.categories }).split(/(\d+)/).map((part, i) => (
                  /^\d+$/.test(part) ? <b key={i}>{part}</b> : part
                ))}
              </div>
              <div style={{ fontSize: 12, color: t.danger, marginTop: 8, lineHeight: 1.4 }}>
                {tr(lang, 'backup.restoreWarning')}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setPending(null)}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: `1.5px solid ${t.border}`, background: 'transparent', color: t.textMuted, fontWeight: 700, cursor: 'pointer' }}
                >
                  {tr(lang, 'backup.cancel')}
                </button>
                <button
                  type="button"
                  onClick={confirmImport}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: t.danger, color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  {tr(lang, 'backup.replace')}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'list' && (
        <>
          <div style={{ fontSize: 11.5, color: t.textFaint, lineHeight: 1.5, marginBottom: 12 }}>
            {tr(lang, 'backup.listHint')}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            <SettingRow
              t={t}
              label={tr(lang, 'backup.showMhd')}
              sub={tr(lang, 'backup.showMhdHint')}
              control={<Toggle t={t} on={showMhd} onChange={setShowMhd} />}
            />
            <SettingRow
              t={t}
              label={tr(lang, 'backup.showMacros')}
              sub={tr(lang, 'backup.showMacrosHint')}
              control={<Toggle t={t} on={showMacros} onChange={setShowMacros} />}
            />
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
                    flex: '1 1 0', minWidth: 80, maxWidth: 130,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '10px 6px', borderRadius: 12, cursor: 'pointer',
                    border: active ? `2px solid ${pal.headerBg}` : '2px solid transparent',
                    background: active ? pal.accentBg : t.cardAlt,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{z.emoji}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: active ? pal.accent : t.pillInactiveText,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
                  }}>
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
              {tr(lang, 'backup.all')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedZoneIds([])}
              style={{ flex: 1, padding: '10px', borderRadius: 12, border: `1.5px solid ${t.border}`, background: 'transparent', color: t.text, fontWeight: 700, cursor: 'pointer' }}
            >
              {tr(lang, 'backup.none')}
            </button>
          </div>

          <textarea
            readOnly
            value={inventoryText || tr(lang, 'backup.noZonesSelected')}
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
            {tr(lang, 'backup.copyList')}
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
