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
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    position: 'sticky',
    bottom: 0,
    zIndex: 100,
  },
}

const navItemStyle = (isActive) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 0 10px',
  gap: 4,
  color: isActive ? 'var(--accent)' : 'var(--text3)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
  transition: 'color 0.15s',
  textDecoration: 'none',
})

// Минималистичная тарелка SVG
const IconFeed = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11C3 7.13 7.03 4 12 4s9 3.13 9 7"/>
    <path d="M3 11h18"/>
    <path d="M12 11v9"/>
    <path d="M8 20h8"/>
    <path d="M17 6.5C17 6.5 19 8 19 11"/>
  </svg>
)

// Плюс добавить
const IconAdd = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 8v8M8 12h8"/>
  </svg>
)

// Профиль
const IconProfile = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)

export default function Layout() {
  const { user } = useAuth()

  return (
    <div style={styles.root}>
      <main style={styles.main}>
        <Outlet />
      </main>
      <nav style={styles.nav}>
        <NavLink to="/" style={({ isActive }) => navItemStyle(isActive)}>
          <IconFeed/>
          <span>Лента</span>
        </NavLink>
        <NavLink to="/add" style={({ isActive }) => navItemStyle(isActive)}>
          <IconAdd/>
          <span>Добавить</span>
        </NavLink>
        <NavLink to={user ? '/profile' : '/auth'} style={({ isActive }) => navItemStyle(isActive)}>
          <IconProfile/>
          <span>Профиль</span>
        </NavLink>
      </nav>
    </div>
  )
}
