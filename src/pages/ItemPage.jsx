import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const EMOJI_MAP = { love: '😍', ok: '😐', bad: '😞' }
const LABEL_MAP = { love: 'Нравится!', ok: 'Норм', bad: 'Не то' }
const COLORS = { love: '#1DB954', ok: '#FFB347', bad: '#7B8FA1' }

export default function ItemPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [item, setItem] = useState(null)
  const [ratings, setRatings] = useState({ love: 0, ok: 0, bad: 0 })
  const [myRating, setMyRating] = useState(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)

  useEffect(() => {
    fetchItem()
  }, [id])

  async function fetchItem() {
    const { data: itemData } = await supabase
      .from('items').select('*').eq('id', id).single()
    setItem(itemData)

    const { data: ratingData } = await supabase
      .from('ratings').select('type').eq('item_id', id)

    const counts = { love: 0, ok: 0, bad: 0 }
    ratingData?.forEach(r => { if (counts[r.type] !== undefined) counts[r.type]++ })
    setRatings(counts)

    if (user) {
      const { data: my } = await supabase
        .from('ratings').select('type')
        .eq('item_id', id).eq('user_id', user.id).single()
      setMyRating(my?.type || null)
    }
    setLoading(false)
  }

  async function vote(type) {
    if (!user) { navigate('/auth'); return }
    if (voting) return
    setVoting(true)

    if (myRating === type) {
      // Снять голос
      await supabase.from('ratings').delete()
        .eq('item_id', id).eq('user_id', user.id)
      setRatings(prev => ({ ...prev, [type]: prev[type] - 1 }))
      setMyRating(null)
    } else {
      if (myRating) {
        await supabase.from('ratings').delete()
          .eq('item_id', id).eq('user_id', user.id)
        setRatings(prev => ({ ...prev, [myRating]: prev[myRating] - 1 }))
      }
      await supabase.from('ratings').insert({ item_id: id, user_id: user.id, type })
      setRatings(prev => ({ ...prev, [type]: prev[type] + 1 }))
      setMyRating(type)
    }
    setVoting(false)
  }

  const total = ratings.love + ratings.ok + ratings.bad

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text3)' }}>
      Загрузка...
    </div>
  )

  if (!item) return (
    <div style={{ textAlign: 'center', padding: '80px 16px' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🤷</div>
      <div style={{ color: 'var(--text3)' }}>Запись не найдена</div>
    </div>
  )

  return (
    <div>
      {/* Кнопка назад */}
      <button
        onClick={() => navigate(-1)}
        style={{
          position: 'absolute', top: 16, left: 16, zIndex: 20,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          borderRadius: 12, padding: '8px 14px',
          color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'Nunito, sans-serif',
        }}
      >
        ← Назад
      </button>

      {/* Фото */}
      <div style={{
        width: '100%', aspectRatio: '4/3',
        background: 'var(--bg3)', overflow: 'hidden', position: 'relative',
      }}>
        {item.photo_url ? (
          <img src={item.photo_url} alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64
          }}>
            {item.category === 'restaurant' ? '🍽️' : '🛒'}
          </div>
        )}
      </div>

      {/* Контент */}
      <div style={{ padding: '20px 16px 32px' }}>
        {/* Название */}
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: 12, marginBottom: 8
        }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.2, flex: 1 }}>
            {item.name}
          </h1>
          <span style={{
            background: 'var(--bg3)', borderRadius: 8,
            padding: '4px 10px', fontSize: 11, fontWeight: 700,
            color: 'var(--text2)', whiteSpace: 'nowrap',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {item.category === 'restaurant' ? 'Ресторан' : 'Магазин'}
          </span>
        </div>

        {item.place && (
          <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 16 }}>
            📍 {item.place}
          </div>
        )}

        {item.description && (
          <p style={{
            color: 'var(--text2)', fontSize: 14, lineHeight: 1.6,
            marginBottom: 24, padding: '14px', background: 'var(--bg2)',
            borderRadius: 12, border: '1px solid var(--border)',
          }}>
            {item.description}
          </p>
        )}

        {/* Голосование */}
        <div style={{
          background: 'var(--bg2)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)', padding: '20px 16px', marginBottom: 20,
        }}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: 'var(--text3)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, textAlign: 'center',
          }}>
            {user ? 'Твоя оценка' : 'Войди чтобы оценить'}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {['love', 'ok', 'bad'].map(type => {
              const isActive = myRating === type
              return (
                <button
                  key={type}
                  onClick={() => vote(type)}
                  style={{
                    flex: 1,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 6,
                    padding: '14px 8px',
                    borderRadius: 12,
                    background: isActive ? COLORS[type] + '22' : 'var(--bg3)',
                    border: isActive ? `2px solid ${COLORS[type]}` : '2px solid transparent',
                    transition: 'all 0.2s',
                    opacity: voting ? 0.7 : 1,
                  }}
                >
                  <span style={{ fontSize: 28 }}>{EMOJI_MAP[type]}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, fontFamily: 'Nunito, sans-serif',
                    color: isActive ? COLORS[type] : 'var(--text3)',
                  }}>
                    {LABEL_MAP[type]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Статистика */}
        {total > 0 && (
          <div style={{ background: 'var(--bg2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '16px' }}>
            <div style={{
              fontSize: 12, fontWeight: 700, color: 'var(--text3)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14,
            }}>
              Всего оценок: {total}
            </div>

            {['love', 'ok', 'bad'].map(type => {
              const pct = total > 0 ? Math.round((ratings[type] / total) * 100) : 0
              return (
                <div key={type} style={{ marginBottom: 10 }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    marginBottom: 5, fontSize: 13,
                  }}>
                    <span>{EMOJI_MAP[type]} {LABEL_MAP[type]}</span>
                    <span style={{ fontWeight: 700, color: COLORS[type] }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: pct + '%',
                      background: COLORS[type], borderRadius: 6,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
