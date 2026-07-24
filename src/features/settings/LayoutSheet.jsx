import { Modal } from '../../components/Modal.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { makeInputStyle } from '../../lib/styles.js';

// Kopfzeile (Titel/Ausrichtung) + Button-Positionen – vorher Teil der
// Haupt-Einstellungen ("Darstellung"), jetzt eigenes Untermenü. Einmal
// eingerichtet, selten wieder angefasst.
export function LayoutSheet({
  open, onClose, t, headerAlign, onSetHeaderAlign, appTitle, onSetAppTitle,
  shoppingPos, onSetShoppingPos, settingsPos, onSetSettingsPos, addPos, onSetAddPos,
}) {
  const inputStyle = makeInputStyle(t);

  return (
    <Modal open={open} onClose={onClose} t={t} title="Layout" subtitle="Kopfzeile, Titel, Button-Positionen">
      <div style={{ background: t.cardAlt, borderRadius: 14, padding: '12px 14px' }}>
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
    </Modal>
  );
}
