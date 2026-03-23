import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const COUNTRIES = [
  { value: 'cz', label: '🇨🇿 Чехия' },
  { value: 'ua', label: '🇺🇦 Украина' },
  { value: 'de', label: '🇩🇪 Германия' },
]

const RATINGS = [
  { value: 'love', emoji: '😍', label: 'Нравится' },
  { value: 'maybe', emoji: '😐', label: 'Не определился' },
  { value: 'dislike', emoji: '😞', label: 'Не нравится' },
]

function ImageEditor({ src, onDone, onCancel }) {
  const containerRef = useRef()
  const imgRef = useRef()
  const [mode, setMode] = useState('crop') // crop | zoom
  const [imgLoaded, setImgLoaded] = useState(false)

  // Crop state
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 })
  const [dragging, setDragging] = useState(null)

  // Zoom/pan state
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [panning, setPanning] = useState(null)
  const lastTouchDist = useRef(null)

  const handleImgLoad = () => {
    const img = imgRef.current
    setCrop({ x: 0, y: 0, w: img.offsetWidth, h: img.offsetHeight })
    setImgLoaded(true)
  }

  const getPos = (e) => {
    const rect = (mode === 'crop' ? imgRef.current : containerRef.current).getBoundingClientRect()
    const touch = e.touches?.[0] || e
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
  }

  // --- CROP ---
  const onCropDown = (e) => {
    e.stopPropagation()
    const pos = getPos(e)
    setDragging({ sx: pos.x, sy: pos.y, sc: { ...crop } })
  }
  const onCropMove = useCallback((e) => {
    if (!dragging) return
    const pos = getPos(e)
    const img = imgRef.current
    const dx = pos.x - dragging.sx
    const dy = pos.y - dragging.sy
    setCrop(prev => ({
      ...prev,
      x: Math.max(0, Math.min(img.offsetWidth - prev.w, dragging.sc.x + dx)),
      y: Math.max(0, Math.min(img.offsetHeight - prev.h, dragging.sc.y + dy)),
    }))
  }, [dragging])
  const onCropUp = () => setDragging(null)

  const setAspect = (ratio) => {
    const img = imgRef.current
    const w = img.offsetWidth
    const h = ratio ? w / ratio : img.offsetHeight
    setCrop({ x: 0, y: 0, w, h: Math.min(h, img.offsetHeight) })
  }

  // --- ZOOM/PAN ---
  const onPanDown = (e) => {
    const pos = getPos(e)
    setPanning({ sx: pos.x, sy: pos.y, so: { ...offset } })
  }
  const onPanMove = useCallback((e) => {
    // Pinch zoom
    if (e.touches?.length === 2) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      if (lastTouchDist.current) {
        const delta = d / lastTouchDist.current
        setScale(s => Math.max(0.5, Math.min(4, s * delta)))
      }
      lastTouchDist.current = d
      return
    }
    if (!panning) return
    const pos = getPos(e)
    setOffset({
      x: panning.so.x + (pos.x - panning.sx),
      y: panning.so.y + (pos.y - panning.sy),
    })
  }, [panning])
  const onPanUp = () => { setPanning(null); lastTouchDist.current = null }

  const onWheel = (e) => {
    e.preventDefault()
    setScale(s => Math.max(0.5, Math.min(4, s - e.deltaY * 0.001)))
  }

  // --- APPLY ---
  const apply = () => {
    const img = imgRef.current
    const canvas = document.createElement('canvas')
    if (mode === 'crop') {
      const sx = img.naturalWidth / img.offsetWidth
      const sy = img.naturalHeight / img.offsetHeight
      canvas.width = crop.w * sx
      canvas.height = crop.h * sy
      canvas.getContext('2d').drawImage(img, crop.x * sx, crop.y * sy, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height)
    } else {
      // Zoom mode — экспортируем текущий вид
      const rect = containerRef.current.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      const ctx = canvas.getContext('2d')
      const cx = rect.width / 2 + offset.x
      const cy = rect.height / 2 + offset.y
      const dw = img.naturalWidth * scale * (rect.width / img.offsetWidth)
      const dh = img.naturalHeight * scale * (rect.height / img.offsetHeight)
      ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh)
    }
    canvas.toBlob(blob => onDone(blob), 'image/webp', 0.92)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.8)' }}>
        <button onClick={onCancel} style={{ color: '#aaa', fontSize: 14, fontWeight: 700, fontFamily: 'Nunito,sans-serif', background: 'none', border: 'none', cursor: 'pointer' }}>Отмена</button>
        <div style={{ display: 'flex', gap: 8 }}>
          {['crop', 'zoom'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: 'Nunito,sans-serif', background: mode === m ? 'var(--accent)' : '#333', color: '#fff', border: 'none', cursor: 'pointer' }}>
              {m === 'crop' ? '✂️ Обрезка' : '🔍 Зум'}
            </button>
          ))}
        </div>
        <button onClick={apply} style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 700, fontFamily: 'Nunito,sans-serif', background: 'none', border: 'none', cursor: 'pointer' }}>Готово</button>
      </div>

      {/* Canvas area */}
      <div ref={containerRef} style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}
        onMouseMove={mode === 'crop' ? onCropMove : onPanMove}
        onMouseUp={mode === 'crop' ? onCropUp : onPanUp}
        onTouchMove={mode === 'crop' ? onCropMove : onPanMove}
        onTouchEnd={mode === 'crop' ? onCropUp : onPanUp}
        onMouseDown={mode === 'zoom' ? onPanDown : undefined}
        onTouchStart={mode === 'zoom' ? onPanDown : undefined}
        onWheel={mode === 'zoom' ? onWheel : undefined}
      >
        <img
          ref={imgRef}
          src={src}
          onLoad={handleImgLoad}
          style={{
            maxWidth: '100vw', maxHeight: 'calc(100vh - 160px)', display: 'block',
            transform: mode === 'zoom' ? `translate(${offset.x}px, ${offset.y}px) scale(${scale})` : 'none',
            transformOrigin: 'center',
            transition: panning || dragging ? 'none' : 'transform 0.1s',
          }}
        />
        {mode === 'crop' && imgLoaded && (
          <div
            onMouseDown={onCropDown}
            onTouchStart={onCropDown}
            style={{
              position: 'absolute',
              left: `calc(50% - ${imgRef.current?.offsetWidth / 2}px + ${crop.x}px)`,
              top: `calc(50% - ${imgRef.current?.offsetHeight / 2}px + ${crop.y}px)`,
              width: crop.w, height: crop.h,
              border: '2px solid var(--accent)',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
              cursor: 'move', boxSizing: 'border-box',
            }}
          >
            {/* Угловые маркеры */}
            {[[0,0,'nw'],[0,100,'ne'],[100,0,'sw'],[100,100,'se']].map(([t,l,c]) => (
              <div key={c} style={{ position: 'absolute', top: `${t}%`, left: `${l}%`, width: 12, height: 12, background: 'var(--accent)', borderRadius: 2, transform: 'translate(-50%,-50%)' }} />
            ))}
          </div>
        )}
      </div>

      {/* Crop controls */}
      {mode === 'crop' && (
        <div style={{ padding: '12px 16px', display: 'flex', gap: 8, background: 'rgba(0,0,0,0.8)' }}>
          {[['1:1',1],['4:3',4/3],['16:9',16/9],['Всё',null]].map(([label, ratio]) => (
            <button key={label} onClick={() => setAspect(ratio)}
              style={{ flex: 1, padding: '10px 4px', background: '#222', border: '1px solid #444', borderRadius: 10, color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'Nunito,sans-serif', cursor: 'pointer' }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Zoom controls */}
      {mode === 'zoom' && (
        <div style={{ padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(0,0,0,0.8)' }}>
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} style={{ width: 40, height: 40, borderRadius: 10, background: '#222', border: '1px solid #444', color: '#fff', fontSize: 20, cursor: 'pointer' }}>−</button>
          <div style={{ flex: 1, textAlign: 'center', color: '#aaa', fontSize: 13 }}>{Math.round(scale * 100)}%</div>
          <button onClick={() => setScale(s => Math.min(4, s + 0.2))} style={{ width: 40, height: 40, borderRadius: 10, background: '#222', border: '1px solid #444', color: '#fff', fontSize: 20, cursor: 'pointer' }}>+</button>
          <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }) }} style={{ padding: '0 12px', height: 40, borderRadius: 10, background: '#222', border: '1px solid #444', color: '#aaa', fontSize: 11, fontWeight: 700, fontFamily: 'Nunito,sans-serif', cursor: 'pointer' }}>Сброс</button>
        </div>
      )}
    </div>
  )
}

