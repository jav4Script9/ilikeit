import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit() {
    if (!email || !password) { setError('Заполни все поля'); return }
    if (password.length < 6) { setError('Пароль минимум 6 символов'); return }
    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'register') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      setSuccess('Проверь почту и подтверди регистрацию!')
      setLoading(false)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError('Неверный email или пароль'); setLoading(false); return }
      navigate('/')
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
    if (error) { setError('Ошибка входа через Google'); setGoogleLoading(false) }
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '16px',
    color: 'var(--text)',
    fontSize: 15,
    fontFamily: 'Nunito, sans-serif',
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px',
      background: 'var(--bg)',
    }}>
      <div style={{
        fontFamily: 'Unbounded, sans-serif',
        fontSize: 32, fontWeight: 900,
        background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: 8,
      }}>
        I Like It
      </div>
      <div style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 40 }}>
        Оценивай блюда и продукты 🌿
      </div>

      <div style={{
        width: '100%', maxWidth: 380,
        background: 'var(--bg2)',
        borderRadius: 20,
        border: '1px solid var(--border)',
        padding: '24px 20px',
      }}>
        {/* Переключатель */}
        <div style={{
          display: 'flex', background: 'var(--bg3)',
          borderRadius: 12, padding: 4, marginBottom: 24,
        }}>
          {['login', 'register'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setSuccess('') }}
              style={{
                flex: 1, padding: '10px',
                borderRadius: 10, fontSize: 13, fontWeight: 700,
                fontFamily: 'Nunito, sans-serif',
                background: mode === m ? 'var(--bg)' : 'none',
                color: mode === m ? 'var(--text)' : 'var(--text3)',
                border: mode === m ? '1px solid var(--border)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {m === 'login' ? 'Войти' : 'Регистрация'}
            </button>
          ))}
        </div>

        {/* Кнопка Google */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          style={{
            width: '100%', padding: '14px',
            background: 'var(--bg3)',
            border: '1px solid var(--border)',
            borderRadius: 12, marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontSize: 14, fontWeight: 700,
            fontFamily: 'Nunito, sans-serif',
            color: 'var(--text)',
            opacity: googleLoading ? 0.7 : 1,
            transition: 'all 0.2s',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 32.4 29.2 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.8 7.1 29.2 5 24 5 13.5 5 5 13.5 5 24s8.5 19 19 19c9.9 0 18.4-7.2 19-17l.1-1c0-1.3-.1-2.7-.5-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.8 7.1 29.2 5 24 5c-7.7 0-14.3 4.4-17.7 9.7z"/>
            <path fill="#4CAF50" d="M24 43c5.1 0 9.7-1.9 13.2-5l-6.1-5.2C29.2 34.3 26.7 35 24 35c-5.1 0-9.5-3.5-11.2-8.2l-6.6 5.1C9.8 38.7 16.4 43 24 43z"/>
            <path fill="#1565C0" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.1 5.2C40.8 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          {googleLoading ? 'Загрузка...' : 'Войти через Google'}
        </button>

        {/* Разделитель */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ color: 'var(--text3)', fontSize: 12, fontWeight: 700 }}>или</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            style={inputStyle}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            style={inputStyle}
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {error && (
          <div style={{
            marginTop: 12, background: '#e0555518', borderRadius: 10,
            padding: '10px 14px', color: '#e05555', fontSize: 13,
            border: '1px solid #e0555533',
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            marginTop: 12, background: '#1DB95418', borderRadius: 10,
            padding: '10px 14px', color: '#1DB954', fontSize: 13,
            border: '1px solid #1DB95433',
          }}>
            {success}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', marginTop: 16, padding: '16px',
            background: loading ? 'var(--bg3)' : 'linear-gradient(135deg, var(--accent), var(--accent2))',
            color: loading ? 'var(--text3)' : '#fff',
            borderRadius: 14, fontSize: 15, fontWeight: 800,
            fontFamily: 'Nunito, sans-serif',
            transition: 'all 0.2s',
          }}
        >
          {loading ? '...' : mode === 'login' ? '→ Войти' : '→ Создать аккаунт'}
        </button>
      </div>
    </div>
  )
}
