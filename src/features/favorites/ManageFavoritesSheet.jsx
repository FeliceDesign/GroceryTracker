import { Trash2 } from 'lucide-react';
import { Modal } from '../../components/Modal.jsx';
import { zonePalette } from '../../lib/colors.js';
import { btnCircle } from '../../lib/styles.js';
import { tr } from '../../lib/i18n.js';

function FavoriteRow({ fav, zone, dark, t, lang, onRemove }) {
  const pal = zonePalette(zone ? zone.color : null, dark);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: t.cardAlt, borderRadius: 12, padding: '10px 12px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: t.text, overflowWrap: 'anywhere' }}>{fav.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
          {zone && (
            <span style={{ fontSize: 11, fontWeight: 700, color: pal.accent, background: pal.accentBg, borderRadius: 999, padding: '2px 8px' }}>
              {zone.emoji} {zone.label}
            </span>
          )}
          <span style={{ fontSize: 11.5, color: t.textFaint }}>{fav.category}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(fav.id)}
        style={btnCircle('transparent', t.danger, 36)}
        aria-label={tr(lang, 'favorites.removeAria', { name: fav.name })}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

// Gemerkte Schnellzugriff-Favoriten ansehen/entfernen. Neue Favoriten
// entstehen nur über den Stern im Detail-Sheet, hier gibt's bewusst kein
// eigenes Anlegen-Formular.
export function ManageFavoritesSheet({ open, onClose, t, dark, lang = 'de', favorites, zones, onRemove }) {
  return (
    <Modal open={open} onClose={onClose} t={t} lang={lang} title={tr(lang, 'favorites.title')} subtitle={tr(lang, 'favorites.subtitle', { count: favorites.length })}>
      {favorites.length === 0 ? (
        <div style={{ textAlign: 'center', color: t.textFaint, padding: '32px 12px', fontSize: 13.5 }}>
          {tr(lang, 'favorites.none')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          {favorites.map((f) => (
            <FavoriteRow key={f.id} fav={f} zone={zones.find((z) => z.id === f.zone)} dark={dark} t={t} lang={lang} onRemove={onRemove} />
          ))}
        </div>
      )}
      <div style={{ fontSize: 11.5, color: t.textFaint, marginTop: 14, lineHeight: 1.4 }}>
        {tr(lang, 'favorites.hint')}
      </div>
    </Modal>
  );
}
