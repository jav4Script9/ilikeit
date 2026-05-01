import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const RATING_COLORS = { love: '#1DB954', ok: '#FFB347', bad: '#e05555', maybe: '#FFB347' }
const RATING_EMOJI = { love: '😍', ok: '😐', bad: '😞', maybe: '😐' }
const VOTE_OPTIONS = [
  { type: 'love', label: 'Нравится' },
  { type: 'ok', label: 'Не определился' },
  { type: 'bad', label: 'Не нравится' },
]

const pluralize = (n, [one, few, many]) => {
  const m100 = Math.abs(n) % 100
  const m10 = Math.abs(n) % 10
  if (m100 >= 11 && m100 <= 14) return many
  if (m10 === 1) return one
  if (m10 >= 2 && m10 <= 4) return few
  return many
}

export default function ItemCard({ item }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const photos = item.photos?.length > 0 ? item.photos : item.photo_url ? [item.photo_url] : []
  const ratingColor = RATING_COLORS[item.rating] || 'var(--border)'

  const [ratings, setRatings] = useState(item.ratings || [])
  const [voting, setVoting] = useState(false)
  const [showVote, setShowVote] = useState(false)

  const counts = {
    love: ratings.filter(r => r.type === 'love').length,
    ok: ratings.filter(r => r.type === 'ok').length,
    bad: ratings.filter(r => r.type === 'bad').length,
  }
  const total = counts.love + counts.ok + counts.bad
  const myVote = user ? ratings.find(r => r.user_id === user.id)?.type || null : null
  const isAuthor = user && item.user_id === user.id
  const canVote = !isAuthor

  const dominant = counts.love >= counts.ok && counts.love >= counts.bad ? 'love'
    : counts.bad > counts.ok ? 'bad' : 'ok'
  const badgeColor = total > 0 ? RATING_COLORS[dominant] : ratingColor

  const openVote = (e) => {
    e.stopPropagation()
    if (!user) { navigate('/auth'); return }
    if (!canVote) return
    setShowVote(true)
  }

  const closeVote = (e) => {
    e?.stopPropagation()
    setShowVote(false)
  }

  const cast = async (type, e) => {
    e.stopPropagation()
    if (voting || !user) return
    setVoting(true)
    if (myVote === type) {
      await supabase.from('ratings').delete().eq('item_id', item.id).eq('user_id', user.id)
      setRatings(prev => prev.filter(r => r.user_id !== user.id))
    } else {
      const { data } = await supabase.from('ratings').upsert({ item_id: item.id, user_id: user.id, type }, { onConflict: 'user_id,item_id' }).select().single()
      setRatings(prev => {
        const without = prev.filter(r => r.user_id !== user.id)
        return data ? [...without, data] : [...without, { user_id: user.id, type, item_id: item.id }]
      })
    }
    setVoting(false)
    setShowVote(false)
  }

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
          <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', borderRadius: 8, padding: '3px 9px', fontSize: 11, color: '#fff', fontWeight: 700 }}>
            {item.category === 'restaurant' ? '🍽️ Ресторан' : '🛒 Магазин'}
          </div>
        </div>
      )}

      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{item.name}</div>

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

        {item.description && (
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.description}
          </div>
        )}

        {item.comment && (
          <div style={{ fontSize: 13, color: 'var(--text2)', fontStyle: 'italic', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', padding: '8px 10px', background: 'var(--bg3)', borderRadius: 8, borderLeft: '3px solid var(--accent)' }}>
            "{item.comment}"
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          {total > 0 && (
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700 }}>
              {total} {pluralize(total, ['оценка', 'оценки', 'оценок'])}
            </span>
          )}
          {(() => {
            const display = total > 0 ? (
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
            ) : null
            if (!display) return null
            return canVote ? (
              <button onClick={openVote} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                {display}
              </button>
            ) : display
          })()}
        </div>
      </div>

      {showVote && (
        <div onClick={closeVote} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2)', borderRadius: 18, padding: '20px 18px', width: '100%', maxWidth: 320, border: '1px solid var(--border)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14, textAlign: 'center' }}>
              Твоя оценка
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {VOTE_OPTIONS.map(opt => {
                const active = myVote === opt.type
                return (
                  <button key={opt.type} onClick={e => cast(opt.type, e)} disabled={voting}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      padding: '14px 6px', borderRadius: 12,
                      background: active ? RATING_COLORS[opt.type] + '33' : 'var(--bg3)',
                      border: active ? `2px solid ${RATING_COLORS[opt.type]}` : '2px solid transparent',
                      cursor: voting ? 'wait' : 'pointer', opacity: voting ? 0.6 : 1, transition: 'all .15s',
                      fontFamily: 'Nunito, sans-serif',
                    }}>
                    <span style={{ fontSize: 26 }}>{RATING_EMOJI[opt.type]}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: active ? RATING_COLORS[opt.type] : 'var(--text3)' }}>{opt.label}</span>
                  </button>
                )
              })}
            </div>
            {myVote && (
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button onClick={e => cast(myVote, e)} disabled={voting}
                  style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '6px 10px' }}>
                  Убрать оценку
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
