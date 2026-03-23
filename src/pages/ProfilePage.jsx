import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useTheme } from '../lib/useTheme'
import ItemCard from '../components/ItemCard'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [myItems, setMyItems] = useState([])
  const [stats, setStats] = useState({ love: 0, ok: 0, bad: 0 })
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState('items') // items | settings
  const [displayName, setDisplayName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    if (user) fetchProfile()
  }, [user])

  async function fetchProfile() {
    // Загружаем профиль из таблицы profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile) {
      setDisplayName(profile.display_name || '')
      setAvatarUrl(profile.avatar_url || null)
    }

    const { data: items } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setMyItems(items || [])

    const { data: ratings } = await supabase
      .from('ratings').select('type').eq('user_id', user.id)
    const counts = { love: 0, ok: 0, bad: 0 }
    ratings?.forEach(r => { if (counts[r.type] !== undefined) counts[r.type]++ })
    setStats(counts)
    setLoading(false)
  }

  async function saveName() {
    setSavingName(true)
    await supabase.from('profiles').upsert({
      id: user.id,
      display_name: displayName.trim(),
      updated_at: new Date().toISOString(),
    })
    setSavingName(false)
  }

  async function handleAvatar(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingAvatar(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`
    const { error } = await supabase.storage.from('photos').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('photos').getPublicUrl(path)
      setAvatarUrl(data.publicUrl)
      await supabase.from('profiles').upsert({
        id: user.id,
        avatar_url: data.publicUrl,
        updated_at: new Date().toISOString(),
      })
    }
    setUploadingAvatar(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const totalVotes = stats.love + stats.ok + stats.bad
  const name = displayName || user?.email?.split('@')[0] || 'Пользователь'

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text3)' }}>Загрузка...</div>
  )

  const tabStyle = (active) => ({
    flex: 1, padding: '10px', textAlign: 'center',
    fontSize: 13, fontWeight: 700, fontFamily: 'Nunito, sans-serif',
    color: active ? 'var(--accent)' : 'var(--text3)',
    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    cursor: 'pointer', background: 'none', border: 'none',
    borderBottom: active ? `2px solid var(--accent)` : '2px solid transparent',
    transition: 'all 0.2s',
  })

  const inputStyle = {
    width: '100%',
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '14px',
    color: 'var(--text)',
    fontSize: 15,
    fontFamily: 'Nunito, sans-serif',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Шапка профиля */}
      <div style={{ padding: '20px 16px 0', background: 'var(--bg)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          {/* Аватар */}
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
              background: avatarUrl ? 'none' : 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', cursor: 'pointer', position: 'relative',
              border: '2px solid var(--border)',
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            )}
            {uploadingAvatar && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 11,
              }}>...</div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} style={{ display: 'none' }} />

          <div>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 2 }}>{name}</div>
            <div style={{ color: 'var(--text3)', fontSize: 12 }}>{user.email}</div>
          </div>
        </div>

        {/* Статистика */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Добавлено', value: myItems.length },
            { label: 'Оценок', value: totalVotes },
            { label: 'Нравится', value: stats.love },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg2)', borderRadius: 12,
              padding: '12px 8px', textAlign: 'center', border: '1px solid var(--border)',
            }}>
              <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 2 }}>{s.value}</div>
              <div style={{ color: 'var(--text3)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Табы */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          <button style={tabStyle(section === 'items')} onClick={() => setSection('items')}>Мои записи</button>
          <button style={tabStyle(section === 'settings')} onClick={() => setSection('settings')}>Настройки</button>
        </div>
      </div>

      {/* Контент */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 24px' }}>

        {section === 'items' && (
          myItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
              <div style={{ color: 'var(--text3)', fontSize: 14 }}>Ты ещё ничего не добавил</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myItems.map(item => <ItemCard key={item.id} item={item} />)}
            </div>
          )
        )}

        {section === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Имя */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Отображаемое имя
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="Твоё имя"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                />
                <button
                  onClick={saveName}
                  disabled={savingName}
                  style={{
                    padding: '0 18px', borderRadius: 12,
                    background: 'var(--accent)', color: '#fff',
                    fontSize: 13, fontWeight: 700, fontFamily: 'Nunito, sans-serif',
                    opacity: savingName ? 0.7 : 1,
                  }}
                >
                  {savingName ? '...' : 'Сохранить'}
                </button>
              </div>
            </div>

            {/* Аватарка */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Аватарка
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12,
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  color: 'var(--text2)', fontSize: 14, fontWeight: 700,
                  fontFamily: 'Nunito, sans-serif', cursor: 'pointer',
                }}
              >
                {uploadingAvatar ? 'Загружаем...' : '📷 Выбрать фото'}
              </button>
            </div>

            {/* Тема */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Тема оформления
              </div>
              <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: 12, padding: 4 }}>
                {['dark', 'light'].map(t => (
                  <button
                    key={t}
                    onClick={() => t !== theme && toggleTheme()}
                    style={{
                      flex: 1, padding: '11px', borderRadius: 10,
                      fontSize: 13, fontWeight: 700, fontFamily: 'Nunito, sans-serif',
                      background: theme === t ? 'var(--bg)' : 'none',
                      color: theme === t ? 'var(--text)' : 'var(--text3)',
                      border: theme === t ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    {t === 'dark' ? '🌙 Тёмная' : '☀️ Светлая'}
                  </button>
                ))}
              </div>
            </div>

            {/* Выход */}
            <button
              onClick={handleSignOut}
              style={{
                width: '100%', padding: '14px', borderRadius: 12,
                background: 'var(--bg3)', border: '1px solid var(--border)',
                color: '#e05555', fontSize: 14, fontWeight: 700,
                fontFamily: 'Nunito, sans-serif', cursor: 'pointer', marginTop: 8,
              }}
            >
              Выйти из аккаунта
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
