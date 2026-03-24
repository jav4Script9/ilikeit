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
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef()

  useEffect(() => { fetchItems() }, [filter])

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

  const filtered = search.length >= 2
    ? items.filter(item =>
        item.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.subcategory?.toLowerCase().includes(search.toLowerCase()) ||
        item.place?.toLowerCase().includes(search.toLowerCase())
      )
    : items

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
      </div>

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
