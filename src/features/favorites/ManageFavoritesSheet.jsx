import { useEffect, useState } from 'react';
import { Trash2, ListPlus, PackagePlus, ShoppingCart, Check, Pencil, Minus, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { Segmented } from '../../components/Segmented.jsx';
import { Toggle } from '../../components/Toggle.jsx';
import { zonePalette } from '../../lib/colors.js';
import { btnCircle, pillStyle, makeInputStyle } from '../../lib/styles.js';
import { tr } from '../../lib/i18n.js';

const UNITS = ['stk', 'g', 'ml'];

function FavoriteRow({
  fav, zone, dark, t, lang, onRemove, onUpdate, onAddToInventory, onAddToShopping, onEditFood,
  showMove = false, canMoveUp = false, canMoveDown = false, onMove,
}) {
  const pal = zonePalette(zone ? zone.color : null, dark);
  // Kurzes Häkchen-Feedback nach dem Antippen, analog zum Kopieren-Feedback
  // in der Stammdaten-Verwaltung.
  const [feedback, setFeedback] = useState(null); // 'inventory' | 'shopping' | null
  const [editingQty, setEditingQty] = useState(false);
  useEffect(() => {
    if (!feedback) return undefined;
    const id = setTimeout(() => setFeedback(null), 1400);
    return () => clearTimeout(id);
  }, [feedback]);

  const unit = fav.unit || 'stk';
  // Nullish statt truthy-Fallback - 0 ist beim Tippen ein gültiger
  // Zwischenzustand und darf nicht auf 1 zurückspringen.
  const qty = fav.qty ?? 1;
  const inputStyle = makeInputStyle(t);

  // Eigener Text-Puffer fürs Mengenfeld (g/ml): zeigt exakt, was getippt
  // wird (auch "0" oder leer), statt bei jedem Tastendruck vom
  // kontrollierten qty-Wert überschrieben zu werden - sonst hängt sich neu
  // Getipptes hinter eine führende "0". Wird nur beim Einheitenwechsel
  // (neuer Startwert) neu synchronisiert.
  const [qtyText, setQtyText] = useState(String(qty));
  useEffect(() => { setQtyText(String(qty)); }, [unit]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ background: t.cardAlt, borderRadius: 12, padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {showMove && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => onMove(fav.id, 'up')}
              disabled={!canMoveUp}
              style={{
                width: 24, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', borderRadius: 6, background: 'transparent', cursor: canMoveUp ? 'pointer' : 'default',
                color: canMoveUp ? t.textMuted : t.border,
              }}
              aria-label={tr(lang, 'favorites.moveUpAria', { name: fav.name })}
            >
              <ChevronUp size={15} />
            </button>
            <button
              type="button"
              onClick={() => onMove(fav.id, 'down')}
              disabled={!canMoveDown}
              style={{
                width: 24, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', borderRadius: 6, background: 'transparent', cursor: canMoveDown ? 'pointer' : 'default',
                color: canMoveDown ? t.textMuted : t.border,
              }}
              aria-label={tr(lang, 'favorites.moveDownAria', { name: fav.name })}
            >
              <ChevronDown size={15} />
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => onEditFood(fav.name)}
          style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', padding: 0 }}
          aria-label={tr(lang, 'favorites.editFoodAria', { name: fav.name })}
        >
          <div style={{ fontSize: 14.5, fontWeight: 700, color: t.text, overflowWrap: 'anywhere' }}>{fav.name}</div>
          {zone && (
            <div style={{ marginTop: 3 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: pal.accent, background: pal.accentBg, borderRadius: 999, padding: '2px 8px' }}>
                {zone.emoji} {zone.label}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, color: t.textFaint }}>{fav.category}</span>
            <span style={{ fontSize: 11.5, color: t.textFaint }}>· {unit === 'stk' ? `${qty}x` : `${qty} ${unit}`}</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setEditingQty((v) => !v)}
          style={btnCircle('transparent', editingQty ? t.text : t.textMuted, 36)}
          aria-label={tr(lang, 'favorites.editAria', { name: fav.name })}
        >
          <Pencil size={15} />
        </button>
        <button
          type="button"
          onClick={() => { onAddToInventory(fav); setFeedback('inventory'); }}
          style={btnCircle('transparent', t.success, 36)}
          aria-label={tr(lang, 'favorites.addToInventoryAria', { name: fav.name })}
        >
          {feedback === 'inventory' ? <Check size={16} /> : <PackagePlus size={16} />}
        </button>
        <button
          type="button"
          onClick={() => { onAddToShopping(fav); setFeedback('shopping'); }}
          style={btnCircle('transparent', feedback === 'shopping' ? t.success : t.textMuted, 36)}
          aria-label={tr(lang, 'favorites.addToShoppingAria', { name: fav.name })}
        >
          {feedback === 'shopping' ? <Check size={16} /> : <ShoppingCart size={16} />}
        </button>
        <button
          type="button"
          onClick={() => onRemove(fav.id)}
          style={btnCircle('transparent', t.danger, 36)}
          aria-label={tr(lang, 'favorites.removeAria', { name: fav.name })}
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateRows: editingQty ? '1fr' : '0fr', transition: 'grid-template-rows 0.2s ease' }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${t.border}`, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {UNITS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => onUpdate(fav.id, { unit: u, qty: u === 'stk' ? 1 : 500 })}
                  style={pillStyle(unit === u, t)}
                >
                  {u === 'stk' ? tr(lang, 'add.piece') : u}
                </button>
              ))}
            </div>
            {unit === 'stk' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button type="button" onClick={() => onUpdate(fav.id, { qty: Math.max(1, qty - 1) })} style={btnCircle(t.card, t.pillInactiveText, 30)}>
                  <Minus size={14} strokeWidth={2.5} />
                </button>
                <span style={{ fontSize: 15, fontWeight: 800, minWidth: 22, textAlign: 'center', color: t.text }}>{qty}x</span>
                <button type="button" onClick={() => onUpdate(fav.id, { qty: qty + 1 })} style={btnCircle(pal.accentBg, pal.accent, 30)}>
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
                    onUpdate(fav.id, { qty: Number.isNaN(parsed) ? 0 : Math.max(0, parsed) });
                  }}
                  style={{ ...inputStyle, marginTop: 0, padding: '8px 10px' }}
                />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: t.textMuted }}>{unit}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Gemerkte Schnellzugriff-Favoriten ansehen/entfernen. Neue Favoriten
// entstehen nur über den Stern im Detail-Sheet oder gesammelt über den
// "Bestand übernehmen"-Button hier, kein eigenes Anlegen-Formular.
export function ManageFavoritesSheet({
  open, onClose, t, dark, lang = 'de', favorites, zones, onRemove, onUpdate, onMove, onAddToInventory, onAddToShopping,
  hasInventoryItems = false, onAddAllFromInventory, onClearAll, onEditFood,
  sortMode = 'manual', onSetSortMode,
}) {
  const [confirmAddAll, setConfirmAddAll] = useState(false);
  const [addAllMsg, setAddAllMsg] = useState('');
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [onlyWithMacros, setOnlyWithMacros] = useState(false);

  // Zustand zurücksetzen, sobald das Sheet zugeht.
  useEffect(() => {
    if (!open) { setConfirmAddAll(false); setAddAllMsg(''); setConfirmClearAll(false); setOnlyWithMacros(false); }
  }, [open]);

  useEffect(() => {
    if (!addAllMsg) return undefined;
    const id = setTimeout(() => setAddAllMsg(''), 3000);
    return () => clearTimeout(id);
  }, [addAllMsg]);

  const handleAddAll = () => {
    if (!confirmAddAll) { setConfirmAddAll(true); return; }
    setConfirmAddAll(false);
    const added = onAddAllFromInventory(onlyWithMacros);
    setAddAllMsg(added > 0
      ? tr(lang, 'favorites.addAllDone', { count: added })
      : tr(lang, onlyWithMacros ? 'favorites.addAllNoneMacros' : 'favorites.addAllNone'));
  };

  const handleClearAll = () => {
    if (!confirmClearAll) { setConfirmClearAll(true); return; }
    setConfirmClearAll(false);
    onClearAll();
  };

  return (
    <Modal open={open} onClose={onClose} t={t} lang={lang} title={tr(lang, 'favorites.title')} subtitle={tr(lang, 'favorites.subtitle', { count: favorites.length })}>
      {hasInventoryItems && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 2px' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: t.textMuted }}>{tr(lang, 'favorites.onlyWithMacros')}</span>
            <Toggle t={t} on={onlyWithMacros} onChange={setOnlyWithMacros} />
          </div>
          <button
            type="button"
            onClick={handleAddAll}
            onBlur={() => setConfirmAddAll(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center',
              border: 'none', borderRadius: 12, padding: '10px 14px', cursor: 'pointer',
              background: t.cardAlt, color: confirmAddAll ? t.danger : t.text, fontSize: 13, fontWeight: 700,
            }}
          >
            <ListPlus size={16} />
            {confirmAddAll ? tr(lang, 'favorites.confirmAddAllFromInventory') : tr(lang, 'favorites.addAllFromInventory')}
          </button>
          {addAllMsg && (
            <div style={{ fontSize: 12, color: t.textFaint, textAlign: 'center', marginTop: 6 }}>{addAllMsg}</div>
          )}
        </div>
      )}

      {favorites.length === 0 ? (
        <div style={{ textAlign: 'center', color: t.textFaint, padding: '32px 12px', fontSize: 13.5 }}>
          {tr(lang, 'favorites.none')}
        </div>
      ) : (
        <>
          {favorites.length > 1 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                {tr(lang, 'favorites.sortLabel')}
              </div>
              <Segmented
                t={t}
                value={sortMode}
                onChange={onSetSortMode}
                options={[
                  { value: 'manual', label: tr(lang, 'favorites.sortManual') },
                  { value: 'alpha', label: tr(lang, 'favorites.sortAlpha') },
                  { value: 'zone', label: tr(lang, 'favorites.sortZone') },
                  { value: 'category', label: tr(lang, 'favorites.sortCategory') },
                ]}
              />
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button
              type="button"
              onClick={handleClearAll}
              onBlur={() => setConfirmClearAll(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent',
                color: t.danger, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', padding: '4px 2px',
              }}
            >
              <Trash2 size={14} />
              {confirmClearAll ? tr(lang, 'favorites.confirmClearAll', { count: favorites.length }) : tr(lang, 'favorites.clearAll')}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {favorites.map((f, idx) => (
              <FavoriteRow
                key={f.id} fav={f} zone={zones.find((z) => z.id === f.zone)} dark={dark} t={t} lang={lang}
                onRemove={onRemove} onUpdate={onUpdate} onAddToInventory={onAddToInventory} onAddToShopping={onAddToShopping}
                onEditFood={onEditFood}
                showMove={sortMode === 'manual'} canMoveUp={idx > 0} canMoveDown={idx < favorites.length - 1} onMove={onMove}
              />
            ))}
          </div>
        </>
      )}
      <div style={{ fontSize: 11.5, color: t.textFaint, marginTop: 14, lineHeight: 1.4 }}>
        {tr(lang, 'favorites.hint')}
      </div>
    </Modal>
  );
}
