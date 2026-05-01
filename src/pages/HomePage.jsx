import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import ItemCard from '../components/ItemCard'

const FILTERS = [
  { key: 'all', label: '✨ Все' },
  { key: 'restaurant', label: '🍽️ Рестораны' },
  { key: 'shop', label: '🛒 Магазины' },
]

export default function HomePage() {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('all')
  const [placeFilter, setPlaceFilter] = useState('')
  const [showPlaceSheet, setShowPlaceSheet] = useState(false)
  const [placeSearch, setPlaceSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef()

  useEffect(() => { fetchItems() }, [filter])
  useEffect(() => { setPlaceFilter(''); setShowPlaceSheet(false); setPlaceSearch('') }, [filter])

  async function fetchItems() {
    setLoading(true)
    let query = supabase
      .from('items')
      .select('*, ratings(*)')
      .order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('category', filter)
    const { data, error } = await query
    if (!error) setItems(data || [])
    setLoading(false)
  }

  async function handleSearch(q) {
    setSearch(q)
    if (q.length < 2) { setSuggestions([]); setShowSuggestions(false); return }

    // Ищем по items и places параллельно
    const [itemsRes, placesRes] = await Promise.all([
      supabase.from('items').select('id, name, subcategory, place, category').or(`name.ilike.%${q}%,subcategory.ilike.%${q}%,place.ilike.%${q}%`).limit(5),
      supabase.from('places').select('id, name, category').ilike('name', `%${q}%`).limit(3),
    ])

    const results = []
    itemsRes.data?.forEach(i => results.push({ type: 'item', id: i.id, label: i.name, sub: i.place || i.subcategory }))
    placesRes.data?.forEach(p => results.push({ type: 'place', id: p.id, label: p.name, sub: p.category === 'restaurant' ? 'Ресторан' : 'Магазин' }))
    setSuggestions(results)
    setShowSuggestions(true)
  }

  const placesInCategory = (() => {
    if (filter === 'all') return []
    const counts = {}
    items.forEach(i => {
      const p = i.place?.trim()
      if (p) counts[p] = (counts[p] || 0) + 1
    })
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  })()

  const filtered = (search.length >= 2
    ? items.filter(item =>
        item.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.subcategory?.toLowerCase().includes(search.toLowerCase()) ||
        item.place?.toLowerCase().includes(search.toLowerCase())
      )
    : items
  ).filter(item => !placeFilter || item.place === placeFilter)

  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{ padding: '20px 16px 0', background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        <div style={{ fontFamily: 'Unbounded, sans-serif', fontSize: 22, fontWeight: 900, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 14 }}>
          I Like It 🔥
        </div>

        {/* Поиск с подсказками */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg3)', borderRadius: 12, padding: '0 12px', border: '1px solid var(--border)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.4, flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              ref={searchRef}
              type="search"
              placeholder="Блюдо, категория, место..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text)', fontSize: 14, padding: '11px 8px', fontFamily: 'Nunito, sans-serif' }}
            />
            {search && (
              <button onClick={() => { setSearch(''); setSuggestions([]); setShowSuggestions(false) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, zIndex: 20, overflow: 'hidden', marginTop: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
              {suggestions.map((s, i) => (
                <div key={i}
                  onMouseDown={() => { setSearch(s.label); setShowSuggestions(false) }}
                  style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  <span style={{ fontSize: 16 }}>{s.type === 'place' ? '📍' : '🍽️'}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{s.label}</div>
                    {s.sub && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{s.sub}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ whiteSpace: 'nowrap', padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, fontFamily: 'Nunito, sans-serif', background: filter === f.key ? 'linear-gradient(135deg, var(--accent), var(--accent2))' : 'var(--bg3)', color: filter === f.key ? '#fff' : 'var(--text2)', border: filter === f.key ? 'none' : '1px solid var(--border)', transition: 'all 0.2s', cursor: 'pointer' }}>
              {f.label}
            </button>
          ))}
        </div>

        {filter !== 'all' && placesInCategory.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex' }}>
            <button onClick={() => setShowPlaceSheet(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 16, fontSize: 12, fontWeight: 700, fontFamily: 'Nunito, sans-serif', background: placeFilter ? 'var(--accent)' : 'var(--bg3)', color: placeFilter ? '#fff' : 'var(--text2)', border: placeFilter ? 'none' : '1px solid var(--border)', cursor: 'pointer', transition: 'all .15s', maxWidth: '100%' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                📍 {placeFilter || 'Все места'}
              </span>
              {placeFilter ? (
                <span onClick={e => { e.stopPropagation(); setPlaceFilter('') }}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </span>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, opacity: 0.7 }}><path d="M6 9l6 6 6-6"/></svg>
              )}
            </button>
          </div>
        )}
      </div>

      {showPlaceSheet && (() => {
        const matches = placeSearch.trim()
          ? placesInCategory.filter(p => p.name.toLowerCase().includes(placeSearch.toLowerCase()))
          : placesInCategory
        const closeSheet = () => { setShowPlaceSheet(false); setPlaceSearch('') }
        return (
          <div onClick={closeSheet} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div onClick={e => e.stopPropagation()} style={{
              background: 'var(--bg2)', borderTopLeftRadius: 20, borderTopRightRadius: 20,
              width: '100%', maxWidth: 600, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
              borderTop: '1px solid var(--border)', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)',
              animation: 'sheet-up .25s ease-out',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px 6px' }}>
                <span style={{ fontSize: 15, fontWeight: 800 }}>{filter === 'restaurant' ? 'Рестораны' : 'Магазины'}</span>
                <button onClick={closeSheet} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <div style={{ padding: '0 18px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg3)', borderRadius: 12, padding: '0 12px', border: '1px solid var(--border)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.4, flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input
                    type="search"
                    placeholder="Поиск по названию"
                    value={placeSearch}
                    onChange={e => setPlaceSearch(e.target.value)}
                    autoFocus
                    style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text)', fontSize: 14, padding: '10px 8px', fontFamily: 'Nunito, sans-serif', outline: 'none' }}
                  />
                </div>
              </div>
              <div style={{ overflowY: 'auto', padding: '0 8px 12px' }}>
                <button onClick={() => { setPlaceFilter(''); closeSheet() }}
                  style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: !placeFilter ? 'var(--bg3)' : 'transparent', border: 'none', color: 'var(--text)', fontSize: 14, fontWeight: !placeFilter ? 800 : 600, fontFamily: 'Nunito, sans-serif', cursor: 'pointer' }}>
                  <span>✨ Все места</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{placesInCategory.reduce((a, p) => a + p.count, 0)}</span>
                </button>
                {matches.length === 0 ? (
                  <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Ничего не найдено</div>
                ) : matches.map(p => {
                  const active = placeFilter === p.name
                  return (
                    <button key={p.name} onClick={() => { setPlaceFilter(p.name); closeSheet() }}
                      style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: active ? 'var(--bg3)' : 'transparent', border: 'none', color: active ? 'var(--accent)' : 'var(--text)', fontSize: 14, fontWeight: active ? 800 : 600, fontFamily: 'Nunito, sans-serif', cursor: 'pointer' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📍 {p.name}
                      </span>
                      <span style={{ fontSize: 11, color: active ? 'var(--accent)' : 'var(--text3)', flexShrink: 0, marginLeft: 8 }}>{p.count}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}

      <div style={{ padding: '16px 16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)', fontSize: 14 }}>Загружаем...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>😶</div>
            <div style={{ color: 'var(--text3)', fontSize: 14 }}>{search ? 'Ничего не найдено' : 'Пока нет записей. Добавь первым!'}</div>
          </div>
        ) : (
          filtered.map(item => <ItemCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  )
}
