import { useEffect, useState } from 'react';
import { Plus, Minus, Check, X, Trash2, Pencil } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { ClearableInput } from '../../components/ClearableInput.jsx';
import { FavoriteChips } from '../../components/FavoriteChips.jsx';
import { zonePalette } from '../../lib/colors.js';
import { makeInputStyle, btnCircle, pillStyle } from '../../lib/styles.js';
import { tr } from '../../lib/i18n.js';

const UNITS = ['stk', 'g', 'ml'];

// Eine Einkaufslisten-Zeile mit aufklappbarem Editor (Name/Menge/Einheit/
// Lagerort) - gleiches Stift-Muster wie in der Favoriten-Verwaltung, damit
// sich Einträge korrigieren lassen statt löschen+neu-eintippen zu müssen.
function ShoppingRow({ entry, zone, zones, dark, t, lang, checked, onCheck, onRemove, onUpdate }) {
  const pal = zone ? zonePalette(zone.color, dark) : null;
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(entry.name);
  const inputStyle = makeInputStyle(t);

  const unit = entry.unit || 'stk';
  const qty = entry.qty ?? 1;
  // Eigener Text-Puffer fürs Mengenfeld (g/ml), analog zur Favoriten-Verwaltung -
  // verhindert eine führende "0" beim Weitertippen nach dem Leeren des Felds.
  const [qtyText, setQtyText] = useState(String(qty));
  useEffect(() => { setQtyText(String(qty)); }, [unit]); // eslint-disable-line react-hooks/exhaustive-deps

  const openEditor = () => {
    setDraftName(entry.name);
    setEditing((v) => !v);
  };
  const saveName = () => {
    const v = draftName.trim();
    if (v && v !== entry.name) onUpdate(entry.id, { name: v });
    else setDraftName(entry.name);
  };

  return (
    <div style={{ background: t.cardAlt, borderRadius: 12, padding: '11px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={() => onCheck(entry)}
          aria-label={tr(lang, 'shopping.checkAria', { name: entry.name })}
          style={{
            flexShrink: 0, width: 30, height: 30, borderRadius: '50%', cursor: 'pointer',
            border: `2px solid ${checked ? t.success : t.border}`,
            background: checked ? t.success : 'transparent',
            color: checked ? '#fff' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Check size={16} strokeWidth={3} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, color: t.text, fontWeight: 500, overflowWrap: 'anywhere' }}>{entry.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: pal ? pal.accent : t.textFaint, fontWeight: 700 }}>
              {zone ? `${zone.emoji} ${zone.label}` : tr(lang, 'shopping.free')}
            </span>
            <span style={{ fontSize: 11, color: t.textFaint }}>· {unit === 'stk' ? `${qty}x` : `${qty}${unit}`}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={openEditor}
          style={btnCircle('transparent', editing ? t.text : t.textMuted, 30)}
          aria-label={tr(lang, 'shopping.editAria', { name: entry.name })}
        >
          <Pencil size={14} />
        </button>
        <button type="button" onClick={() => onRemove(entry.id)} style={btnCircle('transparent', t.textFaint, 30)} aria-label={tr(lang, 'shopping.removeAria')}>
          <X size={15} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateRows: editing ? '1fr' : '0fr', transition: 'grid-template-rows 0.2s ease' }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ClearableInput
              t={t}
              lang={lang}
              value={draftName}
              onChange={setDraftName}
              onBlur={saveName}
              onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
              aria-label={tr(lang, 'shopping.nameAria', { name: entry.name })}
              style={{ ...inputStyle, marginTop: 0 }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {UNITS.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => onUpdate(entry.id, { unit: u, qty: u === 'stk' ? 1 : 500 })}
                    style={pillStyle(unit === u, t)}
                  >
                    {u === 'stk' ? tr(lang, 'add.piece') : u}
                  </button>
                ))}
              </div>
              {unit === 'stk' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button type="button" onClick={() => onUpdate(entry.id, { qty: Math.max(1, qty - 1) })} style={btnCircle(t.card, t.pillInactiveText, 30)}>
                    <Minus size={14} strokeWidth={2.5} />
                  </button>
                  <span style={{ fontSize: 15, fontWeight: 800, minWidth: 22, textAlign: 'center', color: t.text }}>{qty}x</span>
                  <button type="button" onClick={() => onUpdate(entry.id, { qty: qty + 1 })} style={btnCircle(pal ? pal.accentBg : t.cardAlt, pal ? pal.accent : t.text, 30)}>
                    <Plus size={14} strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 120 }}>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={qtyText}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setQtyText(raw);
                      const parsed = parseInt(raw, 10);
                      onUpdate(entry.id, { qty: Number.isNaN(parsed) ? 0 : Math.max(0, parsed) });
                    }}
                    style={{ ...inputStyle, marginTop: 0, padding: '8px 10px' }}
                  />
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: t.textMuted }}>{unit}</span>
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                {tr(lang, 'shopping.zoneLabel')}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {zones.map((z) => {
                  const active = entry.zone === z.id;
                  const zpal = zonePalette(z.color, dark);
                  return (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => onUpdate(entry.id, { zone: z.id })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 999, cursor: 'pointer',
                        border: active ? `1.5px solid ${zpal.headerBg}` : `1.5px solid ${t.border}`,
                        background: active ? zpal.accentBg : 'transparent',
                        color: active ? zpal.accent : t.textMuted, fontSize: 12, fontWeight: 700,
                      }}
                    >
                      <span>{z.emoji}</span>{z.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Einkaufsliste. Aufgebrauchte Artikel landen automatisch hier; abhaken legt
// sie zurück in den Bestand. Freie Einträge lassen sich manuell ergänzen.
export function ShoppingSheet({
  open, onClose, t, dark, lang = 'de', zones,
  shopping, shoppingInput, setShoppingInput, onAddManual, onCheck, onRemove, onUpdate, onClearAll, justChecked,
  showCount = true, favorites, onTapFavorite, favoritesCollapsed, onToggleFavoritesCollapsed, showFavoriteChips = true,
}) {
  const inputStyle = makeInputStyle(t);
  const [confirmClear, setConfirmClear] = useState(false);
  const subtitle = shopping.length === 0
    ? tr(lang, 'shopping.allDone')
    : (showCount ? `${shopping.length} ${tr(lang, 'shopping.open')}` : tr(lang, 'shopping.open'));

  // Bestätigung zurücksetzen, sobald das Sheet auf-/zugeht oder die Liste leer wird
  useEffect(() => {
    if (!open || shopping.length === 0) setConfirmClear(false);
  }, [open, shopping.length]);

  return (
    <Modal open={open} onClose={onClose} t={t} lang={lang} title={tr(lang, 'shopping.title')} subtitle={subtitle}>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <ClearableInput
          t={t}
          lang={lang}
          value={shoppingInput}
          onChange={setShoppingInput}
          onKeyDown={(e) => e.key === 'Enter' && onAddManual()}
          placeholder={tr(lang, 'shopping.placeholder')}
          style={{ ...inputStyle, marginTop: 0 }}
          wrapperStyle={{ flex: 1, minWidth: 0 }}
        />
        <button
          type="button"
          onClick={onAddManual}
          aria-label={tr(lang, 'shopping.addAria')}
          style={{ flexShrink: 0, border: 'none', borderRadius: 12, padding: '0 16px', background: t.btnPrimary, color: t.btnPrimaryText, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <Plus size={18} strokeWidth={2.6} />
        </button>
      </div>

      {shopping.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button
            type="button"
            onClick={() => {
              if (confirmClear) { onClearAll(); setConfirmClear(false); }
              else setConfirmClear(true);
            }}
            onBlur={() => setConfirmClear(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent',
              color: t.danger, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', padding: '4px 2px',
            }}
          >
            <Trash2 size={14} /> {confirmClear ? tr(lang, 'shopping.confirmClearAll', { count: shopping.length }) : tr(lang, 'shopping.clearAll')}
          </button>
        </div>
      )}

      {shopping.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: t.textFaint, fontSize: 14 }}>
          {tr(lang, 'shopping.empty')}
        </div>
      ) : (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shopping.map((s) => (
            <ShoppingRow
              key={s.id}
              entry={s}
              zone={s.zone ? zones.find((zz) => zz.id === s.zone) : null}
              zones={zones}
              dark={dark}
              t={t}
              lang={lang}
              checked={justChecked === s.id}
              onCheck={onCheck}
              onRemove={onRemove}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}

      {showFavoriteChips && favorites && favorites.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <FavoriteChips
            favorites={favorites} zones={zones} dark={dark} t={t} lang={lang} onTap={onTapFavorite}
            label={tr(lang, 'shopping.favoritesLabel')} collapsed={favoritesCollapsed} onToggleCollapse={onToggleFavoritesCollapsed}
          />
        </div>
      )}
    </Modal>
  );
}
