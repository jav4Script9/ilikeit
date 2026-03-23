import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

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

const IconFeed = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const IconMap = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
    <line x1="8" y1="2" x2="8" y2="18"/>
    <line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
)

const IconAdd = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 8v8M8 12h8"/>
  </svg>
)

const IconProfile = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)

export default function Layout() {
  const { user } = useAuth()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)' }}>
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <Outlet />
      </main>
      <nav style={{ display: 'flex', borderTop: '1px solid var(--border)', background: 'var(--bg2)', paddingBottom: 'env(safe-area-inset-bottom, 0px)', position: 'sticky', bottom: 0, zIndex: 100 }}>
        <NavLink to="/" end style={({ isActive }) => navItemStyle(isActive)}>
          <IconFeed/><span>Лента</span>
        </NavLink>
        <NavLink to="/map" style={({ isActive }) => navItemStyle(isActive)}>
          <IconMap/><span>Карта</span>
        </NavLink>
        <NavLink to="/add" style={({ isActive }) => navItemStyle(isActive)}>
          <IconAdd/><span>Добавить</span>
        </NavLink>
        <NavLink to={user ? '/profile' : '/auth'} style={({ isActive }) => navItemStyle(isActive)}>
          <IconProfile/><span>Профиль</span>
        </NavLink>
      </nav>
    </div>
  )
}
