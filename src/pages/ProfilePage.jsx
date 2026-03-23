import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import ItemCard from '../components/ItemCard'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [myItems, setMyItems] = useState([])
  const [stats, setStats] = useState({ love: 0, ok: 0, bad: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchProfile()
  }, [user])

  async function fetchProfile() {
    // Мои добавленные записи
    const { data: items } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setMyItems(items || [])

    // Мои оценки
    const { data: ratings } = await supabase
      .from('ratings').select('type').eq('user_id', user.id)
    const counts = { love: 0, ok: 0, bad: 0 }
    ratings?.forEach(r => { if (counts[r.type] !== undefined) counts[r.type]++ })
    setStats(counts)
    setLoading(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text3)' }}>
      Загрузка...
    </div>
  )

  const totalVotes = stats.love + stats.ok + stats.bad

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      {/* Шапка профиля */}
      <div style={{
        background: 'var(--bg2)', borderRadius: 20,
        border: '1px solid var(--border)',
        padding: '20px', marginBottom: 24,
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, flexShrink: 0,
          }}>
            👤
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 2 }}>
              {user.email?.split('@')[0]}
            </div>
            <div style={{ color: 'var(--text3)', fontSize: 12 }}>
              {user.email}
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: 'Добавлено', value: myItems.length, emoji: '📝' },
            { label: 'Оценок', value: totalVotes, emoji: '⭐' },
            { label: '😍 Нравится', value: stats.love, emoji: '' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg3)', borderRadius: 12,
              padding: '12px 10px', textAlign: 'center',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>
                {s.emoji || '😍'}
              </div>
              <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 2 }}>
                {s.value}
              </div>
              <div style={{ color: 'var(--text3)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSignOut}
          style={{
            padding: '12px', borderRadius: 12,
            background: 'var(--bg3)', border: '1px solid var(--border)',
            color: '#1DB954', fontSize: 13, fontWeight: 700,
            fontFamily: 'Nunito, sans-serif',
          }}
        >
          Выйти из аккаунта
        </button>
      </div>

      {/* Мои записи */}
      <div style={{
        fontSize: 12, fontWeight: 700, color: 'var(--text3)',
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14,
      }}>
        Мои записи ({myItems.length})
      </div>

      {myItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
          <div style={{ color: 'var(--text3)', fontSize: 14 }}>
            Ты ещё ничего не добавил
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {myItems.map(item => <ItemCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  )
}
