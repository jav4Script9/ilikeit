import { Link } from 'react-router-dom'

const EMOJI_MAP = { love: '😍', ok: '😐', bad: '😞' }
const LABEL_MAP = { love: 'Нравится', ok: 'Норм', bad: 'Не то' }

export default function ItemCard({ item }) {
  const rating = item.ratings_summary || { love: 0, ok: 0, bad: 0, total: 0 }
  const topEmoji = rating.total > 0
    ? Object.entries({ love: rating.love, ok: rating.ok, bad: rating.bad })
        .sort((a, b) => b[1] - a[1])[0][0]
    : null

  return (
    <Link to={`/item/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        background: 'var(--bg2)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        transition: 'transform 0.15s, border-color 0.15s',
        active: { transform: 'scale(0.98)' }
      }}>
        {/* Фото */}
        <div style={{
          width: '100%',
          aspectRatio: '4/3',
          background: 'var(--bg3)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {item.photo_url ? (
            <img
              src={item.photo_url}
              alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 48
            }}>
              {item.category === 'restaurant' ? '🍽️' : '🛒'}
            </div>
          )}

          {/* Бейдж категории */}
          <span style={{
            position: 'absolute', top: 10, left: 10,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            borderRadius: 8,
            padding: '3px 8px',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text2)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {item.category === 'restaurant' ? 'Ресторан' : 'Магазин'}
          </span>

          {/* Топ эмодзи */}
          {topEmoji && (
            <span style={{
              position: 'absolute', top: 10, right: 10,
              fontSize: 24,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
            }}>
              {EMOJI_MAP[topEmoji]}
            </span>
          )}
        </div>

        {/* Инфо */}
        <div style={{ padding: '12px 14px 14px' }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4, lineHeight: 1.3 }}>
            {item.name}
          </div>
          {item.place && (
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>
              📍 {item.place}
            </div>
          )}

          {/* Счётчики оценок */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['love', 'ok', 'bad'].map(key => (
              <div key={key} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'var(--bg3)',
                borderRadius: 8,
                padding: '4px 8px',
                fontSize: 12,
                fontWeight: 700,
                color: rating[key] > 0 ? 'var(--text)' : 'var(--text3)',
              }}>
                <span style={{ fontSize: 14 }}>{EMOJI_MAP[key]}</span>
                <span>{rating[key] || 0}</span>
              </div>
            ))}
            {rating.total > 0 && (
              <div style={{
                marginLeft: 'auto',
                fontSize: 11,
                color: 'var(--text3)',
                display: 'flex',
                alignItems: 'center',
              }}>
                {rating.total} оценок
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
