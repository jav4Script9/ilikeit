import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const EMOJI_MAP = { love: '😍', ok: '😐', bad: '😞' }
const LABEL_MAP = { love: 'Нравится', ok: 'Норм', bad: 'Не то' }
const COLORS = { love: '#1DB954', ok: '#FFB347', bad: '#e05555' }

export default function ItemPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [item, setItem] = useState(null)
  const [ratings, setRatings] = useState({ love: 0, ok: 0, bad: 0 })
  const [myRating, setMyRating] = useState(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({})
  const [saving, setSaving] = useState(false)
  const [photoIdx, setPhotoIdx] = useState(0)

  useEffect(() => { fetchItem() }, [id])

  async function fetchItem() {
    const { data: itemData } = await supabase.from('items').select('*').eq('id', id).single()
    setItem(itemData)
    setEditData({
      name: itemData?.name || '',
      description: itemData?.description || '',
      comment: itemData?.comment || '',
      rating: itemData?.rating || '',
    })

    const { data: ratingData } = await supabase.from('ratings').select('type').eq('item_id', id)
    const counts = { love: 0, ok: 0, bad: 0 }
    ratingData?.forEach(r => { if (counts[r.type] !== undefined) counts[r.type]++ })
    setRatings(counts)

    if (user) {
      const { data: my } = await supabase.from('ratings').select('type').eq('item_id', id).eq('user_id', user.id).single()
      setMyRating(my?.type || null)
    }
    setLoading(false)
  }

  async function vote(type) {
    if (!user) { navigate('/auth'); return }
    if (voting) return
    setVoting(true)
    if (myRating === type) {
      await supabase.from('ratings').delete().eq('item_id', id).eq('user_id', user.id)
      setRatings(prev => ({ ...prev, [type]: prev[type] - 1 }))
      setMyRating(null)
    } else {
      if (myRating) {
        await supabase.from('ratings').delete().eq('item_id', id).eq('user_id', user.id)
        setRatings(prev => ({ ...prev, [myRating]: prev[myRating] - 1 }))
      }
      await supabase.from('ratings').insert({ item_id: id, user_id: user.id, type })
      setRatings(prev => ({ ...prev, [type]: prev[type] + 1 }))
      setMyRating(type)
    }
    setVoting(false)
  }

  const [editPhotos, setEditPhotos] = useState([])
  const [editPhotoIdx, setEditPhotoIdx] = useState(0)
  const editFileRef = useRef()

  const handleEditPhoto = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => setEditPhotos(prev => [...prev, { preview: ev.target.result, blob: file }])
      reader.readAsDataURL(file)
    })
  }

  async function saveEdit() {
    setSaving(true)

    let photoUrls = item.photos || []
    if (editPhotos.length > 0) {
      const newUrls = []
      for (let i = 0; i < editPhotos.length; i++) {
        const p = editPhotos[i]
        const path = `${user.id}/${Date.now()}_${i}.webp`
        await supabase.storage.from('photos').upload(path, p.blob)
        const { data } = supabase.storage.from('photos').getPublicUrl(path)
        newUrls.push(data.publicUrl)
      }
      photoUrls = [...photoUrls, ...newUrls]
    }

    await supabase.from('items').update({
      name: editData.name.trim(),
      description: editData.description.trim() || null,
      comment: editData.comment.trim() || null,
      rating: editData.rating || null,
      photos: photoUrls,
      photo_url: photoUrls[0] || null,
    }).eq('id', id)

    if (editData.rating) {
      await supabase.from('ratings').upsert({ item_id: id, user_id: user.id, type: editData.rating }, { onConflict: 'user_id,item_id' })
    }

    setEditPhotos([])
    await fetchItem()
    setSaving(false)
    setEditing(false)
  }

  const total = ratings.love + ratings.ok + ratings.bad
  const photos = item?.photos?.length > 0 ? item.photos : item?.photo_url ? [item.photo_url] : []
  const isOwner = user && item && user.id === item.user_id

  const inputStyle = { width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', color: 'var(--text)', fontSize: 14, fontFamily: 'Nunito, sans-serif' }
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }

  if (loading) return <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text3)' }}>Загрузка...</div>
  if (!item) return <div style={{ textAlign: 'center', padding: '80px 16px' }}><div style={{ fontSize: 48, marginBottom: 12 }}>🤷</div><div style={{ color: 'var(--text3)' }}>Запись не найдена</div></div>

  return (
    <div>
      {/* Кнопка назад */}
      <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: 16, left: 16, zIndex: 20, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderRadius: 12, padding: '8px 14px', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'Nunito, sans-serif', border: 'none', cursor: 'pointer' }}>
        ← Назад
      </button>

      {/* Кнопка редактировать */}
      {isOwner && !editing && (
        <button onClick={() => setEditing(true)} style={{ position: 'absolute', top: 16, right: 16, zIndex: 20, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderRadius: 12, padding: '8px 12px', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Nunito,sans-serif' }}>Изменить</span>
        </button>
      )}

      {/* Фото слайдер */}
      {photos.length > 0 ? (
        <div style={{ width: '100%', aspectRatio: '4/3', background: 'var(--bg3)', overflow: 'hidden', position: 'relative' }}
          onClick={() => setPhotoIdx(i => (i + 1) % photos.length)}
        >
          <img src={photos[photoIdx]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {photos.length > 1 && (
            <>
              <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                {photos.map((_, i) => (
                  <div key={i} onClick={e => { e.stopPropagation(); setPhotoIdx(i) }} style={{ width: i === photoIdx ? 16 : 6, height: 6, borderRadius: 3, background: i === photoIdx ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'all .2s', cursor: 'pointer' }} />
                ))}
              </div>
              <div style={{ position: 'absolute', bottom: 10, right: 12, background: 'rgba(0,0,0,0.55)', borderRadius: 8, padding: '2px 8px', fontSize: 11, color: '#fff', fontWeight: 700 }}>
                {photoIdx + 1}/{photos.length}
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ width: '100%', aspectRatio: '4/3', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
          {item.category === 'restaurant' ? '🍽️' : '🛒'}
        </div>
      )}

      <div style={{ padding: '20px 16px 40px' }}>

        {/* === РЕЖИМ РЕДАКТИРОВАНИЯ === */}
        {editing ? (
          <div>
            <div style={{ fontWeight: 900, fontSize: 17, marginBottom: 20 }}>Редактировать запись</div>

            {/* Фото в редактировании */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Фото</label>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {[...photos, ...editPhotos.map(p => p.preview)].map((src, i) => (
                  <div key={i} style={{ flexShrink: 0, width: 80, height: 80, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
                    <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {i >= photos.length && (
                      <div style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, background: 'var(--accent)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>+</span>
                      </div>
                    )}
                  </div>
                ))}
                <label style={{ flexShrink: 0, width: 80, height: 80, borderRadius: 10, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text3)' }}>
                  <input ref={editFileRef} type="file" accept="image/*" multiple onChange={handleEditPhoto} style={{ display: 'none' }} />
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                </label>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Название</label>
              <input style={inputStyle} value={editData.name} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Описание</label>
              <textarea style={{ ...inputStyle, resize: 'none', minHeight: 76 }} value={editData.description} onChange={e => setEditData(d => ({ ...d, description: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Комментарий / Отзыв</label>
              <textarea style={{ ...inputStyle, resize: 'none', minHeight: 76 }} value={editData.comment} onChange={e => setEditData(d => ({ ...d, comment: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Оценка</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['love', 'ok', 'bad'].map(t => (
                  <button key={t} onClick={() => setEditData(d => ({ ...d, rating: d.rating === t ? '' : t }))}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 6px', borderRadius: 12, background: editData.rating === t ? COLORS[t] + '22' : 'var(--bg3)', border: editData.rating === t ? `2px solid ${COLORS[t]}` : '2px solid transparent', cursor: 'pointer' }}>
                    <span style={{ fontSize: 24 }}>{EMOJI_MAP[t]}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'Nunito,sans-serif', color: editData.rating === t ? COLORS[t] : 'var(--text3)' }}>{LABEL_MAP[t]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditing(false)} style={{ flex: 1, padding: '13px', borderRadius: 12, background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', fontSize: 14, fontWeight: 700, fontFamily: 'Nunito,sans-serif', cursor: 'pointer' }}>
                Отмена
              </button>
              <button onClick={saveEdit} disabled={saving} style={{ flex: 2, padding: '13px', borderRadius: 12, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#fff', fontSize: 14, fontWeight: 800, fontFamily: 'Nunito,sans-serif', border: 'none', cursor: 'pointer' }}>
                {saving ? 'Сохраняем...' : '✅ Сохранить'}
              </button>
            </div>
          </div>

        ) : (
          /* === РЕЖИМ ПРОСМОТРА === */
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.2, flex: 1 }}>{item.name}</h1>
              <span style={{ background: 'var(--bg3)', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text2)', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {item.category === 'restaurant' ? 'Ресторан' : 'Магазин'}
              </span>
            </div>

            {item.subcategory && (
              <div style={{ display: 'inline-block', background: 'var(--bg3)', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 10 }}>
                {item.subcategory}
              </div>
            )}

            {item.place && (
              <div onClick={() => navigate(`/map?place=${item.place_id || ''}`)}
                style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {item.place}
              </div>
            )}

            {item.description && (
              <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, marginBottom: 16, padding: '14px', background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)' }}>
                {item.description}
              </p>
            )}

            {item.comment && (
              <div style={{ marginBottom: 20, padding: '14px', background: 'var(--bg2)', borderRadius: 12, borderLeft: '3px solid var(--accent)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Отзыв</div>
                <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, fontStyle: 'italic' }}>"{item.comment}"</p>
              </div>
            )}

            {/* Голосование */}
            <div style={{ background: 'var(--bg2)', borderRadius: 14, border: '1px solid var(--border)', padding: '20px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, textAlign: 'center' }}>
                {user ? 'Твоя оценка' : 'Войди чтобы оценить'}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {['love', 'ok', 'bad'].map(type => {
                  const isActive = myRating === type
                  return (
                    <button key={type} onClick={() => vote(type)}
                      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 8px', borderRadius: 12, background: isActive ? COLORS[type] + '22' : 'var(--bg3)', border: isActive ? `2px solid ${COLORS[type]}` : '2px solid transparent', transition: 'all 0.2s', opacity: voting ? 0.7 : 1, cursor: 'pointer' }}>
                      <span style={{ fontSize: 28 }}>{EMOJI_MAP[type]}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'Nunito, sans-serif', color: isActive ? COLORS[type] : 'var(--text3)' }}>{LABEL_MAP[type]}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Статистика */}
            {total > 0 && (
              <div style={{ background: 'var(--bg2)', borderRadius: 14, border: '1px solid var(--border)', padding: '16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                  Всего оценок: {total}
                </div>
                {['love', 'ok', 'bad'].map(type => {
                  const pct = total > 0 ? Math.round((ratings[type] / total) * 100) : 0
                  return (
                    <div key={type} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                        <span>{EMOJI_MAP[type]} {LABEL_MAP[type]}</span>
                        <span style={{ fontWeight: 700, color: COLORS[type] }}>{pct}%</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 6, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: pct + '%', background: COLORS[type], borderRadius: 6, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
