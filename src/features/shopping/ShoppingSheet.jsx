import { useEffect, useState } from 'react';
import { Plus, Check, X, Trash2 } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { ClearableInput } from '../../components/ClearableInput.jsx';
import { FavoriteChips } from '../../components/FavoriteChips.jsx';
import { zonePalette } from '../../lib/colors.js';
import { makeInputStyle, btnCircle } from '../../lib/styles.js';
import { tr } from '../../lib/i18n.js';

// Einkaufsliste. Aufgebrauchte Artikel landen automatisch hier; abhaken legt
// sie zurück in den Bestand. Freie Einträge lassen sich manuell ergänzen.
export function ShoppingSheet({
  open, onClose, t, dark, lang = 'de', zones,
  shopping, shoppingInput, setShoppingInput, onAddManual, onCheck, onRemove, onClearAll, justChecked,
  showCount = true, favorites, onTapFavorite,
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

      {favorites && favorites.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <FavoriteChips favorites={favorites} zones={zones} dark={dark} t={t} onTap={onTapFavorite} label={tr(lang, 'shopping.favoritesLabel')} />
        </div>
      )}

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
          {shopping.map((s) => {
            const z = s.zone ? zones.find((zz) => zz.id === s.zone) : null;
            const pal = z ? zonePalette(z.color, dark) : null;
            const checked = justChecked === s.id;
            return (
              <div
                key={s.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px',
                  background: checked ? (pal ? pal.accentBg : t.cardAlt) : t.cardAlt,
                  borderRadius: 12, transition: 'background 0.2s ease',
                }}
              >
                <button
                  type="button"
                  onClick={() => onCheck(s)}
                  aria-label={tr(lang, 'shopping.checkAria', { name: s.name })}
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
                  <div style={{ fontSize: 14.5, color: t.text, fontWeight: 500 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: pal ? pal.accent : t.textFaint, fontWeight: 700, marginTop: 1 }}>
                    {z ? `${z.emoji} ${z.label}` : tr(lang, 'shopping.free')}
                  </div>
                </div>
                <button type="button" onClick={() => onRemove(s.id)} style={btnCircle('transparent', t.textFaint, 30)} aria-label={tr(lang, 'shopping.removeAria')}>
                  <X size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
