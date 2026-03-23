import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // login | register
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
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
      {/* Логотип */}
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
        Оценивай блюда и продукты 🔥
      </div>

      {/* Карточка */}
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
            marginTop: 12, background: '#1DB95422', borderRadius: 10,
            padding: '10px 14px', color: '#1DB954', fontSize: 13,
            border: '1px solid #1DB95444',
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            marginTop: 12, background: '#4CAF5022', borderRadius: 10,
            padding: '10px 14px', color: '#4CAF50', fontSize: 13,
            border: '1px solid #4CAF5044',
          }}>
            {success}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', marginTop: 20, padding: '16px',
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
