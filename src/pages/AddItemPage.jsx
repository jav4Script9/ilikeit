import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function AddItemPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: '', place: '', description: '', category: 'restaurant'
  })
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit() {
    if (!form.name.trim()) { setError('Введи название'); return }
    setLoading(true)
    setError('')

    let photo_url = null

    if (photo) {
      const ext = photo.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('photos').upload(path, photo)
      if (uploadError) { setError('Ошибка загрузки фото'); setLoading(false); return }
      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)
      photo_url = urlData.publicUrl
    }

    const { error: insertError } = await supabase.from('items').insert({
      name: form.name.trim(),
      place: form.place.trim() || null,
      description: form.description.trim() || null,
      category: form.category,
      photo_url,
      user_id: user.id,
    })

    if (insertError) { setError('Ошибка сохранения'); setLoading(false); return }
    navigate('/')
  }

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

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--text3)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 8,
  }

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <div style={{
        fontFamily: 'Unbounded, sans-serif',
        fontSize: 20, fontWeight: 900, marginBottom: 24,
      }}>
        Добавить запись
      </div>

      {/* Фото */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Фото</label>
        <label style={{
          display: 'block',
          width: '100%', aspectRatio: '4/3',
          background: 'var(--bg3)',
          border: '2px dashed var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden', cursor: 'pointer',
          position: 'relative',
        }}>
          <input type="file" accept="image/*" onChange={handlePhoto}
            style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer' }} />
          {preview ? (
            <img src={preview} alt="preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 36 }}>📷</span>
              <span style={{ color: 'var(--text3)', fontSize: 13 }}>Нажми чтобы выбрать фото</span>
            </div>
          )}
        </label>
      </div>

      {/* Категория */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Категория</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { key: 'restaurant', label: '🍽️ Ресторан / Кафе' },
            { key: 'shop', label: '🛒 Магазин' },
          ].map(c => (
            <button
              key={c.key}
              onClick={() => setForm(f => ({ ...f, category: c.key }))}
              style={{
                flex: 1, padding: '12px 8px',
                borderRadius: 12, fontSize: 13, fontWeight: 700,
                fontFamily: 'Nunito, sans-serif',
                background: form.category === c.key
                  ? 'linear-gradient(135deg, var(--accent), var(--accent2))'
                  : 'var(--bg3)',
                color: form.category === c.key ? '#fff' : 'var(--text2)',
                border: '1px solid ' + (form.category === c.key ? 'transparent' : 'var(--border)'),
                transition: 'all 0.2s',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Название */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Название *</label>
        <input
          style={inputStyle}
          placeholder="Например: Пицца Маргарита"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />
      </div>

      {/* Место */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Место (необязательно)</label>
        <input
          style={inputStyle}
          placeholder="Ресторан или магазин"
          value={form.place}
          onChange={e => setForm(f => ({ ...f, place: e.target.value }))}
        />
      </div>

      {/* Описание */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Описание (необязательно)</label>
        <textarea
          style={{ ...inputStyle, resize: 'none', minHeight: 90 }}
          placeholder="Расскажи что думаешь..."
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />
      </div>

      {error && (
        <div style={{
          background: '#1DB95422', border: '1px solid #1DB95444',
          borderRadius: 10, padding: '12px 14px',
          color: '#1DB954', fontSize: 13, marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: '100%', padding: '16px',
          background: loading ? 'var(--bg3)' : 'linear-gradient(135deg, var(--accent), var(--accent2))',
          color: loading ? 'var(--text3)' : '#fff',
          borderRadius: 14, fontSize: 15, fontWeight: 800,
          fontFamily: 'Nunito, sans-serif',
          transition: 'all 0.2s',
        }}
      >
        {loading ? 'Сохраняем...' : '✅ Опубликовать'}
      </button>
    </div>
  )
}
