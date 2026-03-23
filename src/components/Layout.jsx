import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useTheme } from '../lib/useTheme'

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    background: 'var(--bg)',
  },
  main: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  nav: {
    display: 'flex',
    borderTop: '1px solid var(--border)',
    background: 'var(--bg2)',
    paddingBottom: 'var(--safe-bottom)',
    position: 'sticky',
    bottom: 0,
    zIndex: 100,
  },
  navItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 0 8px',
    gap: 4,
    color: 'var(--text3)',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    transition: 'color 0.15s',
  },
}

export default function Layout() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <div style={styles.root}>
      <main style={styles.main}>
        <Outlet />
      </main>
      <nav style={styles.nav}>
        <NavLink to="/" style={({ isActive }) => ({
          ...styles.navItem,
          color: isActive ? 'var(--accent)' : 'var(--text3)'
        })}>
          <span style={{ fontSize: 22 }}>🍽️</span>
          <span>Лента</span>
        </NavLink>

        <NavLink to="/add" style={({ isActive }) => ({
          ...styles.navItem,
          color: isActive ? 'var(--accent)' : 'var(--text3)'
        })}>
          <span style={{ fontSize: 22 }}>➕</span>
          <span>Добавить</span>
        </NavLink>

        {/* Переключатель темы */}
        <button
          onClick={toggleTheme}
          style={{
            ...styles.navItem,
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            color: 'var(--text3)',
          }}
        >
          <span style={{ fontSize: 22 }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? 'Светлая' : 'Тёмная'}</span>
        </button>

        <NavLink to={user ? '/profile' : '/auth'} style={({ isActive }) => ({
          ...styles.navItem,
          color: isActive ? 'var(--accent)' : 'var(--text3)'
        })}>
          <span style={{ fontSize: 22 }}>👤</span>
          <span>Профиль</span>
        </NavLink>
      </nav>
    </div>
  )
}