export default function AddItemPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [category, setCategory] = useState('restaurant')
  const [country, setCountry] = useState('')
  const [placeName, setPlaceName] = useState('')
  const [placeId, setPlaceId] = useState(null)
  const [placeAddress, setPlaceAddress] = useState('')
  const [placeLat, setPlaceLat] = useState(null)
  const [placeLng, setPlaceLng] = useState(null)
  const [geoSuggestions, setGeoSuggestions] = useState([])
  const [geoLoading, setGeoLoading] = useState(false)
  const mapPreviewRef = useRef(null)
  const miniMap = useRef(null)

  const searchGeo = async (q) => {
    if (q.length < 3) { setGeoSuggestions([]); return }
    setGeoLoading(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`, {
        headers: { 'Accept-Language': 'ru' }
      })
      const data = await res.json()
      setGeoSuggestions(data)
    } catch {}
    setGeoLoading(false)
  }

  const selectGeo = (item) => {
    setPlaceAddress(item.display_name.split(',').slice(0,3).join(','))
    setPlaceLat(parseFloat(item.lat))
    setPlaceLng(parseFloat(item.lon))
    setGeoSuggestions([])
    // Показать мини-карту
    setTimeout(() => initMiniMap(parseFloat(item.lat), parseFloat(item.lon)), 100)
  }

  const initMiniMap = (lat, lng) => {
    if (!window.L || !mapPreviewRef.current) return
    const L = window.L
    if (miniMap.current) { miniMap.current.remove(); miniMap.current = null }
    const m = L.map(mapPreviewRef.current, { zoomControl: false, dragging: false, scrollWheelZoom: false }).setView([lat, lng], 15)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(m)
    L.marker([lat, lng]).addTo(m)
    miniMap.current = m
  }

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      document.head.appendChild(script)
    }
  }, [])
  const [placeSuggestions, setPlaceSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [itemName, setItemName] = useState('')
  const [description, setDescription] = useState('')
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState('')
  const [photos, setPhotos] = useState([])
  const [editTarget, setEditTarget] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const searchPlaces = async (q) => {
    if (q.length < 2) { setPlaceSuggestions([]); setShowSuggestions(false); return }
    const { data } = await supabase.from('places').select('*').eq('category', category).ilike('name', `%${q}%`).limit(5)
    setPlaceSuggestions(data || [])
    setShowSuggestions(true)
  }

  const handlePlaceSelect = (place) => {
    setPlaceName(place.name)
    setPlaceId(place.id)
    setPlaceAddress(place.address || '')
    setShowSuggestions(false)
  }

  const handlePhotoSelect = (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => setPhotos(prev => [...prev, { preview: ev.target.result, blob: file }])
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const handleEditDone = (blob) => {
    const url = URL.createObjectURL(blob)
    setPhotos(prev => prev.map((p, i) => i === editTarget.index ? { ...p, preview: url, blob } : p))
    setEditTarget(null)
  }

  const uploadPhotos = async () => {
    const urls = []
    for (let i = 0; i < photos.length; i++) {
      const p = photos[i]
      const ext = 'webp'
      const path = `${user.id}/${Date.now()}_${i}.${ext}`
      const { error } = await supabase.storage.from('photos').upload(path, p.blob)
      if (error) throw error
      const { data } = supabase.storage.from('photos').getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    return urls
  }

  const handleSubmit = async () => {
    if (!itemName.trim()) { setError('Введи название'); return }
    if (!rating) { setError('Выбери оценку'); return }
    setLoading(true); setError('')
    try {
      const photoUrls = photos.length > 0 ? await uploadPhotos() : []
      let finalPlaceId = placeId
      if (placeName.trim() && !placeId) {
        const { data: np, error: pe } = await supabase.from('places').insert({
          name: placeName.trim(), category, country,
          address: placeAddress.trim() || null, lat: placeLat, lng: placeLng, user_id: user.id,
        }).select().single()
        if (pe) throw pe
        finalPlaceId = np.id
      }
      const { data: newItem, error: ie } = await supabase.from('items').insert({
        name: itemName.trim(),
        description: description.trim() || null,
        comment: comment.trim() || null,
        category, country,
        place: placeName.trim() || null,
        place_id: finalPlaceId,
        rating,
        photos: photoUrls,
        photo_url: photoUrls[0] || null,
        user_id: user.id,
      }).select().single()
      if (ie) throw ie
      await supabase.from('ratings').insert({
        item_id: newItem.id, user_id: user.id,
        type: rating === 'love' ? 'love' : rating === 'dislike' ? 'bad' : 'ok',
      })
      navigate('/')
    } catch (e) {
      setError('Ошибка: ' + e.message)
      setLoading(false)
    }
  }

  const inputStyle = { width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px', color: 'var(--text)', fontSize: 15, fontFamily: 'Nunito, sans-serif' }
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }

  return (
    <>
      {editTarget && <ImageEditor src={editTarget.src} onDone={handleEditDone} onCancel={() => setEditTarget(null)} />}
      <div style={{ padding: '20px 16px 40px' }}>
        <div style={{ fontFamily: 'Unbounded, sans-serif', fontSize: 19, fontWeight: 900, marginBottom: 22 }}>Добавить запись</div>

        {/* Фото */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Фото</label>
          {photos.length > 0 ? (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, marginBottom: 0 }}>
              {photos.map((p, i) => (
                <div key={i} style={{ position: 'relative', flexShrink: 0, width: 110, height: 110, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={p.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 4 }}>
                    <button onClick={() => setEditTarget({ index: i, src: p.preview })} style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(0,0,0,0.75)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))} style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(0,0,0,0.75)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                </div>
              ))}
              <label style={{ flexShrink: 0, width: 110, height: 110, borderRadius: 12, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text3)' }}>
                <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} style={{ display: 'none' }} />
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              </label>
            </div>
          ) : (
            <label style={{ display: 'block', width: '100%', aspectRatio: '4/3', background: 'var(--bg3)', border: '2px dashed var(--border)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} style={{ display: 'none' }} />
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              <span style={{ color: 'var(--text3)', fontSize: 13 }}>Нажми чтобы добавить фото</span>
              <span style={{ color: 'var(--text3)', fontSize: 11 }}>Можно несколько</span>
            </label>
          )}
        </div>

        {/* Категория */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Категория</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {[{ k: 'restaurant', l: '🍽️ Ресторан / Кафе' }, { k: 'shop', l: '🛒 Магазин' }].map(c => (
              <button key={c.k} onClick={() => { setCategory(c.k); setPlaceName(''); setPlaceId(null); setPlaceAddress(''); setCountry('') }}
                style={{ flex: 1, padding: '12px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700, fontFamily: 'Nunito,sans-serif', background: category === c.k ? 'linear-gradient(135deg, var(--accent), var(--accent2))' : 'var(--bg3)', color: category === c.k ? '#fff' : 'var(--text2)', border: '1px solid ' + (category === c.k ? 'transparent' : 'var(--border)'), transition: 'all .2s', cursor: 'pointer' }}>
                {c.l}
              </button>
            ))}
          </div>
        </div>

        {/* Страна */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Страна</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {COUNTRIES.map(c => (
              <button key={c.value} onClick={() => setCountry(c.value)} style={{ flex: 1, padding: '10px 4px', borderRadius: 12, fontSize: 11, fontWeight: 700, fontFamily: 'Nunito,sans-serif', background: country === c.value ? 'var(--bg2)' : 'var(--bg3)', color: country === c.value ? 'var(--accent)' : 'var(--text2)', border: country === c.value ? '1px solid var(--accent)' : '1px solid var(--border)', transition: 'all .2s', cursor: 'pointer' }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Заведение */}
        <div style={{ marginBottom: 16, position: 'relative' }}>
          <label style={labelStyle}>{category === 'restaurant' ? 'Ресторан / Кафе' : 'Магазин'}</label>
          <input style={inputStyle} placeholder="Название" value={placeName}
            onChange={e => { setPlaceName(e.target.value); setPlaceId(null); searchPlaces(e.target.value) }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          />
          {showSuggestions && placeSuggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, zIndex: 10, overflow: 'hidden', marginTop: 4 }}>
              {placeSuggestions.map(p => (
                <div key={p.id} onMouseDown={() => handlePlaceSelect(p)} style={{ padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                  <div style={{ fontWeight: 700 }}>{p.name}</div>
                  {p.address && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{p.address}</div>}
                </div>
              ))}
              <div onMouseDown={() => setShowSuggestions(false)} style={{ padding: '12px 14px', cursor: 'pointer', color: 'var(--accent)', fontSize: 13, fontWeight: 700 }}>+ Добавить новое</div>
            </div>
          )}
        </div>

        {/* Адрес с геопоиском */}
        {!placeId && (
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Адрес</label>
            <div style={{ position: 'relative' }}>
              <input
                style={inputStyle}
                placeholder="Начни вводить адрес..."
                value={placeAddress}
                onChange={e => { setPlaceAddress(e.target.value); searchGeo(e.target.value) }}
                onBlur={() => setTimeout(() => setGeoSuggestions([]), 200)}
              />
              {geoLoading && <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 12 }}>...</div>}
              {geoSuggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, zIndex: 20, overflow: 'hidden', marginTop: 4, maxHeight: 200, overflowY: 'auto' }}>
                  {geoSuggestions.map((g, i) => (
                    <div key={i} onMouseDown={() => selectGeo(g)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      {g.display_name.split(',').slice(0, 3).join(', ')}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Мини карта */}
            {placeLat && (
              <div ref={mapPreviewRef} style={{ width: '100%', height: 140, borderRadius: 12, overflow: 'hidden', marginTop: 10, border: '1px solid var(--border)' }} />
            )}
          </div>
        )}
        {placeId && placeAddress && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--bg3)', borderRadius: 12, fontSize: 13, color: 'var(--text2)' }}>📍 {placeAddress}</div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>{category === 'restaurant' ? 'Название блюда *' : 'Название товара *'}</label>
          <input style={inputStyle} placeholder={category === 'restaurant' ? 'Пицца Маргарита' : 'Milka Oreo'} value={itemName} onChange={e => setItemName(e.target.value)} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Описание</label>
          <textarea style={{ ...inputStyle, resize: 'none', minHeight: 76 }} placeholder="Состав, особенности..." value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Комментарий / Отзыв</label>
          <textarea style={{ ...inputStyle, resize: 'none', minHeight: 76 }} placeholder="Твои впечатления..." value={comment} onChange={e => setComment(e.target.value)} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Оценка *</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {RATINGS.map(r => (
              <button key={r.value} onClick={() => setRating(r.value)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 6px', borderRadius: 12, background: rating === r.value ? 'var(--bg2)' : 'var(--bg3)', border: rating === r.value ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer', transition: 'all .18s' }}>
                <span style={{ fontSize: 26 }}>{r.emoji}</span>
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'Nunito,sans-serif', color: rating === r.value ? 'var(--accent)' : 'var(--text3)' }}>{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        {error && <div style={{ background: '#e0555518', border: '1px solid #e0555533', borderRadius: 10, padding: '12px 14px', color: '#e05555', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '15px', borderRadius: 14, background: loading ? 'var(--bg3)' : 'linear-gradient(135deg, var(--accent), var(--accent2))', color: loading ? 'var(--text3)' : '#fff', fontSize: 15, fontWeight: 800, fontFamily: 'Nunito,sans-serif', border: 'none', cursor: loading ? 'default' : 'pointer' }}>
          {loading ? 'Публикуем...' : '✅ Опубликовать'}
        </button>
      </div>
    </>
  )
}
