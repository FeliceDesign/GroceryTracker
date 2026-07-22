import { useState } from 'react';
import { Camera, Copy, Check } from 'lucide-react';
import {
  MACRO_FIELDS, BASIS_OPTIONS, hasMacros, mergeScanned, copyMacros, unsaturatedFat, fmtNum,
} from '../../lib/macros.js';
import { captureNutritionViaPhoto } from '../../scan/camera.js';
import { makeInputStyle } from '../../lib/styles.js';

// Bearbeitungsformular für die Nährwerte eines Lebensmittels.
// `macros` ist der Entwurf (siehe lib/macros.js), `onChange(patch)` mischt
// Änderungen ein. Scan (Nährwerttabelle fotografieren) und Kopieren sind hier
// gekapselt, damit alle Einbindungen (Bearbeiten/Anlegen/Stammdaten) gleich
// funktionieren.
export function MacroEditor({
  name, macros, onChange, t, scanSupported, accent,
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const inputStyle = makeInputStyle(t);
  const showCopy = hasMacros(macros) && (name || '').trim().length > 0;

  const setField = (key, raw) => {
    const v = raw === '' ? null : parseFloat(String(raw).replace(',', '.'));
    onChange({ [key]: raw === '' ? null : (Number.isFinite(v) ? v : null) });
  };

  const scan = async () => {
    setMsg('');
    setBusy(true);
    try {
      const { facts, text } = await captureNutritionViaPhoto();
      if (hasMacros(facts)) {
        const merged = mergeScanned(macros, facts);
        onChange(merged);
        setMsg('✓ Nährwerte erkannt – bitte kurz prüfen.');
      } else if (text && text.trim()) {
        const snippet = text.trim().replace(/\s+/g, ' ').slice(0, 45);
        setMsg(`Keine Nährwerte erkannt (gelesen: „${snippet}…"). Tabelle formatfüllend und scharf fotografieren.`);
      } else {
        setMsg('Kein Text erkannt – näher ran und scharf stellen.');
      }
    } catch (e) {
      setMsg(e?.message || 'Erkennung fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  };

  const doCopy = async () => {
    const ok = await copyMacros({ name, ...macros });
    setCopied(ok);
    setMsg(ok ? '' : 'Kopieren nicht möglich.');
    if (ok) setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, background: t.cardAlt, borderRadius: 12, padding: 4 }}>
        {BASIS_OPTIONS.map((o) => {
          const active = (macros.basis || '100g') === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange({ basis: o.value })}
              style={{
                flex: 1, padding: '9px 6px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700,
                background: active ? t.card : 'transparent',
                color: active ? t.text : t.textMuted,
                boxShadow: active ? t.shadow : 'none',
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {macros.basis === 'portion' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <span style={{ fontSize: 13, color: t.textMuted, flex: 1 }}>Portionsgröße</span>
          <input
            type="number"
            inputMode="decimal"
            value={macros.portionSize ?? ''}
            onChange={(e) => onChange({ portionSize: e.target.value === '' ? null : Math.max(0, parseFloat(e.target.value.replace(',', '.')) || 0) })}
            placeholder="z.B. 30"
            style={{ ...inputStyle, marginTop: 0, width: 100, textAlign: 'right' }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: t.textMuted, width: 18 }}>g</span>
        </div>
      )}

      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {MACRO_FIELDS.map((f) => {
          const row = (
            <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                flex: 1, fontSize: 13.5, color: f.indent ? t.textFaint : t.text,
                fontWeight: f.indent ? 500 : 600, paddingLeft: f.indent ? 12 : 0,
                fontStyle: f.indent ? 'italic' : 'normal',
              }}>
                {f.indent ? '– ' : ''}{f.label}
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={macros[f.key] ?? ''}
                onChange={(e) => setField(f.key, e.target.value)}
                placeholder="—"
                style={{ ...inputStyle, marginTop: 0, width: 96, textAlign: 'right', padding: '9px 10px' }}
              />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: t.textMuted, width: 30 }}>{f.unit}</span>
            </div>
          );
          // Direkt hinter „davon gesättigte" die berechnete, schreibgeschützte
          // Zeile „davon ungesättigt" (Fett − gesättigt) anzeigen.
          if (f.key === 'satFat') {
            const u = unsaturatedFat(macros);
            if (u != null) {
              return [row, (
                <div key="unsat" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flex: 1, fontSize: 13.5, color: t.textFaint, fontWeight: 500, paddingLeft: 12, fontStyle: 'italic' }}>
                    – davon ungesättigt
                  </span>
                  <span style={{ width: 96, textAlign: 'right', padding: '9px 10px', fontSize: 14.5, color: t.textFaint, fontVariantNumeric: 'tabular-nums' }}>
                    {fmtNum(u)}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: t.textMuted, width: 30 }}>g</span>
                </div>
              )];
            }
          }
          return row;
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        {scanSupported && (
          <button
            type="button"
            onClick={scan}
            disabled={busy}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '12px', borderRadius: 12, border: `1.5px solid ${t.border}`,
              background: 'transparent', color: accent || t.textMuted, fontWeight: 700, fontSize: 13.5,
              cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
            }}
          >
            <Camera size={16} /> {busy ? 'Lese…' : 'Tabelle scannen'}
          </button>
        )}
        {showCopy && (
          <button
            type="button"
            onClick={doCopy}
            style={{
              flex: scanSupported ? 0 : 1, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '12px 16px', borderRadius: 12, border: `1.5px solid ${t.border}`,
              background: 'transparent', color: copied ? t.success : t.textMuted, fontWeight: 700, fontSize: 13.5,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={15} />} {copied ? 'Kopiert' : 'Kopieren'}
          </button>
        )}
      </div>

      {msg && (
        <div style={{ fontSize: 12, marginTop: 10, lineHeight: 1.4, color: msg.startsWith('✓') ? t.success : t.textMuted }}>
          {msg}
        </div>
      )}
    </div>
  );
}
