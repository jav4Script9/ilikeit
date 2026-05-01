import { useNavigate } from 'react-router-dom'

const RATING_COLORS = { love: '#1DB954', ok: '#FFB347', bad: '#e05555', maybe: '#FFB347' }
const RATING_EMOJI = { love: '😍', ok: '😐', bad: '😞', maybe: '😐' }

export default function ItemCard({ item }) {
  const navigate = useNavigate()
  const photos = item.photos?.length > 0 ? item.photos : item.photo_url ? [item.photo_url] : []
  const ratingColor = RATING_COLORS[item.rating] || 'var(--border)'

  // Считаем оценки если есть
  const ratings = item.ratings || []
  const counts = {
    love: ratings.filter(r => r.type === 'love').length,
    ok: ratings.filter(r => r.type === 'ok').length,
    bad: ratings.filter(r => r.type === 'bad').length,
  }
  const total = counts.love + counts.ok + counts.bad

  // Определяем доминирующий рейтинг для цвета бейджа
  const dominant = counts.love >= counts.ok && counts.love >= counts.bad ? 'love'
    : counts.bad > counts.ok ? 'bad' : 'ok'
  const badgeColor = total > 0 ? RATING_COLORS[dominant] : ratingColor

  return (
    <div
      onClick={() => navigate(`/item/${item.id}`)}
      style={{ background: 'var(--bg2)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', cursor: 'pointer' }}
    >
      {/* Фото */}
      {photos.length > 0 && (
        <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', position: 'relative' }}>
          <img src={photos[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {photos.length > 1 && (
            <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', borderRadius: 8, padding: '2px 8px', fontSize: 11, color: '#fff', fontWeight: 700 }}>
              +{photos.length - 1}
            </div>
          )}
          {/* Бейдж категории — поверх фото */}
          <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', borderRadius: 8, padding: '3px 9px', fontSize: 11, color: '#fff', fontWeight: 700 }}>
            {item.category === 'restaurant' ? '🍽️ Ресторан' : '🛒 Магазин'}
          </div>
          {/* Оценка поверх фото */}
          {item.rating && (
            <div style={{ position: 'absolute', top: 8, right: 8, background: badgeColor, borderRadius: 20, padding: '4px 10px', fontSize: 14 }}>
              {RATING_EMOJI[item.rating]}
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '12px 14px' }}>
        {/* Название */}
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{item.name}</div>

        {/* Подкатегория */}
        {item.subcategory && (
          <div style={{ display: 'inline-block', background: 'var(--bg3)', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>
            {item.subcategory}
          </div>
        )}

        {item.place && (
          <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {item.place}
          </div>
        )}

        {/* Описание */}
        {item.description && (
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.description}
          </div>
        )}

        {/* Комментарий/отзыв */}
        {item.comment && (
          <div style={{ fontSize: 13, color: 'var(--text2)', fontStyle: 'italic', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', padding: '8px 10px', background: 'var(--bg3)', borderRadius: 8, borderLeft: '3px solid var(--accent)' }}>
            "{item.comment}"
          </div>
        )}

        {/* Нижняя строка — оценки справа налево: N оценок → смайлы */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          {total > 0 && (
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700 }}>{total} оценок</span>
          )}
          {total > 0 ? (
            <div style={{ display: 'flex', gap: 4 }}>
              {['love', 'ok', 'bad'].filter(t => counts[t] > 0).map(t => (
                <span key={t} style={{ fontSize: 16, background: RATING_COLORS[t] + '33', borderRadius: 8, padding: '2px 6px' }}>
                  {RATING_EMOJI[t]}
                </span>
              ))}
            </div>
          ) : item.rating ? (
            <span style={{ fontSize: 18, background: badgeColor + '33', borderRadius: 8, padding: '2px 8px' }}>
              {RATING_EMOJI[item.rating]}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
