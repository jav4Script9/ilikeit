import { useEffect, useState } from 'react'
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

  useEffect(() => {
    fetchItems()
  }, [filter])

  async function fetchItems() {
    setLoading(true)
    let query = supabase
      .from('items')
      .select(`
        *,
        ratings_summary:ratings(
          love:count(*).filter(type.eq.love),
          ok:count(*).filter(type.eq.ok),
          bad:count(*).filter(type.eq.bad),
          total:count(*)
        )
      `)
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('category', filter)
    }

    const { data, error } = await query
    if (!error) setItems(data || [])
    setLoading(false)
  }

  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.place || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100%' }}>
      {/* Шапка */}
      <div style={{
        padding: '20px 16px 0',
        background: 'var(--bg)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        borderBottom: '1px solid var(--border)',
        paddingBottom: 12,
      }}>
        <div style={{
          fontFamily: 'Unbounded, sans-serif',
          fontSize: 22,
          fontWeight: 900,
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 14,
        }}>
          I Like It 🔥
        </div>

        {/* Поиск */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg3)',
          borderRadius: 12,
          padding: '0 12px',
          marginBottom: 12,
          border: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 16, marginRight: 8, opacity: 0.5 }}>🔍</span>
          <input
            type="search"
            placeholder="Найти блюдо или место..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: 'var(--text)',
              fontSize: 14,
              padding: '11px 0',
            }}
          />
        </div>

        {/* Фильтры */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                whiteSpace: 'nowrap',
                padding: '7px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 700,
                fontFamily: 'Nunito, sans-serif',
                background: filter === f.key
                  ? 'linear-gradient(135deg, var(--accent), var(--accent2))'
                  : 'var(--bg3)',
                color: filter === f.key ? '#fff' : 'var(--text2)',
                border: filter === f.key ? 'none' : '1px solid var(--border)',
                transition: 'all 0.2s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Список */}
      <div style={{ padding: '16px 16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)', fontSize: 14 }}>
            Загружаем...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>😶</div>
            <div style={{ color: 'var(--text3)', fontSize: 14 }}>
              {search ? 'Ничего не найдено' : 'Пока нет записей. Добавь первым!'}
            </div>
          </div>
        ) : (
          filtered.map(item => <ItemCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  )
}
