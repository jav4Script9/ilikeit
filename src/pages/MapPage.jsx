import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const EMOJI = { restaurant: '🍽️', shop: '🛒' }
const RATING_COLOR = { love: '#1DB954', ok: '#FFB347', bad: '#e05555' }

export default function MapPage() {
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const leafletMap = useRef(null)
  const markersRef = useRef([])
  const [places, setPlaces] = useState([])
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlaces()
  }, [])

  useEffect(() => {
    if (!places.length) return
    initMap()
  }, [places, filter])

  async function fetchPlaces() {
    const { data } = await supabase
      .from('places')
      .select(`*, items(id, name, rating, photo_url)`)
      .not('lat', 'is', null)
    setPlaces(data || [])
    setLoading(false)
  }

  function initMap() {
    if (!window.L) return
    const L = window.L

    // Уничтожить старую карту
    if (leafletMap.current) {
      leafletMap.current.remove()
      leafletMap.current = null
    }

    const map = L.map(mapRef.current, { zoomControl: false }).setView([50.08, 14.44], 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    leafletMap.current = map

    const filtered = places.filter(p => filter === 'all' || p.category === filter)
    const bounds = []

    filtered.forEach(place => {
      if (!place.lat || !place.lng) return
      bounds.push([place.lat, place.lng])

      const topRating = place.items?.length > 0
        ? (['love','ok','bad'].find(r => place.items.some(i => i.rating === r)) || 'ok')
        : 'ok'

      const icon = L.divIcon({
        html: `<div style="width:36px;height:36px;border-radius:50%;background:${RATING_COLOR[topRating]};display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${EMOJI[place.category]}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        className: '',
      })

      const marker = L.marker([place.lat, place.lng], { icon })
        .addTo(map)
        .on('click', () => setSelected(place))

      markersRef.current.push(marker)
    })

    if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40] })
    else if (bounds.length === 1) map.setView(bounds[0], 14)
  }

  // Загружаем Leaflet CSS+JS динамически
  useEffect(() => {
    if (document.getElementById('leaflet-css')) { return }
    const link = document.createElement('link')
    link.id = 'leaflet-css'
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      if (places.length) initMap()
    }
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (window.L && places.length) initMap()
  }, [places, filter])

  const filtered = places.filter(p => filter === 'all' || p.category === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Фильтры */}
      <div style={{ padding: '12px 16px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0 }}>
        {[['all','✨ Все'],['restaurant','🍽️ Рестораны'],['shop','🛒 Магазины']].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{ whiteSpace: 'nowrap', padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, fontFamily: 'Nunito,sans-serif', background: filter === k ? 'linear-gradient(135deg,var(--accent),var(--accent2))' : 'var(--bg3)', color: filter === k ? '#fff' : 'var(--text2)', border: filter === k ? 'none' : '1px solid var(--border)', cursor: 'pointer' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Карта */}
      <div style={{ flex: 1, position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', zIndex: 10, color: 'var(--text3)', fontSize: 14 }}>
            Загружаем карту...
          </div>
        )}
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {/* Попап выбранного места */}
        {selected && (
          <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, background: 'var(--bg2)', borderRadius: 16, border: '1px solid var(--border)', padding: '16px', zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 2 }}>{selected.name}</div>
                {selected.address && <div style={{ fontSize: 12, color: 'var(--text3)' }}>📍 {selected.address}</div>}
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'var(--bg3)', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Список блюд */}
            {selected.items?.length > 0 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {selected.items.slice(0, 6).map(item => (
                  <div key={item.id} onClick={() => navigate(`/item/${item.id}`)}
                    style={{ flexShrink: 0, width: 72, cursor: 'pointer' }}>
                    <div style={{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden', background: 'var(--bg3)', marginBottom: 4, border: `2px solid ${RATING_COLOR[item.rating] || 'var(--border)'}` }}>
                      {item.photo_url
                        ? <img src={item.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🍽️</div>
                      }
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text2)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  </div>
                ))}
              </div>
            )}

            {(!selected.items || selected.items.length === 0) && (
              <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '8px 0' }}>Нет записей для этого места</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
