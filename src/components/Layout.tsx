import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Compass, CirclePlus, LifeBuoy, Luggage, MessageCircle, UserRound } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import ThemeToggle from './ThemeToggle'

const TABS = [
  { to: '/', label: 'Trips', Icon: Compass, end: true },
  { to: '/post', label: 'Post', Icon: CirclePlus },
  { to: '/chats', label: 'Chats', Icon: MessageCircle },
  { to: '/mine', label: 'My trips', Icon: Luggage },
  { to: '/profile', label: 'Profile', Icon: UserRound },
]

export default function Layout() {
  const { profile, user } = useAuth()
  const { pathname } = useLocation()
  return (
    <div className="app">
      <header className="app-bar">
        <Link to="/" className="brand">TravelBuddy</Link>
        <nav className="app-nav" aria-label="Main">
          {TABS.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end}>
              <Icon size={20} aria-hidden="true" /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <span className="app-user">
          <span className="muted small name">{profile?.displayName ?? user?.displayName}</span>
          <ThemeToggle />
          <Link to="/help" className="icon-btn" aria-label="Help and safety"><LifeBuoy size={20} aria-hidden="true" /></Link>
        </span>
      </header>
      <main className="app-main" key={pathname}><Outlet /></main>
    </div>
  )
}
