import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const COUNTRIES = [
  { value: 'cz', label: '🇨🇿' },
  { value: 'ua', label: '🇺🇦' },
  { value: 'de', label: '🇩🇪' },
]

const RATINGS = [
  { value: 'dislike', emoji: '😞', label: 'Не нравится' },
  { value: 'maybe', emoji: '😐', label: 'Не определился' },
  { value: 'love', emoji: '😍', label: 'Нравится' },
]

const compressToWebp = (file, maxDim = 1920, quality = 0.85) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onerror = reject
  reader.onload = (ev) => {
    const img = new Image()
    img.onerror = reject
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.round(img.naturalWidth * scale)
      const h = Math.round(img.naturalHeight * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/webp', quality)
    }
    img.src = ev.target.result
  }
  reader.readAsDataURL(file)
})

function ImageEditor({ src, onDone, onCancel }) {
  const containerRef = useRef()
  const imgRef = useRef()
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgRect, setImgRect] = useState({ x: 0, y: 0, w: 0, h: 0 })
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 })
  const dragRef = useRef(null) // { type: 'move'|'nw'|'ne'|'sw'|'se', sx, sy, sc }

  const handleImgLoad = () => {
    const img = imgRef.current
    const cont = containerRef.current
    const contRect = cont.getBoundingClientRect()
    const scale = Math.min(contRect.width / img.naturalWidth, contRect.height / img.naturalHeight)
    const w = img.naturalWidth * scale
    const h = img.naturalHeight * scale
    const x = (contRect.width - w) / 2
    const y = (contRect.height - h) / 2
    setImgRect({ x, y, w, h })
    setCrop({ x: 0, y: 0, w, h })
    setImgLoaded(true)
  }

  const getContPos = (e) => {
    const rect = containerRef.current.getBoundingClientRect()
    const touch = e.touches?.[0] || e
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
  }

  const startDrag = (type, e) => {
    e.stopPropagation()
    e.preventDefault()
    const pos = getContPos(e)
    dragRef.current = { type, sx: pos.x, sy: pos.y, sc: { ...crop } }
  }

  const onMove = useCallback((e) => {
    const d = dragRef.current
    if (!d) return
    const pos = getContPos(e)
    const dx = pos.x - d.sx
    const dy = pos.y - d.sy
    const MIN = 40
    const { x: ix, y: iy, w: iw, h: ih } = imgRect
    const sc = d.sc

    setCrop(prev => {
      let { x, y, w, h } = sc
      if (d.type === 'move') {
        x = Math.max(0, Math.min(iw - w, sc.x + dx))
        y = Math.max(0, Math.min(ih - h, sc.y + dy))
      } else if (d.type === 'nw') {
        const nx = Math.min(sc.x + dx, sc.x + sc.w - MIN)
        const ny = Math.min(sc.y + dy, sc.y + sc.h - MIN)
        w = sc.w - (nx - sc.x); h = sc.h - (ny - sc.y); x = nx; y = ny
      } else if (d.type === 'ne') {
        w = Math.max(MIN, sc.w + dx); h = sc.h - (Math.min(sc.y + dy, sc.y + sc.h - MIN) - sc.y)
        y = Math.min(sc.y + dy, sc.y + sc.h - MIN)
      } else if (d.type === 'sw') {
        const nx = Math.min(sc.x + dx, sc.x + sc.w - MIN)
        w = sc.w - (nx - sc.x); h = Math.max(MIN, sc.h + dy); x = nx
      } else if (d.type === 'se') {
        w = Math.max(MIN, sc.w + dx); h = Math.max(MIN, sc.h + dy)
      }
      // Клампим в границы изображения
      x = Math.max(0, Math.min(iw - MIN, x))
      y = Math.max(0, Math.min(ih - MIN, y))
      w = Math.min(iw - x, Math.max(MIN, w))
      h = Math.min(ih - y, Math.max(MIN, h))
      return { x, y, w, h }
    })
  }, [imgRect])

  const onUp = () => { dragRef.current = null }

  const apply = () => {
    const img = imgRef.current
    const sx = img.naturalWidth / imgRect.w
    const sy = img.naturalHeight / imgRect.h
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(crop.w * sx)
    canvas.height = Math.round(crop.h * sy)
    canvas.getContext('2d').drawImage(img, crop.x * sx, crop.y * sy, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(blob => onDone(blob), 'image/webp', 0.92)
  }

  const handleStyle = (cursor) => ({
    position: 'absolute', width: 18, height: 18,
    background: 'var(--accent)', borderRadius: 3,
    border: '2px solid #fff', cursor,
    transform: 'translate(-50%, -50%)',
    touchAction: 'none',
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column', touchAction: 'none', overscrollBehavior: 'contain' }}>
      <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.85)', flexShrink: 0 }}>
        <button onClick={onCancel} style={{ color: '#aaa', fontSize: 14, fontWeight: 700, fontFamily: 'Nunito,sans-serif', background: 'none', border: 'none', cursor: 'pointer' }}>Отмена</button>
        <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>Обрезать фото</span>
        <button onClick={apply} style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 700, fontFamily: 'Nunito,sans-serif', background: 'none', border: 'none', cursor: 'pointer' }}>Готово</button>
      </div>

      <div ref={containerRef}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', userSelect: 'none' }}
        onMouseMove={onMove} onMouseUp={onUp}
        onTouchMove={onMove} onTouchEnd={onUp}
      >
        <img ref={imgRef} src={src} onLoad={handleImgLoad}
          style={{ position: 'absolute', left: imgRect.x, top: imgRect.y, width: imgRect.w, height: imgRect.h, display: 'block', pointerEvents: 'none' }}
        />
        {imgLoaded && (
          <>
            {/* Затемнение вокруг */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              <defs>
                <mask id="crop-mask">
                  <rect width="100%" height="100%" fill="white"/>
                  <rect x={imgRect.x + crop.x} y={imgRect.y + crop.y} width={crop.w} height={crop.h} fill="black"/>
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#crop-mask)"/>
            </svg>

            {/* Рамка кропа */}
            <div
              onMouseDown={e => startDrag('move', e)}
              onTouchStart={e => startDrag('move', e)}
              style={{
                position: 'absolute',
                left: imgRect.x + crop.x, top: imgRect.y + crop.y,
                width: crop.w, height: crop.h,
                border: '2px solid var(--accent)',
                cursor: 'move', boxSizing: 'border-box',
                touchAction: 'none',
              }}
            >
              {/* Сетка thirds */}
              {[1/3, 2/3].map(f => (
                <div key={'v'+f} style={{ position: 'absolute', left: `${f*100}%`, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
              ))}
              {[1/3, 2/3].map(f => (
                <div key={'h'+f} style={{ position: 'absolute', top: `${f*100}%`, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
              ))}
              {/* Угловые ручки */}
              <div onMouseDown={e => startDrag('nw',e)} onTouchStart={e => startDrag('nw',e)} style={{ ...handleStyle('nw-resize'), left: 0, top: 0 }} />
              <div onMouseDown={e => startDrag('ne',e)} onTouchStart={e => startDrag('ne',e)} style={{ ...handleStyle('ne-resize'), left: '100%', top: 0 }} />
              <div onMouseDown={e => startDrag('sw',e)} onTouchStart={e => startDrag('sw',e)} style={{ ...handleStyle('sw-resize'), left: 0, top: '100%' }} />
              <div onMouseDown={e => startDrag('se',e)} onTouchStart={e => startDrag('se',e)} style={{ ...handleStyle('se-resize'), left: '100%', top: '100%' }} />
            </div>
          </>
        )}
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', gap: 8, background: 'rgba(0,0,0,0.85)', flexShrink: 0 }}>
        {[['1:1',1],['4:3',4/3],['16:9',16/9],['Свободно',null]].map(([label, ratio]) => (
          <button key={label} onClick={() => {
            if (!ratio) return // свободно — просто не меняем
            const h = Math.min(crop.w / ratio, imgRect.h)
            const w = h * ratio
            setCrop(c => ({ ...c, w: Math.min(w, imgRect.w), h }))
          }}
            style={{ flex: 1, padding: '10px 4px', background: '#222', border: '1px solid #444', borderRadius: 10, color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'Nunito,sans-serif', cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>
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
      const [dbRes, nomRes] = await Promise.all([
        supabase.from('places').select('address, lat, lng').eq('category', category).not('address', 'is', null).ilike('address', `%${q}%`).limit(3),
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`, {
          headers: { 'Accept-Language': 'ru' }
        }).then(r => r.json()).catch(() => []),
      ])
      const seen = new Set()
      const combined = []
      ;(dbRes.data || []).forEach(d => {
        const key = d.address.toLowerCase().trim()
        if (!seen.has(key)) { seen.add(key); combined.push({ display_name: d.address, lat: d.lat, lon: d.lng, fromDb: true }) }
      })
      ;(nomRes || []).forEach(n => {
        const key = n.display_name.split(',').slice(0,3).join(',').toLowerCase().trim()
        if (!seen.has(key)) { seen.add(key); combined.push(n) }
      })
      setGeoSuggestions(combined)
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
    supabase.from('subcategories').select('*').eq('category', category).order('name')
      .then(({ data }) => setSubcategories(data || []))
    setSubcategory('')
  }, [category])

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
  const [subcategory, setSubcategory] = useState('')
  const [subcategories, setSubcategories] = useState([])
  const [newSubcat, setNewSubcat] = useState('')
  const [showNewSubcat, setShowNewSubcat] = useState(false)
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

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files)
    e.target.value = ''
    for (const file of files) {
      try {
        const blob = await compressToWebp(file)
        const url = URL.createObjectURL(blob)
        setPhotos(prev => [...prev, { preview: url, blob }])
      } catch (err) {
        setError('Не удалось обработать фото: ' + err.message)
      }
    }
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
      const { error } = await supabase.storage.from('photos').upload(path, p.blob, { contentType: 'image/webp' })
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
        subcategory: subcategory || null,
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
              <button key={c.value} onClick={() => setCountry(c.value)} style={{ flex: 1, padding: '12px 4px', borderRadius: 12, fontSize: 24, lineHeight: 1, background: country === c.value ? 'var(--bg2)' : 'var(--bg3)', border: country === c.value ? '2px solid var(--accent)' : '2px solid var(--border)', transition: 'all .2s', cursor: 'pointer', filter: country === c.value ? 'none' : 'grayscale(40%)', opacity: country === c.value ? 1 : 0.7 }}>
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
          <input style={inputStyle} placeholder={category === 'restaurant' ? 'Маргарита' : 'Milka Oreo'} value={itemName} onChange={e => setItemName(e.target.value)} />
        </div>

        {/* Подкатегория */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Категория блюда / товара</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {subcategories.map(s => (
              <button key={s.id} onClick={() => setSubcategory(subcategory === s.name ? '' : s.name)}
                style={{ padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, fontFamily: 'Nunito,sans-serif', background: subcategory === s.name ? 'linear-gradient(135deg, var(--accent), var(--accent2))' : 'var(--bg3)', color: subcategory === s.name ? '#fff' : 'var(--text2)', border: subcategory === s.name ? 'none' : '1px solid var(--border)', cursor: 'pointer', transition: 'all .15s' }}>
                {s.name}
              </button>
            ))}
            <button onClick={() => setShowNewSubcat(!showNewSubcat)}
              style={{ padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, fontFamily: 'Nunito,sans-serif', background: 'var(--bg3)', color: 'var(--accent)', border: '1px dashed var(--accent)', cursor: 'pointer' }}>
              + Добавить
            </button>
          </div>
          {showNewSubcat && (
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={{ ...inputStyle, flex: 1 }} placeholder="Новая категория" value={newSubcat} onChange={e => setNewSubcat(e.target.value)} />
              <button
                onClick={async () => {
                  if (!newSubcat.trim()) return
                  const { data } = await supabase.from('subcategories').insert({ name: newSubcat.trim(), category }).select().single()
                  if (data) { setSubcategories(prev => [...prev, data]); setSubcategory(data.name) }
                  setNewSubcat(''); setShowNewSubcat(false)
                }}
                style={{ padding: '0 16px', borderRadius: 12, background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'Nunito,sans-serif', border: 'none', cursor: 'pointer' }}>
                OK
              </button>
            </div>
          )}
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
